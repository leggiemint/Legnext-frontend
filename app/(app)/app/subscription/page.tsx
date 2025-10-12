
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { PlusIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import PricingSection from "@/components/sections/PricingSection";
import TopUpModal from "../../../../components/payment/TopUpModal";
import { useUser, useUserPlan } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import config from "@/config";

export const dynamic = 'force-dynamic';

export default function SubscriptionPage() {
  const router = useRouter();
  const sessionData = useSession();
  const session = sessionData?.data;
  const [showTopUp, setShowTopUp] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [, setCancelReason] = useState("");
  const [reactivating, setReactivating] = useState(false);
  
  // 🔄 重定向处理状态
  const [hasProcessedRedirect, setHasProcessedRedirect] = useState(false);
  
  // Subscription state management
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  
  // Use unified user state management with backend data
  const { user, isLoading, refreshAll } = useUser();
  const plan = useUserPlan();
  
  // Derived state from context
  const isProUser = plan === 'pro';
  const planDisplayName = plan === 'pro' ? 'Pro' : 'Free';
  const hasActiveSubscription = isProUser; // Simplified for now

  // Get subscription status from backend
  const fetchSubscriptions = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setSubscriptionLoading(true);
      const response = await fetch('/api/stripe/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [session?.user]);

  // Get current active subscription
  const activeSubscription = subscriptions.find(sub =>
    sub.status === 'active' || sub.status === 'trialing'
  );

  // Check if subscription is set to cancel at period end
  const subscriptionCanceled = activeSubscription?.cancel_at_period_end || false;

  // 🐛 Debug logging
  useEffect(() => {
    if (session?.user && !subscriptionLoading) {
      console.log('🔍 [Subscription Debug]', {
        isProUser,
        hasActiveSubscription,
        subscriptionsCount: subscriptions.length,
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          status: s.status,
          cancel_at_period_end: s.cancel_at_period_end,
        })),
        activeSubscription: activeSubscription ? {
          id: activeSubscription.id,
          status: activeSubscription.status,
          cancel_at_period_end: activeSubscription.cancel_at_period_end,
        } : null,
        shouldShowCancelButton: !!(hasActiveSubscription && activeSubscription),
      });
    }
  }, [session?.user, subscriptionLoading, subscriptions, isProUser, hasActiveSubscription, activeSubscription]);

  // Specific customer subscription expiration reminder configuration
  const getSubscriptionExpirationNotice = (userEmail: string) => {
    // Configuration for specific emails with their expiration dates
    const affectedEmails = {
      'm.t.pham@kardiachain.io': {
        expirationDate: '2025-10-16', // Current Period End from CSV
        message: 'Due to system upgrade, your subscription was automatically canceled. Please resubscribe to continue using Pro features.'
      },
      'info@leonardopicollo.com': {
        expirationDate: '2025-10-15',
        message: 'Due to system upgrade, your subscription was automatically canceled. Please resubscribe to continue using Pro features.'
      },
      'wangbolwq@gmail.com': {
        expirationDate: '2025-10-14',
        message: 'Due to system upgrade, your subscription was automatically canceled. Please resubscribe to continue using Pro features.'
      },
      'timboooxd33@gmail.com': {
        expirationDate: '2025-10-14',
        message: 'Due to system upgrade, your subscription was automatically canceled. Please resubscribe to continue using Pro features.'
      },
      'huikai.work@gmail.com': {
        expirationDate: '2025-10-13',
        message: 'Due to system upgrade, your subscription was automatically canceled. Please resubscribe to continue using Pro features.'
      },
      'emolgroupste@gmail.com': {
        expirationDate: '2025-10-13',
        message: 'Due to system upgrade, your subscription was automatically canceled. Please resubscribe to continue using Pro features.'
      },
    };

    const userConfig = affectedEmails[userEmail as keyof typeof affectedEmails];
    
    if (userConfig) {
      return {
        show: true,
        title: 'System Upgrade Notice',
        message: userConfig.message,
        expirationDate: userConfig.expirationDate,
        urgent: false,
      };
    }

    return { show: false };
  };

  const expirationNotice = session?.user?.email ?
    getSubscriptionExpirationNotice(session.user.email) : { show: false };

  // Load subscriptions when component mounts or user changes
  useEffect(() => {
    if (session?.user) {
      fetchSubscriptions();
    }
  }, [session?.user, fetchSubscriptions]);

  // Card支付不需要重定向处理，移除相关逻辑

  // Card支付不需要重定向处理相关的状态和函数

  const handleCancelSubscription = async () => {
    setCanceling(true);

    try {
      console.log("🔴 Initiating subscription cancellation...");
      
      // Call Stripe cancel subscription API
      const response = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          immediate: false // Cancel at period end
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      console.log("✅ Subscription cancelled successfully:", result);
      
      // Show different messages based on cancellation type
      const message = result.subscription?.cancelAtPeriodEnd 
        ? `Your subscription will be cancelled at the end of the current billing period. You can continue using Pro features until ${result.subscription?.currentPeriodEnd ? new Date(result.subscription.currentPeriodEnd).toLocaleDateString() : 'period end'}.`
        : "Your subscription has been cancelled immediately! Your account has been downgraded to the free plan, and your existing credits are preserved.";
      
      toast.success(message, {
        duration: 8000,
      });

      // Close modal and refresh user data
      setShowCancelModal(false);
      setCancelReason("");
      await refreshAll();
      // Refresh subscription status
      await fetchSubscriptions();

    } catch (error: any) {
      console.error("❌ Subscription cancellation failed:", error);
      toast.error(`Failed to cancel subscription: ${error.message}`, {
        duration: 5000,
      });
    } finally {
      setCanceling(false);
    }
  };


  const handleReactivateSubscription = async () => {
    setReactivating(true);
    
    try {
      console.log("🔄 Reactivating subscription...");
      
      // Call resume subscription API
      const response = await fetch('/api/stripe/subscription/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // API will automatically find subscriptions to resume
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reactivate subscription');
      }

      console.log("✅ Subscription reactivated successfully:", result);
      
      toast.success("Subscription reactivated! Your subscription will continue as normal.");
      
      // Refresh user data and subscription status
      await refreshAll();
      await fetchSubscriptions();
      
    } catch (error: any) {
      console.error("❌ Subscription reactivation failed:", error);
      toast.error(`Failed to reactivate subscription: ${error.message}`);
    } finally {
      setReactivating(false);
    }
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
        {session && (isLoading || subscriptionLoading) && (
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

        {/* System upgrade notice */}
        {session && expirationNotice.show && isProUser && (
          <div className="bg-blue-50 border border-blue-200 p-4 mb-6 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  {expirationNotice.title}
                </h3>
                <p className="text-blue-700 text-sm">
                  {expirationNotice.message}
                </p>
                {expirationNotice.expirationDate && (
                  <p className="text-blue-600 text-xs mt-2">
                    Expiration date: {expirationNotice.expirationDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Status Bar */}
        {session && !isLoading && !subscriptionLoading && user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Plan</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {planDisplayName} Plan
                  </span>
                  {/* Only show status badge for Pro plans */}
                  {isProUser && getStatusBadge('active', plan)}
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
              {/* Top up button - for Pro plan users */}
              {isProUser && (
                <button
                  onClick={() => setShowTopUp(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="w-5 h-5" />
                  Get credits
                </button>
              )}
              
              {/* Cancel subscription button - for subscribed users */}
              {hasActiveSubscription && activeSubscription && (
                <div className="flex flex-col gap-2">
                  {subscriptionCanceled ? (
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <button
                        onClick={handleReactivateSubscription}
                        disabled={reactivating}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md border whitespace-nowrap ${
                          reactivating
                            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-600 hover:border-green-700'
                        }`}
                      >
                        {reactivating ? 'Reactivating...' : 'Reactivate Subscription'}
                      </button>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 flex-1 min-w-0">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.725-1.36 3.49 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium whitespace-nowrap">
                          Subscription will be canceled at period end
                          {activeSubscription.current_period_end && (
                            <span className="block text-xs text-yellow-600 mt-1">
                              Until {new Date(activeSubscription.current_period_end * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
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
              )}
            </div>
            
          </div>
        )}
      </div>

      {/* Pricing Section - Reused from pricing page */}
      <PricingSection />

      {/* Pricing Table Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Task Points Consumption
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Different tasks consume different amounts of points. Choose the mode that fits your needs and budget.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Task Type</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Fast Mode</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Turbo Mode</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Draft in Fast Mode</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Draft in Turbo Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Standard Generation</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">40</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Strong Variation</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Light Variation</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Creative Upscale</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">320</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Standard Upscale</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Inpaint</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Remix</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Zoom</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Pan</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Advanced Edit</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Style Transfer</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Remove Background</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Edit</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">120</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">240</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Outpaint</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Enhance</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">160</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Blend</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">80</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Describe</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">20</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Shorten</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">20</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-blue-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Image to Video (480p)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">480</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">960</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-blue-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Image to Video (720p)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">1536</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">3072</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-blue-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Video Extension (480p)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">480</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">960</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-blue-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Video Extension (720p)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">1536</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">3072</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-blue-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-semibold">Video Upscale</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">480</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 font-semibold">960</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">Note:</span> Draft modes are only available for V7 tasks. 
              Video tasks are highlighted in blue and require higher point consumption.
            </p>
            <p className="text-sm text-gray-500">
              Points are consumed based on the complexity and processing requirements of each task.
            </p>
          </div>
        </div>
      </section>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
      />

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
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
                    Cancel Subscription Confirmation
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Your subscription will be cancelled at the end of the current billing period</p>
                        <p className="mt-1">You can continue using Pro features until then.</p>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={canceling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
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
                      Processing...
                    </>
                  ) : (
                    'Confirm Cancellation'
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