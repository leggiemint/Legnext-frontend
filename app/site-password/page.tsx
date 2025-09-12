"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import config from '@/config';

function SitePasswordForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-site-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Password is correct, redirect to original page
        router.push(redirectPath);
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image
              src="/images/logo.svg"
              alt={config.appName}
              width={200}
              height={45}
              className="mx-auto"
            />
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 border border-amber-200">
              <span className="text-sm font-medium text-amber-800">🚧 Under Development</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">
              Site Access Required
            </h1>
            
            <p className="text-gray-600 text-sm">
              This site is currently under development. Please enter the password to continue.
            </p>
          </div>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter site password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition-colors"
                required
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4f46e5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#4f46e5]/90 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Access Site'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Powered by {config.appName} • Development Mode
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SitePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SitePasswordForm />
    </Suspense>
  );
}