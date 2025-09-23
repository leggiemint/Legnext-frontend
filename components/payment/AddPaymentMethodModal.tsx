'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Inner payment form component that uses Stripe hooks
function PaymentForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      // Submit the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message || 'Form submission failed');
      }

      // Confirm the SetupIntent
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/app/payment-methods`,
          // 🎯 移除硬编码的 billing_details，让 PaymentElement 的用户输入生效
          // 这对印度等地区的支付方式至关重要
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message || 'Setup failed');
      }

      if (setupIntent && setupIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment method setup error:', err);
      onError(err.message || 'Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Information
        </label>
        <div className="p-3 border border-gray-300 rounded-lg bg-white">
          <PaymentElement
            options={{
              layout: 'tabs',
              // 仅显示卡片支付方式
              paymentMethodOrder: ['card'],
              fields: {
                billingDetails: {
                  name: 'auto',
                  email: 'auto',
                  phone: 'auto', // 允许用户输入手机号，对国际支付方式更友好
                  address: {
                    country: 'auto',
                    city: 'auto',
                    line1: 'auto',
                    line2: 'auto',
                    postalCode: 'auto',
                    state: 'auto',
                  },
                },
              },
              terms: {
                card: 'never',
              },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding...
            </>
          ) : (
            'Add Payment Method'
          )}
        </button>
      </div>

      {/* Info Text */}
      <div className="text-center">
        <p className="text-xs text-gray-600">
          Your payment method will be securely stored for future transactions.
        </p>
      </div>
    </form>
  );
}

export default function AddPaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create setup intent when modal opens
  React.useEffect(() => {
    if (isOpen && !clientSecret) {
      createSetupIntent();
    }
  }, [isOpen, clientSecret]);

  const createSetupIntent = async () => {
    try {
      setIsLoadingIntent(true);
      const response = await fetch('/api/stripe/setup-intent-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create setup intent');
      }

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      toast.error(error.message || 'Failed to initialize payment form');
      onClose();
    } finally {
      setIsLoadingIntent(false);
    }
  };

  const handleSuccess = () => {
    setError(null);
    onSuccess();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handleClose = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => !isLoadingIntent && handleClose()}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Payment Method
            </h3>
{!isLoadingIntent && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoadingIntent && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading payment form...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Payment Form */}
          {clientSecret && !isLoadingIntent && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                },
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onError={handleError}
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}