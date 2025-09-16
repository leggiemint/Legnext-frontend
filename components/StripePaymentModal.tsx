'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { toast } from 'react-hot-toast';
import config from '@/config';
import { useUser } from '@/contexts/UserContext';

// 初始化 Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentDetails {
  clientSecret: string;
  setupIntentId: string;
  customerId: string;
  amount: number;
  currency: string;
  priceId: string;
}

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceId: string;
  onSuccess?: () => void;
}

export default function StripePaymentModal({
  isOpen,
  onClose,
  priceId,
  onSuccess,
}: StripePaymentModalProps) {
  const { user, refreshAll } = useUser();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 创建 SetupIntent
  const createSetupIntent = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userPlan: user?.plan || 'free'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setPaymentDetails({
        clientSecret: data.clientSecret,
        setupIntentId: data.setupIntentId,
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        priceId: data.priceId,
      });
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.message || 'Failed to initialize payment');
      toast.error(err.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  // 当模态框打开时创建 SetupIntent
  useEffect(() => {
    if (isOpen && !paymentDetails) {
      createSetupIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentDetails]);

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setPaymentDetails(null);
      setError('');
    }
  }, [isOpen]);

  const handleSuccess = async (subscriptionId: string) => {
    console.log('Subscription created:', subscriptionId);
    onSuccess?.();
    onClose();
    // 刷新用户数据和余额，不重新加载页面
    if (refreshAll) {
      await refreshAll();
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon/apple-touch-icon.png" 
              alt="Legnext" 
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Legnext Pro
              </h2>
              <p className="text-sm text-gray-600">
                Complete your subscription
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="loading loading-spinner loading-lg mb-4" style={{ color: config.colors.main }}></div>
                <p className="text-gray-600">Initializing payment...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Setup Failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSetupIntent}
                  className="px-4 py-2 font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: config.colors.main }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : paymentDetails ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentDetails.clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: config.colors.main,
                    colorBackground: '#ffffff',
                    colorText: '#1f2937',
                    colorDanger: '#ef4444',
                    borderRadius: '8px',
                  },
                  rules: {
                    '.Input': {
                      border: '1px solid #d1d5db',
                    },
                    '.Input:focus': {
                      borderColor: config.colors.main,
                      boxShadow: `0 0 0 2px ${config.colors.main}20`,
                    },
                    '.Tab': {
                      border: '1px solid #d1d5db',
                    },
                    '.Tab:hover': {
                      backgroundColor: '#f9fafb',
                    },
                    '.Tab--selected': {
                      borderColor: config.colors.main,
                      backgroundColor: `${config.colors.main}10`,
                    },
                    // Hide default terms and conditions
                    '.p-LegalText': {
                      display: 'none',
                    },
                    '.p-LegalTextContainer': {
                      display: 'none',
                    },
                    '.p-LegalText--default': {
                      display: 'none',
                    },
                    // Hide Stripe's product summary/details
                    '.p-Summary': {
                      display: 'none',
                    },
                    '.p-SummaryContainer': {
                      display: 'none',
                    },
                    '.p-ProductSummary': {
                      display: 'none',
                    },
                    '.p-ProductSummaryContainer': {
                      display: 'none',
                    },
                    '.p-OrderSummary': {
                      display: 'none',
                    },
                    '.p-OrderSummaryContainer': {
                      display: 'none',
                    },
                    // Hide any pricing breakdown
                    '.p-PricingSummary': {
                      display: 'none',
                    },
                    '.p-PricingSummaryContainer': {
                      display: 'none',
                    },
                  },
                },
              }}
            >
              <StripePaymentForm
                clientSecret={paymentDetails.clientSecret}
                setupIntentId={paymentDetails.setupIntentId}
                priceId={paymentDetails.priceId}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={handleCancel}
                amount={paymentDetails.amount}
                currency={paymentDetails.currency}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}