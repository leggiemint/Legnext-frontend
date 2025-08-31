import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import configFile from "@/config";
import User from "@/models/User";
import { findCheckoutSession } from "@/libs/stripe";
import { grantCreditsToUser } from "@/libs/user";
import { grantCredits, updateSubscriptionStatus } from "@/libs/user-service";
import WebhookEvent from "@/models/WebhookEvent";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Smart plan matching function for different environments
function findPlanByPriceId(priceId: string, sessionMode?: string) {
  // First try exact match
  let plan = configFile.stripe.plans.find((p) => p.priceId === priceId);
  
  if (plan) {
    return plan;
  }

  // If no exact match and we're dealing with a subscription, apply fallback logic
  if (sessionMode === 'subscription' || !sessionMode) {
    console.log(`No exact plan match for priceId: ${priceId}, applying fallback logic`);
    
    // Check if this looks like a Stripe test price ID
    const isTestPriceId = priceId?.startsWith('price_') && !priceId.includes('prod');
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isTestPriceId || isDevelopment) {
      console.log(`Detected ${isTestPriceId ? 'test' : 'development'} environment, assuming Pro plan`);
      return {
        name: "Pro",
        credits: 260,
        priceId: priceId,
        price: 12,
        isFeatured: true,
        description: "Best Value"
      };
    }
  }
  
  return null;
}

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: NextRequest) {
  console.log("=== STRIPE WEBHOOK RECEIVED ===", new Date().toISOString());
  console.log("Headers:", Object.fromEntries(headers().entries()));
  
  await connectMongo();

  const body = await req.text();
  console.log("Body length:", body.length);

  const signature = headers().get("stripe-signature");
  console.log("Stripe signature present:", !!signature);

  let eventType;
  let event;

  // In development or when no signature is provided, allow bypassing verification
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment && !signature) {
    console.log("⚠️ DEVELOPMENT MODE: Skipping webhook signature verification (no signature provided)");
    try {
      event = JSON.parse(body);
      console.log("Parsed event from raw body:", { type: event.type, id: event.id });
    } catch (err) {
      console.error("Failed to parse webhook body as JSON:", err.message);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  } else if (signature && webhookSecret) {
    // verify Stripe event is legit
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("✅ Webhook signature verified");
    } catch (err) {
      console.error(`Webhook signature verification failed. ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } else {
    console.error("Missing webhook signature or secret");
    return NextResponse.json({ error: "Missing webhook signature or secret" }, { status: 400 });
  }

  eventType = event.type;
  console.log(`Received Stripe webhook event: ${eventType}`);

  // Global idempotency claim (insert first, duplicate -> early return)
  try {
    await WebhookEvent.create({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      console.log(`⏭️ Stripe webhook ${event.id} already processed`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw err;
  }

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Checkout.Session = event.data
          .object as Stripe.Checkout.Session;

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = findPlanByPriceId(priceId, session?.mode);

        console.log("=== WEBHOOK CHECKOUT.SESSION.COMPLETED ===");
        console.log("Event ID:", event.id);
        console.log("Webhook checkout.session.completed:", {
          customerId,
          priceId,
          userId,
          sessionMode: session?.mode,
          planFound: !!plan,
          planName: plan?.name,
          environment: process.env.NODE_ENV,
          availablePlans: configFile.stripe.plans.map(p => ({ name: p.name, priceId: p.priceId }))
        });

        if (!plan) {
          console.error(`No plan could be determined for priceId: ${priceId}`);
          break;
        }

        const customer = (await stripe.customers.retrieve(
          customerId as string
        )) as Stripe.Customer;

        let user;

        // Get or create the user. userId is normally pass in the checkout session (clientReferenceID) to identify the user when we get the webhook event
        if (userId) {
          user = await User.findById(userId);
          if (!user) {
            console.error(`User not found with ID: ${userId}`);
            throw new Error(`User not found with ID: ${userId}`);
          }
        } else if (customer.email) {
          user = await User.findOne({ email: customer.email });

          if (!user) {
            user = await User.create({
              email: customer.email,
              name: customer.name,
            });

            await user.save();
          }
        } else {
          console.error("No user found and no email provided");
          throw new Error("No user found and no email provided");
        }

        // 🔒 Industry Standard: Prevent duplicate subscription processing
        // Check if this checkout session was already processed
        const existingWebhookEvent = user.webhookEvents?.find(
          (webhookEvent: any) => webhookEvent.eventId === event.id && webhookEvent.eventType === 'checkout.session.completed'
        );
        
        if (existingWebhookEvent && existingWebhookEvent.processed) {
          console.log(`Webhook event ${event.id} already processed for user ${user._id}`);
          break;
        }

        // 🚫 Prevent duplicate active subscriptions
        if (user.subscriptionStatus === "active" && user.plan === "pro") {
          console.log(`User ${user._id} already has active subscription, updating existing instead of creating new`);
          
          // Update existing subscription details but don't grant new credits
          user.priceId = priceId;
          user.customerId = customerId;
          user.hasAccess = true;
          
          // Log this as a webhook event
          user.webhookEvents = user.webhookEvents || [];
          user.webhookEvents.push({
            eventId: event.id,
            eventType: 'checkout.session.completed',
            processed: true,
            processedAt: new Date(),
            metadata: { note: 'Duplicate subscription attempt blocked' }
          });
          
          await user.save();
          console.log(`Duplicate subscription prevented for user ${user._id}`);
          break;
        }

        // Update user data + Grant user access to your product
        user.priceId = priceId;
        user.customerId = customerId;
        user.hasAccess = true;
        
        // Update plan and grant credits based on the subscription
        if (plan.name === "Pro") {
          console.log(`Processing Pro plan for user ${user._id}, current plan: ${user.plan}`);
          
          // Check if user is already Pro to prevent duplicate credits
          const wasAlreadyPro = user.plan === "pro" && user.subscriptionStatus === "active";
          
          // 📈 Track subscription change history
          if (user.plan !== "pro") {
            user.subscriptionHistory = user.subscriptionHistory || [];
            user.subscriptionHistory.push({
              action: 'upgraded',
              fromPlan: user.plan || 'free',
              toPlan: 'pro',
              timestamp: new Date(),
              priceId: priceId,
              metadata: { source: 'stripe_checkout' }
            });
          }
          
          user.plan = "pro";
          user.subscriptionStatus = "active";
          user.subscriptionStartDate = new Date();
          
          // Only grant credits if this is a new Pro subscription
          if (!wasAlreadyPro) {
            console.log(`New Pro subscription: Granting ${plan.credits} credits to user ${user._id}`);
            // Use UserProfile-based credit granting
            await grantCredits(
              user._id.toString(), 
              plan.credits, 
              "subscription_upgrade",
              user.email,
              { plan: "pro", subscriptionStatus: "active" }
            );
            // Also update User model for backward compatibility
            await grantCreditsToUser(user._id.toString(), plan.credits, "subscription_upgrade");
          } else {
            console.log(`User ${user._id} already has active Pro plan, skipping credit grant`);
          }
        }
        
        // 📝 Record webhook processing
        user.webhookEvents = user.webhookEvents || [];
        user.webhookEvents.push({
          eventId: event.id,
          eventType: 'checkout.session.completed',
          processed: true,
          processedAt: new Date(),
          metadata: { 
            priceId: priceId,
            planName: plan.name,
            creditsGranted: user.plan !== "pro" || user.subscriptionStatus !== "active"
          }
        });
        
        await user.save();
        console.log("=== USER UPDATED SUCCESSFULLY ===");
        console.log(`User ${user._id} updated:`, {
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
          hasAccess: user.hasAccess,
          customerId: user.customerId,
          priceId: user.priceId,
          subscriptionStartDate: user.subscriptionStartDate
        });
        console.log("=== END USER UPDATE ===");

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail(...);
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        // 🔄 Industry Standard: Handle subscription updates and plan changes
        
        const stripeObject: Stripe.Subscription = event.data.object as Stripe.Subscription;
        const user = await User.findOne({ customerId: stripeObject.customer });

        if (!user) {
          console.error(`User not found for customerId: ${stripeObject.customer}`);
          break;
        }

        // 🔒 Check for duplicate webhook processing
        const existingWebhookEvent = user.webhookEvents?.find(
          (webhookEvent: any) => webhookEvent.eventId === event.id && webhookEvent.eventType === 'customer.subscription.updated'
        );
        
        if (existingWebhookEvent && existingWebhookEvent.processed) {
          console.log(`Webhook event ${event.id} already processed for user ${user._id}`);
          break;
        }

        const newPriceId = stripeObject.items.data[0]?.price.id;
        const newPlan = findPlanByPriceId(newPriceId);
        
        // Handle cancellation at period end
        if (stripeObject.cancel_at_period_end) {
          console.log(`Subscription will be canceled at period end for user ${user._id}`);
          
          // Update user to show "canceling soon" status
          user.subscriptionStatus = "active"; // Still active until period ends
          user.subscriptionEndDate = new Date(stripeObject.current_period_end * 1000);
          
          // Update UserProfile as well
          await updateSubscriptionStatus(
            user._id.toString(),
            "active",
            user.plan,
            user.email
          );
          
          // Track in subscription history
          user.subscriptionHistory = user.subscriptionHistory || [];
          user.subscriptionHistory.push({
            action: 'canceled',
            fromPlan: user.plan,
            toPlan: user.plan, // Same plan until period ends
            timestamp: new Date(),
            metadata: { 
              source: 'stripe_subscription_updated',
              cancelAtPeriodEnd: true,
              periodEndDate: new Date(stripeObject.current_period_end * 1000)
            }
          });
        }
        // Handle plan changes (upgrade/downgrade)
        else if (newPlan && newPlan.name.toLowerCase() !== user.plan) {
          const oldPlan = user.plan;
          const newPlanName = newPlan.name.toLowerCase() as "free" | "pro";
          
          console.log(`Plan change detected for user ${user._id}: ${oldPlan} -> ${newPlanName}`);
          
          // Track plan change in history
          user.subscriptionHistory = user.subscriptionHistory || [];
          user.subscriptionHistory.push({
            action: oldPlan === "free" ? 'upgraded' : 'downgraded',
            fromPlan: oldPlan,
            toPlan: newPlanName,
            timestamp: new Date(),
            priceId: newPriceId,
            metadata: { 
              source: 'stripe_subscription_updated',
              subscriptionId: stripeObject.id,
              effectiveDate: new Date()
            }
          });
          
          // Update user plan
          user.plan = newPlanName;
          user.priceId = newPriceId;
          
          // Handle credit allocation for upgrades
          if (newPlanName === "pro" && oldPlan === "free") {
            console.log(`Upgrading user ${user._id} to Pro - granting credits`);
            // Use UserProfile-based credit granting
            await grantCredits(
              user._id.toString(), 
              newPlan.credits, 
              "plan_upgrade",
              user.email,
              { plan: "pro", subscriptionStatus: "active" }
            );
            // Also update User model for backward compatibility
            await grantCreditsToUser(user._id.toString(), newPlan.credits, "plan_upgrade");
          }
        }
        
        // 📝 Record webhook processing
        user.webhookEvents = user.webhookEvents || [];
        user.webhookEvents.push({
          eventId: event.id,
          eventType: 'customer.subscription.updated',
          processed: true,
          processedAt: new Date(),
          metadata: { 
            subscriptionId: stripeObject.id,
            cancelAtPeriodEnd: stripeObject.cancel_at_period_end,
            priceId: newPriceId,
            planName: newPlan?.name
          }
        });
        
        await user.save();
        console.log(`Subscription updated for user ${user._id}`);
        
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;

        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );
        const user = await User.findOne({ customerId: subscription.customer });

        if (!user) {
          console.error(`User not found for customerId: ${subscription.customer}`);
          break;
        }

        // 🔒 Check for duplicate webhook processing
        const existingWebhookEvent = user.webhookEvents?.find(
          (webhookEvent: any) => webhookEvent.eventId === event.id && webhookEvent.eventType === 'customer.subscription.deleted'
        );
        
        if (existingWebhookEvent && existingWebhookEvent.processed) {
          console.log(`Webhook event ${event.id} already processed for user ${user._id}`);
          break;
        }

        console.log(`Canceling subscription for user ${user._id}`);
        
        // 📈 Track subscription cancellation history
        user.subscriptionHistory = user.subscriptionHistory || [];
        user.subscriptionHistory.push({
          action: 'canceled',
          fromPlan: user.plan,
          toPlan: 'free',
          timestamp: new Date(),
          metadata: { 
            source: 'stripe_webhook',
            subscriptionId: stripeObject.id,
            canceledAt: stripeObject.canceled_at ? new Date(stripeObject.canceled_at * 1000) : new Date()
          }
        });
        
        // Revoke access to your product
        user.hasAccess = false;
        user.subscriptionStatus = "canceled";
        user.subscriptionEndDate = new Date();
        user.plan = "free"; // Downgrade to free plan
        
        // Update UserProfile as well
        await updateSubscriptionStatus(
          user._id.toString(),
          "canceled",
          "free",
          user.email
        );
        
        // 📝 Record webhook processing
        user.webhookEvents = user.webhookEvents || [];
        user.webhookEvents.push({
          eventId: event.id,
          eventType: 'customer.subscription.deleted',
          processed: true,
          processedAt: new Date(),
          metadata: { 
            subscriptionId: stripeObject.id,
            canceledAt: stripeObject.canceled_at ? new Date(stripeObject.canceled_at * 1000) : new Date()
          }
        });
        
        await user.save();
        console.log(`User ${user._id} downgraded to free plan`);

        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product

        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;

        const priceId = stripeObject.lines.data[0].price.id;
        const customerId = stripeObject.customer;

        const user = await User.findOne({ customerId });

        if (!user) {
          console.error(`User not found for customerId: ${customerId}`);
          break;
        }

        // 🔒 Check for duplicate webhook processing
        const existingWebhookEvent = user.webhookEvents?.find(
          (webhookEvent: any) => webhookEvent.eventId === event.id && webhookEvent.eventType === 'invoice.paid'
        );
        
        if (existingWebhookEvent && existingWebhookEvent.processed) {
          console.log(`Webhook event ${event.id} already processed for user ${user._id}`);
          break;
        }

        // Make sure the invoice is for the same plan (priceId) the user subscribed to
        if (user.priceId !== priceId) {
          console.log(`Plan mismatch for user ${user._id}. Expected: ${user.priceId}, Got: ${priceId}`);
          break;
        }

        // Find the plan configuration using smart matching
        const plan = findPlanByPriceId(priceId);
        
        // Grant user access to your product. It's a boolean in the database, but could be a number of credits, etc...
        user.hasAccess = true;
        user.subscriptionStatus = "active";
        
        // Grant monthly credits for Pro users (renewal scenario)
        if (plan && plan.name === "Pro") {
          user.plan = "pro";
          console.log(`Granting monthly Pro credits to user ${user._id} for subscription renewal`);
          
          // 📊 Track renewal in subscription history
          user.subscriptionHistory = user.subscriptionHistory || [];
          user.subscriptionHistory.push({
            action: 'renewed',
            fromPlan: 'pro',
            toPlan: 'pro',
            timestamp: new Date(),
            priceId: priceId,
            metadata: { 
              source: 'stripe_invoice_paid',
              invoiceId: stripeObject.id,
              amount: stripeObject.amount_paid,
              currency: stripeObject.currency
            }
          });
          
          // Grant monthly Pro credits (260 credits) for renewal
          // Use UserProfile-based credit granting
          await grantCredits(
            user._id.toString(), 
            plan.credits, 
            "monthly_subscription_renewal",
            user.email,
            { plan: "pro", subscriptionStatus: "active" }
          );
          // Also update User model for backward compatibility
          await grantCreditsToUser(user._id.toString(), plan.credits, "monthly_subscription_renewal");
        }
        
        // 📝 Record webhook processing
        user.webhookEvents = user.webhookEvents || [];
        user.webhookEvents.push({
          eventId: event.id,
          eventType: 'invoice.paid',
          processed: true,
          processedAt: new Date(),
          metadata: { 
            invoiceId: stripeObject.id,
            priceId: priceId,
            amount: stripeObject.amount_paid,
            currency: stripeObject.currency
          }
        });
        
        await user.save();

        break;
      }

      case "invoice.payment_failed": {
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;
        
        const customerId = stripeObject.customer;
        const user = await User.findOne({ customerId });
        
        if (user) {
          user.subscriptionStatus = "past_due";
          await user.save();
          
          // Update UserProfile as well
          await updateSubscriptionStatus(
            user._id.toString(),
            "past_due",
            user.plan,
            user.email
          );
        }

        break;
      }

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("Stripe webhook error: ", {
      error: e.message,
      stack: e.stack,
      eventType,
      eventId: event.id
    });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
