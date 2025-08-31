import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("🧪 Test webhook endpoint hit!");
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  
  const body = await req.text();
  console.log("Body length:", body.length);
  console.log("Body preview:", body.substring(0, 200));

  return NextResponse.json({ 
    success: true, 
    message: "Test webhook received",
    timestamp: new Date().toISOString()
    });
}

export async function GET() {
  return NextResponse.json({ 
    message: "Webhook test endpoint is working",
    endpoint: "/api/webhooks/stripe/test"
  });
}
