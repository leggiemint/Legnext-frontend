import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";

export async function GET() {
  try {
    // 获取所有webhook事件
    const webhookEvents = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // 获取所有用户档案
    const userProfiles = await prisma.userProfile.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10
    });

    // 获取所有交易记录
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalWebhookEvents: webhookEvents.length,
        totalUserProfiles: userProfiles.length,
        totalTransactions: transactions.length
      },
      webhookEvents: webhookEvents.map(event => ({
        id: event.id,
        provider: event.provider,
        eventType: event.eventType,
        eventId: event.eventId,
        processed: event.processed,
        error: event.error,
        createdAt: event.createdAt
      })),
      userProfiles: userProfiles.map(profile => ({
        userId: profile.userId,
        plan: profile.plan,
        subscriptionStatus: profile.subscriptionStatus,
        credits: profile.credits,
        stripeCustomerId: profile.stripeCustomerId,
        updatedAt: profile.updatedAt
      })),
      recentTransactions: transactions.map(t => ({
        id: t.id,
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        gateway: t.gateway,
        createdAt: t.createdAt
      }))
    });

  } catch (error: any) {
    console.error("Check webhooks error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
