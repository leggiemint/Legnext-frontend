import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/debug/clear-session - 清除所有NextAuth相关的cookies
export async function GET() {
  try {
    const response = NextResponse.json({
      message: "Session cookies cleared",
      instructions: [
        "1. All NextAuth cookies have been cleared",
        "2. Please close all browser tabs for this site", 
        "3. Clear browser cache for this domain",
        "4. Try logging in again",
        "5. Check if user is created in database"
      ]
    });

    // 清除所有可能的NextAuth cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // 查找和清除NextAuth相关的cookies
    allCookies.forEach(cookie => {
      if (
        cookie.name.includes('next-auth') ||
        cookie.name.includes('__Secure-next-auth') ||
        cookie.name.includes('__Host-next-auth') ||
        cookie.name === 'next-auth.session-token' ||
        cookie.name === '__Secure-next-auth.session-token' ||
        cookie.name === '__Host-next-auth.session-token'
      ) {
        response.cookies.delete(cookie.name);
        console.log(`🗑️ Clearing cookie: ${cookie.name}`);
      }
    });

    // 额外清除可能的cookies
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token', 
      '__Host-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.callback-url',
      'next-auth.pkce.code_verifier',
      '__Secure-next-auth.pkce.code_verifier',
      '__Host-next-auth.pkce.code_verifier'
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });

    console.log("🧹 All NextAuth cookies cleared");
    
    return response;
  } catch (error) {
    console.error("💥 Error clearing session:", error);
    return NextResponse.json({
      error: "Failed to clear session",
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/debug/clear-session - 强制清除session并重定向到登录页
export async function POST() {
  try {
    const response = NextResponse.redirect('/auth/signin');
    
    // 清除所有NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token', 
      '__Host-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.callback-url'
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });

    return response;
  } catch (error) {
    console.error("💥 Error in forced session clear:", error);
    return NextResponse.json({
      error: "Failed to clear session and redirect",
      details: error.message
    }, { status: 500 });
  }
}
