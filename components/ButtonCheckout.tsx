"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";
import config from "@/config";
import PaymentErrorModal from "./PaymentErrorModal";

// This component is used to create Stripe Checkout Sessions
// It calls the /api/stripe/create-checkout route with the priceId, successUrl and cancelUrl
// By default, it doesn't force users to be authenticated. But if they are, it will prefill the Checkout data with their email and/or credit card. You can change that in the API route
// You can also change the mode to "subscription" if you want to create a subscription instead of a one-time payment
const ButtonCheckout = ({
  priceId,
  mode, // Default to subscription for Pro plan
  isFree = false,
}: {
  priceId?: string; // Optional for free plans
  mode?: "payment" | "subscription";
  isFree?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    error: any;
  }>({
    isOpen: false,
    error: null,
  });
  const sessionData = useSession();
  const session = sessionData?.data;

  const handleAction = async () => {
    setIsLoading(true);
    setErrorModal({ isOpen: false, error: null });

    try {
      if (isFree) {
        // Free plan logic based on login state
        if (session) {
          // Logged in: redirect to app
          window.location.href = "/app";
        } else {
          // Not logged in: redirect to login
          window.location.href = config.auth.loginUrl;
        }
      } else {
        // Pro plan logic based on login state
        if (session) {
          // Check if user already has an active subscription
          try {
            const userResponse = await fetch('/api/user/profile');
            const userData = await userResponse.json();
            
            if (userData?.profile?.plan === "pro") {
              toast.success("You are already subscribed to the Pro plan!");
              return;
            }
          } catch (error) {
            console.error("Failed to check user status:", error);
            // Continue with checkout process
          }
          
          // Logged in: proceed to payment checkout
          if (!priceId) {
            toast.error("Price ID is required for paid plans");
            return;
          }
          
          const { url }: { url: string } = await apiClient.post(
            "/stripe/create-checkout-session",
            {
              priceId,
              mode: mode || "subscription",
              successUrl: `${window.location.origin}/app`,
              cancelUrl: window.location.href,
            }
          );
          window.location.href = url;
        } else {
          // Not logged in: redirect to login first
          window.location.href = config.auth.loginUrl;
        }
      }
    } catch (error: any) {
      console.error("Payment checkout error:", error);
      
      // 显示详细的错误模态框
      setErrorModal({
        isOpen: true,
        error: {
          title: error.title || "Payment Error",
          message: error.message || "Failed to process payment. Please try again.",
          showRetry: error.showRetry || false,
          showContact: error.showContact || false,
          statusCode: error.response?.status,
          requestId: error.response?.data?.requestId,
        },
      });
    }

    setIsLoading(false);
  };

  const handleRetry = async () => {
    await handleAction();
  };

  return (
    <>
      <button
        className="btn btn-block group text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: config.colors.main }}
        onClick={() => handleAction()}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {isFree ? (
              // 🎯 Free Plan Icon - Rocket for "Get Started"
              <svg
                className="w-5 h-5 fill-white group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-200"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.5 2C12.5 2 16.5 4.5 19 7.5C21.5 10.5 22 15.5 22 15.5C22 15.5 21.5 16 20.5 16H17L13 20V17C13 17 10.5 16.5 8.5 15C6.5 13.5 5 11 5 11L12.5 2Z" fill="currentColor"/>
                <path d="M7 21C6.5 21 6 20.5 6 20C6 19.5 6.5 19 7 19H9C9.5 19 10 19.5 10 20C10 20.5 9.5 21 9 21H7Z" fill="currentColor"/>
                <path d="M3 17C2.5 17 2 16.5 2 16C2 15.5 2.5 15 3 15H5C5.5 15 6 15.5 6 16C6 16.5 5.5 17 5 17H3Z" fill="currentColor"/>
                <path d="M6 13C5.5 13 5 12.5 5 12C5 11.5 5.5 11 6 11H8C8.5 11 9 11.5 9 12C9 12.5 8.5 13 8 13H6Z" fill="currentColor"/>
              </svg>
            ) : (
              // 💎 Pro Plan Icon - Crown for Premium
              <svg
                className="w-5 h-5 fill-white group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-200"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5 16L3 8L8 12L12 6L16 12L21 8L19 16H5Z" fill="currentColor"/>
                <path d="M19 18H5C4.45 18 4 18.45 4 19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19C20 18.45 19.55 18 19 18Z" fill="currentColor"/>
                <circle cx="12" cy="9" r="1.5" fill="white"/>
              </svg>
            )}
            <span>{isFree ? "Try Free" : "Go Pro"}</span>
          </div>
        )}
      </button>

      {/* Payment Error Modal */}
      <PaymentErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, error: null })}
        error={errorModal.error}
        onRetry={handleRetry}
      />
    </>
  );
};

export default ButtonCheckout;
