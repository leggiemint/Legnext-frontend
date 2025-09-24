import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper function to calculate task duration
function calculateDuration(startedAt?: string, endedAt?: string): string {
  if (!startedAt || !endedAt) return 'unknown';
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const durationMs = end - start;
  const seconds = Math.round(durationMs / 1000);
  return `${seconds}s`;
}

// Global store for SSE connections - in production, use Redis or similar
const sseConnections = new Map<string, {
  controller: ReadableStreamDefaultController<Uint8Array>;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  lastHeartbeat: number;
  createdAt: number;
  clientIP?: string;
  userAgent?: string;
}>();

// Rate limiting for connection attempts
const connectionAttempts = new Map<string, number>();
const MAX_CONNECTIONS_PER_MINUTE = 15; // 增加限制，允许更多并发连接

// Connection cleanup scheduler
let cleanupScheduled = false;

// Scheduled cleanup to prevent memory leaks
function scheduleCleanup() {
  if (cleanupScheduled) return;

  cleanupScheduled = true;
  setTimeout(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const staleConnections: string[] = [];

    sseConnections.forEach((connection, clientId) => {
      if (now - connection.lastHeartbeat > staleThreshold) {
        staleConnections.push(clientId);
      }
    });

    staleConnections.forEach(clientId => {
      const connection = sseConnections.get(clientId);
      if (connection) {
        try {
          connection.controller.close();
        } catch (error) {
          // Connection already closed
        }
        sseConnections.delete(clientId);
      }
    });

    // Clean up old rate limit entries
    const oneHourAgo = now - 60 * 60 * 1000;
    for (const [key] of connectionAttempts.entries()) {
      const timestamp = parseInt(key.split(':')[1] || '0') * 60000;
      if (timestamp < oneHourAgo) {
        connectionAttempts.delete(key);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Cleanup completed: ${staleConnections.length} stale connections removed, active: ${sseConnections.size}`);
    }

    cleanupScheduled = false;

    // Schedule next cleanup if there are still connections
    if (sseConnections.size > 0) {
      scheduleCleanup();
    }
  }, 60000); // Every minute
}

// Broadcast notification to all connected clients
function broadcastNotification(notification: any) {
  const message = `data: ${JSON.stringify(notification)}\n\n`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const now = Date.now();

  // Clean up stale connections during broadcast
  const staleConnections: string[] = [];
  const failedConnections: string[] = [];
  let successCount = 0;

  sseConnections.forEach((connection, clientId) => {
    try {
      // Check if connection is stale (no heartbeat for 3 minutes)
      if (now - connection.lastHeartbeat > 3 * 60 * 1000) {
        staleConnections.push(clientId);
        return;
      }

      connection.controller.enqueue(data);
      connection.lastHeartbeat = now;
      successCount++;
    } catch (error) {
      // Only log errors in development or if LOG_LEVEL is debug
      if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
        console.error('Error sending SSE message to client:', clientId, error);
      }
      failedConnections.push(clientId);
    }
  });

  // Remove stale and failed connections
  [...staleConnections, ...failedConnections].forEach(clientId => {
    const connection = sseConnections.get(clientId);
    if (connection) {
      try {
        connection.controller.close();
      } catch (error) {
        // Connection already closed
      }
      sseConnections.delete(clientId);
    }
  });

  // Log broadcast stats in development
  if (process.env.NODE_ENV === 'development' && notification.type !== 'ping') {
    console.log(`📡 Broadcast ${notification.type}: ${successCount} delivered, ${staleConnections.length + failedConnections.length} cleaned up`);
  }

  // Schedule cleanup if not already scheduled
  scheduleCleanup();
}

// Notification functions
async function notifyTaskCompleted(taskData: WebhookCallbackPayload['data']): Promise<void> {
  // Broadcast to all connected clients via SSE
  broadcastNotification({
    type: 'task_completed',
    job_id: taskData.job_id,
    task_type: taskData.task_type,
    output: taskData.output,
    timestamp: Date.now()
  });
}

async function notifyTaskFailed(taskData: WebhookCallbackPayload['data']): Promise<void> {
  // Broadcast to all connected clients via SSE
  broadcastNotification({
    type: 'task_failed',
    job_id: taskData.job_id,
    task_type: taskData.task_type,
    error: taskData.error,
    timestamp: Date.now()
  });
}

async function notifyTaskProgress(taskData: WebhookCallbackPayload['data']): Promise<void> {
  // Broadcast to all connected clients via SSE
  broadcastNotification({
    type: 'task_progress',
    job_id: taskData.job_id,
    task_type: taskData.task_type,
    status: taskData.status,
    timestamp: Date.now()
  });
}

export interface WebhookCallbackPayload {
  timestamp: number;
  data: {
    job_id: string;
    model: string;
    task_type: string;
    status: string;
    config: {
      service_mode: string;
      webhook_config?: {
        endpoint: string;
        secret: string;
      };
    };
    input: any;
    output: {
      image_url: string;
      image_urls?: string[];
    };
    meta: {
      created_at: string;
      started_at: string;
      ended_at: string;
      usage: {
        type: string;
        frozen: number;
        consume: number;
      };
    };
    detail: any;
    logs: any[];
    error: {
      code: number;
      raw_message: string;
      message: string;
      detail: any;
    };
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Add request timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000); // 5 second timeout for webhook processing

    let body: WebhookCallbackPayload;

    try {
      body = await request.json();
    } catch (parseError) {
      clearTimeout(timeoutId);
      console.error('Invalid JSON in webhook payload:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    clearTimeout(timeoutId);

    // Validate required fields early
    if (!body.data?.job_id || !body.data?.status) {
      console.error('Missing required fields in webhook payload:', {
        hasJobId: !!body.data?.job_id,
        hasStatus: !!body.data?.status,
      });
      return NextResponse.json(
        {
          error: 'Missing required fields in payload',
          required: ['data.job_id', 'data.status']
        },
        { status: 400 }
      );
    }

    // Enhanced logging with performance tracking
    const processingStart = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.log('📨 Webhook received:', {
        job_id: body.data.job_id,
        task_type: body.data.task_type,
        status: body.data.status,
        image_count: body.data.output?.image_urls?.length || 0,
        connections: sseConnections.size,
        parseTime: processingStart - startTime,
      });
    } else {
      // Production: optimized logging
      console.log(`📨 ${body.data.job_id}:${body.data.status} (${sseConnections.size} clients)`);
    }

    // Process the callback data with error handling
    const { data } = body;
    let notificationSent = false;

    try {
      if (data.status === 'completed') {
        await notifyTaskCompleted(data);
        notificationSent = true;
      } else if (data.status === 'failed') {
        await notifyTaskFailed(data);
        notificationSent = true;
      } else if (data.status === 'running' || data.status === 'queued') {
        await notifyTaskProgress(data);
        notificationSent = true;
      }
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
      // Don't fail the webhook because of notification errors
    }

    const processingTime = Date.now() - processingStart;

    // Enhanced response with metrics
    const response = {
      success: true,
      message: 'Webhook callback processed successfully',
      job_id: data.job_id,
      status: data.status,
      timestamp: body.timestamp,
      processing_time_ms: processingTime,
      notification_sent: notificationSent,
      active_connections: sseConnections.size,
    };

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development' && processingTime > 1000) {
      console.warn(`⚠️ Slow webhook processing: ${processingTime}ms for ${data.job_id}`);
    }

    return NextResponse.json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('Webhook callback processing error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
    });

    return NextResponse.json(
      {
        error: 'Failed to process webhook callback',
        processing_time_ms: processingTime,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// Handle SSE connections for real-time notifications
export async function GET(request: NextRequest) {
  const clientId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Rate limiting check with per-IP tracking
  const now = Date.now();
  const minuteKey = `${clientIP}:${Math.floor(now / 60000)}`;
  const attempts = connectionAttempts.get(minuteKey) || 0;

  if (attempts >= MAX_CONNECTIONS_PER_MINUTE) {
    // Log rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚫 Rate limit exceeded for IP: ${clientIP}, attempts: ${attempts}`);
    }
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: 60 - (now % 60000) / 1000
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  connectionAttempts.set(minuteKey, attempts + 1);

  // Optimized cleanup scheduling
  if (attempts === 0) {
    setTimeout(() => {
      connectionAttempts.delete(minuteKey);
    }, 65000); // Slightly longer than a minute for safety
  }

  const encoder = new TextEncoder();
  const createdAt = Date.now();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'SSE connection established',
        clientId,
        timestamp: createdAt
      })}\n\n`;

      controller.enqueue(encoder.encode(initialMessage));

      // Store the controller for broadcasting with heartbeat tracking
      sseConnections.set(clientId, {
        controller,
        writer: null as any, // Not used in this implementation
        lastHeartbeat: createdAt,
        createdAt,
        clientIP,
        userAgent
      });

      // Log connection in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 New SSE connection: ${clientId} from ${clientIP}, total: ${sseConnections.size}`);
      }

      // Set up heartbeat mechanism
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeatMessage = `data: ${JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeatMessage));
          
          // Update heartbeat timestamp
          const connection = sseConnections.get(clientId);
          if (connection) {
            connection.lastHeartbeat = Date.now();
          }
        } catch (error) {
          // Only log heartbeat errors in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Heartbeat failed for client:', clientId, error);
          }
          clearInterval(heartbeatInterval);
          cleanup();
        }
      }, 30000); // Every 30 seconds

      // Clean up on disconnect
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        const wasConnected = sseConnections.has(clientId);
        sseConnections.delete(clientId);

        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }

        // Log cleanup in development
        if (process.env.NODE_ENV === 'development' && wasConnected) {
          console.log(`🔌 SSE connection closed: ${clientId}, remaining: ${sseConnections.size}`);
        }
      };

      // Set up cleanup timer with enhanced timeout handling
      // Use 270s to ensure we close before Vercel's 300s limit
      const timeoutId = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏰ SSE connection timeout: ${clientId} after 270s`);
        }
        cleanup();
      }, 270 * 1000);

      // Handle client disconnect with proper cleanup
      const abortHandler = () => {
        clearTimeout(timeoutId);
        cleanup();
      };

      request.signal.addEventListener('abort', abortHandler);

      // Store cleanup function for potential manual cleanup
      const connection = sseConnections.get(clientId);
      if (connection) {
        (connection as any).cleanup = () => {
          clearTimeout(timeoutId);
          request.signal.removeEventListener('abort', abortHandler);
          cleanup();
        };
      }
    },
    
    cancel() {
      // Clean up when the stream is cancelled
      sseConnections.delete(clientId);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering for SSE
    },
  });
}

// Handle preflight requests for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    },
  });
}