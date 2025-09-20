'use client';

import React from 'react';
import { useBalance, formatBalance, formatCredits, formatPoints } from '@/contexts/UserContext';

interface UserBalanceProps {
  variant?: 'compact' | 'detailed' | 'minimal';
  showRefresh?: boolean;
  className?: string;
}

export function UserBalance({ 
  variant = 'compact', 
  showRefresh = false,
  className = '' 
}: UserBalanceProps) {
  const { balance, isLoading, error } = useBalance();

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Failed to load balance
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No balance data
      </div>
    );
  }

  // 最小化显示 - 只显示总余额
  if (variant === 'minimal') {
    return (
      <div className={`text-sm font-medium ${className}`}>
        {formatBalance(balance.totalBalance)}
      </div>
    );
  }

  // 紧凑显示 - 显示可用余额
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="text-sm">
          <span className="text-gray-600">Balance: </span>
          <span className="font-medium text-green-600">
            {formatBalance(balance.availableBalance)}
          </span>
        </div>
        {showRefresh && (
          <button
            onClick={() => window.location.reload()}
            className="text-gray-400 hover:text-gray-600"
            title="Refresh balance"
          >
            🔄
          </button>
        )}
      </div>
    );
  }

  // 详细显示 - 显示完整信息
  if (variant === 'detailed') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Available Balance:</span>
          <span className="font-medium text-green-600">
            {formatBalance(balance.availableBalance)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Balance:</span>
          <span className="text-sm text-gray-800">
            {formatBalance(balance.totalBalance)}
          </span>
        </div>

        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Credits:</span>
            <span>{formatCredits(balance.remainingCredits)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Points:</span>
            <span>{formatPoints(balance.remainingPoints)}</span>
          </div>
        </div>

        {balance.frozenCredits > 0 || balance.frozenPoints > 0 ? (
          <div className="border-t pt-2">
            <div className="text-xs text-orange-600">
              Frozen: {formatCredits(balance.frozenCredits)} + {formatPoints(balance.frozenPoints)}
            </div>
          </div>
        ) : null}

        {showRefresh && (
          <button
            onClick={() => window.location.reload()}
            className="w-full text-xs text-gray-400 hover:text-gray-600 mt-2"
          >
            🔄 Refresh
          </button>
        )}
      </div>
    );
  }

  return null;
}

// 信用包显示组件
export function CreditPacksList({ className = '' }: { className?: string }) {
  const { balance, isLoading } = useBalance();

  if (isLoading || !balance?.creditPacks?.length) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Credit Packs</h4>
      <div className="space-y-1">
        {balance.creditPacks.map((pack) => (
          <div key={pack.id} className="text-xs bg-gray-50 p-2 rounded">
            <div className="flex justify-between">
              <span className="font-medium">{pack.description}</span>
              <span className={pack.active ? 'text-green-600' : 'text-gray-400'}>
                {pack.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between mt-1 text-gray-600">
              <span>Used: {pack.used}/{pack.capacity}</span>
              <span>Remaining: {pack.remaining}</span>
            </div>
            <div className="text-gray-500 mt-1">
              Expires: {new Date(pack.expired_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}