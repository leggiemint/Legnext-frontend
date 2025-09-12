import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { withAuth, validateParams, CommonSchemas, createErrorResponse } from '@/libs/backend-proxy-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, params, async (user, validatedParams) => {
    try {
      // 验证路由参数
      const paramResult = validateParams(validatedParams, CommonSchemas.accountParams);
      if (paramResult instanceof NextResponse) return paramResult;

      const accountId = parseInt(paramResult.id, 10);

      // 调用后端API
      const response = await backendApiClient.getCreditPacks(accountId);
      return NextResponse.json(response);
    } catch (error) {
      return createErrorResponse(error, 'Failed to fetch credit packs');
    }
  });
}
