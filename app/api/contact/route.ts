import { NextRequest, NextResponse } from "next/server";
import { sendContactFormEmail } from "@/libs/resend";

import { log } from '@/libs/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 检查是否配置了 RESEND_API_KEY
    if (!process.env.RESEND_API_KEY) {
      log.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { 
          error: "Email service is not configured. Please contact support directly.",
          support: "support@legnext.ai"
        },
        { status: 500 }
      );
    }
    // 添加原始请求体调试
    const rawBody = await req.text();
    log.info('Raw request body:', rawBody);
    log.info('Raw body length:', rawBody.length);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      log.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    log.info('Parsed body:', body);
    log.info('Body keys:', Object.keys(body));

    const { firstName, lastName, email, subject, message } = body;

    log.info('Extracted fields:', { firstName, lastName, email, subject, message });
    log.info('Field types:', { 
      firstName: typeof firstName, 
      lastName: typeof lastName, 
      email: typeof email, 
      subject: typeof subject, 
      message: typeof message 
    });

    // 验证必填字段
    log.info('Checking required fields...');
    if (!firstName || !lastName || !email || !subject || !message) {
      log.info('Missing fields detected:', { 
        firstName: !firstName, 
        lastName: !lastName, 
        email: !email, 
        subject: !subject, 
        message: !message 
      });
      return NextResponse.json(
        { 
          error: "All fields are required. Please make sure to select a subject from the dropdown.",
          missingFields: Object.entries({ firstName: !firstName, lastName: !lastName, email: !email, subject: !subject, message: !message })
            .filter(([, missing]) => missing)
            .map(([field]) => field)
        },
        { status: 400 }
      );
    }

    log.info('All required fields present');

    // 验证邮箱格式
    log.info('Checking email format...');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      log.info('Invalid email format:', email);
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    log.info('Email format valid');

    // 验证消息长度
    log.info('Checking message length:', message.length);
    if (message.length < 5) {
      log.info('Message too short:', message.length);
      return NextResponse.json(
        { error: "Message must be at least 5 characters long" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      log.info('Message too long:', message.length);
      return NextResponse.json(
        { error: "Message must be less than 2000 characters" },
        { status: 400 }
      );
    }

    log.info('All validations passed, attempting to send email...');

    // 发送邮件
    try {
      const results = await sendContactFormEmail({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      });

      // 检查邮件发送结果
      if (results && results.length > 0 && results[0].error) {
        log.error('Email sending failed:', results[0].error);
        throw new Error(`Email sending failed: ${results[0].error.message}`);
      }
      
      log.info('Email sent successfully:', results);

      return NextResponse.json({
        message: "Thank you for your message! We'll get back to you soon.",
        success: true,
      });

    } catch (emailError) {
      log.error('Email sending error:', emailError);
      
      return NextResponse.json(
        { 
          error: "There was an issue sending your message. Please try again or contact us directly at support@legnext.ai",
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    log.error('Contact form error:', error);
    
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again later.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}