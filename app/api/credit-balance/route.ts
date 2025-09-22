import { NextResponse } from 'next/server';
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

    log.info(`🔍 [Credit Balance] Getting balance for user: ${session.user.email}`);

    const user = await getUserWithProfile(session.user.id);
    
    if (!user?.profile?.backendAccountId) {
      log.info('❌ [Credit Balance] No backend account found');
      return NextResponse.json({ 
        balance: 0,
        credits: 0,
        points: 0,
        error: 'No backend account found'
      }, { status: 404 });
    }

    try {
      log.info(`🔍 [Credit Balance] Fetching wallet and credit packs for backend account: ${user.profile.backendAccountId}`);
      
      // 添加重试机制来处理503错误
      const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const result = await fn();
            if (result.code !== 503) {
              return result;
            }
            if (i < maxRetries - 1) {
              log.warn(`⚠️ [Credit Balance] Retry ${i + 1}/${maxRetries} after 503 error, waiting ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // 指数退避
            }
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            log.warn(`⚠️ [Credit Balance] Retry ${i + 1}/${maxRetries} after error:`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
        throw new Error('Max retries exceeded');
      };
      
      // 并行获取wallet和credit packs信息，带重试机制
      const [walletResponse, creditPacksResponse] = await Promise.all([
        retryWithBackoff(() => backendApiClient.getAccountWallet(user.profile.backendAccountId)),
        retryWithBackoff(() => backendApiClient.getCreditPacks(user.profile.backendAccountId)).catch(() => ({ 
          code: 200, 
          data: { 
            credit_packs: [] as any[],
            available_credits: 0,
            frozen_credits: 0,
            used_credits: 0,
            total_credits: 0,
            expired_credits: 0,
            inactive_credits: 0,
            credit_packs_count: 0
          } 
        }))
      ]);
      
      if (walletResponse.code !== 200) {
        log.error('❌ [Credit Balance] Backend wallet error:', walletResponse);
        
        // 如果是503错误，返回503状态码
        if (walletResponse.code === 503) {
          return NextResponse.json({ 
            balance: 0,
            credits: 0,
            points: 0,
            error: 'Backend service temporarily unavailable'
          }, { status: 503 });
        }
        
        return NextResponse.json({ 
          balance: 0,
          credits: 0,
          points: 0,
          error: 'Backend wallet error'
        }, { status: 500 });
      }

      const wallet = walletResponse.data;
      const creditPacks = creditPacksResponse.code === 200 ? creditPacksResponse.data : {
        credit_packs: [],
        available_credits: 0,
        frozen_credits: 0,
        used_credits: 0,
        total_credits: 0,
        expired_credits: 0,
        inactive_credits: 0,
        credit_packs_count: 0
      };
      
      // 计算credits（从credit packs获取）
      // 从CreditPackInfo获取汇总信息
      const remainingCredits = creditPacks.available_credits || 0;
      const frozenCredits = creditPacks.frozen_credits || 0;
      const usedCredits = creditPacks.used_credits || 0;
      
      // 也可以从各个credit pack计算（作为验证）
      // const calculatedCredits = creditPacks.credit_packs?.reduce((total: number, pack: any) => {
      //   if (pack.active) {
      //     return total + (pack.capacity - pack.used - pack.frozen);
      //   }
      //   return total;
      // }, 0) || 0;
      
      // 计算points（从wallet获取）
      const remainingPoints = wallet.point_remain || 0;
      const frozenPoints = wallet.point_frozen || 0;
      const usedPoints = wallet.point_used || 0;
      
      // 计算总余额和可用余额 (1$ = 1000 credits/points)
      const totalBalance = (remainingCredits + remainingPoints) / 1000;
      const availableBalance = (remainingCredits + remainingPoints - frozenCredits - frozenPoints) / 1000;


      return NextResponse.json({
        balance: totalBalance,
        availableBalance,
        credits: remainingCredits,
        points: remainingPoints,
        frozenCredits,
        frozenPoints,
        usedCredits,
        usedPoints,
        creditPacks: creditPacks.credit_packs || [],
        backendAccountId: user.profile.backendAccountId
      });

    } catch (backendError) {
      log.error('❌ [Credit Balance] Backend API error:', backendError);
      return NextResponse.json({ 
        balance: 0,
        credits: 0,
        points: 0,
        error: 'Backend API unavailable'
      }, { status: 503 });
    }

  } catch (error) {
    log.error('❌ [Credit Balance] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}