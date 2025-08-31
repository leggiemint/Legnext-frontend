import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { createSquarePortal } from "@/libs/square";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json(
        { error: "Return URL is required" },
        { status: 400 }
      );
    }

    // Get user profile to find Square customer ID
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!userProfile?.squareCustomerId) {
      return NextResponse.json(
        { error: "You don't have a Square billing account yet. Make a purchase first." },
        { status: 400 }
      );
    }

    // Create Square customer portal session
    const portalUrl = await createSquarePortal({
      customerId: userProfile.squareCustomerId,
      returnUrl,
    });

    return NextResponse.json({
      url: portalUrl
    });

  } catch (error: any) {
    console.error("Square portal error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to create Square customer portal session" },
      { status: 500 }
    );
  }
}
