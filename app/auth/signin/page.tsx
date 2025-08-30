"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import config from "@/config";
import Image from "next/image";

const SigninPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigninContent />
    </Suspense>
  );
};

const SigninContent = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || config.auth.callbackUrl;

  return (
    <main className="h-screen w-full bg-gray-50 font-sans antialiased flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-md w-full">
        {/* Header (brand + marketing copy) */}
        <div className="text-left mb-8 space-y-4">
          <a href="/" className="inline-flex items-center mb-6 group transition-transform hover:scale-105">
            <Image
              src="/images/logo.svg"
              alt={config.appName}
              width={216}
              height={48}
              className="w-54 h-auto"
            />
          </a>
          
          <div className="space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20">
              <span className="text-sm font-medium text-[#06b6d4]">Join thousands of streamers</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Create Your PNGTuber Avatar in Minutes,
              <span className="block text-gray-600">no art skills required.</span>
            </h1>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              Create an account or log in with an existing one to start creating your streaming avatar.
            </p>
          </div>
        </div>

        {/* Auth Buttons Container */}
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg">
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Legal copy */}
        <div className="text-left mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            New accounts are subject to our{" "}
            <a href="/terms" className="text-gray-600 hover:text-[#06b6d4] underline-offset-2 hover:underline transition-colors">
              terms & conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-gray-600 hover:text-[#06b6d4] underline-offset-2 hover:underline transition-colors">
              privacy policy
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
};

export default SigninPage;