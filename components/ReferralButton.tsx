"use client";

import { useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { showReferralWidget, isReferralWidgetLoaded } from '@/libs/getreditus';

interface ReferralButtonProps {
  className?: string;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * 推荐按钮组件
 * 点击后显示 GetReditus 推荐小部件
 */
export default function ReferralButton({ 
  className = "", 
  children = "Share & Earn",
  variant = "primary"
}: ReferralButtonProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      // 检查推荐小部件是否已加载
      const isLoaded = isReferralWidgetLoaded();
      
      if (!isLoaded) {
        console.warn('Referral widget not loaded yet, please wait...');
        return;
      }

      // 显示推荐小部件
      showReferralWidget();
    } catch (error) {
      console.error('Error showing referral widget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "btn transition-colors duration-200";
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300`;
      case 'outline':
        return `${baseClasses} bg-transparent hover:bg-[#4f46e5] text-[#4f46e5] hover:text-white border-2 border-[#4f46e5]`;
      default:
        return `${baseClasses} bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-white border-none`;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${getButtonClasses()} ${className}`}
    >
      {children}
    </button>
  );
}
