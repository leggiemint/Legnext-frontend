// Square Webhook 处理器
// 处理 Square 支付事件和订阅更新

import { NextRequest, NextResponse } from "next/server";
import { verifySquareWebhook } from "@/libs/square";
import { findUserByEmail } from "@/libs/user-service";

const relevantEvents = new Set([
  "payment.completed",
  "payment.failed", 
  "payment.updated",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "invoice.payment_made",
]);

export async function POST(req: NextRequest) {
  let eventType: string | null = null;
  let event: any = null;

  try {
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

    console.log(`🔔 Square webhook received: ${eventType}`, {
      eventId: event.event_id,
      merchantId: event.merchant_id,
      locationId: event.location_id,
    });

    if (!relevantEvents.has(eventType)) {
      console.log(`⏭️ Ignoring irrelevant Square event: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    // 根据事件类型处理
    switch (eventType) {
      case "payment.completed": {
        await handlePaymentCompleted(event);
        break;
      }
      
      case "payment.failed": {
        await handlePaymentFailed(event);
        break;
      }
      
      case "subscription.created":
      case "subscription.updated": {
        await handleSubscriptionUpdate(event);
        break;
      }
      
      case "subscription.canceled": {
        await handleSubscriptionCanceled(event);
        break;
      }
      
      default: {
        console.warn(`⚠️ Unhandled Square event type: ${eventType}`);
      }
    }

    console.log(`✅ Square webhook processed successfully: ${eventType}`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error(`❌ Square webhook error (${eventType}):`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" }, 
      { status: 500 }
    );
  }
}

// 处理支付完成事件
async function handlePaymentCompleted(event: any) {
  try {
    const payment = event.data.object;
    const { amount_money, buyer_email_address, receipt_number } = payment;
    
    console.log("💳 Square payment completed:", {
      amount: amount_money?.amount,
      currency: amount_money?.currency,
      email: buyer_email_address,
      receipt: receipt_number,
    });

    if (!buyer_email_address) {
      console.warn("⚠️ Payment completed but no buyer email found");
      return;
    }

    // 查找用户
    const user = await findUserByEmail(buyer_email_address);
    if (!user) {
      console.warn(`⚠️ User not found for email: ${buyer_email_address}`);
      return;
    }

    // 计算金额和积分
    const amountInCents = parseInt(amount_money?.amount || "0");
    const amountInDollars = amountInCents / 100;
    
    // 根据金额判断是哪个计划 (这里可以更智能地匹配)
    let creditsToAdd = 0;
    let planName = "unknown";
    
    if (amountInDollars === 12) { // Pro plan
      creditsToAdd = 200; // Pro plan adds 200 credits (plus 60 free = 260 total)
      planName = "pro";
    }

    if (creditsToAdd > 0) {
      // 更新用户积分和计划 
      const userId = (user as any)._id?.toString() || (user as any).id?.toString();
      if (userId) {
        await updateUserAfterPayment(userId, planName, creditsToAdd);
        console.log(`✅ Updated user ${(user as any).email}: plan=${planName}, credits=+${creditsToAdd}`);
      } else {
        console.error('❌ Unable to get user ID for payment update');
      }
    }

  } catch (error) {
    console.error("❌ Error handling payment completed:", error);
    throw error;
  }
}

// 处理支付失败事件
async function handlePaymentFailed(event: any) {
  try {
    const payment = event.data.object;
    console.log("❌ Square payment failed:", {
      amount: payment.amount_money?.amount,
      email: payment.buyer_email_address,
      reason: payment.processing_fee || "Unknown",
    });
    
    // 这里可以添加失败处理逻辑，比如通知用户
    
  } catch (error) {
    console.error("❌ Error handling payment failed:", error);
    throw error;
  }
}

// 处理订阅更新事件 
async function handleSubscriptionUpdate(event: any) {
  try {
    const subscription = event.data.object;
    console.log("🔄 Square subscription updated:", {
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.plan_id,
    });
    
    // TODO: 实现订阅管理逻辑
    console.warn("⚠️ Square subscription management not implemented");
    
  } catch (error) {
    console.error("❌ Error handling subscription update:", error);
    throw error;
  }
}

// 处理订阅取消事件
async function handleSubscriptionCanceled(event: any) {
  try {
    const subscription = event.data.object;
    console.log("❌ Square subscription canceled:", {
      subscriptionId: subscription.id,
      customerId: subscription.customer_id,
    });
    
    // TODO: 实现订阅取消处理逻辑
    console.warn("⚠️ Square subscription cancellation not implemented");
    
  } catch (error) {
    console.error("❌ Error handling subscription canceled:", error);
    throw error;
  }
}

// 更新用户支付后状态
async function updateUserAfterPayment(userId: string, planName: string, creditsToAdd: number) {
  try {
    // 动态导入数据库连接和User模型
    const connectMongo = (await import("@/libs/mongoose")).default;
    await connectMongo();
    
    const User = (await import("@/models/User")).default;
    
    // 更新用户数据 - 使用正确的credits字段结构
    const updateResult = await User.findByIdAndUpdate(
      userId,
      {
        plan: planName,
        $inc: { 
          "credits.balance": creditsToAdd,
          "credits.totalEarned": creditsToAdd
        },
        hasAccess: true,
        subscriptionStatus: "active",
        "credits.lastCreditGrant": {
          date: new Date(),
          amount: creditsToAdd,
          reason: "square_payment"
        }
      },
      { new: true }
    );

    if (!updateResult) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(`✅ Successfully updated user ${updateResult.email}:`, {
      plan: planName,
      newCreditsBalance: updateResult.credits?.balance,
      creditsAdded: creditsToAdd,
      hasAccess: true,
      subscriptionStatus: "active",
    });
    
    return updateResult;
    
  } catch (error) {
    console.error("❌ Error updating user after payment:", error);
    throw error;
  }
}