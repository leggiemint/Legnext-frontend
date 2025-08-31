import { NextRequest, NextResponse } from "next/server";
import { verifySquareWebhook } from "@/libs/square";

export async function GET() {
  try {
    const environment = {
      paymentGateway: process.env.PAYMENT_GATEWAY || process.env.NEXT_PUBLIC_PAYMENT_GATEWAY,
      squareWebhookSecret: process.env.SQUARE_WEBHOOK_SECRET ? "Configured" : "Missing",
      squareWebhookUrl: process.env.SQUARE_WEBHOOK_NOTIFICATION_URL,
      squareAccessToken: process.env.SQUARE_ACCESS_TOKEN ? "Configured" : "Missing",
      squareLocationId: process.env.SQUARE_LOCATION_ID ? "Configured" : "Missing",
      squareEnvironment: process.env.SQUARE_ENVIRONMENT,
    };

    console.log("🔍 Square webhook configuration check:", environment);

    return NextResponse.json({
      success: true,
      message: "Square webhook configuration status",
      timestamp: new Date().toISOString(),
      environment,
      webhookEndpoint: "https://pngtubermaker.com/api/webhooks/square",
      expectedEvents: [
        "payment.completed",
        "payment.failed"
      ],
      configurationChecklist: [
        {
          item: "Square Developer Console Webhook URL",
          shouldBe: "https://pngtubermaker.com/api/webhooks/square",
          status: "Please verify in Square Developer Console"
        },
        {
          item: "SQUARE_WEBHOOK_SECRET",
          shouldBe: "Signature key from Square Developer Console",
          status: environment.squareWebhookSecret === "Configured" ? "✅ Configured" : "❌ Missing"
        },
        {
          item: "SQUARE_WEBHOOK_NOTIFICATION_URL",
          shouldBe: "https://pngtubermaker.com/api/webhooks/square",
          status: environment.squareWebhookUrl === "https://pngtubermaker.com/api/webhooks/square" ? "✅ Correct" : "❌ Incorrect"
        },
        {
          item: "Webhook Events",
          shouldBe: "payment.completed, payment.failed",
          status: "Please verify in Square Developer Console"
        }
      ]
    });
  } catch (error) {
    console.error("❌ Square webhook config check error:", error);
    return NextResponse.json(
      { error: "Configuration check failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");
    
    console.log("🧪 Square webhook config test received POST request");
    console.log("📋 Headers:", {
      contentType: req.headers.get("content-type"),
      signature: signature ? "Present" : "Missing",
      userAgent: req.headers.get("user-agent")
    });
    console.log("📄 Body length:", body.length);
    
    // 测试签名验证
    const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
    let signatureValid = false;
    
    if (signature && webhookSecret) {
      signatureValid = verifySquareWebhook(body, signature, webhookSecret);
      console.log("🔐 Signature validation result:", signatureValid);
    }
    
    return NextResponse.json({
      success: true,
      message: "Square webhook config test completed",
      timestamp: new Date().toISOString(),
      signaturePresent: !!signature,
      signatureValid: signatureValid,
      bodyLength: body.length,
      webhookSecretConfigured: !!webhookSecret
    });
  } catch (error) {
    console.error("❌ Square webhook config test error:", error);
    return NextResponse.json(
      { error: "Config test failed" },
      { status: 500 }
    );
  }
}
