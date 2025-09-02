// Cloudflare Worker for Square API proxy
// Deploy this to your Cloudflare Worker to proxy Square API requests

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Square-Version',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      
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
      
      console.log(`[Proxy] ${request.method} ${url.pathname} -> ${targetUrl}`);
      
      // Create new headers, removing any worker-specific ones
      const forwardHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (!key.toLowerCase().startsWith('cf-') && 
            key.toLowerCase() !== 'x-forwarded-for' &&
            key.toLowerCase() !== 'x-real-ip') {
          forwardHeaders.set(key, value);
        }
      }
      
      // Forward the request to Square API
      const squareResponse = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });
      
      console.log(`[Proxy] Square API responded with status: ${squareResponse.status}`);
      
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
      
      return new Response(squareResponse.body, {
        status: squareResponse.status,
        statusText: squareResponse.statusText,
        headers: responseHeaders,
      });
      
    } catch (error) {
      console.error('[Proxy] Error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Proxy error', 
          message: error.message,
          timestamp: new Date().toISOString()
        }), 
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};