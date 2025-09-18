"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { CurrencyDollarIcon, ExclamationTriangleIcon, XCircleIcon, GiftIcon } from "@heroicons/react/24/outline";
import TopUpModal from "../../../components/TopUpModal";
import { useUser, useUserPlan } from "@/contexts/UserContext";
import useSWR from "swr";
import { log } from "@/libs/logger";

export const dynamic = 'force-dynamic';

function CreditBalanceContent() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const searchParams = useSearchParams();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // 使用context获取基本用户信息
  const { user, isLoading: userLoading, error: userError } = useUser();
  const plan = useUserPlan();
  
  // 使用统一的credit-balance API获取所有数据
  const { data: creditBalanceData, error: creditBalanceError, isLoading: creditBalanceLoading, mutate: refreshCreditBalance } = useSWR(
    session?.user?.email ? '/api/credit-balance' : null,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch credit balance data');
      return response.json();
    },
    { refreshInterval: 30000 } // 30秒刷新一次
  );

  // 处理credit-balance API返回的统一数据
  const creditBalance = creditBalanceData;
  const remainingPoints = creditBalance?.points || 0;
  
  // 处理credit packs数据，过滤掉空的credit packs
  const allCreditPacks = creditBalance?.creditPacks || [];
  const creditPacks = allCreditPacks.filter((pack: any) => pack.capacity > 0);
  
  // 计算总的可用credits (所有active credit packs的可用容量)
  const totalAvailableCredits = creditBalance?.credits || 0;

  // 使用API返回的预计算余额
  const accountBalance = creditBalance?.balance || 0;
  
  // 派生状态
  const isProUser = plan === 'pro';
  const hasActiveSubscription = isProUser;

  // 处理URL参数，检测TopUp成功并自动刷新数据
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      log.info('🔄 TopUp payment successful, refreshing data...');
      toast.success('Payment successful! Your credits have been added to your account.');
      
      // 触发自定义事件，通知其他组件刷新
      window.dispatchEvent(new CustomEvent('payment-success'));
      
      // 延迟刷新以确保webhook处理完成
      setTimeout(() => {
        refreshCreditBalance();
      }, 2000);
      
      // 清理URL参数
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    } else if (canceled === 'true') {
      toast.error('Payment was canceled. Please try again if you want to add credits.');
      
      // 清理URL参数
      const url = new URL(window.location.href);
      url.searchParams.delete('canceled');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, refreshCreditBalance]);



  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error("Please enter a redeem code");
      return;
    }

    const userApiKey = user?.initApiKey;
    if (!userApiKey) {
      toast.error("No API key found. Please contact support.");
      log.error('❌ No initApiKey found in user data:', {
        user: user,
        hasInitApiKey: !!user?.initApiKey,
        userKeys: Object.keys(user || {})
      });
      return;
    }

    setIsRedeeming(true);
    try {
      log.info(`🎁 Redeeming code: ${redeemCode}`);
      log.info(`🔑 Using API key: ${userApiKey.substring(0, 10)}...`);
      log.info(`📝 Request payload:`, {
        code: redeemCode.trim().toLowerCase(),
        apiKeyLength: userApiKey.length
      });
      
      toast.loading('Redeeming code...', { id: 'redeem' });

      const response = await fetch('/api/backend-proxy/account/code/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': userApiKey,
        },
        body: JSON.stringify({
          code: redeemCode.trim().toLowerCase()
        })
      });

      const result = await response.json();
      
      // 打印完整的API响应以便调试
      log.info('🔍 Full API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: result
      });

      if (!response.ok) {
        // 处理特定的错误消息
        let errorMessage = result.message || result.error || 'Failed to redeem code';
        
        if (errorMessage.includes('record not found')) {
          errorMessage = 'Invalid redeem code. Please check your code and try again.';
        } else if (errorMessage.includes('already used') || errorMessage.includes('is used')) {
          errorMessage = 'This redeem code has already been used.';
        } else if (errorMessage.includes('expired')) {
          errorMessage = 'This redeem code has expired.';
        }
        
        throw new Error(errorMessage);
      }

      log.info('✅ Code redeemed successfully:', result);
      
      toast.success(`Code redeemed successfully! Credits have been added to your account.`, { id: 'redeem' });
      
      // 触发自定义事件，通知其他组件刷新
      window.dispatchEvent(new CustomEvent('payment-success'));
      
      // 刷新数据以显示新添加的credits
      setTimeout(() => {
        refreshCreditBalance();
      }, 1000);
      
      setRedeemCode("");
      setShowRedeem(false);
      
    } catch (error: any) {
      log.error('❌ Redeem code failed:', error);
      toast.error(`Failed to redeem code: ${error.message}`, { id: 'redeem' });
    } finally {
      setIsRedeeming(false);
    }
  };

  const refreshAll = async () => {
    log.info('🔄 Manual refresh triggered');
    toast.loading('Refreshing data...', { id: 'refresh' });
    
    try {
      await refreshCreditBalance();
      toast.success('Data refreshed successfully!', { id: 'refresh' });
    } catch (error) {
      log.error('Refresh failed:', error);
      toast.error('Failed to refresh data', { id: 'refresh' });
    }
  };

  if (!session) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your credit balance.</p>
        </div>
      </div>
    );
  }

  const isLoading = userLoading || creditBalanceLoading;
  const hasError = userError || creditBalanceError;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wallet data...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Credit Balance</h3>
          <p className="text-gray-600 mb-4">{hasError}</p>
          <button
            onClick={refreshAll}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Balance</h1>
            <p className="text-gray-600">Manage your credits and account</p>
          </div>
          <button
            onClick={refreshAll}
            disabled={isLoading}
            className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
      </div>


      {/* Actions Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Need More Credits?</h3>
              <p className="text-gray-600">
                {hasActiveSubscription 
                  ? "Your Pro subscription includes monthly credits. You can also redeem codes for bonus credits."
                  : "Upgrade to Pro for monthly credits, or redeem codes for free credits."
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRedeem(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <GiftIcon className="w-4 h-4" />
                Redeem Code
              </button>
              {hasActiveSubscription && (
                <button 
                  onClick={() => setShowTopUp(true)}
                  className="text-purple-600 hover:text-purple-700 px-6 py-2 rounded-lg border border-purple-600 hover:border-purple-700 font-medium transition-colors"
                >
                  Top-up Credits
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Account Balance Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Account Balance</h3>
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${accountBalance.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Formula: 1$ = 1000credits = 1000 points
          </p>
        </div>

        {/* Available Credits Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Available Credits</h3>
            <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {totalAvailableCredits.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            ready to use
          </p>
        </div>

        {/* Points Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Points</h3>
            <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {remainingPoints.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            available points
          </p>
        </div>
      </div>

      {/* Credit Packs Detail */}
      {creditPacks.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Credit Packs</h2>
            <p className="text-gray-600 mt-1">Your individual credit packs and their status</p>
          </div>

          <div className="divide-y divide-gray-200">
            {creditPacks.map((pack: any) => {
              const isExpired = new Date(pack.expired_at) < new Date();
              const daysUntilExpiry = Math.ceil((new Date(pack.expired_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const available = pack.capacity - pack.used - (pack.frozen || 0);
              const usagePercentage = pack.capacity > 0 ? ((pack.used / pack.capacity) * 100) : 0;
              
              return (
                <div key={pack.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="p-3 rounded-full bg-blue-50">
                        <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      {/* Pack Info */}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-lg">
                          {pack.description} - {pack.capacity} credits
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">Usage: {usagePercentage.toFixed(1)}%</span>
                          
                          <span className="text-sm text-gray-600">
                            Expires: {isExpired ? 'Expired' : isNaN(daysUntilExpiry) ? 'No expiry date' : `${daysUntilExpiry} days left`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Credit Summary */}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {available.toLocaleString()} / {pack.capacity.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">available / total</div>
                      <div className="text-sm text-gray-600">{pack.used.toLocaleString()} used</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Top Up Modal */}
      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
      />

      {/* Redeem Modal */}
      {showRedeem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Redeem Code</h2>
                <GiftIcon className="w-5 h-5 text-gray-600" />
              </div>
              <button
                onClick={() => setShowRedeem(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Enter your redeem code to get free credits. Codes are case-insensitive and can only be used once.</p>
            
            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Redeem Code</label>
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toLowerCase())}
                placeholder="Enter your code here"
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the code exactly as shown on your voucher or email.
              </p>
            </div>
            
            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleRedeem}
                disabled={isRedeeming}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isRedeeming
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isRedeeming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Redeeming...
                  </>
                ) : (
                  <>
                    <GiftIcon className="w-4 h-4" />
                    Redeem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CreditBalancePage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credit balance...</p>
        </div>
      </div>
    }>
      <CreditBalanceContent />
    </Suspense>
  );
}