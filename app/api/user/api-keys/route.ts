import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { getUserWithProfile } from '@/libs/user-helpers';
import { backendApiClient } from '@/libs/backend-api-client';

import { log } from '@/libs/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info(`🔍 [API Keys] Getting API keys for user: ${session.user.email}`);

    const user = await getUserWithProfile(session.user.id);
    
    if (!user?.profile?.backendAccountId) {
      log.info('❌ [API Keys] No backend account found');
      return NextResponse.json({ 
        data: {
          apiKeys: [],
          error: 'No backend account found'
        }
      }, { status: 404 });
    }

    try {
      log.info(`🔍 [API Keys] Fetching API keys for backend account: ${user.profile.backendAccountId}`);
      
      const apiKeysResponse = await backendApiClient.getAccountApiKeys(user.profile.backendAccountId);
      
      if (apiKeysResponse.code !== 200) {
        log.error('❌ [API Keys] Backend API keys error:', apiKeysResponse);
        return NextResponse.json({ 
          data: {
            apiKeys: [],
            error: 'Backend API keys error'
          }
        }, { status: 500 });
      }

      const apiKeys = apiKeysResponse.data || [];

      log.info(`✅ [API Keys] Retrieved ${apiKeys.length} API keys for account ${user.profile.backendAccountId}`);

      return NextResponse.json({
        data: {
          apiKeys: apiKeys.map(key => ({
            id: key.id,
            name: key.name,
            value: key.value, // 保持为value字段以匹配前端预期
            goApiKey: key.value, // 同时保留goApiKey用于兼容性
            isActive: !key.revoked, // 映射为isActive
            revoked: key.revoked,
            createdAt: key.created_at,
            updatedAt: key.updated_at
          })),
          backendAccountId: user.profile.backendAccountId
        }
      });

    } catch (backendError) {
      log.error('❌ [API Keys] Backend API error:', backendError);
      return NextResponse.json({ 
        data: {
          apiKeys: [],
          error: 'Backend API unavailable'
        }
      }, { status: 503 });
    }

  } catch (error) {
    log.error('❌ [API Keys] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    log.info(`🔍 [API Keys] Creating API key for user: ${session.user.email}, name: ${name}`);

    const user = await getUserWithProfile(session.user.id);
    
    if (!user?.profile?.backendAccountId) {
      log.info('❌ [API Keys] No backend account found');
      return NextResponse.json({ 
        error: 'No backend account found'
      }, { status: 404 });
    }

    try {
      log.info(`🔍 [API Keys] Creating API key for backend account: ${user.profile.backendAccountId}`);
      
      const createResponse = await backendApiClient.createApiKey(user.profile.backendAccountId, name);
      
      if (createResponse.code !== 200) {
        log.error('❌ [API Keys] Backend API key creation error:', createResponse);
        return NextResponse.json({ 
          error: 'Backend API key creation error'
        }, { status: 500 });
      }

      const newApiKey = createResponse.data;

      log.info(`✅ [API Keys] Created API key for account ${user.profile.backendAccountId}: ${newApiKey.id}`);

      return NextResponse.json({
        apiKey: {
          id: newApiKey.id,
          name: newApiKey.name,
          value: newApiKey.value,
          revoked: newApiKey.revoked,
          createdAt: newApiKey.created_at,
          updatedAt: newApiKey.updated_at
        },
        backendAccountId: user.profile.backendAccountId
      });

    } catch (backendError) {
      log.error('❌ [API Keys] Backend API error:', backendError);
      return NextResponse.json({ 
        error: 'Backend API unavailable'
      }, { status: 503 });
    }

  } catch (error) {
    log.error('❌ [API Keys] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}