import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Create a new student with hashed password (legacy function - use students.createStudentWithUser instead)
export const createStudentWithPassword = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(), // This should be already hashed when calling this function
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("المستخدم موجود بالفعل", "USER_EXISTS");
    }

    // Create user account
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: args.password, // Should be hashed
      role: "student",
      isActive: true,
      createdAt: Date.now(),
    });

    // Create student profile
    const studentId = await ctx.db.insert("students", {
      userId,
      email,
      name: args.name,
      isActive: true,
      invitationSent: false,
      enrollmentDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      courses: args.courses || [],
    });

    return {
      success: true,
      studentId,
      message: "تم إنشاء حساب الطالب بنجاح",
    };
  },
});

// Update student password (with hashed password)
export const updateStudentPassword = mutation({
  args: {
    studentId: v.id("students"),
    newPassword: v.string(), // This should be already hashed when calling this function
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    // Update the user's password
    if (student.userId) {
      await ctx.db.patch(student.userId, {
        passwordHash: args.newPassword,
      });
    }

    // Update student record
    await ctx.db.patch(args.studentId, {
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "تم تحديث كلمة المرور بنجاح",
    };
  },
});

// Get student for password verification (used by auth system)
export const getStudentForAuth = query({
  args: { email: v.string() },
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

    // Get student profile
    const student = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();
    
    if (!student || !student.isActive) {
      return null;
    }

    return {
      id: student._id,
      email: student.email,
      name: student.name,
      role: "student",
      hashedPassword: user.passwordHash,
      courses: student.courses,
      enrollmentDate: student.enrollmentDate,
    };
  },
});

// List all students (for admin use)
export const getAllStudents = query({
  handler: async (ctx) => {
    const students = await ctx.db
      .query("students")
      .collect();

    return students.map(student => ({
      id: student._id,
      email: student.email,
      name: student.name,
      isActive: student.isActive,
      enrollmentDate: student.enrollmentDate,
      courses: student.courses,
    }));
  },
});

// Activate/deactivate student
export const toggleStudentStatus = mutation({
  args: {
    studentId: v.id("students"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    await ctx.db.patch(args.studentId, {
      isActive: args.isActive,
    });

    return {
      success: true,
      message: args.isActive ? "تم تفعيل حساب الطالب" : "تم إلغاء تفعيل حساب الطالب",
    };
  },
});

// Delete student (hard delete)
export const deleteStudentPermanently = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    await ctx.db.delete(args.studentId);

    return {
      success: true,
      message: "تم حذف حساب الطالب نهائياً",
    };
  },
});