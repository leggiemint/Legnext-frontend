/**
 * GetReditus 推荐跟踪工具
 * 用于跟踪用户注册转化事件
 */

// 声明全局 GetReditus 函数类型
declare global {
  interface Window {
    gr?: {
      (action: 'track', event: 'conversion', data: { email: string }): void;
      (action: 'loadReferralWidget', config: {
        product_id: string;
        auth_token: string;
        user_details: {
          email: string;
          first_name?: string;
          last_name?: string;
          company_id?: string;
          company_name?: string;
        };
      }): void;
    };
    referralWidget?: {
      show: () => void;
    }; // 推荐小部件实例
  }
}

/**
 * 跟踪用户注册转化事件
 * @param email 用户邮箱地址
 */
export function trackGetReditusConversion(email: string): void {
  try {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return;
    }

    // 检查 GetReditus 是否已加载
    if (typeof window.gr !== 'function') {
      return;
    }

    // 调用 GetReditus 跟踪函数
    window.gr('track', 'conversion', { email });
  } catch (error) {
    console.error('GetReditus tracking error:', error);
  }
}

/**
 * 检查 GetReditus 是否已加载
 */
export function isGetReditusLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.gr === 'function';
}

/**
 * 等待 GetReditus 加载完成
 * @param timeout 超时时间（毫秒）
 */
export function waitForGetReditus(timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isGetReditusLoaded()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isGetReditusLoaded()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * 显示推荐小部件模态框
 */
export function showReferralWidget(): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.referralWidget) {
      console.warn('Referral widget not loaded yet');
      return;
    }

    window.referralWidget.show();
  } catch (error) {
    console.error('GetReditus widget display error:', error);
  }
}

/**
 * 检查推荐小部件是否已加载
 */
export function isReferralWidgetLoaded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return typeof window.referralWidget === 'object' && typeof window.referralWidget.show === 'function';
}
