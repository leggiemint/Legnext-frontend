"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface PaymentErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    title: string;
    message: string;
    showRetry?: boolean;
    showContact?: boolean;
    statusCode?: number;
    requestId?: string;
  };
  onRetry?: () => void;
}

export default function PaymentErrorModal({
  isOpen,
  onClose,
  error,
  onRetry,
}: PaymentErrorModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen) return null;

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      onClose();
    } catch (retryError) {
      console.error("Retry failed:", retryError);
      toast.error("Retry failed. Please try again later.");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContactSupport = () => {
    // 创建支持工单的预填充内容
    const supportMessage = `Payment Error Report

Error: ${error.title}
Message: ${error.message}
Status Code: ${error.statusCode || 'Unknown'}
Request ID: ${error.requestId || 'N/A'}
Timestamp: ${new Date().toISOString()}

Please describe what you were trying to do when this error occurred:`;

    // 打开邮件客户端或支持页面
    const mailtoLink = `mailto:support@legnext.ai?subject=Payment Error Report&body=${encodeURIComponent(supportMessage)}`;
    window.open(mailtoLink, '_blank');
  };

  const getErrorIcon = () => {
    if (error.statusCode === 500 || error.message.includes('unavailable')) {
      return (
        <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    } else if (error.statusCode === 403 || error.message.includes('blocked')) {
      return (
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const getErrorColor = () => {
    if (error.statusCode === 500 || error.message.includes('unavailable')) {
      return 'border-orange-200 bg-orange-50';
    } else if (error.statusCode === 403 || error.message.includes('blocked')) {
      return 'border-red-200 bg-red-50';
    } else {
      return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative w-full max-w-md rounded-lg border-2 ${getErrorColor()} bg-white p-6 shadow-xl`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              {getErrorIcon()}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {error.title}
            </h3>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              {error.message}
            </p>

            {/* Additional info */}
            {(error.requestId || error.statusCode) && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6 text-left">
                <div className="text-sm text-gray-600">
                  {error.statusCode && (
                    <div className="mb-1">
                      <span className="font-medium">Status Code:</span> {error.statusCode}
                    </div>
                  )}
                  {error.requestId && (
                    <div>
                      <span className="font-medium">Request ID:</span> {error.requestId}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {error.showRetry && onRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isRetrying ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Retrying...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try Again
                    </>
                  )}
                </button>
              )}

              {error.showContact && (
                <button
                  onClick={handleContactSupport}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Support
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            {/* Help text */}
            <div className="mt-4 text-xs text-gray-500">
              💡 If this problem persists, please contact our support team with the details above.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
