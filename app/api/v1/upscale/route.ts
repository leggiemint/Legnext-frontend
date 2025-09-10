import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, extractApiKeyFromRequest, getApiCallCost, consumeApiCall, getUserBackendApiKey } from "@/libs/api-auth";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/upscale
 * 
 * Upscale高清放大API - 使用用户API Key验证
 * 
 * Headers:
 *   Authorization: Bearer your_api_key_here
 *   或
 *   X-API-Key: your_api_key_here
 * 
 * Body:
 * {
 *   "job_id": "280b8eb6-978f-446b-a87d-198caed8eabe",
 *   "index": 0,
 *   "callback": "https://your-webhook-endpoint.com"
 * }
 * 
 * Response:
 * {
 *   "job_id": "380c9fc7-089g-557c-b98e-209dbed9efcf",
 *   "model": "midjourney",
 *   "task_type": "upscale",
 *   "status": "pending",
 *   "meta": {
 *     "usage": {
 *       "type": "point",
 *       "frozen": 40,
 *       "consume": 0
 *     }
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 提取并验证API Key
    const apiKey = extractApiKeyFromRequest(req);
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "API key required", 
          message: "Please provide API key in Authorization header: 'Bearer your_api_key_here'" 
        },
        { status: 401 }
      );
    }

    // 2. 验证API Key
    const validation = await validateApiKey(apiKey);
    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid API key", message: validation.error },
        { status: 401 }
      );
    }

    // User validation passed, continue with API call

    // 3. 检查请求参数
    const body = await req.json();
    const { job_id, index, callback } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: "Missing required parameter", message: "'job_id' is required" },
        { status: 400 }
      );
    }

    if (typeof index !== 'number' || index < 0 || index > 3) {
      return NextResponse.json(
        { error: "Invalid parameter", message: "'index' must be a number between 0 and 3 (corresponding to the 4 generated images)" },
        { status: 400 }
      );
    }

    // 4. 注意：余额检查由后端API统一处理，这里不预先判断
    const requiredCredits = getApiCallCost('upscale');

    // 5. 获取用户的后端API Key
    const backendApiKey = await getUserBackendApiKey(validation.userId!);
    if (!backendApiKey) {
      return NextResponse.json(
        { error: "No valid backend API key found", message: "Please create an API key in your dashboard" },
        { status: 400 }
      );
    }

    // 6. 调用后端Upscale API
    const baseUrl = process.env.BASE_MANAGER_URL || process.env.NEXT_PUBLIC_BASE_MANAGER_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Backend service not configured" },
        { status: 500 }
      );
    }

    
    // 使用正确的后端API参数格式：jobId, imageNo, type
    let backendResponse;
    try {
      backendResponse = await fetch(`${baseUrl}/api/v1/upscale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': backendApiKey
        },
        body: JSON.stringify({
          jobId: job_id,
          imageNo: index,
          type: 0, // 固定为0，根据用户提供的curl示例
          callback
        })
      });
    } catch (fetchError) {
      return NextResponse.json(
        { error: "Failed to connect to backend service", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      
      // 检查是否是credits不足错误 - 直接透传后端错误
      if (backendResponse.status === 402 || errorText.includes('insufficient quota')) {
        return NextResponse.json(
          { 
            error: "Insufficient credits", 
            message: "Your account does not have enough credits for this operation",
            backend_error: errorText
          },
          { status: 402 }
        );
      }
      
      return NextResponse.json(
        { error: `Backend API error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();

    // 7. 消费credits（只在成功提交任务后扣费）
    if (result.job_id && result.status !== 'failed') {
      await consumeApiCall(validation.userId!, requiredCredits);
    }

    // 8. 记录任务到数据库（可选，用于追踪）
    try {
      await prisma.midjourneyImage.create({
        data: {
          userId: validation.userId!,
          taskId: result.job_id || `upscale_${Date.now()}`,
          prompt: `Upscale from job ${job_id}, index ${index}`,
          status: result.status || 'pending',
          model: result.model || 'midjourney',
          mode: 'fast', // Default mode
          storedImages: {
            task_type: 'upscale',
            callback_url: callback || null,
            backend_task_type: result.task_type,
            service_mode: result.config?.service_mode,
            frozen_credits: result.meta?.usage?.frozen,
            backend_api_key_used: backendApiKey,
            original_job_id: job_id,
            upscale_index: index
          }
        }
      });
    } catch (dbError) {
      // 不影响主要流程
    }

    return NextResponse.json({
      ...result,
      credits_consumed: requiredCredits
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}