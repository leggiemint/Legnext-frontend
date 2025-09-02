import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

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

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { keyId } = params;

    // 检查API密钥是否存在且属于当前用户
    const apiKey = await prisma.userApiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        goApiKey: true,
        name: true,
      }
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Full API key retrieved for user: ${user.email}, keyId: ${keyId}`);

    return NextResponse.json({
      key: apiKey.goApiKey,
      name: apiKey.name,
    });

  } catch (error) {
    console.error("💥 Error retrieving full API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}