import { generateRandomPassword } from './password-utils';

// Email service interface for student invitations
interface EmailService {
  sendStudentInvitation(to: string, name: string, tempPassword: string, loginUrl: string): Promise<boolean>;
}

// Mock email service for development
class MockEmailService implements EmailService {
  async sendStudentInvitation(to: string, name: string, tempPassword: string, loginUrl: string): Promise<boolean> {
    console.log('\n=== 📧 Student Invitation Email (Development Mode) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: دعوة للانضمام إلى أكاديمية التراث الحنبلي`);
    console.log('\n--- Email Content ---');
    console.log(`مرحباً ${name},`);
    console.log('\nتم إنشاء حساب لك في أكاديمية التراث الحنبلي.');
    console.log('\nبيانات الدخول:');
    console.log(`البريد الإلكتروني: ${to}`);
    console.log(`كلمة المرور المؤقتة: ${tempPassword}`);
    console.log(`\nرابط تسجيل الدخول: ${loginUrl}`);
    console.log('\nيرجى تغيير كلمة المرور بعد أول تسجيل دخول.');
    console.log('\nمع تحيات فريق أكاديمية التراث الحنبلي');
    console.log('=== End Email ===\n');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
}

// Resend email service for production
class ResendEmailService implements EmailService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendStudentInvitation(to: string, name: string, tempPassword: string, loginUrl: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'أكاديمية التراث الحنبلي <noreply@hanbali-academy.com>',
          to: [to],
          subject: 'دعوة للانضمام إلى أكاديمية التراث الحنبلي',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2c5530; margin: 0; font-size: 24px;">أكاديمية التراث الحنبلي</h1>
                  <p style="color: #666; margin: 5px 0 0 0;">Hanbali Heritage Academy</p>
                </div>
                
                <h2 style="color: #2c5530; margin-bottom: 20px;">مرحباً ${name}</h2>
                
                <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                  تم إنشاء حساب لك في أكاديمية التراث الحنبلي. يمكنك الآن الوصول إلى الدروس والمواد التعليمية.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #2c5530; margin-top: 0;">بيانات الدخول:</h3>
                  <p style="margin: 10px 0;"><strong>البريد الإلكتروني:</strong> ${to}</p>
                  <p style="margin: 10px 0;"><strong>كلمة المرور المؤقتة:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}" style="background-color: #2c5530; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    تسجيل الدخول
                  </a>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">
                    <strong>تنبيه أمني:</strong> يرجى تغيير كلمة المرور بعد أول تسجيل دخول لضمان أمان حسابك.
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                  مع تحيات فريق أكاديمية التراث الحنبلي<br>
                  إذا لم تطلب هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.
                </p>
              </div>
            </div>
          `,
          text: `
مرحباً ${name},

تم إنشاء حساب لك في أكاديمية التراث الحنبلي.

بيانات الدخول:
البريد الإلكتروني: ${to}
كلمة المرور المؤقتة: ${tempPassword}

رابط تسجيل الدخول: ${loginUrl}

يرجى تغيير كلمة المرور بعد أول تسجيل دخول.

مع تحيات فريق أكاديمية التراث الحنبلي
          `,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send student invitation email via Resend:', await response.text());
        return false;
      }

      console.log(`✅ Student invitation email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending student invitation email via Resend:', error);
      return false;
    }
  }
}

// Initialize email service based on environment
export function getEmailService(): EmailService {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey && process.env.NODE_ENV === 'production') {
    return new ResendEmailService(resendApiKey);
  } else {
    // Use mock service in development
    return new MockEmailService();
  }
}

// Helper function to generate invitation data
export function generateInvitationData(email: string, name: string): {
  tempPassword: string;
  loginUrl: string;
} {
  const tempPassword = generateRandomPassword(12);
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
  
  return {
    tempPassword,
    loginUrl,
  };
}