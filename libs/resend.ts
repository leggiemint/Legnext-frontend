import { Resend } from 'resend';

// Lazy initialize Resend to avoid build-time errors when API key is missing
let resend: Resend | null = null;

const getResendClient = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.group("⚠️ RESEND_API_KEY missing from .env");
      console.error("It's required to send emails.");
      console.error("Add your Resend API key to .env.local as RESEND_API_KEY");
      console.error("You can get an API key from https://resend.com/api-keys");
      console.groupEnd();
      throw new Error('RESEND_API_KEY is required but not configured');
    }
    
    resend = new Resend(apiKey);
  }
  
  return resend;
};

/**
 * Sends an email using Resend API
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
  from,
}: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  from?: string;
}) => {
  try {
    // 使用 resend.dev 作为测试发送域名，或者你已验证的域名
    const fromAddress = from || `Legnext <noreply@resend.dev>`;
    
    console.log('Sending email with params:', {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      replyTo,
    });

    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      replyTo,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Email sending failed: ${JSON.stringify(error)}`);
    }

    console.log('Email sent successfully:', data);
    return { data, error: null as any };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * 发送联系表单邮件
 */
export const sendContactFormEmail = async ({
  firstName,
  lastName,
  email,
  subject,
  message,
}: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const fullName = `${firstName} ${lastName}`;
  
  // 发送给管理员的邮件
  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
        New Contact Form Submission
      </h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Contact Details</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      
      <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #1f2937;">Message</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #4f46e5;">
        <p style="margin: 0; font-size: 14px; color: #0369a1;">
          <strong>Reply directly to this email to respond to ${fullName}</strong>
        </p>
      </div>
    </div>
  `;

  // 发送给用户的自动回复邮件
  const userEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
        <h1 style="color: #4f46e5; margin: 0;">Legnext</h1>
      </div>
      
      <div style="padding: 30px 0;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Thank you for contacting us!</h2>
        
        <p style="color: #4b5563; line-height: 1.6;">
          Hi ${firstName},
        </p>
        
        <p style="color: #4b5563; line-height: 1.6;">
          We've received your message and will get back to you as soon as possible. Here's a copy of what you sent:
        </p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; line-height: 1.6; color: #6b7280;">${message}</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5;">
          <h3 style="color: #0369a1; margin-top: 0;">Expected Response Times</h3>
          <ul style="color: #0369a1; margin: 10px 0;">
            <li>General Inquiries: 24-48 hours</li>
            <li>Technical Support: 12-24 hours</li>
            <li>Billing Issues: 2-6 hours</li>
          </ul>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6;">
          In the meantime, you might find our 
          <a href="https://legnext.ai/docs" style="color: #4f46e5;">documentation</a> 
          helpful, or join our 
          <a href="https://discord.gg/zysPAnvP8f" style="color: #4f46e5;">Discord community</a> 
          for quick help from other creators.
        </p>
        
        <p style="color: #4b5563; line-height: 1.6;">
          Best regards,<br>
          The Legnext Team
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p>
          Legnext - Midjourney API Integration Platform<br>
          <a href="https://legnext.ai" style="color: #4f46e5;">legnext.ai</a>
        </p>
      </div>
    </div>
  `;

  // 在测试模式下，将管理员邮件也发送给用户（因为Resend限制只能发送给已验证的邮箱）
  const adminEmail = process.env.NODE_ENV === 'production' ? 'support@legnext.ai' : email;
  
  console.log(`Sending admin notification to: ${adminEmail} (${process.env.NODE_ENV === 'production' ? 'production' : 'development'} mode)`);
  
  // 并行发送两封邮件
  const results = await Promise.allSettled([
    // 发送给管理员 (在开发模式下发送给用户自己)
    sendEmail({
      to: adminEmail,
      subject: `[${process.env.NODE_ENV === 'production' ? 'CONTACT' : 'TEST-CONTACT'}] New Contact: ${subject}`,
      html: adminEmailHtml,
      replyTo: email,
    }),
    // 发送给用户
    sendEmail({
      to: email,
      subject: 'Thank you for contacting Legnext',
      html: userEmailHtml,
    }),
  ]);

  return results;
};