import { NextRequest, NextResponse } from 'next/server';
import { backendApiClient } from '@/libs/backend-api-client';
import { withAuth, validateParams, validateQuery, CommonSchemas, createErrorResponse } from '@/libs/backend-proxy-auth';


export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, params, async (user, validatedParams) => {
    try {
      // 验证路由参数
      const paramResult = validateParams(validatedParams, CommonSchemas.accountParams);
      if (paramResult instanceof NextResponse) return paramResult;

      // 验证查询参数
      const { searchParams } = new URL(request.url);
      const queryResult = validateQuery(searchParams, CommonSchemas.paginationQuery);
      if (queryResult instanceof NextResponse) return queryResult;

      const accountId = parseInt(paramResult.id, 10);
      const { page, page_size: pageSize } = queryResult;

      // 调用后端API
      const response = await backendApiClient.getTaskHistories(accountId, page, pageSize);
      return NextResponse.json(response);
    } catch (error) {
      return createErrorResponse(error, 'Failed to fetch task histories');
    }
  });
}
