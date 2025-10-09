import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Create a new student with user account (using crypto for password hashing)
export const createStudentWithUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    courses: v.optional(v.array(v.id("courses"))),
    password: v.string(), // Will be hashed
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ConvexError("صيغة البريد الإلكتروني غير صحيحة", "INVALID_EMAIL_FORMAT");
    }

    // Validate name
    if (!args.name.trim() || args.name.trim().length < 2) {
      throw new ConvexError("اسم الطالب يجب أن يكون على الأقل حرفين", "INVALID_NAME");
    }

    // Validate password
    if (!args.password || args.password.length < 6) {
      throw new ConvexError("كلمة المرور يجب أن تكون على الأقل 6 أحرف", "WEAK_PASSWORD");
    }

    // Check if email already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("يوجد مستخدم بهذا البريد الإلكتروني بالفعل", "EMAIL_EXISTS");
    }

    // Check if email already exists in students table (for legacy data)
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingStudent) {
      throw new ConvexError("يوجد طالب بهذا البريد الإلكتروني بالفعل", "STUDENT_EMAIL_EXISTS");
    }

    // Validate courses if provided
    if (args.courses && args.courses.length > 0) {
      for (const courseId of args.courses) {
        const course = await ctx.db.get(courseId);
        if (!course || !course.isActive) {
          throw new ConvexError("أحد الدورات المحددة غير صالح أو غير نشط", "INVALID_COURSE");
        }
      }
    }

    try {
      // Simple hash using crypto (available in Convex)
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = crypto.pbkdf2Sync(args.password, salt, 10000, 64, 'sha512').toString('hex') + ':' + salt;

      // Create user account
      const userId = await ctx.db.insert("users", {
        email,
        passwordHash,
        role: "student",
        isActive: true,
        createdAt: Date.now(),
      });

      // Create student profile
      const studentId = await ctx.db.insert("students", {
        userId,
        name: args.name.trim(),
        email,
        phone: args.phone?.trim(),
        courses: args.courses || [],
        isActive: true,
        invitationSent: false,
        enrollmentDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update course student lists if courses are assigned
      if (args.courses && args.courses.length > 0) {
        for (const courseId of args.courses) {
          const course = await ctx.db.get(courseId);
          if (course) {
            const updatedStudents = [...course.students, studentId];
            await ctx.db.patch(courseId, { students: updatedStudents });
          }
        }
      }

      return { studentId, userId };
    } catch (error) {
      console.error("Error creating student with user:", error);
      throw new ConvexError("فشل في إنشاء حساب الطالب", "STUDENT_CREATION_FAILED");
    }
  },
});

// Create a new student (legacy function for backward compatibility)
export const createStudent = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const studentId = await ctx.db.insert("students", {
      userId: args.userId,
      name: args.name,
      email: user.email,
      courses: args.courses || [],
      isActive: true,
      invitationSent: false,
      enrollmentDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return studentId;
  },
});

// Get student by User ID
export const getStudentByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get student by ID
export const getStudent = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all students (active and inactive)
export const getAllStudents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("students")
      .collect();
  },
});

// Get all active students
export const getActiveStudents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("students")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get students with course details
export const getStudentsWithCourses = query({
  handler: async (ctx) => {
    const students = await ctx.db
      .query("students")
      .collect();

    const studentsWithCourses = await Promise.all(
      students.map(async (student) => {
        const courses = await Promise.all(
          student.courses.map(courseId => ctx.db.get(courseId))
        );
        return {
          ...student,
          courseDetails: courses.filter(Boolean)
        };
      })
    );

    return studentsWithCourses;
  },
});

// Update student information
export const updateStudent = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Add updatedAt timestamp
    if (Object.keys(filteredUpdates).length > 0) {
      (filteredUpdates as any).updatedAt = Date.now();
    }

    await ctx.db.patch(id, filteredUpdates);

    // If email is updated, also update the user record
    if (updates.email) {
      const student = await ctx.db.get(id);
      if (student?.userId) {
        await ctx.db.patch(student.userId, { email: updates.email });
      }
    }

    return id;
  },
});

// Delete student (soft delete by setting isActive to false)
export const deleteStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});

