'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import config from '@/config';
import { useUser } from '@/contexts/UserContext';

interface StripePaymentFormProps {
  clientSecret: string;
  setupIntentId: string;
  priceId: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void; // Optional since we don't use it in the current implementation
  amount: number;
  currency: string;
}

export default function StripePaymentForm({
  clientSecret,
  setupIntentId,
  priceId,
  onSuccess,
  onError,
  onCancel,
  amount,
  currency,
}: StripePaymentFormProps) {
  // Suppress unused variable warnings for function parameters
  void setupIntentId;
  void onCancel;
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      // 提交支付表单
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || 'Form submission failed');
        setIsProcessing(false);
        return;
      }

      // 确认 SetupIntent（不收费，只保存支付方式）
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/app`,
        },
        redirect: 'if_required', // 避免自动重定向
      });

      if (error) {
        setMessage(error.message || 'Setup failed');
        onError(error.message || 'Setup failed');
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        // SetupIntent 成功，创建订阅
        const response = await fetch('/api/stripe/confirm-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setupIntentId: setupIntent.id,
            priceId: priceId,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create subscription');
        }

        toast.success('Payment setup successful! Welcome to Pro!');
        onSuccess(result.subscriptionId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setMessage(errorMessage);
      onError(errorMessage);
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Plan Information Header */}
      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Subscribe Pro Plan</h3>
        </div>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatAmount(amount, currency)}
          </span>
          <span className="text-sm text-gray-500">/month</span>
        </div>
        
        <p className="text-sm text-gray-600">
          Then {formatAmount(amount, currency)} per month starting next month
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        {/* Payment Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Information
          </label>
          <div className="p-3 border border-gray-300 rounded-lg bg-white">
            <PaymentElement
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'us_bank_account'],
                fields: {
                  billingDetails: {
                    name: 'auto',
                    email: 'auto',
                    phone: 'never',
                    address: 'never',
                  },
                },
                terms: {
                  card: 'never',
                  usBankAccount: 'never',
                  bancontact: 'never',
                  ideal: 'never',
                  sepaDebit: 'never',
                  sofort: 'never',
                },
              }}
            />
          </div>
        </div>

        {/* Billing Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Billing Address
          </label>
          <div className="p-3 border border-gray-300 rounded-lg bg-white">
            <AddressElement
              options={{
                mode: 'billing',
                allowedCountries: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'CN', 'SG'],
                fields: {
                  phone: 'never',
                },
              }}
            />
          </div>
        </div>


        {/* Error Message */}
        {message && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{message}</p>
          </div>
        )}

        {/* Subscribe Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isProcessing || !stripe || !elements}
            className="w-full py-4 px-6 font-semibold text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ backgroundColor: config.colors.main }}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Processing...</span>
              </div>
            ) : (
              <span>Subscribe</span>
            )}
          </button>
        </div>

        {/* Terms Information */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            By subscribing, you authorize Legnext to charge you according to the terms until you cancel your subscription.
          </p>
        </div>
      </form>
    </div>
  );
}