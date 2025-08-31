import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log("🧪 Webhook test endpoint received request");
    console.log("📋 Headers:", headers);
    console.log("📄 Body:", body);
    
    return NextResponse.json({
      success: true,
      message: "Webhook test endpoint working",
      timestamp: new Date().toISOString(),
      headers: headers,
      bodyLength: body.length
    });
  } catch (error) {
    console.error("❌ Webhook test error:", error);
    return NextResponse.json(
      { error: "Test failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Webhook test endpoint is running",
    timestamp: new Date().toISOString()
  });
}
