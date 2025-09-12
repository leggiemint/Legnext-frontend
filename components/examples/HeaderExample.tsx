'use client';

import React from 'react';
import { UserInfo, UserStatusIndicator } from '@/components/UserInfo';
import { UserBalance } from '@/components/UserBalance';

// Header组件使用示例
export function HeaderExample() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-purple-600">Legnext</h1>
          </div>

          {/* 用户信息和余额 */}
          <div className="flex items-center gap-6">
            {/* 余额显示 */}
            <UserBalance variant="compact" showRefresh={true} />
            
            {/* 用户状态指示器 */}
            <UserStatusIndicator />
            
            {/* 用户信息 */}
            <UserInfo variant="compact" showPlan={true} />
          </div>
        </div>
      </div>
    </header>
  );
}

// Sidebar组件使用示例
export function SidebarExample() {
  return (
    <aside className="w-64 bg-gray-50 h-full border-r">
      <div className="p-4 space-y-4">
        {/* 用户详细信息 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <UserInfo variant="detailed" showPlan={true} showEmail={true} />
        </div>

        {/* 余额详细信息 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Account Balance</h3>
          <UserBalance variant="detailed" showRefresh={true} />
        </div>

        {/* 导航菜单 */}
        <nav className="space-y-2">
          <a href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Dashboard
          </a>
          <a href="/api-keys" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            API Keys
          </a>
          <a href="/subscription" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Subscription
          </a>
        </nav>
      </div>
    </aside>
  );
}

// 移动端菜单使用示例
export function MobileMenuExample() {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      {/* 用户信息区 */}
      <div className="pb-4 border-b">
        <UserInfo variant="compact" showPlan={true} showEmail={true} />
      </div>

      {/* 余额区 */}
      <div className="py-4 border-b">
        <UserBalance variant="compact" showRefresh={true} />
        <div className="mt-2">
          <UserStatusIndicator className="justify-center" />
        </div>
      </div>

      {/* 菜单区 */}
      <div className="pt-4 space-y-2">
        <a href="/dashboard" className="block px-3 py-2 text-sm text-gray-700">
          Dashboard
        </a>
        <a href="/subscription" className="block px-3 py-2 text-sm text-gray-700">
          Subscription
        </a>
      </div>
    </div>
  );
}