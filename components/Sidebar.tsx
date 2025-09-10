"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { KeyIcon, CreditCardIcon, CurrencyDollarIcon, DocumentTextIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useUser, usePlan, useCredits } from '@/contexts/UserContext';

const sidebarItems = [
  {
    name: "Midjourney",
    href: "/app/midjourney",
    icon: <Image src="/images/Midjourney_logo.png" alt="Midjourney" width={20} height={20} className="w-5 h-5" />,
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
  const { userData, loading } = useUser();
  const { planDisplayName, isProUser } = usePlan();
  const { balance } = useCredits();

  return (
    <div className="bg-white w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col z-40 border-r border-gray-200">
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-grow pt-8 pr-0">
        {/* Navigation */}
        <nav className="px-4">
          <ul className="space-y-3">
            {sidebarItems.map((item) => {
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

          {/* API & Logs Section */}
          <div className="mt-8 mb-4">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              API & Logs
            </h3>
            <ul className="space-y-3">
              {apiLogsItems.map((item) => {
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
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-base-300 rounded w-20 mb-2"></div>
              <div className="h-3 bg-base-300 rounded w-16"></div>
            </div>
          ) : userData ? (
            <div className="space-y-3">
              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    isProUser
                      ? 'bg-purple-600/10 text-purple-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {planDisplayName.toLowerCase()}
                  </div>
                </div>
              </div>

              {/* Credits Display */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Credits</span>
                  <span className="font-semibold text-gray-900">{balance}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {planDisplayName} plan
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