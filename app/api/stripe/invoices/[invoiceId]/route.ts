import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { getInvoiceDetails } from '@/libs/stripe-client';
import { getUserWithProfile } from '@/libs/user-helpers';

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { invoiceId } = params;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const user = await getUserWithProfile(session.user.id);
    if (!user?.paymentCustomer?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User has no payment customer' },
        { status: 404 }
      );
    }

    // 获取发票详情
    const invoice = await getInvoiceDetails(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // 验证发票所有权
    if (invoice.customer !== user.paymentCustomer.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 格式化发票数据
    const formattedInvoice = {
      id: invoice.id,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      amount_remaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created,
      due_date: invoice.due_date,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      subscription: invoice.subscription,
      billing_reason: invoice.billing_reason,
      payment_intent: invoice.payment_intent,
      lines: invoice.lines?.data?.map(line => ({
        id: line.id,
        description: line.description,
        amount: line.amount,
        currency: line.currency,
        period: line.period,
        price: line.price,
        quantity: line.quantity,
      })) || [],
    };

    return NextResponse.json(formattedInvoice);

  } catch (error) {
    console.error('Get invoice details error:', error);
    return NextResponse.json(
      { error: 'Failed to get invoice details' },
      { status: 500 }
    );
  }
}