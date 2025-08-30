import { NextResponse } from "next/server";
import configFile from "@/config";

// Temporary debug endpoint to check Stripe configuration
export async function GET() {
  return NextResponse.json({
    plans: configFile.stripe.plans,
    environment: process.env.NODE_ENV,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) + "...",
  });
}