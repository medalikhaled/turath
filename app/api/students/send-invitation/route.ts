import { NextRequest, NextResponse } from 'next/server';
import { getEmailService, generateInvitationData } from '@/lib/email-service';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'معرف الطالب مطلوب', code: 'STUDENT_ID_REQUIRED' },
        { status: 400 }
      );
    }

    // Send invitation via Convex mutation
    const result = await convex.mutation(api.students.sendInvitation, {
      studentId,
    });

    if (!result.success || !result.invitationData) {
      return NextResponse.json(
        { error: 'فشل في إرسال الدعوة', code: 'INVITATION_FAILED' },
        { status: 500 }
      );
    }

    // Send email invitation
    const emailService = getEmailService();
    const emailSent = await emailService.sendStudentInvitation(
      result.invitationData.email,
      result.invitationData.name,
      result.invitationData.tempPassword,
      result.invitationData.loginUrl
    );

    if (!emailSent) {
      return NextResponse.json(
        { 
          error: 'تم إنشاء الحساب ولكن فشل في إرسال البريد الإلكتروني', 
          code: 'EMAIL_SEND_FAILED',
          invitationData: result.invitationData // Return data for manual sharing
        },
        { status: 207 } // 207 Multi-Status (partial success)
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الدعوة بنجاح',
      emailSent: true,
    });

  } catch (error) {
    console.error('Error in send invitation API:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}