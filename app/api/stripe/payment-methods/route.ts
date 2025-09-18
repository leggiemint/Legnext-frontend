import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import { stripe } from '@/libs/stripe-client';
import { getUserWithProfile } from '@/libs/user-helpers';
import { withValidStripeCustomer } from '@/libs/stripe-utils';

// GET: List customer's payment methods
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await getUserWithProfile(session.user.id);
    if (!user?.email) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 使用强化的Stripe客户验证机制获取支付方法
    const paymentMethods = await withValidStripeCustomer(
      session.user.id,
      user.email,
      async (customerId) => {
        return await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        });
      }
    );

    return NextResponse.json({
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
          funding: pm.card.funding,
          country: pm.card.country,
        } : null,
        created: pm.created,
        metadata: pm.metadata,
      })),
    });

  } catch (error: any) {
    console.error('❌ Error fetching payment methods:', error);

    // 不在生产环境暴露内部错误详情
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Failed to fetch payment methods',
        ...(isDevelopment && { message: error.message }),
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a payment method
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // 获取用户信息并验证Stripe客户
    const user = await getUserWithProfile(session.user.id);
    if (!user?.email) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 使用强化机制验证并删除支付方法
    await withValidStripeCustomer(
      session.user.id,
      user.email,
      async (customerId) => {
        // Verify the payment method belongs to this customer
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        if (paymentMethod.customer !== customerId) {
          throw new Error('Payment method not found');
        }

        return paymentMethod;
      }
    );

    // Detach the payment method from the customer
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });

  } catch (error: any) {
    console.error('❌ Error removing payment method:', error);

    // 不在生产环境暴露内部错误详情
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Failed to remove payment method',
        ...(isDevelopment && { message: error.message }),
      },
      { status: 500 }
    );
  }
}