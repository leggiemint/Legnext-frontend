import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

export const dynamic = 'force-dynamic';

// DEPRECATED: This endpoint is deprecated in favor of backend API system
// GET /api/user/api-keys/[keyId]/full - 获取完整的API密钥
export async function GET(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`⚠️ [DEPRECATED] GET /api/user/api-keys/${params.keyId}/full accessed by user: ${session.user.email}. Redirecting to backend system.`);

    return NextResponse.json({ 
      error: "This endpoint is deprecated. Please use the backend API system at /api/backend/api-keys",
      deprecated: true,
      redirectTo: "/api/backend/api-keys"
    }, { status: 410 }); // 410 Gone - resource no longer available

  } catch (error) {
    console.error("💥 Error in deprecated full API key endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}