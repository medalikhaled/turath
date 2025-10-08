import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Session management functions for JWT-based authentication

// Create or update student session
export const createStudentSession = mutation({
  args: {
    studentId: v.id("students"),
    sessionData: v.object({
      userId: v.string(),
      email: v.string(),
      role: v.literal("student"),
      sessionType: v.literal("student"),
      expiresAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Verify student exists and is active
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    if (!student.isActive) {
      throw new ConvexError("حساب الطالب غير نشط", "STUDENT_INACTIVE");
    }

    // Store session data for server-side validation if needed
    // For JWT-based auth, we primarily rely on the token itself
    return {
      success: true,
      student: {
        id: student._id,
        email: student.email,
        name: student.name,
        role: student.role,
        courses: student.courses,
      },
    };
  },
});

// Validate student credentials
export const validateStudentCredentials = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Find student by email
    const student = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!student) {
      throw new ConvexError("البريد الإلكتروني أو كلمة المرور غير صحيحة", "INVALID_CREDENTIALS");
    }

    if (!student.isActive) {
      throw new ConvexError("حساب الطالب غير نشط", "STUDENT_INACTIVE");
    }

    // Return student data for password verification on client side
    // Password verification will be done in the API route using bcrypt
    return {
      success: true,
      student: {
        id: student._id,
        email: student.email,
        name: student.name,
        role: student.role,
        hashedPassword: student.password,
        courses: student.courses,
      },
    };
  },
});

// Get student by ID for session validation
export const getStudentById = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    
    if (!student) {
      return null;
    }

    if (!student.isActive) {
      return null;
    }

    return {
      id: student._id,
      email: student.email,
      name: student.name,
      role: student.role,
      courses: student.courses,
      enrollmentDate: student.enrollmentDate,
    };
  },
});

// Get student by email for session validation
export const getStudentByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    const student = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!student || !student.isActive) {
      return null;
    }

    return {
      id: student._id,
      email: student.email,
      name: student.name,
      role: student.role,
      courses: student.courses,
      enrollmentDate: student.enrollmentDate,
    };
  },
});

// Update student last login time
export const updateStudentLastLogin = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("الطالب غير موجود", "STUDENT_NOT_FOUND");
    }

    // We could add a lastLoginAt field to the schema if needed
    // For now, we'll just return success
    return { success: true };
  },
});

// Check if user has admin role (for admin authentication)
export const validateAdminRole = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check if user exists in students table with admin role
    const adminUser = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    return {
      isAdmin: !!adminUser,
      user: adminUser ? {
        id: adminUser._id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      } : null,
    };
  },
});

// Create admin user if not exists (for initial setup)
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingAdmin) {
      throw new ConvexError("المدير موجود بالفعل", "ADMIN_EXISTS");
    }

    // Create admin user
    const adminId = await ctx.db.insert("students", {
      email,
      name: args.name,
      password: args.password, // Should be hashed before calling this function
      role: "admin",
      isActive: true,
      enrollmentDate: Date.now(),
      courses: [],
    });

    return {
      success: true,
      adminId,
      message: "تم إنشاء حساب المدير بنجاح",
    };
  },
});

// Get admin user by email (for admin sessions)
export const getAdminByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    const adminUser = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!adminUser || !adminUser.isActive) {
      return null;
    }

    return {
      id: adminUser._id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    };
  },
});

// Logout function (for client-side cleanup)
export const logout = mutation({
  args: {
    userId: v.string(),
    sessionType: v.union(v.literal("student"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    // For JWT-based auth, logout is primarily handled client-side
    // We could implement server-side session blacklisting if needed
    
    return {
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    };
  },
});