// Add course to student
export const addCourseToStudent = mutation({
  args: {
    studentId: v.id("students"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const updatedCourses = [...student.courses, args.courseId];
    await ctx.db.patch(args.studentId, { courses: updatedCourses });
    return args.studentId;
  },
});

// Remove course from student
export const removeCourseFromStudent = mutation({
  args: {
    studentId: v.id("students"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const updatedCourses = student.courses.filter(id => id !== args.courseId);
    await ctx.db.patch(args.studentId, {
      courses: updatedCourses,
      updatedAt: Date.now()
    });
    return args.studentId;
  },
});

// Generate secure random password for invitations
function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one character from each category
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate invitation token for secure links (if needed in future)
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create student with invitation (Enhanced with better security)
export const createStudentWithInvitation = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    courses: v.optional(v.array(v.id("courses"))),
    sendInvitation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ConvexError("صيغة البريد الإلكتروني غير صحيحة", "INVALID_EMAIL_FORMAT");
    }

    // Validate name
    if (!args.name.trim() || args.name.trim().length < 2) {
      throw new ConvexError("اسم الطالب يجب أن يكون على الأقل حرفين", "INVALID_NAME");
    }

    // Check if email already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("يوجد مستخدم بهذا البريد الإلكتروني بالفعل", "EMAIL_EXISTS");
    }

    // Check if email already exists in students table (for legacy data)
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingStudent) {
      throw new ConvexError("يوجد طالب بهذا البريد الإلكتروني بالفعل", "STUDENT_EMAIL_EXISTS");
    }

    // Validate courses if provided
    if (args.courses && args.courses.length > 0) {
      for (const courseId of args.courses) {
        const course = await ctx.db.get(courseId);
        if (!course || !course.isActive) {
          throw new ConvexError("أحد الدورات المحددة غير صالح أو غير نشط", "INVALID_COURSE");
        }
      }
    }

    try {
      // Generate a secure temporary password
      const tempPassword = generateSecurePassword(12);

      // Hash the password using crypto
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = crypto.pbkdf2Sync(tempPassword, salt, 10000, 64, 'sha512').toString('hex') + ':' + salt;

      // Create user account
      const userId = await ctx.db.insert("users", {
        email,
        passwordHash,
        role: "student",
        isActive: true,
        createdAt: Date.now(),
      });

      // Create student profile
      const studentId = await ctx.db.insert("students", {
        userId,
        name: args.name.trim(),
        email,
        phone: args.phone?.trim(),
        courses: args.courses || [],
        isActive: true,
        invitationSent: args.sendInvitation,
        enrollmentDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update course student lists if courses are assigned
      if (args.courses && args.courses.length > 0) {
        for (const courseId of args.courses) {
          const course = await ctx.db.get(courseId);
          if (course) {
            const updatedStudents = [...course.students, studentId];
            await ctx.db.patch(courseId, { students: updatedStudents });
          }
        }
      }

      // Return credentials for invitation email
      return {
        studentId,
        userId,
        tempPassword: args.sendInvitation ? tempPassword : undefined,
        invitationData: args.sendInvitation ? {
          email,
          name: args.name.trim(),
          tempPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
        } : undefined
      };
    } catch (error) {
      console.error("Error creating student:", error);
      throw new ConvexError("فشل في إنشاء حساب الطالب", "STUDENT_CREATION_FAILED");
    }
  },
});

// Send invitation to student (Enhanced with better security)
export const sendInvitation = mutation({
  args: {
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    if (!student.isActive) {
      throw new ConvexError("حساب الطالب غير نشط", "STUDENT_INACTIVE");
    }

    try {
      // Generate new secure temporary password
      const tempPassword = generateSecurePassword(12);

      // Hash the password using crypto
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = crypto.pbkdf2Sync(tempPassword, salt, 10000, 64, 'sha512').toString('hex') + ':' + salt;

      // Update user password if user account exists
      if (student.userId) {
        const user = await ctx.db.get(student.userId);
        if (!user) {
          throw new ConvexError("حساب المستخدم غير موجود", "USER_NOT_FOUND");
        }
        await ctx.db.patch(student.userId, { passwordHash });
      } else {
        // If no user account exists, create one (for legacy students)
        const userId = await ctx.db.insert("users", {
          email: student.email,
          passwordHash,
          role: "student",
          isActive: true,
          createdAt: Date.now(),
        });

        // Link the user account to the student
        await ctx.db.patch(args.studentId, { userId });
      }

      // Mark invitation as sent and update timestamp
      await ctx.db.patch(args.studentId, {
        invitationSent: true,
        updatedAt: Date.now()
      });

      return {
        success: true,
        message: "تم إرسال الدعوة بنجاح",
        invitationData: {
          email: student.email,
          name: student.name,
          tempPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
        }
      };
    } catch (error) {
      console.error("Error sending invitation:", error);
      throw new ConvexError("فشل في إرسال الدعوة", "INVITATION_SEND_FAILED");
    }
  },
});

