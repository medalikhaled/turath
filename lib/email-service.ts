/**
 * Email Service - Functional approach
 * 
 * Sends student invitations and admin OTP emails using Resend API.
 * Logs email content in development for easy testing.
 */

// ============================================================================
// Configuration
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const IS_DEV = process.env.NODE_ENV !== 'production';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a cryptographically secure random password
 */
function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    const randomBytes = new Uint8Array(1);
    crypto.getRandomValues(randomBytes);
    password += allChars[randomBytes[0] % allChars.length];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Log email content in development for testing
 */
function logEmailInDev(type: 'student' | 'admin', data: any): void {
  if (!IS_DEV) return;
  
  if (type === 'student') {
    console.log('\n' + '='.repeat(60));
    console.log('📧 STUDENT INVITATION EMAIL (Sent via Resend)');
    console.log('='.repeat(60));
    console.log(`To: ${data.to}`);
    console.log(`Name: ${data.name}`);
    console.log(`Temp Password: ${data.tempPassword}`);
    console.log(`Login URL: ${data.loginUrl}`);
    console.log('='.repeat(60) + '\n');
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('📧 ADMIN OTP EMAIL (Sent via Resend)');
    console.log('='.repeat(60));
    console.log(`To: ${data.to}`);
    console.log(`OTP: ${data.otp}`);
    console.log(`Expires: ${new Date(data.expiresAt).toLocaleString()}`);
    console.log(`Valid for: ${Math.round((data.expiresAt - Date.now()) / 60000)} minutes`);
    console.log('='.repeat(60) + '\n');
  }
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send student invitation email via Resend
 */
export async function sendStudentInvitation(
  to: string,
  name: string,
  tempPassword: string,
  loginUrl: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured - cannot send emails');
    return false;
  }

  logEmailInDev('student', { to, name, tempPassword, loginUrl });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
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
      const errorText = await response.text();
      console.error('❌ Failed to send student invitation email:', errorText);
      return false;
    }

    console.log(`✅ Student invitation email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending student invitation email:', error);
    return false;
  }
}

/**
 * Send admin OTP email via Resend
 */
export async function sendAdminOTP(
  to: string,
  otp: string,
  expiresAt: number
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured - cannot send emails');
    return false;
  }

  logEmailInDev('admin', { to, otp, expiresAt });

  try {
    const expiryMinutes = Math.round((expiresAt - Date.now()) / 60000);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hanbali Heritage Academy <admin@hanbali-academy.com>',
        to: [to],
        subject: 'Admin Login OTP - Hanbali Heritage Academy',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e40af; margin: 0; font-size: 24px;">🛡️ Admin Login</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Hanbali Heritage Academy</p>
              </div>
              
              <h2 style="color: #1e40af; margin-bottom: 20px;">Admin OTP Code</h2>
              
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                You requested an OTP code to access the admin dashboard. Use the code below to complete your login:
              </p>
              
              <div style="background-color: #f1f5f9; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px solid #e2e8f0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">Your OTP Code:</h3>
                <div style="font-size: 32px; font-weight: bold; color: #1e40af; font-family: monospace; letter-spacing: 4px; margin: 10px 0;">
                  ${otp}
                </div>
                <p style="color: #64748b; margin: 15px 0 0 0; font-size: 14px;">
                  ⏰ Expires in ${expiryMinutes} minutes
                </p>
              </div>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 25px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>🔒 Security Notice:</strong> This code is for admin access only. Never share this code with anyone. If you didn't request this code, please contact the system administrator immediately.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                Best regards,<br>
                Hanbali Heritage Academy Team<br>
                <em>If you didn't request this code, please ignore this email.</em>
              </p>
            </div>
          </div>
        `,
        text: `
Admin Login OTP - Hanbali Heritage Academy

You requested an OTP code to access the admin dashboard.

Your OTP Code: ${otp}
Expires in: ${expiryMinutes} minutes

Security Notice: This code is for admin access only. Never share this code with anyone.

If you didn't request this code, please ignore this email.

Best regards,
Hanbali Heritage Academy Team
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to send admin OTP email:', errorText);
      return false;
    }

    console.log(`✅ Admin OTP email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending admin OTP email:', error);
    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate invitation data for a new student
 */
export function generateInvitationData(email: string, name: string): {
  tempPassword: string;
  loginUrl: string;
} {
  const tempPassword = generateRandomPassword(12);
  const loginUrl = `${APP_URL}/login`;
  
  return {
    tempPassword,
    loginUrl,
  };
}
