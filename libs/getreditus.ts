/**
 * GetReditus 推荐跟踪工具
 * 用于跟踪用户注册转化事件
 */

// 声明全局 GetReditus 函数类型
declare global {
  interface Window {
    gr?: (action: string, event: string, data?: { email: string }) => void;
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
      console.warn('GetReditus tracking: Not in browser environment');
      return;
    }

    // 检查 GetReditus 是否已加载
    if (typeof window.gr !== 'function') {
      console.warn('GetReditus tracking: gr function not available, script may not be loaded yet');
      return;
    }

    // 调用 GetReditus 跟踪函数
    window.gr('track', 'conversion', { email });
    
    console.log(`✅ GetReditus conversion tracked for email: ${email}`);
  } catch (error) {
    console.error('❌ GetReditus tracking error:', error);
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
        console.warn('GetReditus tracking: Timeout waiting for script to load');
        resolve(false);
      }
    }, 100);
  });
}
