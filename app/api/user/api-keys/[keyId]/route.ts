import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

// PUT /api/user/api-keys/[keyId] - 更新API密钥（重命名或启用/禁用）
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

    const { keyId } = params;
    const body = await req.json();
    const { name, isActive } = body;

    // 验证输入
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: "API key name must be a non-empty string" },
          { status: 400 }
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
          { error: "API key name cannot exceed 100 characters" },
          { status: 400 }
        );
      }
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    // 检查API密钥是否存在且属于当前用户
    const existingKey = await prisma.userApiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
      }
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    // 更新API密钥
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedKey = await prisma.userApiKey.update({
      where: { id: keyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        goApiKey: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // 返回遮蔽的密钥
    const maskedKey = {
      id: updatedKey.id,
      name: updatedKey.name,
      key: `${updatedKey.goApiKey.substring(0, 8)}...${updatedKey.goApiKey.substring(updatedKey.goApiKey.length - 4)}`,
      isActive: updatedKey.isActive,
      lastUsedAt: updatedKey.lastUsedAt,
      createdAt: updatedKey.createdAt,
      updatedAt: updatedKey.updatedAt,
    };

    console.log(`✅ API key updated for user: ${user.email}, keyId: ${keyId}`);

    return NextResponse.json({
      message: "API key updated successfully",
      key: maskedKey,
    });

  } catch (error) {
    console.error("💥 Error updating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/api-keys/[keyId] - 删除API密钥
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

    const { keyId } = params;

    // 检查API密钥是否存在且属于当前用户
    const existingKey = await prisma.userApiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
      }
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    // 软删除（设置为不活跃）而不是硬删除，以保留使用历史
    await prisma.userApiKey.update({
      where: { id: keyId },
      data: { 
        isActive: false,
        updatedAt: new Date(),
      }
    });

    console.log(`✅ API key deleted for user: ${user.email}, keyId: ${keyId}`);

    return NextResponse.json({
      message: "API key deleted successfully",
    });

  } catch (error) {
    console.error("💥 Error deleting API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}