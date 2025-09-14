import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface CallbackPayload {
  id: string;
  text: string;
  urls: string[];
  status: number;
  comment: string;
  cost: {
    jobId: string;
    fastCost: number;
    relaxCost: number;
    feeCost: number;
    costAt: string;
  };
  audits: string[];
  seed: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CallbackPayload = await request.json();
    
    // Log the callback payload for debugging
    console.log('Received callback from backend:', {
      id: body.id,
      status: body.status,
      comment: body.comment,
      urls: body.urls?.length || 0,
    });

    // Process the callback data
    // This is where you would typically:
    // 1. Update your database with the task completion status
    // 2. Store the generated images
    // 3. Notify the user through websockets or other means
    // 4. Update any UI state

    // For now, we'll just acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Callback received successfully',
      jobId: body.id,
    });
  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}