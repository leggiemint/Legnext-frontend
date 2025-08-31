import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";

export async function GET() {
  try {
    // 获取最近的Square webhook事件
    const recentWebhooks = await prisma.webhookEvent.findMany({
      where: { provider: "square" },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return NextResponse.json({
      success: true,
      message: "Square webhook debug info",
      data: {
        recentWebhooks: recentWebhooks.map(w => ({
          id: w.id,
          eventId: w.eventId,
          eventType: w.eventType,
          processed: w.processed,
          error: w.error,
          createdAt: w.createdAt,
          processedAt: w.processedAt
        })),
        webhookURL: "https://pngtubermaker.com/api/webhooks/square",
        expectedEvents: [
          "payment.completed",
          "payment.failed"
        ]
      }
    });

  } catch (error: any) {
    console.error("Square webhook debug error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch webhook info" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // 简单的webhook测试端点
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  
  console.log("🧪 Square webhook test received:", {
    bodyLength: body.length,
    headers: {
      contentType: headers["content-type"],
      userAgent: headers["user-agent"],
      signature: headers["x-square-hmacsha256-signature"] ? "Present" : "Missing"
    }
  });

  return NextResponse.json({
    received: true,
    message: "Test webhook received successfully",
    timestamp: new Date().toISOString()
  });
}