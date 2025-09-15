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
const sseConnections = new Map<string, WritableStreamDefaultWriter<Uint8Array>>();

// Broadcast notification to all connected clients
function broadcastNotification(notification: any) {
  const message = `data: ${JSON.stringify(notification)}\n\n`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  sseConnections.forEach((writer, clientId) => {
    try {
      writer.write(data);
    } catch (error) {
      console.error('Error sending SSE message to client:', clientId, error);
      sseConnections.delete(clientId);
    }
  });
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
  try {
    const body: WebhookCallbackPayload = await request.json();

    // Log the callback payload
    console.log('Webhook received:', {
      job_id: body.data.job_id,
      task_type: body.data.task_type,
      status: body.data.status,
      image_count: body.data.output?.image_urls?.length || 0,
    });

    // Validate required fields
    if (!body.data?.job_id) {
      console.error('Missing job_id in webhook payload');
      return NextResponse.json(
        { error: 'Missing job_id in payload' },
        { status: 400 }
      );
    }

    // Process the callback data - Pure proxy mode (no database storage)
    const { data } = body;

    if (data.status === 'completed') {
      await notifyTaskCompleted(data);
    } else if (data.status === 'failed') {
      await notifyTaskFailed(data);
    } else if (data.status === 'running' || data.status === 'queued') {
      await notifyTaskProgress(data);
    }

    // Acknowledge successful receipt
    return NextResponse.json({
      success: true,
      message: 'Webhook callback processed successfully',
      job_id: data.job_id,
      status: data.status,
      timestamp: body.timestamp,
    });
  } catch (error) {
    console.error('Webhook callback processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook callback' },
      { status: 500 }
    );
  }
}

// Handle SSE connections for real-time notifications
export async function GET(request: NextRequest) {
  const clientId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'SSE connection established',
        clientId,
        timestamp: Date.now()
      })}\n\n`;

      controller.enqueue(encoder.encode(initialMessage));

      // Create a writer that writes to the controller
      const writer = {
        write: (data: Uint8Array) => {
          try {
            controller.enqueue(data);
          } catch (error) {
            console.error('Error writing to SSE stream:', error);
          }
        }
      } as WritableStreamDefaultWriter<Uint8Array>;

      sseConnections.set(clientId, writer);

      // Clean up on disconnect
      const cleanup = () => {
        sseConnections.delete(clientId);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      };

      // Set up cleanup timer (connection timeout after 30 minutes)
      const timeoutId = setTimeout(cleanup, 30 * 60 * 1000);

      request.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        cleanup();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}