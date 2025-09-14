'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SubscriptionData {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  ended_at: number | null;
  price: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
  latest_invoice: string;
}

interface InvoiceData {
  id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  created: number;
  due_date: number | null;
  period_start: number | null;
  period_end: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  subscription: string | null;
  billing_reason: string;
}

/**
 * Stripe订阅Hook
 */
export function useStripeSubscription() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!session?.user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions);
      setHasActiveSubscription(data.hasActiveSubscription);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  const cancelSubscription = useCallback(async (subscriptionId: string, immediate = false) => {
    try {
      const response = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, immediate }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      // 刷新订阅列表
      fetchSubscriptions();
      return data.subscription;
    } catch (err) {
      console.error('Error canceling subscription:', err);
      throw err;
    }
  }, [fetchSubscriptions]);

  const resumeSubscription = useCallback(async (subscriptionId: string) => {
    try {
      const response = await fetch('/api/stripe/subscription/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      const data = await response.json();
      // 刷新订阅列表
      fetchSubscriptions();
      return data.subscription;
    } catch (err) {
      console.error('Error resuming subscription:', err);
      throw err;
    }
  }, [fetchSubscriptions]);

  const createCheckoutSession = useCallback(async (priceId: string, successUrl?: string, cancelUrl?: string) => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // 获取活跃订阅
  const activeSubscription = subscriptions.find(
    sub => sub.status === 'active' || sub.status === 'trialing'
  );

  return {
    subscriptions,
    activeSubscription,
    hasActiveSubscription,
    isLoading,
    error,
    refetch: fetchSubscriptions,
    cancelSubscription,
    resumeSubscription,
    createCheckoutSession,
  };
}

/**
 * Stripe发票Hook
 */
export function useStripeInvoices(limit: number = 10) {
  const sessionData = useSession();
  const session = sessionData?.data;
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!session?.user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/stripe/invoices?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, limit]);

  const fetchInvoiceDetails = useCallback(async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/stripe/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    isLoading,
    error,
    refetch: fetchInvoices,
    fetchInvoiceDetails,
  };
}

/**
 * Stripe结账Hook
 */
export function useStripeCheckout() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (
    priceId: string,
    options: {
      successUrl?: string;
      cancelUrl?: string;
    } = {}
  ) => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // 自动跳转到Stripe结账页面
      if (data.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(errorMessage);
      console.error('Error creating checkout session:', err);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createCheckoutSession,
    isCreating,
    error,
  };
}

/**
 * 订阅状态辅助Hook
 */
export function useSubscriptionStatus() {
  const { activeSubscription, hasActiveSubscription, isLoading } = useStripeSubscription();

  const isPro = hasActiveSubscription && activeSubscription?.status === 'active';
  const isTrialing = hasActiveSubscription && activeSubscription?.status === 'trialing';
  const isCanceled = activeSubscription?.cancel_at_period_end || false;
  const isActive = isPro || isTrialing;

  const periodEnd = activeSubscription?.current_period_end 
    ? new Date(activeSubscription.current_period_end * 1000)
    : null;

  const daysUntilEnd = periodEnd 
    ? Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    isPro,
    isTrialing,
    isCanceled,
    isActive,
    periodEnd,
    daysUntilEnd,
    subscription: activeSubscription,
    isLoading,
  };
}