import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

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
    let customerId = undefined;

    if (session?.user?.id) {
      // Get user with profile for existing customer ID
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true }
      });

      // Use existing Stripe customer ID if available
      if (user?.profile?.stripeCustomerId) {
        customerId = user.profile.stripeCustomerId;
      }
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: mode as 'payment' | 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // If user is logged in, pass user ID for webhook processing
      client_reference_id: user?.id || undefined,
      // Pre-fill customer info if available
      customer: customerId,
      customer_email: !customerId && user?.email ? user.email : undefined,
      // Enable customer portal for subscription management
      customer_creation: mode === 'subscription' ? 'always' : 'if_required',
      // Add metadata for tracking
      metadata: {
        userId: user?.id || '',
        plan: 'pro', // Assuming this is for pro plan
      },
      // For subscriptions, collect tax if needed
      ...(mode === 'subscription' && {
        automatic_tax: { enabled: false }, // Enable if you want automatic tax calculation
      }),
    });

    return NextResponse.json({ 
      url: checkoutSession.url 
    });

  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: "Your card was declined." },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
