import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { getCustomerInvoices } from '@/libs/stripe-client';
import { getUserWithProfile } from '@/libs/user-helpers';

import { log } from '@/libs/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // 获取用户信息
    const user = await getUserWithProfile(session.user.id);
    if (!user?.paymentCustomer?.stripeCustomerId) {
      return NextResponse.json({
        invoices: [],
      });
    }

    // 获取客户发票
    const invoices = await getCustomerInvoices(
      user.paymentCustomer.stripeCustomerId,
      limit
    );

    // 格式化发票数据
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
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
    }));

    // 过滤重复的 subscription_create 发票
    const filteredInvoices = formattedInvoices.filter((invoice, index, arr) => {
      if (invoice.billing_reason === 'subscription_create') {
        // 查找是否有相同订阅和相同日期的其他 subscription_create 发票
        const duplicate = arr.find((otherInvoice, otherIndex) => 
          otherIndex < index && 
          otherInvoice.subscription === invoice.subscription &&
          otherInvoice.created === invoice.created &&
          otherInvoice.billing_reason === 'subscription_create'
        );
        return !duplicate; // 如果没有重复，保留这个发票
      }
      return true; // 其他类型的发票都保留
    });

    return NextResponse.json({
      invoices: filteredInvoices,
    });

  } catch (error) {
    log.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to get invoices' },
      { status: 500 }
    );
  }
}