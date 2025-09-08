import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";
import { createBackendApiKey, getBackendApiKeys, generateApiKeyName } from "@/libs/backend-client";

export const dynamic = 'force-dynamic';

// POST /api/backend/api-keys - 为当前用户创建新的API Key
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const backendAccountId = user.profile.preferences?.backendAccountId;
    
    if (!backendAccountId) {
      return NextResponse.json(
        { 
          error: "No backend account found. Please setup backend integration first.",
          setupRequired: true 
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name } = body;

    // 生成API Key名称
    const apiKeyName = name || generateApiKeyName(session.user.email);

    console.log(`🔑 Creating API Key for user: ${session.user.email}`);

    // 创建API Key
    const result = await createBackendApiKey({
      accountId: backendAccountId,
      name: apiKeyName
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to create API key", details: result.error },
        { status: 500 }
      );
    }

    // 更新用户偏好设置，保存最新的API Key信息
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        preferences: {
          ...user.profile.preferences,
          lastApiKeyCreated: new Date().toISOString(),
          hasActiveApiKey: true
        }
      }
    });

    return NextResponse.json({
      message: "API Key created successfully",
      data: {
        apiKey: {
          id: result.apiKey!.id,
          name: result.apiKey!.name,
          value: result.apiKey!.value, // 完整API Key值
          createdAt: result.apiKey!.created_at,
          revoked: result.apiKey!.revoked
        },
        backendAccountId,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("💥 Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/backend/api-keys - 获取当前用户的所有API Keys
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

    const backendAccountId = user.profile.preferences?.backendAccountId;
    
    if (!backendAccountId) {
      return NextResponse.json({
        data: {
          hasBackendAccount: false,
          apiKeys: [],
          setupRequired: true
        }
      });
    }

    console.log(`🔍 Fetching API Keys for account: ${backendAccountId}`);

    // 获取所有API Keys
    const result = await getBackendApiKeys(backendAccountId);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to fetch API keys", details: result.error },
        { status: 500 }
      );
    }

    // 过滤和格式化API Keys  
    const apiKeysArray = result.apiKeys || [];
    const formattedApiKeys = apiKeysArray.map(key => ({
      id: key.id,
      name: key.name,
      // 为安全起见，隐藏API Key的部分内容
      value: key.revoked ? "***REVOKED***" : `${key.value.substring(0, 8)}...${key.value.substring(key.value.length - 8)}`,
      fullValue: key.revoked ? null : key.value, // 只有未撤销的才返回完整值
      createdAt: key.created_at,
      updatedAt: key.updated_at,
      revoked: key.revoked,
      accountId: key.account_id
    }));

    console.log(`📋 Found ${formattedApiKeys.length} API keys for user ${session.user.email}`);

    return NextResponse.json({
      data: {
        hasBackendAccount: true,
        backendAccountId,
        apiKeys: formattedApiKeys,
        totalKeys: formattedApiKeys.length,
        activeKeys: formattedApiKeys.filter(key => !key.revoked).length,
        revokedKeys: formattedApiKeys.filter(key => key.revoked).length
      }
    });

  } catch (error: any) {
    console.error("💥 Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}