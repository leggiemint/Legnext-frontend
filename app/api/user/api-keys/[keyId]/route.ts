import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { getUserWithProfile } from "@/libs/user-service";
import { revokeBackendApiKey } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// PUT /api/user/api-keys/[keyId] - 更新API密钥（重命名或禁用）
export async function PUT(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, isActive } = body;

    // 验证API Key属于当前用户
    const apiKey = await prisma.userApiKey.findFirst({
      where: {
        id: params.keyId,
        userId: user.id
      }
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // 更新API Key
    const updatedApiKey = await prisma.userApiKey.update({
      where: { id: params.keyId },
      data: {
        ...(name && { name }),
        ...(typeof isActive === 'boolean' && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      data: {
        apiKey: {
          id: updatedApiKey.id,
          name: updatedApiKey.name,
          isActive: updatedApiKey.isActive,
          updatedAt: updatedApiKey.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("💥 Error updating API key:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/user/api-keys/[keyId] - 撤销/删除API密钥
export async function DELETE(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 验证API Key属于当前用户
    const apiKey = await prisma.userApiKey.findFirst({
      where: {
        id: params.keyId,
        userId: user.id
      }
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // 🚀 尝试在后端系统撤销API Key（如果有后端账户）
    const preferences = user.profile.preferences as any;
    if (preferences?.backendAccountId) {
      try {
        // 注意：这里需要后端API Key的ID，暂时无法映射
        // 在更完整的实现中，应该在UserApiKey中存储backendApiKeyId
        console.log(`⚠️ Backend API key revocation not implemented for local key: ${apiKey.id}`);
      } catch (error) {
        console.warn(`⚠️ Backend API key revocation failed:`, error?.message);
      }
    }

    // 🎯 本地数据库：标记为不活跃而不是删除（行业标准）
    const revokedApiKey = await prisma.userApiKey.update({
      where: { id: params.keyId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: "API key revoked successfully",
      data: {
        apiKey: {
          id: revokedApiKey.id,
          name: revokedApiKey.name,
          isActive: revokedApiKey.isActive,
          updatedAt: revokedApiKey.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("💥 Error revoking API key:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}