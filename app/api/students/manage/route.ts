import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET - Get all students with their details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let students;
    if (includeInactive) {
      students = await convex.query(api.students.getAllStudents);
    } else {
      students = await convex.query(api.students.getActiveStudents);
    }

    // Get detailed information for each student
    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        const invitationStatus = await convex.query(api.students.getStudentInvitationStatus, {
          studentId: student._id,
        });
        return {
          ...student,
          invitationStatus,
        };
      })
    );

    return NextResponse.json({
      success: true,
      students: studentsWithDetails,
      count: studentsWithDetails.length,
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب بيانات الطلاب', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

// POST - Create single student or bulk create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's bulk creation
    if (Array.isArray(body.students)) {
      const result = await convex.mutation(api.students.bulkCreateStudentsWithInvitations, {
        students: body.students,
        sendInvitations: body.sendInvitations || false,
      });

      return NextResponse.json({
        success: result.success,
        message: `تم إنشاء ${result.created} حساب طالب بنجاح`,
        created: result.created,
        errors: result.errors,
        results: result.results,
        errorDetails: result.errorDetails,
      });
    } else {
      // Single student creation
      const { name, email, phone, courses, sendInvitation } = body;

      if (!name || !email) {
        return NextResponse.json(
          { error: 'الاسم والبريد الإلكتروني مطلوبان', code: 'REQUIRED_FIELDS' },
          { status: 400 }
        );
      }

      const result = await convex.mutation(api.students.createStudentWithInvitation, {
        name,
        email: email.toLowerCase().trim(),
        phone,
        courses: courses || [],
        sendInvitation: sendInvitation || false,
      });

      return NextResponse.json({
        success: true,
        message: 'تم إنشاء حساب الطالب بنجاح',
        studentId: result.studentId,
        userId: result.userId,
        invitationData: result.invitationData,
      });
    }

  } catch (error) {
    console.error('Error creating student(s):', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists') || error.message.includes('موجود')) {
        return NextResponse.json(
          { error: 'User with this email already exists', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'خطأ في إنشاء حساب الطالب', code: 'CREATION_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH - Update student information
export async function PATCH(request: NextRequest) {
  try {
    const { studentId, ...updates } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'معرف الطالب مطلوب', code: 'STUDENT_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const result = await convex.mutation(api.students.updateStudent, {
      id: studentId,
      ...updates,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات الطالب بنجاح',
      studentId: result,
    });

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث بيانات الطالب', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate student (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const reason = searchParams.get('reason');

    if (!studentId) {
      return NextResponse.json(
        { error: 'معرف الطالب مطلوب', code: 'STUDENT_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const result = await convex.mutation(api.students.deactivateStudent, {
      studentId: studentId as any, // Type assertion for API route
      reason: reason || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء تفعيل حساب الطالب بنجاح',
    });

  } catch (error) {
    console.error('Error deactivating student:', error);
    return NextResponse.json(
      { error: 'خطأ في إلغاء تفعيل حساب الطالب', code: 'DEACTIVATION_ERROR' },
      { status: 500 }
    );
  }
}