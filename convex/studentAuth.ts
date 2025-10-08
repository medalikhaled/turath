import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Create a new student with hashed password
export const createStudentWithPassword = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(), // This should be already hashed when calling this function
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Check if student already exists
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingStudent) {
      throw new ConvexError("الطالب موجود بالفعل", "STUDENT_EXISTS");
    }

    // Create student with hashed password
    const studentId = await ctx.db.insert("students", {
      email,
      name: args.name,
      password: args.password, // Should be hashed
      role: "student",
      isActive: true,
      enrollmentDate: Date.now(),
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

    await ctx.db.patch(args.studentId, {
      password: args.newPassword,
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
    
    const student = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!student || !student.isActive || student.role !== "student") {
      return null;
    }

    return {
      id: student._id,
      email: student.email,
      name: student.name,
      role: student.role,
      hashedPassword: student.password,
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
      .withIndex("by_role", (q) => q.eq("role", "student"))
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