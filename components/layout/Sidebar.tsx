"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { KeyIcon, CreditCardIcon, CurrencyDollarIcon, DocumentTextIcon, ClipboardDocumentListIcon, BookOpenIcon, BanknotesIcon, GiftIcon } from "@heroicons/react/24/outline";
import { useUser, useUserPlan } from '@/contexts/UserContext';
import { useEffect } from 'react';
import useSWR from 'swr';
import ReferralButton from '@/components/tracking/ReferralButton';
import GetReditusReferralWidget from '@/components/tracking/GetReditusReferralWidget';

// Tools组菜单项
const toolsItems = [
  {
    name: "Midjourney",
    href: "/app/midjourney",
    icon: <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v2H3v-2zm16-4H5l-2-8h18l-2 8zM7 8l1.5-6h7L17 8H7z"/><path d="M12 4l-1 4h2l-1-4z" fill="currentColor"/></svg>,
  },
  // {
  //   name: "Create Video",
  //   href: "/app/create-video",
  //   icon: <VideoCameraIcon className="w-5 h-5" />,
  // },
  // {
  //   name: "Images",
  //   href: "/app/images",
  //   icon: <PhotoIcon className="w-5 h-5" />,
  // },
];

// API & Logs组菜单项
const apiLogsItems = [
  {
    name: "API Keys",
    href: "/app/api-keys",
    icon: <KeyIcon className="w-5 h-5" />
  },
  {
    name: "Task Logs",
    href: "/app/task-logs",
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />
  },
  {
    name: "Docs",
    href: "https://docs.legnext.ai/",
    icon: <BookOpenIcon className="w-5 h-5" />
  }
];

// Billing组菜单项
const billingItems = [
  {
    name: "Credit Balance", 
    href: "/app/credit-balance",
    icon: <CurrencyDollarIcon className="w-5 h-5" />
  },
  {
    name: "Subscription",
    href: "/app/subscription",
    icon: <CreditCardIcon className="w-5 h-5" />
  },
  {
    name: "Payment Methods",
    href: "/app/payment-methods",
    icon: <BanknotesIcon className="w-5 h-5" />
  },
  {
    name: "Invoices",
    href: "/app/invoice",
    icon: <DocumentTextIcon className="w-5 h-5" />
  }
];


const Sidebar = () => {
  const pathname = usePathname();
  const sessionData = useSession();
  const session = sessionData?.data;
  
  // 使用统一的用户状态管理
  const { user, isLoading } = useUser();
  const userPlan = useUserPlan();
  const isProUser = userPlan === 'pro';

  // 使用与page.tsx相同的SWR机制获取credit-balance数据
  const { data: creditBalanceData, error: creditBalanceError, isLoading: creditBalanceLoading, mutate: refreshCreditBalance } = useSWR(
    session?.user?.email ? '/api/credit-balance' : null,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch credit balance data');
      return response.json();
    },
    { 
      refreshInterval: 30000, // 30秒刷新一次
      revalidateOnFocus: true, // 窗口获得焦点时重新验证
      revalidateOnReconnect: true, // 网络重连时重新验证
    }
  );

  // 监听支付成功事件，自动刷新余额
  useEffect(() => {
    const handlePaymentSuccess = () => {
      // 延迟刷新以确保webhook处理完成
      setTimeout(() => {
        refreshCreditBalance();
      }, 2000);
    };

    // 监听自定义事件
    window.addEventListener('payment-success', handlePaymentSuccess);
    
    return () => {
      window.removeEventListener('payment-success', handlePaymentSuccess);
    };
  }, [refreshCreditBalance]);

  // 处理credit-balance API返回的统一数据
  const creditBalance = creditBalanceData;
  const accountBalance = creditBalance?.balance || 0;

  const displayBalance = accountBalance.toFixed(2);

  return (
    <div className="bg-white w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col z-40 border-r border-gray-200">
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-grow pt-8 pr-0">
        {/* Navigation */}
        <nav className="px-4">
          {/* Tools Section */}
          <div className="mb-4">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Tools
            </h3>
            <ul className="space-y-3">
              {toolsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] ${
                        isActive
                          ? "bg-purple-600/10 text-purple-600 font-semibold shadow-sm"
                          : "text-slate-600 hover:bg-base-300 hover:text-slate-800"
                      }`}
                    >
                      <div className={`${isActive ? "text-purple-600" : "text-slate-500"} flex-shrink-0`}>
                        {item.icon}
                      </div>
                      <span className="truncate font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* API & Logs Section */}
          <div className="mt-8 mb-4">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              API & Logs
            </h3>
            <ul className="space-y-3">
              {apiLogsItems.map((item) => {
                const isActive = pathname === item.href;
                const isExternalLink = item.href.startsWith('http');
                
                return (
                  <li key={item.name}>
                    {isExternalLink ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] ${
                          isActive
                            ? "bg-purple-600/10 text-purple-600 font-semibold shadow-sm"
                            : "text-slate-600 hover:bg-base-300 hover:text-slate-800"
                        }`}
                      >
                        <div className={`${isActive ? "text-purple-600" : "text-slate-500"} flex-shrink-0`}>
                          {item.icon}
                        </div>
                        <span className="truncate font-medium">{item.name}</span>
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] ${
                          isActive
                            ? "bg-purple-600/10 text-purple-600 font-semibold shadow-sm"
                            : "text-slate-600 hover:bg-base-300 hover:text-slate-800"
                        }`}
                      >
                        <div className={`${isActive ? "text-purple-600" : "text-slate-500"} flex-shrink-0`}>
                          {item.icon}
                        </div>
                        <span className="truncate font-medium">{item.name}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Billing Section */}
          <div className="mt-8 mb-4">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Billing & Payments
            </h3>
            <ul className="space-y-3">
              {billingItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] ${
                        isActive
                          ? "bg-purple-600/10 text-purple-600 font-semibold shadow-sm"
                          : "text-slate-600 hover:bg-base-300 hover:text-slate-800"
                      }`}
                    >
                      <div className={`${isActive ? "text-purple-600" : "text-slate-500"} flex-shrink-0`}>
                        {item.icon}
                      </div>
                      <span className="truncate font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

      </div>

      {/* Referral Button - Above separator line */}
      {session && (
        <div className="p-4">
          <ReferralButton 
            variant="outline" 
            className="w-full text-sm py-2 px-3"
          >
            <GiftIcon className="w-4 h-4 mr-2" />
            Share & Earn
          </ReferralButton>
        </div>
      )}

      {/* Separator Line */}
      <div className="border-t border-gray-200"></div>

      {/* Plan Section */}
       {session && (
         <div className="p-4 border-t border-gray-200 bg-white">
          {user ? (
            <div className="space-y-3">
              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    isProUser
                      ? 'bg-purple-600/10 text-purple-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {userPlan}
                  </div>
                </div>
              </div>

              {/* Balance Display */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Balance</span>
                  <span className="font-semibold text-gray-900">
                    ${displayBalance}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {userPlan} plan
                </div>
              </div>

              {/* Upgrade Button for Free Users */}
              {!isProUser && (
                <Link 
                  href="/app/subscription"
                  className="w-full block text-center bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 hover:scale-[1.02] shadow-sm"
                >
                  ⚡ Upgrade to Premium
                </Link>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* GetReditus Referral Widget - Hidden component for loading widget */}
      <GetReditusReferralWidget />
    </div>
  );
};

export default Sidebar;