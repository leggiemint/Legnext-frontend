import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint to verify webhook routing works
export async function GET(req: NextRequest) {
  console.log("=== WEBHOOK TEST ENDPOINT HIT ===", new Date().toISOString());
  return NextResponse.json({ 
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
}

export async function POST(req: NextRequest) {
  console.log("=== WEBHOOK TEST POST ===", new Date().toISOString());
  const body = await req.text();
  console.log("Body length:", body.length);
  return NextResponse.json({ 
    message: "POST webhook test successful",
    timestamp: new Date().toISOString(),
    bodyLength: body.length
  });
}