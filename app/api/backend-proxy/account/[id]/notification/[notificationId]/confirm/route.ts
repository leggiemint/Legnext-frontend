import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { withAuth, validateParams, CommonSchemas, createErrorResponse } from '@/libs/backend-proxy-auth';


// 告诉Next.js这个API路由是动态的，不要在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; notificationId: string } }
) {
  return withAuth(request, params, async (user, validatedParams) => {
    try {
      // 验证路由参数
      const paramResult = validateParams(validatedParams, CommonSchemas.notificationParams);
      if (paramResult instanceof NextResponse) return paramResult;

      const accountId = parseInt(paramResult.id, 10);
      const notificationId = parseInt(paramResult.notificationId, 10);

      // 调用后端API
      const response = await backendApiClient.confirmNotification(accountId, notificationId);
      return NextResponse.json(response);
    } catch (error) {
      return createErrorResponse(error, 'Failed to confirm notification');
    }
  });
}
