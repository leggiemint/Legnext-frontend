"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { KeyIcon, CreditCardIcon, CurrencyDollarIcon, DocumentTextIcon, ClipboardDocumentListIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { useUser, useUserPlan, useBalance } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';

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
    name: "Subscription",
    href: "/app/subscription", 
    icon: <CreditCardIcon className="w-5 h-5" />
  },
  {
    name: "Credit Balance", 
    href: "/app/credit-balance",
    icon: <CurrencyDollarIcon className="w-5 h-5" />
  },
  {
    name: "Invoices",
    href: "/app/invoice",
    icon: <DocumentTextIcon className="w-5 h-5" />
  }
];


const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // 使用统一的用户状态管理
  const { user, isLoading } = useUser();
  const userPlan = useUserPlan();
  const { balance } = useBalance();
  const isProUser = userPlan === 'pro';
  
  // 获取与credit-balance页面一致的数据
  const [balanceData, setBalanceData] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchBalanceData();
    }
  }, [session]);

  const fetchBalanceData = async () => {
    try {
      setBalanceLoading(true);
      const response = await fetch('/api/credit-balance');
      if (response.ok) {
        const data = await response.json();
        setBalanceData(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance data:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const displayBalance = balance?.availableBalance 
    ? balance.availableBalance.toFixed(2)
    : balanceData?.credits?.totalAccountBalance 
    ? balanceData.credits.totalAccountBalance.toFixed(2)
    : balanceData?.credits?.balance 
    ? (balanceData.credits.balance / 1000).toFixed(2)
    : '0.00';

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

      {/* Separator Line */}
      <div className="border-t border-gray-200"></div>

      {/* Plan Section */}
       {session && (
         <div className="p-4 border-t border-gray-200 bg-white">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-base-300 rounded w-20 mb-2"></div>
              <div className="h-3 bg-base-300 rounded w-16"></div>
            </div>
          ) : user ? (
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
                    {isLoading || balanceLoading ? (
                      <div className="w-8 h-4 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      `$${displayBalance}`
                    )}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {userPlan} plan
                </div>
              </div>

              {/* Upgrade Button for Free Users */}
              {!isProUser && (
                <Link 
                  href="/pricing"
                  className="w-full block text-center bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 hover:scale-[1.02] shadow-sm"
                >
                  ⚡ Upgrade to Premium
                </Link>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Sidebar;