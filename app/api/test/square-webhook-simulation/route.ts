import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { updateSubscription, grantCredits } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`🧪 Simulating Square webhook for user: ${userId}`);

    // 模拟Square payment.completed事件
    const mockPaymentEvent = {
      type: 'payment.completed',
      event_id: `evt_test_${Date.now()}`,
      data: {
        object: {
          id: `payment_${Date.now()}`,
          source_type: 'CARD',
          reference_id: userId, // 用户ID
          order_id: `order_${Date.now()}`,
          amount_money: {
            amount: 1200, // $12.00
            currency: 'USD'
          }
        }
      }
    };

    console.log(`🔔 Simulating Square webhook: ${mockPaymentEvent.type}`);

    // 检查是否已处理过
    const existingEvent = await prisma.webhookEvent.findFirst({
      where: {
        provider: "square",
        eventId: mockPaymentEvent.event_id
      }
    });

    if (existingEvent) {
      console.log(`⏭️ Event already processed`);
      return NextResponse.json({ 
        success: false, 
        message: "Event already processed" 
      });
    }

    // 记录webhook事件
    await prisma.webhookEvent.create({
      data: {
        provider: "square",
        eventId: mockPaymentEvent.event_id,
        eventType: mockPaymentEvent.type,
        processed: false
      }
    });

    // 处理payment.completed事件
    const payment = mockPaymentEvent.data.object;
    
    if (payment?.source_type === 'CARD') {
      const userId = payment.reference_id;
      
      if (userId) {
        console.log(`💳 Processing payment for user ${userId}`);
        
        // 更新订阅状态
        const updateResult = await updateSubscription(
          userId,
          "pro",
          "active",
          payment.order_id, // 使用order ID作为客户引用
          "pro-monthly-subscription"
        );

        if (!updateResult.success) {
          console.error(`Failed to update subscription:`, updateResult.error);
          throw new Error(`Subscription update failed: ${updateResult.error}`);
        }

        // 授予Pro计划积分
        const creditResult = await grantCredits(
          userId,
          200, // 200 + 60 welcome = 260 total
          "Square Pro subscription purchase",
          "square",
          payment.id
        );

        if (!creditResult.success) {
          console.error(`Failed to grant credits:`, creditResult.error);
          throw new Error(`Credit grant failed: ${creditResult.error}`);
        }

        console.log(`✅ Pro subscription activated for user ${userId}, new balance: ${creditResult.newBalance}`);
      }
    }

    // 标记为已处理
    await prisma.webhookEvent.updateMany({
      where: {
        provider: "square",
        eventId: mockPaymentEvent.event_id
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    console.log(`✅ Square webhook simulation completed successfully`);

    return NextResponse.json({
      success: true,
      message: "Square webhook simulation completed",
      event: mockPaymentEvent.type,
      userId: userId
    });

  } catch (error: any) {
    console.error("Square webhook simulation error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
