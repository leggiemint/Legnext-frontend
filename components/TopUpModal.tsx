"use client";

import { useState } from "react";
import { WalletIcon, XCircleIcon } from "@heroicons/react/24/outline";


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

export default function TopUpModal({
  isOpen,
  onClose,
  title = "Top up",
  description = "Get more credits to continue using the app.",
  buttonText = "Top up"
}: TopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(10);

  if (!isOpen) return null;

  const selectedOption = defaultTopUpOptions.find(opt => opt.amount === selectedAmount);

  const handleConfirm = async () => {
    if (selectedOption) {
      try {
        // 创建TopUp checkout session
        const response = await fetch('/api/stripe/topup/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: selectedOption.amount,
            credits: selectedOption.credits,
            successUrl: `${window.location.origin}/app/credit-balance?success=true`,
            cancelUrl: `${window.location.origin}/app/credit-balance?canceled=true`,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        const data = await response.json();
        
        // 重定向到Stripe Checkout
        window.location.href = data.url;
      } catch (error) {
        console.error('TopUp checkout error:', error);
        // 可以添加错误提示
        alert('Failed to start payment process. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <WalletIcon className="w-5 h-5 text-gray-600" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">{description}</p>
        
        {/* Amount Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <div className="relative">
            <select
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(Number(e.target.value))}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none"
            >
              {defaultTopUpOptions.map((option) => (
                <option key={option.amount} value={option.amount}>
                  ${option.amount} ({option.credits} credits)
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            ${selectedAmount} → {selectedOption?.credits} credits
          </p>
        </div>
        
        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <WalletIcon className="w-4 h-4" />
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
