import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/libs/prisma";
import { updateSubscription, grantCredits } from "@/libs/user-service";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 处理订阅激活的通用函数
async function processSubscriptionActivation(userId: string, customerId: string, session: Stripe.Checkout.Session) {
  console.log(`💳 Processing subscription activation for user ${userId}, customer ${customerId}`);

  // Get the subscription to get the price ID
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  console.log(`📋 Subscription details:`, {
    subscriptionId,
    priceId,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  });

  // Update subscription status and store Stripe customer ID
  const updateResult = await updateSubscription(
    userId,
    "pro",
    "active",
    customerId,
    priceId,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000)
  );

  if (!updateResult.success) {
    console.error(`❌ Failed to update subscription for user ${userId}:`, updateResult.error);
    throw new Error(`Subscription update failed: ${updateResult.error}`);
  }

  // Grant Pro plan credits (200 credits - user already has 60 free credits)
  const creditResult = await grantCredits(
    userId,
    200,
    "Pro subscription credits",
    "stripe",
    session.id
  );

  if (!creditResult.success) {
    console.error(`❌ Failed to grant credits to user ${userId}:`, creditResult.error);
    throw new Error(`Credit grant failed: ${creditResult.error}`);
  }

  console.log(`✅ Pro subscription activated for user ${userId}, new credit balance: ${creditResult.newBalance}`);
}

export async function POST(req: NextRequest) {
  console.log("🔔 Stripe webhook received!");
  
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  console.log("Body length:", body.length);
  console.log("Signature present:", !!signature);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`✅ Webhook verified, event type: ${event.type}, event ID: ${event.id}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // Prevent duplicate processing
    const existingEvent = await prisma.webhookEvent.findFirst({
      where: {
        provider: "stripe",
        eventId: event.id
      }
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Record webhook event
    await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        processed: false
      }
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log(`🎯 Processing checkout.session.completed:`, {
          mode: session.mode,
          customerId: session.customer,
          clientReferenceId: session.client_reference_id,
          customerEmail: session.customer_details?.email,
          sessionId: session.id
        });
        
        if (session.mode === "subscription") {
          const customerId = session.customer as string;
          const userId = session.client_reference_id;
          
          if (!userId) {
            console.error("❌ No user ID in checkout session, trying to find user by email...");
            
            // 尝试通过邮箱找到用户
            const customerEmail = session.customer_details?.email;
            if (customerEmail) {
              const user = await prisma.user.findUnique({
                where: { email: customerEmail }
              });
              
              if (user) {
                console.log(`✅ Found user by email: ${user.id} (${customerEmail})`);
                // 继续处理，使用找到的用户ID
                await processSubscriptionActivation(user.id, customerId, session);
                break;
              } else {
                console.error(`❌ No user found with email: ${customerEmail}`);
              }
            }
            
            console.error("❌ Cannot process subscription without user identification");
            break;
          }

          // 使用通用函数处理订阅激活
          await processSubscriptionActivation(userId, customerId, session);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const customer = await prisma.customer.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });
        
        if (!customer) break;
        
        const profile = await prisma.userProfile.findFirst({
          where: { userId: customer.userId }
        });

        if (!profile) break;

        let status = "active";
        if (subscription.status === "canceled") status = "canceled";
        else if (subscription.status === "past_due") status = "past_due";

        await updateSubscription(
          profile.userId,
          subscription.status === "active" ? "pro" : "free",
          status,
          subscription.customer as string,
          subscription.items.data[0]?.price.id,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000)
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const customer = await prisma.customer.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });
        
        if (!customer) break;
        
        const profile = await prisma.userProfile.findFirst({
          where: { userId: customer.userId }
        });

        if (!profile) break;

        await updateSubscription(
          profile.userId,
          "free",
          "canceled",
          subscription.customer as string
        );
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
          // Only process recurring subscription payments, not the initial payment
          const customer = await prisma.customer.findFirst({
            where: { stripeCustomerId: invoice.customer as string }
          });
          
          if (!customer) return;
          
          const profile = await prisma.userProfile.findFirst({
            where: { userId: customer.userId }
          });

          if (profile && profile.plan === "pro") {
            console.log(`💰 Processing monthly credit renewal for user ${profile.userId}`);
            
            // Grant monthly credits for Pro users (200 credits per month)
            const creditResult = await grantCredits(
              profile.userId,
              200,
              "Monthly Pro subscription renewal credits",
              "stripe",
              invoice.id
            );

            if (!creditResult.success) {
              console.error(`Failed to grant monthly credits to user ${profile.userId}:`, creditResult.error);
            } else {
              console.log(`✅ Monthly credits granted to user ${profile.userId}, new balance: ${creditResult.newBalance}`);
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        const customer = await prisma.customer.findFirst({
          where: { stripeCustomerId: invoice.customer as string }
        });
        
        if (!customer) break;
        
        const profile = await prisma.userProfile.findFirst({
          where: { userId: customer.userId }
        });

        if (profile) {
          await updateSubscription(
            profile.userId,
            profile.plan,
            "past_due"
          );
        }
        break;
      }
    }

    // Mark as processed
    await prisma.webhookEvent.updateMany({
      where: {
        provider: "stripe",
        eventId: event.id
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error(`Webhook error:`, error);
    
    // Update webhook event with error
    await prisma.webhookEvent.updateMany({
      where: {
        provider: "stripe",
        eventId: event.id
      },
      data: {
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
