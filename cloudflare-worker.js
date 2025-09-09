// Cloudflare Worker for Square API proxy
// Deploy this to your Cloudflare Worker to proxy Square API requests

export default {
  async fetch(request, env, ctx) {
    // 允许的来源域名 - 从环境变量或默认值获取
    const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://legnext.ai,http://localhost:3001,http://localhost:3000').split(',');
    const origin = request.headers.get('Origin');
    
    // 验证请求来源
    let allowOrigin = '*';
    if (origin && allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (origin && !allowedOrigins.includes(origin)) {
      // 拒绝未授权的来源
      return new Response('Unauthorized origin', { status: 403 });
    }

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Square-Version, Square-Environment',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Add request ID for tracking
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // 简单的IP级别速率限制 (使用Cloudflare KV存储，如果可用)
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    
    try {
      // 如果配置了KV命名空间，进行速率限制检查
      if (env.RATE_LIMIT_KV) {
        const rateLimitKey = `rate_limit_${clientIP}`;
        const currentMinute = Math.floor(Date.now() / 60000); // 当前分钟
        const limitKey = `${rateLimitKey}_${currentMinute}`;
        
        const currentCount = await env.RATE_LIMIT_KV.get(limitKey);
        const requestCount = currentCount ? parseInt(currentCount) : 0;
        
        // 每分钟最多60个请求
        const maxRequestsPerMinute = 60;
        if (requestCount >= maxRequestsPerMinute) {
          console.warn(`[Proxy ${requestId}] Rate limit exceeded for IP: ${clientIP}`);
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              message: 'Too many requests. Please wait a moment and try again.',
              requestId: requestId,
              retryAfter: 60
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'Retry-After': '60',
                ...corsHeaders,
              },
            }
          );
        }
        
        // 更新请求计数，设置65秒过期（比1分钟多一点，确保清理）
        await env.RATE_LIMIT_KV.put(limitKey, (requestCount + 1).toString(), { expirationTtl: 65 });
      }
    } catch (rateLimitError) {
      // 速率限制检查失败不应阻断正常请求，只记录错误
      console.warn(`[Proxy ${requestId}] Rate limit check failed:`, rateLimitError.message);
    }

    try {
      const url = new URL(request.url);
      
      // 添加健康检查端点
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          requestId: requestId 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Square SDK will send requests like: https://your-worker.dev/proxy/v2/checkout/payment-links
      // We need to forward this to: https://connect.squareupsandbox.com/v2/checkout/payment-links
      
      // Extract the API path (everything after /proxy)
      let targetPath = url.pathname;
      if (targetPath.startsWith('/proxy')) {
        targetPath = targetPath.substring(6); // Remove '/proxy'
      }
      
      // Default to sandbox, but detect production based on various signals
      let squareBaseUrl = 'https://connect.squareupsandbox.com';
      
      // Method 1: Check URL parameter
      if (url.searchParams.get('env') === 'production') {
        squareBaseUrl = 'https://connect.squareup.com';
      }
      
      // Method 2: Check custom header
      if (request.headers.get('Square-Environment') === 'production') {
        squareBaseUrl = 'https://connect.squareup.com';
      }
      
      // Method 3: Check if using production access token pattern (starts with EAAA for production)
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.includes('Bearer EAAA')) {
        squareBaseUrl = 'https://connect.squareup.com';
      }
      
      const targetUrl = `${squareBaseUrl}${targetPath}${url.search}`;
      
      console.log(`[Proxy ${requestId}] ${request.method} ${url.pathname} -> ${targetUrl}`);
      
      // Create new headers, removing any worker-specific ones
      const forwardHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (!key.toLowerCase().startsWith('cf-') && 
            key.toLowerCase() !== 'x-forwarded-for' &&
            key.toLowerCase() !== 'x-real-ip') {
          forwardHeaders.set(key, value);
        }
      }
      
      // Add user agent to avoid bot detection
      forwardHeaders.set('User-Agent', 'LegNext-API-Client/1.0');
      
      // Retry logic for failed requests
      let squareResponse;
      let lastError;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Proxy ${requestId}] Attempt ${attempt}/${maxRetries}`);
          
          // Forward the request to Square API with timeout
          squareResponse = await fetch(targetUrl, {
            method: request.method,
            headers: forwardHeaders,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });
          
          console.log(`[Proxy ${requestId}] Square API responded with status: ${squareResponse.status}`);
          
          // If successful, break out of retry loop
          if (squareResponse.ok || squareResponse.status < 500) {
            break;
          }
          
          // If it's a client error (4xx), don't retry
          if (squareResponse.status >= 400 && squareResponse.status < 500) {
            break;
          }
          
          // If it's a server error (5xx), retry
          if (attempt < maxRetries) {
            console.log(`[Proxy ${requestId}] Server error ${squareResponse.status}, retrying in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
          
        } catch (error) {
          lastError = error;
          console.error(`[Proxy ${requestId}] Attempt ${attempt} failed:`, error.message);
          
          if (attempt < maxRetries) {
            console.log(`[Proxy ${requestId}] Retrying in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }
      }
      
      // If all retries failed, throw the last error
      if (!squareResponse) {
        throw lastError || new Error('All retry attempts failed');
      }
      
      // Create response with CORS headers
      const responseHeaders = new Headers();
      
      // Copy Square response headers
      for (const [key, value] of squareResponse.headers.entries()) {
        responseHeaders.set(key, value);
      }
      
      // Add CORS headers
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
      }
      
      // Add performance headers
      const duration = Date.now() - startTime;
      responseHeaders.set('X-Proxy-Duration', `${duration}ms`);
      responseHeaders.set('X-Request-ID', requestId);
      
      return new Response(squareResponse.body, {
        status: squareResponse.status,
        statusText: squareResponse.statusText,
        headers: responseHeaders,
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Proxy ${requestId}] Error after ${duration}ms:`, error);
      
      // 避免向客户端暴露详细的错误信息
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          message: 'Payment service is experiencing issues. Please try again later.',
          requestId: requestId,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }), 
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Proxy-Duration': `${duration}ms`,
            ...corsHeaders,
          },
        }
      );
    }
  },
};