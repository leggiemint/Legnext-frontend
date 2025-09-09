import axios from "axios";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";
import config from "@/config";

// use this to interact with our own API (/app/api folder) from the front-end side
// See https://shipfa.st/docs/tutorials/api-call
const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    let message = "";
    let title = "Error";
    let showRetry = false;
    let showContact = false;

    // 根据错误类型提供更友好的错误信息
    if (error.response?.status === 401) {
      // User not auth, ask to re login
      toast.error("Please login to continue");
      // automatically redirect to /app page after login
      return signIn(undefined, { callbackUrl: config.auth.callbackUrl });
    } else if (error.response?.status === 403) {
      // User not authorized, must subscribe/purchase/pick a plan
      message = "Please upgrade your plan to access this feature";
      title = "Upgrade Required";
      showContact = true;
    } else if (error.response?.status === 402) {
      // Payment required
      message = "Payment is required to access this feature";
      title = "Payment Required";
      showContact = true;
    } else if (error.response?.status === 429) {
      // Rate limited
      message = "Too many requests. Please wait a moment and try again";
      title = "Rate Limited";
      showRetry = true;
    } else if (error.response?.status === 500) {
      // Server error
      const errorData = error?.response?.data;
      
      // 检查是否是支付服务错误，避免暴露内部架构信息
      if (errorData?.error === 'Proxy error' || errorData?.message?.includes('service unavailable') || errorData?.requestId) {
        message = "Payment service is temporarily unavailable. Please try again in a few moments";
        title = "Service Temporarily Unavailable";
        showRetry = true;
        showContact = true;
      } else if (errorData?.error?.includes('payment') || errorData?.error?.includes('checkout')) {
        message = "Payment processing is temporarily unavailable. Please try again later";
        title = "Payment Service Error";
        showRetry = true;
        showContact = true;
      } else {
        message = "Something went wrong on our end. We're working to fix it";
        title = "Server Error";
        showRetry = true;
        showContact = true;
      }
    } else if (error.response?.status === 502 || error.response?.status === 503) {
      // Bad gateway or service unavailable
      message = "Service is temporarily unavailable. Please try again in a few minutes";
      title = "Service Unavailable";
      showRetry = true;
      showContact = true;
    } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      // Network error
      message = "Network connection failed. Please check your internet connection and try again";
      title = "Connection Error";
      showRetry = true;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Timeout error
      message = "Request timed out. Please try again";
      title = "Request Timeout";
      showRetry = true;
    } else {
      // Generic error
      message = error?.response?.data?.error || error.message || "Something went wrong";
      title = "Error";
      showRetry = true;
    }

    // 创建增强的错误对象
    const enhancedError = {
      ...error,
      message: typeof message === "string" ? message : JSON.stringify(message),
      title,
      showRetry,
      showContact,
      originalError: error,
    };

    console.error(`API Error [${error.response?.status || 'NETWORK'}]:`, {
      message,
      title,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });

    // 显示用户友好的错误提示
    if (message) {
      toast.error(`${title}: ${message}`, {
        duration: 6000,
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '400px',
        },
      });
    } else {
      toast.error("Something went wrong. Please try again");
    }

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
