import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { createSquareCheckout } from "@/libs/square";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceId, mode, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "Success and cancel URLs are required" },
        { status: 400 }
      );
    }

    if (!mode) {
      return NextResponse.json(
        { error: "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)" },
        { status: 400 }
      );
    }

    // Get current user session
    const session = await getServerSession(authOptions);
    let user = null;

    if (session?.user?.id) {
      // Get user with profile for existing customer ID
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true }
      });
    }

    // Create Square checkout session
    const checkoutUrl = await createSquareCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      clientReferenceId: user?.id || undefined,
      user: user ? {
        customerId: undefined, // TODO: Add Square customer ID support
        email: user.email || undefined,
      } : undefined,
    });

    return NextResponse.json({ 
      url: checkoutUrl 
    });

  } catch (error: any) {
    console.error("Square checkout error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to create Square checkout session" },
      { status: 500 }
    );
  }
}
