import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";

export const dynamic = 'force-dynamic';

// 获取后端管理API密钥 - 仅服务端可用
function getBackendApiKey(): string {
  const apiKey = process.env.BACKEND_API_KEY;
  if (!apiKey) {
    throw new Error('BACKEND_API_KEY environment variable is not configured');
  }
  return apiKey;
}

// 获取后端管理系统URL
function getBaseManagerUrl(): string {
  const url = process.env.BASE_MANAGER_URL || process.env.NEXT_PUBLIC_BASE_MANAGER_URL;
  if (!url) {
    throw new Error('BASE_MANAGER_URL environment variable is not configured');
  }
  return url;
}

/**
 * GET /api/user/task-histories?page=1&pageSize=10
 * 
 * 查询当前用户的任务历史记录（分页）
 * 使用session认证，自动从用户的backend账户获取任务历史
 * 
 * Query Parameters:
 *   page: 页码，默认1
 *   pageSize: 每页数量，默认10，最大100
 */
export async function GET(req: NextRequest) {
  try {
    // 1. 验证用户session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Login required" }, { status: 401 });
    }

    // 2. 获取用户信息
    const user = await getUserWithProfile(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // 3. 检查是否有backend账户ID
    const backendAccountId = user.profile.preferences?.backendAccountId;
    if (!backendAccountId) {
      return NextResponse.json({
        error: "Backend account not configured", 
        message: "Please set up your backend integration first.",
        data: {
          page: 1,
          size: 10,
          total: 0,
          data: []
        }
      }, { status: 404 });
    }

    // 4. 获取查询参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100);

    if (page < 1) {
      return NextResponse.json(
        { error: "Invalid parameter", message: "'page' must be >= 1" },
        { status: 400 }
      );
    }

    if (pageSize < 1) {
      return NextResponse.json(
        { error: "Invalid parameter", message: "'pageSize' must be >= 1" },
        { status: 400 }
      );
    }

    // 5. 调用后端API
    const baseUrl = getBaseManagerUrl();
    const backendUrl = `${baseUrl}/api/account/${backendAccountId}/task_histories?page=${page}&page_size=${pageSize}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': getBackendApiKey()
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // 如果是404，返回空结果而不是错误
      if (response.status === 404) {
        return NextResponse.json({
          code: 200,
          data: {
            page: page,
            size: pageSize,
            total: 0,
            data: []
          },
          message: "No task histories found"
        });
      }
      
      return NextResponse.json(
        { 
          error: `Backend API error: ${response.status}`, 
          details: errorText,
          message: "Failed to fetch task histories from backend"
        },
        { status: response.status >= 500 ? 500 : response.status }
      );
    }

    // 6. 返回后端响应
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error.message || "Failed to process request"
      },
      { status: 500 }
    );
  }
}