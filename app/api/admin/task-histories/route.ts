import { NextRequest, NextResponse } from "next/server";

// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

// 验证管理API Key
function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key');
  const expectedKey = getBackendApiKey();
  return apiKey === expectedKey;
}

/**
 * GET /api/admin/task-histories?accountId={id}&page=1&pageSize=10
 * 
 * 管理员查询指定账户的任务历史记录（分页）
 * 
 * Headers:
 *   X-API-Key: {BACKEND_API_KEY} (管理API密钥)
 * 
 * Query Parameters:
 *   accountId: 账户ID (必需) - 从用户的 backendAccountId 获取
 *   page: 页码，默认1
 *   pageSize: 每页数量，默认10，最大100
 * 
 * Security:
 *   - 需要有效的管理API密钥
 *   - 不允许硬编码账户ID
 *   - accountId必须从查询参数动态获取
 * 
 * Response:
 * {
 *   "code": 200,
 *   "data": {
 *     "page": 1,
 *     "size": 10,
 *     "total": 13,
 *     "data": [
 *       {
 *         "id": 119,
 *         "created_at": "2025-09-10T20:27:30.769487+08:00",
 *         "task_id": "f08384cf-0b44-41f3-b137-56048a27986f",
 *         "account_id": 24,
 *         "action": "upscale",
 *         "usage": 120,
 *         "status": "finished",
 *         "detail": {...}
 *       }
 *     ]
 *   },
 *   "message": "success"
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // 1. 验证管理API Key
    if (!validateApiKey(req)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid API key" },
        { status: 401 }
      );
    }

    // 2. 获取查询参数
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100); // 限制最大100

    // 3. 验证必需参数
    if (!accountId) {
      return NextResponse.json(
        { error: "Missing required parameter", message: "'accountId' is required and cannot be hardcoded" },
        { status: 400 }
      );
    }

    // 4. 安全检查：确保accountId是数字且合理
    const accountIdNum = parseInt(accountId);
    if (isNaN(accountIdNum) || accountIdNum <= 0) {
      return NextResponse.json(
        { error: "Invalid parameter", message: "'accountId' must be a positive integer" },
        { status: 400 }
      );
    }

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

    // 5. 调用后端API - 使用动态的accountId
    const baseUrl = getBaseManagerUrl();
    const backendUrl = `${baseUrl}/api/account/${accountIdNum}/task_histories?page=${page}&page_size=${pageSize}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': getBackendApiKey()
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: `Backend API error: ${response.status}`, 
          details: errorText,
          message: "Failed to fetch task histories from backend"
        },
        { status: response.status }
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