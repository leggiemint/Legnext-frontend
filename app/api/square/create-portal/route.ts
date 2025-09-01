import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json(
        { error: "Return URL is required" },
        { status: 400 }
      );
    }

    // TODO: Add Square customer ID support
    return NextResponse.json(
      { error: "Square portal not yet implemented" },
      { status: 501 }
    );


  } catch (error: any) {
    console.error("Square portal error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to create Square customer portal session" },
      { status: 500 }
    );
  }
}
