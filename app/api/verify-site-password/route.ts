import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const sitePassword = process.env.SITE_PASSWORD;

    // 强制要求密码验证（生产环境保护）
    if (!sitePassword) {
      return NextResponse.json(
        { error: 'Site password protection is enabled but not configured' },
        { status: 500 }
      );
    }

    // Check if password matches
    if (password !== sitePassword) {
      return NextResponse.json(
        { error: 'Invalid password. Please try again.' },
        { status: 401 }
      );
    }

    // Password is correct, set cookie and return success
    const response = NextResponse.json({ success: true });
    
    // Set cookie that expires in 24 hours
    response.cookies.set('site-access', sitePassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Site password verification error:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}