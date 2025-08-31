"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// 强制动态渲染，避免静态预渲染阶段对 useSearchParams 的限制
export const dynamic = "force-dynamic";

// 注意：这是一个简化的客户门户实现
// 由于Square的订阅API复杂且我们使用支付链接方式，
// 这个门户主要用于显示用户信息和管理基本操作

interface SubscriptionData {
  subscriptionId: string;
  status: string;
  customerId: string;
  startDate: string;
  canceledDate?: string;
  phases: any[];
  plan: string;
  credits: number;
}

function PortalContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return_url') || '/app';

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchSubscriptionData();
    }
  }, [status, router]);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();

      if (data.user.squareSubscriptionId) {
        // 这里可以调用Square API来获取最新的订阅信息
        // 暂时使用用户数据中的信息
        setSubscriptionData({
          subscriptionId: data.user.squareSubscriptionId,
          status: data.user.subscriptionStatus,
          customerId: data.user.squareCustomerId,
          startDate: data.user.subscriptionStartDate || new Date().toISOString(),
          plan: data.user.plan,
          credits: data.credits?.balance || 0,
          phases: []
        });
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionData?.subscriptionId) return;

    try {
      setIsCanceling(true);
      setError(null);

      // 由于使用支付链接方式，取消订阅通过状态更新处理
      // 这里调用API来更新用户状态
      const response = await fetch('/api/user/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cancel',
          reason: 'user_requested',
          note: 'Cancelled via Square portal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      setSuccessMessage('Subscription cancelled successfully. Your account will remain active until the end of the current billing period.');
      setTimeout(() => {
        router.push(returnUrl);
      }, 3000);

    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription. Please contact support for assistance.');
    } finally {
      setIsCanceling(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href={returnUrl}
            className="btn btn-ghost btn-sm mb-4"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-base-content">Square Billing Portal</h1>
          <p className="text-base-content/70 mt-2">Manage your Square subscription and billing information</p>

          {/* 警告信息 */}
          <div className="alert alert-warning mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-bold">Simplified Portal</h3>
              <div className="text-xs">
                This is a simplified customer portal. For advanced subscription management,
                please contact support. Square&apos;s subscription features are managed through
                payment links for better compatibility.
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {!subscriptionData ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h2 className="text-2xl font-semibold mb-2">No Active Subscription</h2>
              <p className="text-base-content/70 mb-6">
                You don&apos;t have an active Square subscription. Visit our pricing page to get started.
              </p>
              <Link href="/pricing" className="btn btn-primary">
                View Pricing
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Subscription Details */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Current Subscription</h2>
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Plan:</span>
                    <span className="font-semibold capitalize">{subscriptionData.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Status:</span>
                    <span className={`badge ${
                      subscriptionData.status === 'active' ? 'badge-success' :
                      subscriptionData.status === 'canceled' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {subscriptionData.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Credits Balance:</span>
                    <span className="font-semibold">{subscriptionData.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Start Date:</span>
                    <span>{new Date(subscriptionData.startDate).toLocaleDateString()}</span>
                  </div>
                  {subscriptionData.canceledDate && (
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Canceled Date:</span>
                      <span>{new Date(subscriptionData.canceledDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Manage Subscription</h2>
                <div className="space-y-4 mt-4">
                  {subscriptionData.status === 'active' && (
                    <div className="space-y-2">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                        className="btn btn-error btn-block"
                      >
                        {isCanceling ? (
                          <>
                            <div className="loading loading-spinner loading-sm"></div>
                            Canceling...
                          </>
                        ) : (
                          'Cancel Subscription'
                        )}
                      </button>
                      <p className="text-xs text-base-content/60">
                        Your subscription will remain active until the end of the current billing period.
                      </p>
                    </div>
                  )}

                  {/* 功能限制说明 */}
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <h3 className="font-bold">Limited Features</h3>
                      <div className="text-xs">
                        Due to Square&apos;s API limitations and our payment link approach:
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>No plan upgrades/downgrades</li>
                          <li>No payment method updates</li>
                          <li>Limited billing history</li>
                          <li>No automatic renewals</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="divider">Support</div>

                  <div className="text-sm text-base-content/70 space-y-2">
                    <p>Need help with your subscription or billing?</p>
                    <div className="space-y-1">
                      <p>
                        <a href="/contact" className="link link-primary">
                          Contact Support
                        </a>
                      </p>
                      <p>
                        <a href="mailto:support@pngtubermaker.com" className="link link-primary">
                          Email: support@pngtubermaker.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SquarePortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
