import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { updateSubscription, grantCredits } from "@/libs/user-service";
import { verifySquareWebhook } from "@/libs/square";

// Square webhook events we handle
const RELEVANT_EVENTS = new Set([
  'payment.completed',
  'payment.failed',
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'invoice.payment_made'
]);

export async function POST(req: NextRequest) {
  let eventType: string | null = null;
  let event: any = null;
  let eventId: string | null = null;

  try {
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");

    if (!signature) {
      console.error("❌ Missing Square signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
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

    // Parse event data
    event = JSON.parse(body);
    eventType = event.type;
    eventId = event.event_id;

    console.log(`🔔 Square webhook received: ${eventType}`, {
      eventId: eventId,
      merchantId: event.merchant_id,
      locationId: event.location_id,
      createdAt: event.created_at
    });

    if (!RELEVANT_EVENTS.has(eventType)) {
      console.log(`⏭️ Ignoring irrelevant Square event: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    // Prevent duplicate processing
    const existingEvent = await prisma.webhookEvent.findFirst({
      where: {
        provider: "square",
        eventId: eventId
      }
    });

    if (existingEvent) {
      console.log(`⏭️ Square webhook ${eventId} already processed`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Record webhook event
    await prisma.webhookEvent.create({
      data: {
        provider: "square",
        eventId: eventId,
        eventType: eventType,
        processed: false
      }
    });

    // Process different event types
    switch (eventType) {
      case 'payment.completed': {
        const payment = event.data?.object;
        
        if (payment?.source_type === 'CARD') {
          const userId = payment.reference_id; // This should be the user ID from checkout
          
          if (userId) {
            // Grant Pro plan subscription (simplified logic)
            await updateSubscription(
              userId,
              "pro",
              "active",
              payment.order_id, // Use order ID as customer reference
              "pro-monthly-subscription"
            );

            // Grant Pro plan credits
            await grantCredits(
              userId,
              200, // 200 + 60 welcome = 260 total
              "Square Pro subscription purchase",
              "square",
              payment.id
            );
          }
        }
        break;
      }

      case 'payment.failed': {
        // Handle failed payment
        console.log('Payment failed:', event.data?.object?.id);
        break;
      }

      default:
        console.log(`Unhandled Square event type: ${eventType}`);
    }

    // Mark as processed
    await prisma.webhookEvent.updateMany({
      where: {
        provider: "square",
        eventId: eventId
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    console.log(`✅ Square webhook processed successfully: ${eventType}`);
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error(`❌ Square webhook error (${eventType}):`, {
      error: error.message,
      stack: error.stack,
      eventId: eventId,
      eventType: eventType
    });

    // Record failed webhook event
    try {
      if (eventId && eventType) {
        await prisma.webhookEvent.create({
          data: {
            provider: "square",
            eventId: eventId,
            eventType: eventType,
            processed: false,
            error: error.message,
            metadata: {
              error: error.message,
              source: 'square_webhook_error'
            }
          }
        });
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
