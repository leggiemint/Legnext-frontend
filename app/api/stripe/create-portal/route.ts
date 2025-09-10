import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

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

    // Get customer to find Stripe customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    });

    if (!customer?.stripeCustomerId) {
      return NextResponse.json(
        { error: "You don't have a Stripe billing account yet. Make a purchase first." },
        { status: 400 }
      );
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({
      url: portalSession.url
    });

  } catch (error: any) {
    console.error("Stripe portal error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}
