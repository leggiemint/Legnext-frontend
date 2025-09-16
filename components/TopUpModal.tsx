"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { WalletIcon } from "@heroicons/react/24/outline";
import TopUpPaymentForm from "./TopUpPaymentForm";
import config from "@/config";
import { useUser } from "@/contexts/UserContext";


interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

const defaultTopUpOptions = [
  { amount: 5, credits: 5000 },    // $5 = 5000 credits (1$ = 1000 credits)
  { amount: 10, credits: 10000 },  // $10 = 10000 credits
  { amount: 25, credits: 25000 },  // $25 = 25000 credits
  { amount: 50, credits: 50000 },  // $50 = 50000 credits
  { amount: 100, credits: 100000 }, // $100 = 100000 credits
  { amount: 250, credits: 250000 }, // $250 = 250000 credits
  { amount: 500, credits: 500000 }  // $500 = 500000 credits
];

// 初始化Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function TopUpModal({
  isOpen,
  onClose,
  title = "Top up",
  description = "Get more credits to continue using the app.",
  buttonText = "Top up"
}: TopUpModalProps) {
  const { refreshBalance } = useUser();
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    customerId: string;
    amount: number;
    credits: number;
    currency: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 重置状态当模态框关闭时 - 必须在早期返回之前
  useEffect(() => {
    if (!isOpen) {
      setShowPayment(false);
      setPaymentDetails(null);
      setIsLoading(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedOption = defaultTopUpOptions.find(opt => opt.amount === selectedAmount);

  // 创建PaymentIntent
  const createPaymentIntent = async () => {
    if (!selectedOption) return;

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/stripe/topup/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedOption.amount,
          credits: selectedOption.credits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setPaymentDetails({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        customerId: data.customerId,
        amount: data.amount,
        credits: data.credits,
        currency: data.currency,
      });

      setShowPayment(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    onClose();
    // 刷新余额数据而不重新加载页面
    if (refreshBalance) {
      await refreshBalance();
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPaymentDetails(null);
  };

  const handleBackdropClick = (e: any) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <WalletIcon className="w-6 h-6" style={{ color: config.colors.main }} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
              <p className="text-sm text-gray-600">
                Purchase credits for your account
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Setup Failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPaymentIntent}
                  className="px-4 py-2 font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: config.colors.main }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : showPayment && paymentDetails ? (
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
                      boxShadow: `0 0 0 1px ${config.colors.main}`,
                    },
                    '.Tab': {
                      borderColor: '#e5e7eb',
                      backgroundColor: '#f9fafb',
                    },
                    '.Tab--selected': {
                      borderColor: config.colors.main,
                      backgroundColor: `${config.colors.main}10`,
                    },
                  },
                },
              }}
            >
              <TopUpPaymentForm
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                amount={paymentDetails.amount}
                credits={paymentDetails.credits}
              />
            </Elements>
          ) : (
            /* 金额选择界面 */
            <div>
              <p className="text-gray-600 mb-6">{description}</p>

              {/* Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Credit Package</label>
                <div className="grid grid-cols-1 gap-3">
                  {defaultTopUpOptions.map((option) => (
                    <label
                      key={option.amount}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAmount === option.amount
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="amount"
                        value={option.amount}
                        checked={selectedAmount === option.amount}
                        onChange={(e) => setSelectedAmount(Number(e.target.value))}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedAmount === option.amount
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAmount === option.amount && (
                            <div className="w-full h-full rounded-full bg-purple-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {option.credits.toLocaleString()} Credits
                          </div>
                          <div className="text-sm text-gray-500">
                            ${(option.credits / 1000).toFixed(1)}k credits
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${option.amount}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${(option.amount / option.credits * 1000).toFixed(2)}/1k
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Selected Summary */}
              {selectedOption && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">Selected:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {selectedOption.credits.toLocaleString()} credits
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Total:</span>
                    <span className="text-lg font-bold" style={{ color: config.colors.main }}>
                      ${selectedOption.amount}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPaymentIntent}
                  disabled={!selectedOption || isLoading}
                  className="flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: config.colors.main }}
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
