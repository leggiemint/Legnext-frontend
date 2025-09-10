"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { CurrencyDollarIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, GiftIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import TopUpModal from "../../components/TopUpModal";
import { usePlan } from "@/contexts/UserContext";


interface CreditPack {
  id: number;
  capacity: number;
  used: number;
  available: number;
  frozen: number;
  active: boolean;
  effectiveAt: string;
  expiredAt: string;
  description: string;
  createdAt: string;
  packType: 'subscription' | 'topup';
  isExpired: boolean;
  daysUntilExpiry: number;
}

interface CreditBalanceData {
  source: string;
  backendConfigured: boolean;
  backendAccountId?: number;
  credits: {
    balance: number;
    totalCredits?: number;
    frozenCredits?: number;
    usedCredits?: number;
    expiredCredits?: number;
    inactiveCredits?: number;
    dataSource: string;
    remainPoints?: number;
    remainCredits?: number;
    totalAccountBalance?: number;
    balanceFormula?: string;
  };
  creditPacks: CreditPack[];
  statistics?: {
    totalPacks: number;
    activePacks: number;
    expiredPacks: number;
    subscriptionPacks: number;
    topupPacks: number;
  };
  fetchedAt: string;
}

export default function CreditBalancePage() {
  const { data: session } = useSession();
  const [creditData, setCreditData] = useState<CreditBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  
  // 使用统一的plan状态管理
  const { isProUser, hasActiveSubscription } = usePlan();

  // 获取实时credit balance数据
  useEffect(() => {
    if (session?.user?.id) {
      fetchCreditBalance();
    }
  }, [session]);

  const fetchCreditBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/credit-balance');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCreditData(data);
      
      console.log('✅ Credit balance data fetched:', data);
    } catch (err: any) {
      console.error('❌ Error fetching credit balance:', err);
      setError(err.message || 'Failed to fetch credit balance');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTopUp = (amount: number, credits: number) => {
    toast.success(`Top up selected: $${amount} for ${credits} credits. Implementation coming soon!`);
    setShowTopUp(false);
  };

  const handleRedeem = () => {
    if (!redeemCode.trim()) {
      toast.error("Please enter a redeem code");
      return;
    }
    toast.success(`Redeem code "${redeemCode}" submitted. Implementation coming soon!`);
    setRedeemCode("");
    setShowRedeem(false);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your credit balance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Credit Balance</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCreditBalance}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!creditData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">No credit data available.</p>
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
            <p className="text-gray-600">Track your credit usage and purchase additional credits</p>
          </div>
          <button
            onClick={fetchCreditBalance}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>


      {/* Credit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Purchase More Credits */}
        <div className="md:col-span-4 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Need More Credits?</h3>
              <p className="text-gray-600">
                {(isProUser && hasActiveSubscription) 
                  ? "Redeem a code or purchase additional credits"
                  : "Redeem a code to get free credits"
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRedeem(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Redeem
              </button>
              {/* Top-up button - only for subscribed users */}
              {(isProUser && hasActiveSubscription) && (
                <button 
                  onClick={() => setShowTopUp(true)}
                  className="text-purple-600 hover:text-purple-700 px-6 py-2 rounded-lg border border-purple-600 hover:border-purple-700 font-medium transition-colors"
                >
                  Top-up
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Account Balance</h3>
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${creditData.credits.totalAccountBalance ? 
              creditData.credits.totalAccountBalance.toFixed(2) : 
              (creditData.credits.balance / 1000).toFixed(2)
            }
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {creditData.credits.balanceFormula ? 
              `Formula: 1$ = 1000credits = 1000 points` : 
              "1$ = 1000credits = 1000 points"
            }
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Available Credits</h3>
            <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {creditData.credits.balance.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">ready to use</p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Points</h3>
            <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {(creditData.credits.remainPoints || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">available points</p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Used Credits</h3>
            <ArrowDownIcon className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {(creditData.credits.usedCredits || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">consumed</p>
        </div>
      </div>

      {/* Credit Packs Detail */}
      {creditData.creditPacks && creditData.creditPacks.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Credit Packs</h2>
            <p className="text-gray-600 mt-1">Your individual credit packs and their status</p>
          </div>

          <div className="divide-y divide-gray-200">
            {creditData.creditPacks.map((pack) => (
              <div key={pack.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      pack.packType === 'subscription' ? 'bg-purple-50' : 'bg-blue-50'
                    }`}>
                      {pack.packType === 'subscription' ? (
                        <ClockIcon className={`w-5 h-5 ${pack.isExpired ? 'text-red-600' : 'text-purple-600'}`} />
                      ) : (
                        <CurrencyDollarIcon className={`w-5 h-5 ${pack.isExpired ? 'text-red-600' : 'text-blue-600'}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{pack.description}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        {!pack.active && <span className="text-red-600 font-medium">Inactive</span>}
                        {pack.isExpired && <span className="text-red-600 font-medium">Expired</span>}
                        {pack.active && !pack.isExpired && <span className="text-green-600 font-medium">Active</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {pack.available.toLocaleString()} / {pack.capacity.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">available / total</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Usage: {((pack.used / pack.capacity) * 100).toFixed(1)}%</span>
                    <span>{pack.used.toLocaleString()} used</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        pack.isExpired ? 'bg-red-500' : 
                        pack.packType === 'subscription' ? 'bg-purple-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((pack.used / pack.capacity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Pack Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Expires:</span>
                    <div className={`font-medium ${
                      pack.isExpired ? 'text-red-600' : 
                      pack.daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {pack.isExpired ? 'Expired' : `${pack.daysUntilExpiry} days left`}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Used:</span>
                    <div className="font-medium">{pack.used.toLocaleString()} credits</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Top Up Modal */}
      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        onConfirm={handleTopUp}
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
            
            <p className="text-gray-600 mb-6">Enter your redeem code to get free credits.</p>
            
            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Redeem Code</label>
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <GiftIcon className="w-4 h-4" />
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}