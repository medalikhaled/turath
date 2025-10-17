import { NextRequest, NextResponse } from 'next/server';
import { generateInvitationData, sendStudentInvitation } from '@/lib/email-service';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, courses, sendInvitation } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني مطلوبان', code: 'REQUIRED_FIELDS_MISSING' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    // Generate invitation data
    const invitationData = generateInvitationData(email, name);

    // Create student with invitation via Convex
    const result = await convex.mutation(api.students.createStudentWithInvitation, {
      name,
      email: email.toLowerCase().trim(),
      phone,
      courses: courses || [],
      sendInvitation: sendInvitation || false,
    });

    if (!result.studentId) {
      return NextResponse.json(
        { error: 'Failed to create student account', code: 'STUDENT_CREATION_FAILED' },
        { status: 500 }
      );
    }

    // Send email invitation if requested
    let emailSent = false;
    if (sendInvitation && result.invitationData) {
      emailSent = await sendStudentInvitation(
        result.invitationData.email,
        result.invitationData.name,
        result.invitationData.tempPassword,
        result.invitationData.loginUrl
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حساب الطالب بنجاح',
      studentId: result.studentId,
      userId: result.userId,
      emailSent,
      invitationData: sendInvitation ? result.invitationData : undefined,
    });

  } catch (error) {
    console.error('Error in create student with invitation API:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'User with this email already exists', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'خطأ في الخادم', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}