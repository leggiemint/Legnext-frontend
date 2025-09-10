import { NextRequest, NextResponse } from "next/server";
import { initializeSubscriptionPlans } from "@/libs/square-subscriptions";

// This endpoint initializes Square subscription plans in the Catalog API
// It should be run once during deployment or when setting up the system
export async function POST(req: NextRequest) {
  try {
    // Check for admin authorization (you might want to add proper admin auth)
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'admin-secret-key';
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    console.log('🚀 Initializing Square subscription plans...');

    const result = await initializeSubscriptionPlans();

    console.log('✅ Square subscription plans initialized successfully');

    return NextResponse.json({
      success: true,
      message: 'Square subscription plans initialized successfully',
      plans: result
    });

  } catch (error) {
    console.error('❌ Failed to initialize Square subscription plans:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to initialize subscription plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}