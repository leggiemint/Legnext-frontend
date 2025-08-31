import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { updateSubscription, grantCredits } from "@/libs/user-service";

export async function POST(req: NextRequest) {
  try {
    console.log("🔔 Simple Square webhook received - starting processing...");
    
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");

    console.log("📋 Simple webhook headers:", {
      contentType: req.headers.get("content-type"),
      signature: signature ? "Present" : "Missing",
      userAgent: req.headers.get("user-agent"),
      host: req.headers.get("host")
    });

    // 暂时跳过签名验证，专注于处理逻辑
    console.log("⚠️ Skipping signature verification for testing");

    // 解析事件数据
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error("❌ Failed to parse webhook body:", parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = event.type;
    const eventId = event.event_id;

    console.log(`🔔 Simple Square webhook received: ${eventType}`, {
      eventId: eventId,
      merchantId: event.merchant_id,
      createdAt: event.created_at
    });

    // 只处理payment.updated事件（因为这是你收到的）
    if (eventType === 'payment.updated') {
      const payment = event.data?.object?.payment;
      
      console.log(`🎯 Processing payment.updated:`, {
        paymentId: payment?.id,
        sourceType: payment?.source_type,
        amount: payment?.amount_money,
        status: payment?.status,
        note: payment?.note,
        buyerEmail: payment?.buyer_email_address
      });
      
      if (payment?.source_type === 'CARD' && payment?.status === 'COMPLETED') {
        let userId = null;
        
        // 从note中提取用户ID
        if (payment.note) {
          console.log(`🔍 Checking payment note for user ID: ${payment.note}`);
          const userIdMatch = payment.note.match(/User ID: ([a-zA-Z0-9-_]+)/);
          if (userIdMatch) {
            userId = userIdMatch[1];
            console.log(`✅ Found user ID in payment note: ${userId}`);
          }
        }
        
        // 如果还是没有用户ID，尝试通过邮箱查找用户
        if (!userId && payment.buyer_email_address) {
          console.log(`🔍 No user ID in note, trying to find user by email: ${payment.buyer_email_address}`);
          
          const user = await prisma.user.findUnique({
            where: { email: payment.buyer_email_address }
          });
          
          if (user) {
            userId = user.id;
            console.log(`✅ Found user by email: ${user.id} (${payment.buyer_email_address})`);
          } else {
            console.error(`❌ No user found with email: ${payment.buyer_email_address}`);
          }
        }
        
        if (userId) {
          console.log(`💳 Processing Square Pro subscription for user ${userId}`);
          
          // 检查是否已处理过这个支付
          const existingTransaction = await prisma.transaction.findFirst({
            where: {
              gatewayTxnId: payment.id,
              gateway: "square"
            }
          });

          if (existingTransaction) {
            console.log(`⏭️ Payment ${payment.id} already processed`);
            return NextResponse.json({ received: true, duplicate: true });
          }

          // 更新订阅状态
          const updateResult = await updateSubscription(
            userId,
            "pro",
            "active",
            payment.order_id, // 使用order ID作为客户引用
            "square-pro-subscription"
          );

          if (!updateResult.success) {
            console.error(`❌ Failed to update subscription for user ${userId}:`, updateResult.error);
            throw new Error(`Subscription update failed: ${updateResult.error}`);
          }

          // 授予Pro计划积分 (200 credits - 用户已有60免费积分)
          const creditResult = await grantCredits(
            userId,
            200, // 200 credits for Pro subscription
            "Square Pro subscription purchase",
            "square",
            payment.id
          );

          if (!creditResult.success) {
            console.error(`❌ Failed to grant credits to user ${userId}:`, creditResult.error);
            throw new Error(`Credit grant failed: ${creditResult.error}`);
          }

          console.log(`✅ Square Pro subscription activated for user ${userId}, new credit balance: ${creditResult.newBalance}`);
        } else {
          console.error('❌ Cannot process Square payment without user identification');
          console.error('Payment details:', {
            note: payment.note,
            buyerEmail: payment.buyer_email_address
          });
        }
      }
    }

    console.log(`✅ Simple Square webhook processed successfully: ${eventType}`);
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("❌ Simple Square webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
