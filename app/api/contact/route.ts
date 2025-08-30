import { NextRequest, NextResponse } from "next/server";
import { sendContactFormEmail } from "@/libs/resend";

export async function POST(req: NextRequest) {
  try {
    // 检查是否配置了 RESEND_API_KEY
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { 
          error: "Email service is not configured. Please contact support directly.",
          support: "support@pngtubermaker.com"
        },
        { status: 500 }
      );
    }
    // 添加原始请求体调试
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);
    console.log('Raw body length:', rawBody.length);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    console.log('Parsed body:', body);
    console.log('Body keys:', Object.keys(body));

    const { firstName, lastName, email, subject, message } = body;

    console.log('Extracted fields:', { firstName, lastName, email, subject, message });
    console.log('Field types:', { 
      firstName: typeof firstName, 
      lastName: typeof lastName, 
      email: typeof email, 
      subject: typeof subject, 
      message: typeof message 
    });

    // 验证必填字段
    console.log('Checking required fields...');
    if (!firstName || !lastName || !email || !subject || !message) {
      console.log('Missing fields detected:', { 
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

    console.log('All required fields present');

    // 验证邮箱格式
    console.log('Checking email format...');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    console.log('Email format valid');

    // 验证消息长度
    console.log('Checking message length:', message.length);
    if (message.length < 5) {
      console.log('Message too short:', message.length);
      return NextResponse.json(
        { error: "Message must be at least 5 characters long" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      console.log('Message too long:', message.length);
      return NextResponse.json(
        { error: "Message must be less than 2000 characters" },
        { status: 400 }
      );
    }

    console.log('All validations passed, attempting to send email...');

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
      const failedEmails = results.filter(result => result.status === 'rejected');
      
      if (failedEmails.length > 0) {
        console.error('Some emails failed to send:', failedEmails);
        // 即使有些邮件失败，我们仍然可以告诉用户成功（至少一封邮件发送了）
      }

      return NextResponse.json({
        message: "Thank you for your message! We'll get back to you soon.",
        success: true,
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      return NextResponse.json(
        { 
          error: "There was an issue sending your message. Please try again or contact us directly at support@pngtubermaker.com",
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Contact form error:', error);
    
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again later.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}