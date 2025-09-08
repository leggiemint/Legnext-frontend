import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { revokeBackendApiKey } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// PATCH /api/backend/api-keys/[keyId]/revoke - 撤销指定的API Key
export async function PATCH(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keyId = parseInt(params.keyId);
    
    if (isNaN(keyId)) {
      return NextResponse.json(
        { error: "Invalid API key ID" },
        { status: 400 }
      );
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const backendAccountId = user.profile.preferences?.backendAccountId;
    
    if (!backendAccountId) {
      return NextResponse.json(
        { error: "No backend account found" },
        { status: 404 }
      );
    }

    console.log(`🗑️ Revoking API Key ${keyId} for account: ${backendAccountId}`);

    // 撤销API Key
    const result = await revokeBackendApiKey({
      accountId: backendAccountId,
      keyId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to revoke API key", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: result.message || "API Key revoked successfully",
      data: {
        keyId,
        backendAccountId,
        revokedAt: new Date().toISOString(),
        backendMessage: result.message
      }
    });

  } catch (error: any) {
    console.error("💥 Error revoking API key:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST方法别名，为了保持向后兼容性
export const POST = PATCH;