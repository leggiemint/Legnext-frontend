import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = parseInt(params.id);
    const body = await request.json();
    const { plan } = body;

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Map frontend plan names to backend plan names
    const backendPlan = plan === 'free' ? 'hobbyist' : plan === 'pro' ? 'developer' : plan;

    if (!['hobbyist', 'developer'].includes(backendPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be hobbyist or developer' },
        { status: 400 }
      );
    }

    const result = await backendApiClient.updateAccountPlan(accountId, backendPlan);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}