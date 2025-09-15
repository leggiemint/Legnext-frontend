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

// Notification functions (implement based on your needs)
async function notifyTaskCompleted(taskData: WebhookCallbackPayload['data']): Promise<void> {
  // Implementation options:
  // 1. WebSocket notification to user's browser
  // 2. Server-sent events (SSE)
  // 3. Push notifications
  // 4. Email notification
  // 5. In-app notification system

  console.log(`🔔 Notifying user of completed task: ${taskData.job_id}`);

  // Example: You could send to WebSocket or notification system here
  // await sendWebSocketNotification(userId, {
  //   type: 'task_completed',
  //   job_id: taskData.job_id,
  //   images: taskData.output?.image_urls,
  //   task_type: taskData.task_type
  // });
}

async function notifyTaskFailed(taskData: WebhookCallbackPayload['data']): Promise<void> {
  console.log(`🔔 Notifying user of failed task: ${taskData.job_id}`);

  // Similar to completion notification but for failures
  // await sendWebSocketNotification(userId, {
  //   type: 'task_failed',
  //   job_id: taskData.job_id,
  //   error: taskData.error,
  //   task_type: taskData.task_type
  // });
}

async function notifyTaskProgress(taskData: WebhookCallbackPayload['data']): Promise<void> {
  console.log(`🔔 Notifying user of task progress: ${taskData.job_id} - ${taskData.status}`);

  // Optional: notify user of progress updates
  // await sendWebSocketNotification(userId, {
  //   type: 'task_progress',
  //   job_id: taskData.job_id,
  //   status: taskData.status,
  //   task_type: taskData.task_type
  // });
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

    // Log the callback payload for debugging
    console.log('Received webhook callback from backend:', {
      timestamp: body.timestamp,
      job_id: body.data.job_id,
      model: body.data.model,
      task_type: body.data.task_type,
      status: body.data.status,
      image_urls: body.data.output?.image_urls?.length || 0,
      usage: body.data.meta?.usage,
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
      console.log('✅ Task completed successfully:', {
        job_id: data.job_id,
        task_type: data.task_type,
        model: data.model,
        image_url: data.output?.image_url,
        image_count: data.output?.image_urls?.length || 0,
        usage: data.meta?.usage,
        duration: calculateDuration(data.meta?.started_at, data.meta?.ended_at),
      });

      // Notify user of completion (implement as needed)
      await notifyTaskCompleted(data);

    } else if (data.status === 'failed') {
      console.error('❌ Task failed:', {
        job_id: data.job_id,
        task_type: data.task_type,
        error: data.error,
        duration: calculateDuration(data.meta?.started_at, data.meta?.ended_at),
      });

      // Notify user of failure
      await notifyTaskFailed(data);

    } else if (data.status === 'running' || data.status === 'queued') {
      console.log('⏳ Task status update:', {
        job_id: data.job_id,
        status: data.status,
        task_type: data.task_type,
      });

      // Optionally notify user of progress updates
      await notifyTaskProgress(data);

    } else {
      console.log('📊 Task status update:', {
        job_id: data.job_id,
        status: data.status,
        task_type: data.task_type,
      });
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

// Handle preflight requests for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}