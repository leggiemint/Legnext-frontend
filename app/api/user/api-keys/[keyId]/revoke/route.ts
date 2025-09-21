import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { getUserWithProfile } from '@/libs/user-helpers';
import { backendApiClient } from '@/libs/backend-api-client';
import { log } from '@/libs/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyId = parseInt(params.keyId, 10);
    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    log.info(`🔍 [API Keys] Revoking API key for user: ${session.user.email}, keyId: ${keyId}`);

    const user = await getUserWithProfile(session.user.id);
    
    if (!user?.profile?.backendAccountId) {
      log.info('❌ [API Keys] No backend account found');
      return NextResponse.json({ 
        error: 'No backend account found'
      }, { status: 404 });
    }

    try {
      // 首先获取所有API keys来检查是否为初始密钥
      const apiKeysResponse = await backendApiClient.getAccountApiKeys(user.profile.backendAccountId);
      
      if (apiKeysResponse.code !== 200) {
        log.error('❌ [API Keys] Failed to fetch API keys for validation:', apiKeysResponse);
        return NextResponse.json({ 
          error: 'Failed to validate API key'
        }, { status: 500 });
      }

      const apiKeys = apiKeysResponse.data || [];
      const sortedKeys = apiKeys.sort((a, b) => a.id - b.id);
      
      // 检查要撤销的key是否为初始密钥（ID最小的）
      const keyToRevoke = apiKeys.find(key => key.id === keyId);
      if (!keyToRevoke) {
        log.error('❌ [API Keys] API key not found:', keyId);
        return NextResponse.json({ 
          error: 'API key not found'
        }, { status: 404 });
      }

      // 检查是否为初始密钥
      if (keyToRevoke.id === sortedKeys[0]?.id) {
        log.warn('🚫 [API Keys] Attempted to revoke initial API key:', {
          keyId,
          keyName: keyToRevoke.name,
          userId: session.user.email
        });
        return NextResponse.json({ 
          error: 'Cannot revoke initial API key'
        }, { status: 403 });
      }

      log.info(`🔍 [API Keys] Revoking API key ${keyId} for backend account: ${user.profile.backendAccountId}`);
      
      const revokeResponse = await backendApiClient.revokeApiKey(user.profile.backendAccountId, keyId);
      
      if (revokeResponse.code !== 200) {
        log.error('❌ [API Keys] Backend API key revoke error:', revokeResponse);
        return NextResponse.json({ 
          error: 'Backend API key revoke error'
        }, { status: 500 });
      }

      log.info(`✅ [API Keys] Revoked API key ${keyId} for account ${user.profile.backendAccountId}`);

      return NextResponse.json({
        message: 'API key revoked successfully',
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