import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactFormEmail(data: ContactFormData) {
  const { firstName, lastName, email, subject, message } = data;
  
  const emailContent = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  try {
    const result = await resend.emails.send({
      from: 'Legnext Contact Form <noreply@legnext.ai>',
      to: ['support@legnext.ai'],
      subject: `Contact Form: ${subject}`,
      html: emailContent,
    });

    return [result];
  } catch (error) {
    console.error('Resend email error:', error);
    throw error;
  }
}
