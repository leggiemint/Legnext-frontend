// 对外API接口 - 查询任务状态
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, extractApiKeyFromRequest } from "@/libs/api-auth";
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

    // 查找任务记录（只能查询自己的任务）
    const task = await prisma.midjourneyImage.findFirst({
      where: {
        id: taskId,
        userId: user.id, // 确保只能查询自己的任务
      },
      select: {
        id: true,
        status: true,
        progress: true,
        prompt: true,
        model: true,
        mode: true,
        aspectRatio: true,
        imageUrl: true,
        upscaledUrls: true,
        variationUrls: true,
        storedImages: true,
        failureReason: true,
        apiCallsUsed: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found", message: "Task does not exist or you don't have permission to access it" },
        { status: 404 }
      );
    }

    // 构建响应
    const response: any = {
      success: true,
      task_id: task.id,
      status: task.status,
      progress: task.progress,
      prompt: task.prompt,
      model: task.model,
      mode: task.mode,
      aspect_ratio: task.aspectRatio,
      api_calls_used: task.apiCallsUsed,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    };

    // 如果任务完成，添加结果信息
    if (task.status === 'completed' && (task.imageUrl || task.storedImages)) {
      response.result = {
        image_url: task.imageUrl,
        upscaled_urls: task.upscaledUrls ? JSON.parse(task.upscaledUrls as string) : [],
        variations: task.variationUrls ? JSON.parse(task.variationUrls as string) : [],
        stored_images: task.storedImages ? JSON.parse(task.storedImages as string) : null,
      };
    }

    // 如果任务失败，添加失败原因
    if (task.status === 'failed' && task.failureReason) {
      response.failure_reason = task.failureReason;
    }

    console.log(`📊 Task status queried by API key user: ${user.email}, taskId: ${taskId}, status: ${task.status}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error("💥 Error in API v1 status:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Please try again later" },
      { status: 500 }
    );
  }
}