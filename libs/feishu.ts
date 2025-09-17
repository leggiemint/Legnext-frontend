import { log } from '@/libs/logger';

const WEBHOOK_URL = process.env.FEISHU_BOT_WEBHOOK || process.env.FEISHU_WEBHOOK_URL;

export interface FeishuMessageOptions {
  text: string;
  event?: string;
  title?: string;
}

interface FeishuResponse {
  code: number;
  msg: string;
  data?: unknown;
}

/**
 * Send a text notification to the configured Feishu bot webhook.
 */
export async function sendFeishuMessage({ text, event, title }: FeishuMessageOptions) {
  if (!WEBHOOK_URL) {
    log.error('❌ [Feishu] Missing webhook URL. Please set FEISHU_BOT_WEBHOOK or FEISHU_WEBHOOK_URL.');
    throw new Error('Feishu webhook not configured');
  }

  const messageText = event ? `[${event}] ${text}` : text;
  const mergedText = title ? `${title}\n${messageText}` : messageText;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msg_type: 'text',
        content: {
          text: mergedText,
        },
      }),
    });

    const rawBody = await response.text();
    let payload: FeishuResponse | undefined;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as FeishuResponse;
      } catch {
        // Non-JSON responses are ignored; we'll fall back to status text below.
      }
    }

    if (!response.ok) {
      log.error('❌ [Feishu] Webhook request failed', response.status, payload || rawBody || response.statusText);
      throw new Error(`Feishu webhook error: ${response.statusText}`);
    }

    if (payload && 'code' in payload && payload.code !== 0) {
      log.error('❌ [Feishu] Webhook returned non-zero code', payload);
      throw new Error(`Feishu webhook rejected request: ${payload.msg}`);
    }

    log.info('✅ [Feishu] Notification sent successfully');
    return payload ?? { code: 0, msg: 'success' };
  } catch (error) {
    log.error('❌ [Feishu] Unexpected error sending notification', error);
    throw error;
  }
}
