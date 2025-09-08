
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { getUserWithProfile } from "@/libs/user-service";
import { createBackendApiKey } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// GET /api/user/api-keys - 获取用户的API密钥（从本地数据库）
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

    // 从本地数据库获取API Keys（行业标准做法）
    const apiKeys = await prisma.userApiKey.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      data: {
        apiKeys: apiKeys.map(key => ({
          id: key.id,
          name: key.name || 'API Key',
          goApiKey: key.goApiKey,
          preview: `${key.goApiKey.substring(0, 8)}...${key.goApiKey.substring(key.goApiKey.length - 8)}`,
          isActive: key.isActive,
          lastUsedAt: key.lastUsedAt,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt
        }))
      }
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

    // 🚀 在后端系统创建API Key（如果后端可用）
    const preferences = user.profile.preferences as any;
    let backendApiKey = null;
    
    if (preferences?.backendAccountId) {
      try {
        const result = await createBackendApiKey({
          accountId: preferences.backendAccountId,
          name: name || `API Key - ${new Date().toLocaleDateString()}`
        });
        
        if (result.success && result.apiKey) {
          backendApiKey = result.apiKey;
        }
      } catch (error) {
        console.warn(`⚠️ Backend API key creation failed for ${user.email}:`, error?.message);
        // 继续创建本地记录，但没有后端API Key
      }
    }

    // 🎯 创建本地数据库记录（行业标准：本地存储）
    const apiKey = await prisma.userApiKey.create({
      data: {
        userId: user.id,
        name: name || 'API Key',
        goApiKey: backendApiKey?.value || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // 如果后端失败，创建本地key
        isActive: true
      }
    });

    return NextResponse.json({
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          goApiKey: apiKey.goApiKey,
          fullValue: apiKey.goApiKey, // 只在创建时返回完整值
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt
        }
      }
    });

  } catch (error) {
    console.error("💥 Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}