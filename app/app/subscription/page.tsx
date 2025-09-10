
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { PlusIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import PricingSection from "@/components/PricingSection";
import TopUpModal from "../../components/TopUpModal";
import { useUser, usePlan } from "@/contexts/UserContext";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [showTopUp, setShowTopUp] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isImmediateCancel, setIsImmediateCancel] = useState(false);
  
  // Use unified user state management
  const { userData, loading, refreshUserData } = useUser();
  const { plan, planDisplayName, isProUser, hasActiveSubscription } = usePlan();

  const handleCancelSubscription = async () => {
    setCanceling(true);

    try {
      console.log("🔴 Initiating subscription cancellation...");
      
      // 调用Stripe取消订阅API
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason || 'User requested cancellation',
          cancelAtPeriodEnd: !isImmediateCancel // 根据用户选择决定是否立即取消
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      console.log("✅ Subscription cancelled successfully:", result);
      
      // 根据取消类型显示不同消息
      const message = result.subscription?.cancelAtPeriodEnd 
        ? `订阅将在当前计费周期结束时取消。您可以继续使用Pro功能直到 ${result.subscription?.currentPeriodEnd ? new Date(result.subscription.currentPeriodEnd).toLocaleDateString() : '期末'}。`
        : "订阅已立即取消！您的账户已降级为免费计划，现有credits保留。";
      
      toast.success(message, {
        duration: 8000,
      });

      // 关闭模态框并刷新用户数据
      setShowCancelModal(false);
      setCancelReason("");
      setIsImmediateCancel(false);
      await refreshUserData();

    } catch (error: any) {
      console.error("❌ Subscription cancellation failed:", error);
      toast.error(`取消订阅失败: ${error.message}`, {
        duration: 5000,
      });
    } finally {
      setCanceling(false);
    }
  };

  const handleTopUp = (amount: number, credits: number) => {
    toast.success(`Top up selected: $${amount} for ${credits} credits. Implementation coming soon!`);
    setShowTopUp(false);
  };

  const getStatusBadge = (status: string, plan: string) => {
    if (plan === 'free') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          Free Plan
        </span>
      );
    }

    const isActive = status === 'active';
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : (
          <XCircleIcon className="w-4 h-4" />
        )}
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
        
        {/* Loading State */}
        {session && loading && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-6 bg-gray-300 rounded w-32"></div>
                <div className="h-6 bg-gray-300 rounded-full w-20"></div>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Status Bar */}
        {session && !loading && userData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Plan</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {planDisplayName} Plan
                  </span>
                  {getStatusBadge(userData?.subscriptionStatus || 'inactive', plan)}
                </div>
                <div className="text-sm text-gray-500">
                  Next billing: {isProUser && hasActiveSubscription ? 'Monthly' : '-'}
                </div>
                <div className="text-sm text-gray-500">
                  Email: {session?.user?.email}
                </div>
              </div>
            </div>
            
            {/* Action Buttons below status bar */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {/* Top up button - only for subscribed users */}
              {(isProUser && hasActiveSubscription) && (
                <button
                  onClick={() => setShowTopUp(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="w-5 h-5" />
                  Get credits
                </button>
              )}
              
              {/* Cancel subscription button - only for subscribed users */}
              {(isProUser && hasActiveSubscription) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={canceling}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md border ${
                    canceling
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-600 hover:border-red-700'
                  }`}
                >
                  {canceling ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
            
          </div>
        )}
      </div>

      {/* Pricing Section - Reused from pricing page */}
      <PricingSection />

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        onConfirm={handleTopUp}
        buttonText="Get credits"
      />

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => !canceling && setShowCancelModal(false)}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    取消订阅确认
                  </h3>
                </div>
                {!canceling && (
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">取消订阅后：</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>您将失去Pro功能访问权限</li>
                        <li>现有credits将保留但无法获得新的月度credits</li>
                        <li>可以随时重新订阅恢复Pro功能</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Cancellation Type Selection */}
                <div className="space-y-3 mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    取消方式
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="cancelType"
                        checked={!isImmediateCancel}
                        onChange={() => setIsImmediateCancel(false)}
                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                        disabled={canceling}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        在计费周期结束时取消（推荐）
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="cancelType"
                        checked={isImmediateCancel}
                        onChange={() => setIsImmediateCancel(true)}
                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                        disabled={canceling}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        立即取消
                      </span>
                    </label>
                  </div>
                </div>

                {/* Reason Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    取消原因（可选）
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="请告诉我们您取消订阅的原因，这将帮助我们改进服务..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    rows={3}
                    disabled={canceling}
                  />
                </div>

                {/* Warning for immediate cancellation */}
                {isImmediateCancel && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-xs text-yellow-800">
                        立即取消将立即停止您的Pro功能访问。建议选择在计费周期结束时取消，这样您可以继续使用Pro功能直到当前周期结束。
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={canceling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {canceling ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      处理中...
                    </>
                  ) : (
                    `确认${isImmediateCancel ? '立即' : '在周期结束时'}取消`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}