import { NextRequest, NextResponse } from 'next/server';
import { sendFeishuMessage } from '@/libs/feishu';
import { log } from '@/libs/logger';

export const dynamic = 'force-dynamic';

interface RequestPayload {
  text?: string;
  event?: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  let body: RequestPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { text, event, title } = body ?? {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Field "text" is required' }, { status: 400 });
  }

  try {
    const result = await sendFeishuMessage({ text: text.trim(), event, title });
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    log.error('❌ [Feishu API] Failed to send notification', error);
    return NextResponse.json({ error: error.message || 'Failed to notify Feishu bot' }, { status: 500 });
  }
}
