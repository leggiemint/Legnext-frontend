import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import jwt from 'jsonwebtoken';
import config from '@/config';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 检查 GetReditus 是否启用
    if (!config.getreditus?.enabled) {
      return NextResponse.json(
        { error: 'GetReditus referral widget is not enabled' },
        { status: 400 }
      );
    }

    // 验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查必要的配置
    const productId = process.env.GETREDITUS_PRODUCT_ID;
    const productSecret = process.env.GETREDITUS_PRODUCT_SECRET;

    if (!productId || !productSecret) {
      return NextResponse.json(
        { error: 'GetReditus configuration is incomplete - missing Product ID or Secret' },
        { status: 500 }
      );
    }

    // 准备 JWT payload - 根据官方文档格式
    const payload = {
      ProductId: productId,
      UserId: session.user.id, // 使用用户ID作为唯一标识符
      iat: Math.floor(Date.now() / 1000), // 发行时间
    };

    // 生成 JWT 令牌 - 使用 HS512 算法
    const authToken = jwt.sign(payload, productSecret, {
      algorithm: 'HS512',
    });

    return NextResponse.json({
      auth_token: authToken,
      product_id: productId,
    });

  } catch (error) {
    console.error('GetReditus auth token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth token' },
      { status: 500 }
    );
  }
}
