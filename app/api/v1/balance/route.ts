// 对外API接口 - 查询API调用余额
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, extractApiKeyFromRequest } from "@/libs/api-auth";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/balance
 * 
 * 查询当前API Key关联用户的余额信息
 * 
 * Headers:
 *   Authorization: Bearer lnx_your_api_key_here
 * 
 * Response:
 * {
 *   "success": true,
 *   "balance": {
 *     "api_calls_remaining": 150,
 *     "total_api_calls_purchased": 200,
 *     "total_api_calls_used": 50,
 *     "plan": "pro",
 *     "subscription_status": "active"
 *   },
 *   "usage_stats": {
 *     "images_generated": 25,
 *     "images_upscaled": 10,
 *     "variations_created": 5
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // 提取API密钥
    const apiKey = extractApiKeyFromRequest(req);
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "API key required", 
          message: "Please provide API key in Authorization header: 'Bearer lnx_your_api_key_here'" 
        },
        { status: 401 }
      );
    }

    // 验证API密钥
    const validation = await validateApiKey(apiKey);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid API key", message: validation.error },
        { status: 401 }
      );
    }

    const { user } = validation;
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 获取详细的用户资料
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        apiCalls: true,
        totalApiCallsUsed: true,
        totalApiCallsPurchased: true,
        plan: true,
        subscriptionStatus: true,
        imagesGenerated: true,
        imagesUpscaled: true,
        variationsCreated: true,
        lastActiveAt: true,
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log(`💰 Balance queried by API key user: ${user.email}, remaining: ${userProfile.apiCalls}`);

    return NextResponse.json({
      success: true,
      balance: {
        api_calls_remaining: userProfile.apiCalls,
        total_api_calls_purchased: userProfile.totalApiCallsPurchased,
        total_api_calls_used: userProfile.totalApiCallsUsed,
        plan: userProfile.plan,
        subscription_status: userProfile.subscriptionStatus,
      },
      usage_stats: {
        images_generated: userProfile.imagesGenerated,
        images_upscaled: userProfile.imagesUpscaled,
        variations_created: userProfile.variationsCreated,
        last_active: userProfile.lastActiveAt.toISOString(),
      }
    });

  } catch (error) {
    console.error("💥 Error in API v1 balance:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Please try again later" },
      { status: 500 }
    );
  }
}