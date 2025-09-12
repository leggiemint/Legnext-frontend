import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { getUserWithProfile } from '@/libs/user-helpers';
import { z } from 'zod';

/**
 * Backend代理路由认证和权限控制工具
 */

export interface AuthenticatedUser {
  id: string;
  initApiKey: string | null;
  backendAccountId: number | null;
}

/**
 * 验证用户身份并返回用户信息
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  try {
    // 1. 检查session
    const session = await getServerSession(authOptions);
    console.log('🔍 [AUTH] Session check:', { hasSession: !!session, userId: session?.user?.id });
    
    if (!session?.user?.id) {
      console.log('❌ [AUTH] No session or user ID found');
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED' 
        },
        { status: 401 }
      );
    }

    // 2. 获取用户完整信息
    const user = await getUserWithProfile(session.user.id);
    console.log('🔍 [AUTH] User profile:', { 
      userId: session.user.id, 
      hasUser: !!user, 
      hasInitApiKey: !!user?.profile?.initApiKey,
      backendAccountId: user?.profile?.backendAccountId 
    });
    
    if (!user) {
      console.log('❌ [AUTH] User not found in database');
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // 3. 检查用户是否有initApiKey（后端API访问密钥）
    if (!user.profile?.initApiKey) {
      console.log('❌ [AUTH] User has no initApiKey');
      return NextResponse.json(
        { 
          error: 'Backend API access not configured',
          code: 'NO_BACKEND_ACCESS' 
        },
        { status: 403 }
      );
    }

    return {
      id: user.id,
      initApiKey: user.profile.initApiKey,
      backendAccountId: user.profile.backendAccountId,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        code: 'AUTH_ERROR' 
      },
      { status: 500 }
    );
  }
}

/**
 * 验证用户是否有权限访问指定的accountId资源
 */
export function verifyAccountAccess(
  user: AuthenticatedUser, 
  requestedAccountId: number | string
): boolean {
  if (!user.backendAccountId) {
    return false;
  }
  
  const accountId = typeof requestedAccountId === 'string' 
    ? parseInt(requestedAccountId, 10) 
    : requestedAccountId;
    
  return user.backendAccountId === accountId;
}

/**
 * 参数验证schemas
 */
export const ParamSchemas = {
  accountId: z.string().regex(/^\d+$/, 'Account ID must be numeric').transform(Number),
  notificationId: z.string().regex(/^\d+$/, 'Notification ID must be numeric').transform(Number),
  jobId: z.string().min(1, 'Job ID is required'),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  pageSize: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  code: z.string().min(1, 'Code is required'),
};

/**
 * 通用验证schemas
 */
export const CommonSchemas = {
  paginationQuery: z.object({
    page: z.string().optional().default('1').transform(val => parseInt(val, 10)),
    page_size: z.string().optional().default('10').transform(val => parseInt(val, 10)),
  }),
  accountParams: z.object({
    id: z.string().regex(/^\d+$/, 'Account ID must be numeric'),
  }),
  notificationParams: z.object({
    id: z.string().regex(/^\d+$/, 'Account ID must be numeric'),
    notificationId: z.string().regex(/^\d+$/, 'Notification ID must be numeric'),
  }),
};

/**
 * 验证路由参数
 */
export function validateParams<T>(
  params: Record<string, any>,
  schema: z.ZodType<T, any, any>
): T | NextResponse {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          code: 'INVALID_PARAMS',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Parameter validation failed',
        code: 'VALIDATION_ERROR' 
      },
      { status: 400 }
    );
  }
}

/**
 * 验证查询参数
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T, any, any>
): T | NextResponse {
  try {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          code: 'INVALID_QUERY',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Query validation failed',
        code: 'VALIDATION_ERROR' 
      },
      { status: 400 }
    );
  }
}

/**
 * 安全的错误响应处理
 * 避免泄露敏感信息
 */
export function createErrorResponse(error: unknown, context = 'Operation failed'): NextResponse {
  console.error(`${context}:`, error);
  
  // 生产环境下不泄露具体错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof Error && error.message.includes('Unauthorized')) {
    return NextResponse.json(
      { 
        error: 'Access denied',
        code: 'ACCESS_DENIED' 
      },
      { status: 403 }
    );
  }
  
  if (error instanceof Error && error.message.includes('not found')) {
    return NextResponse.json(
      { 
        error: 'Resource not found',
        code: 'NOT_FOUND' 
      },
      { status: 404 }
    );
  }
  
  return NextResponse.json(
    { 
      error: context,
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && error instanceof Error && { details: error.message })
    },
    { status: 500 }
  );
}

/**
 * 统一的代理路由中间件
 */
export async function withAuth<T extends Record<string, any>>(
  request: NextRequest,
  params: T | undefined,
  handler: (user: AuthenticatedUser, validatedParams: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // 1. 认证用户
    const authResult = await authenticateUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 2. 如果有params，进行验证
    let validatedParams = params;
    if (params && 'id' in params) {
      // 验证accountId权限
      const accountId = parseInt(params.id as string, 10);
      if (isNaN(accountId)) {
        return NextResponse.json(
          { error: 'Invalid account ID', code: 'INVALID_ACCOUNT_ID' },
          { status: 400 }
        );
      }
      
      if (!verifyAccountAccess(authResult, accountId)) {
        return NextResponse.json(
          { error: 'Access denied to this account', code: 'ACCOUNT_ACCESS_DENIED' },
          { status: 403 }
        );
      }
    }

    // 3. 调用处理函数
    return await handler(authResult, validatedParams as T);
  } catch (error) {
    return createErrorResponse(error, 'Request processing failed');
  }
}