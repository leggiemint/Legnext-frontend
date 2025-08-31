import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" }, 
        { status: 400 }
      );
    }

    // Try to create lead, ignore if email already exists
    try {
      await prisma.lead.create({
        data: {
          email: email.toLowerCase(),
          source: source || "website",
          metadata: {
            userAgent: req.headers.get("user-agent"),
            referer: req.headers.get("referer"),
            ip: req.headers.get("x-forwarded-for") || 
                req.headers.get("x-real-ip") || 
                "unknown"
          }
        }
      });
    } catch (error: any) {
      // Email already exists, that's fine
      if (error.code === "P2002") {
        return NextResponse.json({ success: true, message: "Already subscribed" });
      }
      throw error;
    }

    // TODO: Add to email marketing list (Mailgun, etc.)

    return NextResponse.json({ 
      success: true, 
      message: "Successfully subscribed to updates" 
    });

  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
