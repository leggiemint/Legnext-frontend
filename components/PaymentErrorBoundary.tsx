"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "react-hot-toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error("Payment Error Boundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 显示用户友好的错误提示
    this.showUserFriendlyError(error);
  }

  showUserFriendlyError = (error: Error) => {
    let message = "Something went wrong with the payment process";
    let title = "Payment Error";

    // 根据错误类型提供更友好的信息
    if (error.message.includes("Proxy error") || error.message.includes("Cloudflare")) {
      title = "Service Temporarily Unavailable";
      message = "Payment service is temporarily unavailable. Please try again in a few moments";
    } else if (error.message.includes("Network") || error.message.includes("fetch")) {
      title = "Connection Error";
      message = "Network connection failed. Please check your internet connection and try again";
    } else if (error.message.includes("timeout")) {
      title = "Request Timeout";
      message = "Request timed out. Please try again";
    }

    toast.error(
      <div className="flex flex-col gap-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm opacity-90">{message}</div>
        <div className="text-xs opacity-75 mt-1">
          💡 Try refreshing the page or contact support if the problem persists
        </div>
      </div>,
      {
        duration: 8000,
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '400px',
        },
      }
    );
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleContactSupport = () => {
    const supportMessage = `Payment Error Report

Error: ${this.state.error?.message || 'Unknown error'}
Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}
Timestamp: ${new Date().toISOString()}

Please describe what you were trying to do when this error occurred:`;

    const mailtoLink = `mailto:support@legnext.ai?subject=Payment Error Report&body=${encodeURIComponent(supportMessage)}`;
    window.open(mailtoLink, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg border-2 border-red-200 shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Error Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Process Error
            </h3>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              Something went wrong while processing your payment. This might be a temporary issue.
            </p>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6 text-left">
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">Error Details:</div>
                  <div className="text-xs font-mono break-all">
                    {this.state.error.message}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>

              <button
                onClick={this.handleContactSupport}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-4 text-xs text-gray-500">
              💡 If this problem persists, please contact our support team with the details above.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PaymentErrorBoundary;
