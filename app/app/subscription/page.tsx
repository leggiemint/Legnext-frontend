"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { PlusIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import PricingSection from "@/components/PricingSection";
import TopUpModal from "../../components/TopUpModal";
import { useUser, usePlan } from "@/contexts/UserContext";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [showTopUp, setShowTopUp] = useState(false);
  const [canceling, setCanceling] = useState(false);
  
  // Use unified user state management
  const { userData, loading, refreshUserData } = useUser();
  const { plan, planDisplayName, isProUser, hasActiveSubscription } = usePlan();

  const handleCancelSubscription = async () => {
    // 确认对话框
    const reason = prompt("请告诉我们取消订阅的原因（可选）:");
    
    if (!confirm("确认取消订阅？您将立即失去Pro功能，但现有credits会保留。")) {
      return;
    }

    setCanceling(true);

    try {
      console.log("🔴 Initiating subscription cancellation...");
      
      // 调用Square取消订阅API
      const response = await fetch('/api/square/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'User requested cancellation',
          feedback: null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      console.log("✅ Subscription cancelled successfully:", result);
      
      toast.success("订阅已成功取消！您的账户已降级为免费计划，现有credits保留。", {
        duration: 5000,
      });

      // 刷新用户数据以反映最新状态
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
                  onClick={handleCancelSubscription}
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

    </div>
  );
}