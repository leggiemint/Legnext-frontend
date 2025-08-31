import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { createCustomerPortal } from "@/libs/payment";

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

    // Get user profile to find customer ID
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    });

    const customerId = userProfile?.stripeCustomerId || userProfile?.squareCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "You don't have a billing account yet. Make a purchase first." },
        { status: 400 }
      );
    }

    // Use unified payment interface
    const portalUrl = await createCustomerPortal({
      customerId,
      returnUrl,
    });

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Failed to create customer portal session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: portalUrl
    });

  } catch (error: any) {
    console.error("Payment portal error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}
