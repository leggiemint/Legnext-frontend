'use client';

import React from 'react';
import Image from 'next/image';
import { useUserInfo, useUserPlan } from '@/contexts/UserContext';

interface UserInfoProps {
  variant?: 'compact' | 'detailed' | 'avatar-only';
  showPlan?: boolean;
  showEmail?: boolean;
  className?: string;
}

export function UserInfo({ 
  variant = 'compact', 
  showPlan = true,
  showEmail = false,
  className = '' 
}: UserInfoProps) {
  const { user, isLoading, error } = useUserInfo();
  const plan = useUserPlan();

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Error loading user info
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-300 rounded w-20"></div>
          <div className="h-2 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Not logged in
      </div>
    );
  }

  // 头像组件
  const UserAvatar = ({ size = 'w-8 h-8' }: { size?: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center`}>
      {user.image ? (
        <Image 
          src={user.image} 
          alt={user.name || 'User'} 
          width={32}
          height={32}
          className={`${size} rounded-full object-cover`}
        />
      ) : (
        <span className="text-white font-medium text-sm">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  // Plan标签组件
  const PlanBadge = () => (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
      plan === 'pro' 
        ? 'bg-purple-100 text-purple-700' 
        : 'bg-gray-100 text-gray-600'
    }`}>
      {plan.toUpperCase()}
    </span>
  );

  // 仅头像显示
  if (variant === 'avatar-only') {
    return (
      <div className={`flex items-center ${className}`}>
        <UserAvatar />
      </div>
    );
  }

  // 紧凑显示
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <UserAvatar />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {user.name || 'User'}
            </span>
            {showPlan && <PlanBadge />}
          </div>
          {showEmail && (
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 详细显示
  if (variant === 'detailed') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-3">
          <UserAvatar size="w-12 h-12" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {user.name || 'User'}
              </h3>
              {showPlan && <PlanBadge />}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium capitalize">{plan}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Backend Account:</span>
            <span className="font-mono text-xs">
              {user.backendAccountId ? `#${user.backendAccountId}` : 'Not linked'}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">API Access:</span>
            <span className={user.initApiKey ? 'text-green-600' : 'text-gray-400'}>
              {user.initApiKey ? 'Available' : 'Not available'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// 快速用户状态指示器
export function UserStatusIndicator({ className = '' }: { className?: string }) {
  const { user, isLoading } = useUserInfo();
  const plan = useUserPlan();

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        user.backendAccountId && user.initApiKey 
          ? 'bg-green-500' 
          : 'bg-yellow-500'
      }`} />
      <span className="text-xs text-gray-600">
        {plan.toUpperCase()}
      </span>
    </div>
  );
}