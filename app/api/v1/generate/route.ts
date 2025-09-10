// 对外API接口 - 使用API Key验证的图像生成接口
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, extractApiKeyFromRequest, consumeApiCall, getApiCallCost, checkCreditsBalance } from "@/libs/api-auth";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/generate
 * 
 * 第三方开发者使用API Key调用的图像生成接口
 * 
 * Headers:
 *   Authorization: Bearer lnx_your_api_key_here
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "prompt": "a beautiful landscape",
 *   "model": "v6", // optional: v5, v6, niji
 *   "mode": "fast", // optional: fast, turbo, mixed
 *   "aspect_ratio": "16:9", // optional: 1:1, 16:9, 9:16, etc.
 *   "stylize": 100, // optional: 0-1000
 *   "chaos": 0, // optional: 0-100
 *   "quality": "1" // optional: 0.25, 0.5, 1, 2
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "task_id": "task_123456",
 *   "status": "pending",
 *   "estimated_cost": 2,
 *   "remaining_credits": 98
 * }
 */
export async function POST(req: NextRequest) {
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

    // 解析请求体
    const body = await req.json();
    const { 
      prompt, 
      model = "v6", 
      mode = "fast", 
      aspect_ratio, 
      stylize, 
      chaos, 
      quality = "1" 
    } = body;

    // 验证必需参数
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt cannot exceed 2000 characters" },
        { status: 400 }
      );
    }

    // 验证可选参数
    const validModels = ["v5", "v6", "niji"];
    if (model && !validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model. Valid options: ${validModels.join(", ")}` },
        { status: 400 }
      );
    }

    const validModes = ["fast", "turbo", "mixed"];
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Valid options: ${validModes.join(", ")}` },
        { status: 400 }
      );
    }

    // 计算API调用费用
    const estimatedCost = getApiCallCost('generate');
    
    // 检查用户余额（使用标准化的预检查机制）
    const balanceCheck = await checkCreditsBalance(user.id, estimatedCost);
    
    if (!balanceCheck.sufficient) {
      return NextResponse.json(
        { 
          error: "Insufficient API call balance", 
          message: `This operation requires ${estimatedCost} API calls, but you only have ${balanceCheck.currentBalance} remaining.`,
          required_credits: estimatedCost,
          current_credits: balanceCheck.currentBalance
        },
        { status: 402 } // Payment Required
      );
    }

    // 消费API调用次数
    const consumed = await consumeApiCall(user.id, estimatedCost);
    if (!consumed) {
      return NextResponse.json(
        { error: "Failed to consume API calls" },
        { status: 500 }
      );
    }

    // 创建图像生成记录
    const imageRecord = await prisma.midjourneyImage.create({
      data: {
        userId: user.id,
        prompt: prompt.trim(),
        model: model,
        mode: mode,
        aspectRatio: aspect_ratio,
        stylize: stylize ? parseInt(stylize.toString()) : null,
        chaos: chaos ? parseInt(chaos.toString()) : null,
        quality: quality,
        status: "pending",
        apiCallsUsed: estimatedCost,
      }
    });

    // 这里应该调用实际的Midjourney API
    // 目前返回模拟响应

    // 更新用户资料以获取最新余额
    const updatedUser = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { apiCalls: true }
    });

    return NextResponse.json({
      success: true,
      task_id: imageRecord.id,
      status: "pending",
      estimated_cost: estimatedCost,
      remaining_credits: updatedUser?.apiCalls || 0,
      message: "Image generation task has been queued. Use the task_id to check status."
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", message: "Please try again later" },
      { status: 500 }
    );
  }
}