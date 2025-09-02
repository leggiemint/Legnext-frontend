
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

// GET /api/user/api-keys - 获取用户的所有API密钥
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 获取用户的所有API密钥（不返回完整密钥，只显示前几位）
    const apiKeys = await prisma.userApiKey.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        goApiKey: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 遮蔽API密钥，只显示前8位和后4位
    const maskedApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key: `${key.goApiKey.substring(0, 8)}...${key.goApiKey.substring(key.goApiKey.length - 4)}`,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    }));

    console.log(`✅ API Keys fetched for user: ${user.email}, count: ${apiKeys.length}`);

    return NextResponse.json({
      keys: maskedApiKeys,
      count: apiKeys.length,
    });
  } catch (error) {
    console.error("💥 Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/user/api-keys - 创建新的API密钥
export async function POST(req: NextRequest) {
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
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "API key name cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // 检查用户已有的API密钥数量限制
    const existingKeysCount = await prisma.userApiKey.count({
      where: { 
        userId: user.id,
        isActive: true 
      }
    });

    const maxKeys = user.profile.plan === 'pro' ? 10 : 3; // Pro用户可以有10个，免费用户3个
    if (existingKeysCount >= maxKeys) {
      return NextResponse.json(
        { 
          error: `Maximum API keys limit reached. ${user.profile.plan === 'pro' ? 'Pro' : 'Free'} plan allows up to ${maxKeys} keys.`
        },
        { status: 400 }
      );
    }

    // 生成新的API密钥
    const apiKey = `lnx_${crypto.randomBytes(32).toString('hex')}`;

    // 创建API密钥记录
    const newApiKey = await prisma.userApiKey.create({
      data: {
        userId: user.id,
        goApiKey: apiKey,
        name: name.trim(),
        isActive: true,
      }
    });

    console.log(`✅ New API key created for user: ${user.email}, name: ${name}`);

    return NextResponse.json({
      message: "API key created successfully",
      key: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // 只在创建时返回完整密钥
        isActive: newApiKey.isActive,
        createdAt: newApiKey.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("💥 Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}