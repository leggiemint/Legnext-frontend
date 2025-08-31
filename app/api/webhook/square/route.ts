// Square Webhook 处理器
// 处理 Square 支付事件和订阅更新

import { NextRequest, NextResponse } from "next/server";
import { verifySquareWebhook } from "@/libs/square";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import WebhookEvent from "@/models/WebhookEvent";
import { processSquareEvent, SUPPORTED_SQUARE_EVENTS } from "@/libs/webhooks/square-event-handler";

const relevantEvents = new Set(Object.values(SUPPORTED_SQUARE_EVENTS));

export async function POST(req: NextRequest) {
  let eventType: string | null = null;
  let event: any = null;
  let eventId: string | null = null;

  try {
    await connectMongo();

    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");

    if (!signature) {
      console.error("❌ Missing Square signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 验证 webhook 签名
    const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ Missing SQUARE_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    const isValid = verifySquareWebhook(body, signature, webhookSecret);
    if (!isValid) {
      console.error("❌ Invalid Square webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 解析事件数据
    event = JSON.parse(body);
    eventType = event.type;
    eventId = event.event_id;

    console.log(`🔔 Square webhook received: ${eventType}`, {
      eventId: eventId,
      merchantId: event.merchant_id,
      locationId: event.location_id,
      createdAt: event.created_at
    });

    if (!relevantEvents.has(eventType)) {
      console.log(`⏭️ Ignoring irrelevant Square event: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    // Global idempotency claim (insert first, duplicate -> early return)
    try {
      await WebhookEvent.create({
        provider: "square",
        eventId: eventId,
        eventType: eventType,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        console.log(`⏭️ Square webhook ${eventId} already processed`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw err;
    }

    // 🔒 防重复处理：检查是否已经处理过此事件
    const existingEvent = await User.findOne({
      "webhookEvents.eventId": eventId,
      "webhookEvents.eventType": eventType
    });

    if (existingEvent) {
      console.log(`⏭️ Square webhook event ${eventId} already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 使用统一的事件处理器
    try {
      await processSquareEvent(event);
    } catch (processError) {
      console.error(`❌ Event processing failed for ${eventType}:`, processError);
      // 继续执行，不抛出错误以避免重试循环
    }

    console.log(`✅ Square webhook processed successfully: ${eventType}`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error(`❌ Square webhook error (${eventType}):`, {
      error: error.message,
      stack: error.stack,
      eventId: eventId,
      eventType: eventType
    });

    // 记录失败的webhook事件
    try {
      if (eventId && eventType) {
        await User.findOneAndUpdate(
          {}, // 空查询，添加到第一个用户或创建新文档
          {
            $push: {
              webhookEvents: {
                eventId: eventId,
                eventType: eventType,
                processed: false,
                processedAt: new Date(),
                metadata: {
                  error: error.message,
                  source: 'square_webhook_error'
                }
              }
            }
          },
          { upsert: true }
        );
      }
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// 注意：所有事件处理逻辑已移至统一的 @/libs/webhooks/square-event-handler.ts