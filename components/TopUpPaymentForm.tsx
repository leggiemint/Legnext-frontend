'use client';

import { useState } from 'react';
import { useElements, useStripe, PaymentElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import config from '@/config';

interface TopUpPaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  credits: number;
}

export default function TopUpPaymentForm({
  onSuccess,
  onCancel,
  amount,
  credits
}: TopUpPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 确认支付
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/app/credit-balance',
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success(`Successfully purchased ${credits} credits for $${amount}!`);
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 支付信息概要 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-900">Credits:</span>
          <span className="text-sm font-bold text-gray-900">{credits.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">Total:</span>
          <span className="text-lg font-bold" style={{ color: config.colors.main }}>
            ${amount}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="space-y-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* 按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: config.colors.main,
            opacity: (!stripe || !elements || isLoading) ? 0.5 : 1
          }}
        >
          {isLoading ? 'Processing...' : `Pay $${amount}`}
        </button>
      </div>
    </form>
  );
}