// Reset student password
export const resetStudentPassword = mutation({
  args: {
    studentId: v.id("students"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    // Hash the new password using crypto
    const crypto = await import('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(args.newPassword, salt, 10000, 64, 'sha512').toString('hex') + ':' + salt;

    // Update user password
    if (student.userId) {
      await ctx.db.patch(student.userId, { passwordHash });
    }

    // Update student record
    await ctx.db.patch(args.studentId, {
      updatedAt: Date.now()
    });

    return { success: true, message: "Password reset successfully" };
  },
});

// Verify student credentials (for login) - Enhanced with security
export const verifyStudentCredentials = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || user.role !== "student" || !user.isActive) {
      return null;
    }

    // Verify password using crypto
    const crypto = await import('crypto');
    const [hash, salt] = user.passwordHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(args.password, salt, 10000, 64, 'sha512').toString('hex');

    if (hash !== verifyHash) {
      return null;
    }

    // Get student profile
    const student = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();

    if (!student || !student.isActive) {
      return null;
    }

    // Update last login
    await ctx.db.patch(student._id, {
      lastLogin: Date.now(),
      updatedAt: Date.now()
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        courses: student.courses,
        enrollmentDate: student.enrollmentDate,
        lastLogin: Date.now(),
      }
    };
  },
});

// Bulk create students with invitations
export const bulkCreateStudentsWithInvitations = mutation({
  args: {
    students: v.array(v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      courses: v.optional(v.array(v.id("courses"))),
    })),
    sendInvitations: v.boolean(),
  },
  handler: async (ctx, args) => {
    const results = [];
    const errors = [];

    for (const studentData of args.students) {
      try {
        const email = studentData.email.toLowerCase().trim();

        // Check if email already exists
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .first();

        if (existingUser) {
          errors.push({
            email: studentData.email,
            error: "يوجد مستخدم بهذا البريد الإلكتروني بالفعل",
          });
          continue;
        }

        // Generate secure password
        const tempPassword = generateSecurePassword(12);

        // Hash the password using crypto
        const crypto = await import('crypto');
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.pbkdf2Sync(tempPassword, salt, 10000, 64, 'sha512').toString('hex') + ':' + salt;

        // Create user account
        const userId = await ctx.db.insert("users", {
          email,
          passwordHash,
          role: "student",
          isActive: true,
          createdAt: Date.now(),
        });

        // Create student profile
        const studentId = await ctx.db.insert("students", {
          userId,
          name: studentData.name.trim(),
          email,
          phone: studentData.phone?.trim(),
          courses: studentData.courses || [],
          isActive: true,
          invitationSent: args.sendInvitations,
          enrollmentDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        results.push({
          studentId,
          userId,
          invitationData: args.sendInvitations ? {
            email,
            name: studentData.name.trim(),
            tempPassword,
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
          } : undefined
        });
      } catch (error) {
        errors.push({
          email: studentData.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: results.length > 0,
      created: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    };
  },
});

// Get student invitation status
export const getStudentInvitationStatus = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const user = student.userId ? await ctx.db.get(student.userId) : null;

    return {
      studentId: student._id,
      name: student.name,
      email: student.email,
      isActive: student.isActive,
      invitationSent: student.invitationSent || false,
      hasUserAccount: !!user,
      lastLogin: student.lastLogin,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  },
});

// Deactivate student account (soft delete)
export const deactivateStudent = mutation({
  args: {
    studentId: v.id("students"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    // Deactivate student
    await ctx.db.patch(args.studentId, {
      isActive: false,
      updatedAt: Date.now()
    });

    // Deactivate associated user account
    if (student.userId) {
      await ctx.db.patch(student.userId, { isActive: false });
    }

    // Remove student from all courses
    for (const courseId of student.courses) {
      const course = await ctx.db.get(courseId);
      if (course) {
        const updatedStudents = course.students.filter(id => id !== args.studentId);
        await ctx.db.patch(courseId, { students: updatedStudents });
      }
    }

    return {
      success: true,
      message: "تم إلغاء تفعيل حساب الطالب بنجاح"
    };
  },
});

// Reactivate student account
export const reactivateStudent = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    // Reactivate student
    await ctx.db.patch(args.studentId, {
      isActive: true,
      updatedAt: Date.now()
    });

    // Reactivate associated user account
    if (student.userId) {
      await ctx.db.patch(student.userId, { isActive: true });
    }

    // Re-add student to their courses
    for (const courseId of student.courses) {
      const course = await ctx.db.get(courseId);
      if (course && !course.students.includes(args.studentId)) {
        const updatedStudents = [...course.students, args.studentId];
        await ctx.db.patch(courseId, { students: updatedStudents });
      }
    }

    return {
      success: true,
      message: "تم إعادة تفعيل حساب الطالب بنجاح"
    };
  },
});

