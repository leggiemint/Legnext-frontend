import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export const dynamic = 'force-dynamic';

interface StripeInvoiceResponse {
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed' | 'canceled';
    description: string;
    paymentMethod?: string;
    items: Array<{
      description: string;
      amount: number;
      quantity?: number;
    }>;
    metadata?: {
      planName?: string;
      credits?: number;
      gateway?: string;
    };
  }>;
  pagination: {
    limit: number;
    cursor?: string;
    hasNext: boolean;
  };
  summary: {
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    totalAmount: number;
    lastInvoiceDate: string | null;
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const cursor = url.searchParams.get('cursor') || undefined;

    console.log(`📄 [STRIPE-INVOICES] Fetching invoices for user: ${session.user.email}`);

    // Get customer to find Stripe customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    });

    if (!customer?.stripeCustomerId) {
      console.log(`⚠️ [STRIPE-INVOICES] No Stripe customer found for user: ${session.user.email}`);
      return NextResponse.json({
        invoices: [],
        pagination: {
          limit,
          cursor: undefined,
          hasNext: false
        },
        summary: {
          totalInvoices: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
          totalAmount: 0,
          lastInvoiceDate: null
        }
      });
    }

    console.log(`🔍 [STRIPE-INVOICES] Fetching Stripe invoices for customer: ${customer.stripeCustomerId}`);

    // Fetch invoices from Stripe
    const stripeParams: Stripe.InvoiceListParams = {
      customer: customer.stripeCustomerId,
      limit: Math.min(limit, 100), // Stripe max is 100
      expand: ['data.payment_intent', 'data.subscription']
    };

    if (cursor) {
      stripeParams.starting_after = cursor;
    }

    const stripeInvoices = await stripe.invoices.list(stripeParams);

    console.log(`📊 [STRIPE-INVOICES] Retrieved ${stripeInvoices.data.length} invoices from Stripe`);

    // Transform Stripe invoices to our format
    const invoices = stripeInvoices.data.map(invoice => {
      // Map Stripe status to our status
      let status: 'paid' | 'pending' | 'failed' | 'canceled';
      switch (invoice.status) {
        case 'paid':
          status = 'paid';
          break;
        case 'open':
        case 'draft':
          status = 'pending';
          break;
        case 'uncollectible':
          status = 'failed';
          break;
        case 'void':
          status = 'canceled';
          break;
        default:
          status = 'pending';
      }

      // Extract items
      const items = invoice.lines.data.map(line => ({
        description: line.description || line.price?.nickname || 'Subscription',
        amount: line.amount / 100, // Convert from cents
        quantity: line.quantity || 1
      }));

      // Extract plan info from subscription or metadata
      let planName = 'Unknown Plan';
      let credits = 0;

      if (invoice.subscription && typeof invoice.subscription === 'object') {
        const subscription = invoice.subscription as Stripe.Subscription;
        if (subscription.metadata?.planName) {
          planName = subscription.metadata.planName;
        }
        if (subscription.metadata?.credits) {
          credits = parseInt(subscription.metadata.credits);
        }
      }

      // Check invoice metadata
      if (invoice.metadata?.planName) {
        planName = invoice.metadata.planName;
      }
      if (invoice.metadata?.credits) {
        credits = parseInt(invoice.metadata.credits);
      }

      // Get payment method info
      let paymentMethod = 'Credit Card';
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
        if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
          const pm = paymentIntent.payment_method as Stripe.PaymentMethod;
          if (pm.card?.brand) {
            paymentMethod = `${pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)} •••• ${pm.card.last4}`;
          }
        }
      }

      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.total / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status,
        description: invoice.description || `${planName} Subscription`,
        paymentMethod,
        items,
        metadata: {
          planName,
          credits: credits > 0 ? credits : undefined,
          gateway: 'stripe'
        }
      };
    });

    // Calculate summary
    const summary = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: invoices.filter(inv => inv.status === 'pending').length,
      totalAmount: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0),
      lastInvoiceDate: invoices.length > 0 ? invoices[0].date : null
    };

    const response: StripeInvoiceResponse = {
      invoices,
      pagination: {
        limit,
        cursor: stripeInvoices.has_more && invoices.length > 0 
          ? invoices[invoices.length - 1].id 
          : undefined,
        hasNext: stripeInvoices.has_more
      },
      summary
    };

    console.log(`✅ [STRIPE-INVOICES] Successfully returned ${invoices.length} invoices for ${session.user.email}`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("❌ [STRIPE-INVOICES] Error fetching Stripe invoices:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}