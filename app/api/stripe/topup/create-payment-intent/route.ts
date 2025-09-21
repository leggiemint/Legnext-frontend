import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { stripe } from '@/libs/stripe-client';
import { prisma } from '@/libs/prisma';
import { log } from '@/libs/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount, credits } = await request.json();

    if (!amount || !credits || amount <= 0 || credits <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount or credits' },
        { status: 400 }
      );
    }

    // 查找或创建Stripe客户
    let paymentCustomer = await prisma.paymentCustomer.findUnique({
      where: { userId: session.user.id }
    });

    let stripeCustomerId = paymentCustomer?.stripeCustomerId;

    if (!stripeCustomerId) {
      // 创建新的Stripe客户
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });

      stripeCustomerId = customer.id;

      // 保存到数据库
      await prisma.paymentCustomer.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId },
        create: {
          userId: session.user.id,
          stripeCustomerId,
        },
      });
    }

    // 创建PaymentIntent for TopUp (一次性支付)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // 转换为分
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        type: 'topup',
        userId: session.user.id,
        credits: credits.toString(),
        amount: amount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // 启用3D Secure认证（对印度用户很重要）
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic' as const,
        },
      },
    });

    log.info(`💰 TopUp PaymentIntent created: ${paymentIntent.id} for user ${session.user.id}, amount: $${amount}, credits: ${credits}`);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: stripeCustomerId,
      amount,
      credits,
      currency: 'usd',
    });

  } catch (error) {
    log.error('TopUp PaymentIntent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}