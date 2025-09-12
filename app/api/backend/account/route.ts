import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, account_group, plan, type } = body;

    if (!name || !plan) {
      return NextResponse.json(
        { error: 'Name and plan are required' },
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

    const result = await backendApiClient.createAccount({
      name: `legnexta_${name}`,
      account_group: account_group || 'user',
      plan: backendPlan,
      type: type || 'ppu',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}