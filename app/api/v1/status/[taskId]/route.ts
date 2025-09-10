// 对外API接口 - 查询任务状态
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, extractApiKeyFromRequest, getUserBackendApiKey } from "@/libs/api-auth";
import { prisma } from "@/libs/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/status/[taskId]
 * 
 * 查询图像生成任务状态
 * 
 * Headers:
 *   Authorization: Bearer lnx_your_api_key_here
 * 
 * Response:
 * {
 *   "success": true,
 *   "task_id": "task_123456",
 *   "status": "completed", // pending, generating, completed, failed
 *   "progress": 100,
 *   "result": {
 *     "image_url": "https://...",
 *     "upscaled_urls": ["https://..."],
 *     "variations": ["https://..."]
 *   },
 *   "created_at": "2024-01-01T00:00:00Z",
 *   "completed_at": "2024-01-01T00:01:00Z"
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
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

    const { taskId } = params;

    // 获取用户的后端API Key
    const backendApiKey = await getUserBackendApiKey(user.id);
    if (!backendApiKey) {
      return NextResponse.json(
        { error: "No backend API key found", message: "Please create an API key in your dashboard" },
        { status: 400 }
      );
    }

    // 直接查询后端系统获取任务状态
    const baseUrl = process.env.BASE_MANAGER_URL || process.env.NEXT_PUBLIC_BASE_MANAGER_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Backend service not configured" },
        { status: 500 }
      );
    }

    try {
      const backendResponse = await fetch(`${baseUrl}/api/v1/job/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': backendApiKey
        }
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        
        return NextResponse.json(
          { error: `Backend status error: ${backendResponse.status}`, details: errorText },
          { status: backendResponse.status }
        );
      }

      const backendData = await backendResponse.json();
      
      // 转换后端响应格式为前端期望的格式
      const statusData: any = {
        success: true,
        task_id: backendData.job_id,
        task_type: backendData.task_type,
        status: backendData.status,
        progress: backendData.status === 'completed' ? 100 : (backendData.status === 'processing' ? 50 : 0),
        created_at: backendData.meta?.created_at,
        started_at: backendData.meta?.started_at,
        ended_at: backendData.meta?.ended_at,
        model: backendData.model,
        usage: backendData.meta?.usage
      };

      // 如果任务完成，添加结果信息
      if (backendData.status === 'completed' && backendData.output) {
        statusData.result = {
          image_url: backendData.output.image_url,
          image_urls: backendData.output.image_urls || [],
          upscaled_urls: [],
          variations: []
        };
      }

      // 如果任务失败，添加错误信息
      if (backendData.status === 'failed' && backendData.error) {
        statusData.failure_reason = backendData.error.message || backendData.error.raw_message;
      }

      // 更新本地数据库中的任务状态（可选）
      try {
        await prisma.midjourneyImage.updateMany({
          where: {
            taskId: taskId,
            userId: user.id
          },
          data: {
            status: backendData.status || 'pending',
            progress: statusData.progress,
            imageUrl: backendData.output?.image_url || null,
            upscaledUrls: backendData.output?.image_urls ? JSON.stringify(backendData.output.image_urls) : null,
            failureReason: backendData.error?.message || null,
            updatedAt: new Date()
          }
        });
      } catch (dbError) {
        // 不影响主要流程
      }

      return NextResponse.json(statusData);

    } catch (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch status from backend service", details: fetchError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", message: "Please try again later" },
      { status: 500 }
    );
  }
}