import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Create a new student with user account
export const createStudentWithUser = mutation({
  args: {
    name: v.string(),
    username: v.string(), // Required username
    email: v.string(),
    password: v.string(), // Already hashed from API route
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const username = args.username.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("User already exists", "USER_EXISTS");
    }

    // Check if username already exists
    const existingUsername = await ctx.db
      .query("students")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existingUsername) {
      throw new ConvexError("Username already exists", "USERNAME_EXISTS");
    }

    // Create user account
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: args.password,
      role: "student",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create student profile
    const studentId = await ctx.db.insert("students", {
      userId,
      username,
      name: args.name,
      courses: args.courses || [],
      enrollmentDate: Date.now(),
      requiresPasswordChange: false,
    });

    return {
      success: true,
      studentId,
      userId,
      username,
    };
  },
});

// Get student by ID
export const getStudent = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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

// Get all students
export const getAllStudents = query({
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

// Get active students
export const getActiveStudents = query({
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    const activeStudents = [];

    for (const student of students) {
      const user = await ctx.db.get(student.userId);
      if (user?.isActive) {
        activeStudents.push(student);
      }
    }

    return activeStudents;
  },
});

// Get students with course details
export const getStudentsWithCourses = query({
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();

    return await Promise.all(
      students.map(async (student) => {
        const user = await ctx.db.get(student.userId);
        const courses = await Promise.all(
          student.courses.map((courseId) => ctx.db.get(courseId))
        );

        return {
          ...student,
          email: user?.email || "",
          isActive: user?.isActive || false,
          invitationSent: false, // Placeholder until invitation system is implemented
          courses: courses.filter((c) => c !== null),
        };
      })
    );
  },
});

// Update student
export const updateStudent = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, updates);

    return { success: true };
  },
});

// Delete student (permanent delete)
export const deleteStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) {
      throw new ConvexError("Student not found", "STUDENT_NOT_FOUND");
    }

    // Delete user account
    await ctx.db.delete(student.userId);
    
    // Delete student record
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Deactivate student (soft delete)
export const deactivateStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) {
      throw new ConvexError("Student not found", "STUDENT_NOT_FOUND");
    }

    // Deactivate user account
    await ctx.db.patch(student.userId, { isActive: false });

    return { success: true };
  },
});

// Reactivate student
export const reactivateStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) {
      throw new ConvexError("Student not found", "STUDENT_NOT_FOUND");
    }

    // Reactivate user account
    await ctx.db.patch(student.userId, { isActive: true });

    return { success: true };
  },
});

// Old deactivate with reason (keeping for compatibility)
export const deactivateStudentWithReason = mutation({
  args: {
    studentId: v.id("students"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("Student not found", "STUDENT_NOT_FOUND");
    }

    await ctx.db.patch(student.userId, { isActive: false });

    return { success: true };
  },
});

// Reset student password
export const resetStudentPassword = mutation({
  args: {
    studentId: v.id("students"),
    newPassword: v.string(), // Already hashed from API route
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new ConvexError("Student not found", "STUDENT_NOT_FOUND");
    }

    await ctx.db.patch(student.userId, {
      passwordHash: args.newPassword,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.studentId, {
      requiresPasswordChange: false,
    });

    return {
      success: true,
      message: "Password reset successfully",
    };
  },
});

// Stub functions for invitation system (to be implemented later)
export const createStudentWithInvitation = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async () => {
    throw new ConvexError("Not implemented yet", "NOT_IMPLEMENTED");
  },
});

export const sendInvitation = mutation({
  args: { studentId: v.id("students") },
  handler: async () => {
    throw new ConvexError("Not implemented yet", "NOT_IMPLEMENTED");
  },
});

export const getStudentInvitationStatus = query({
  args: { studentId: v.id("students") },
  handler: async () => {
    return null;
  },
});

export const bulkCreateStudentsWithInvitations = mutation({
  args: {
    students: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
      })
    ),
    sendInvitations: v.optional(v.boolean()),
  },
  handler: async () => {
    throw new ConvexError("Not implemented yet", "NOT_IMPLEMENTED");
  },
});

export const verifyStudentCredentials = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async () => {
    throw new ConvexError("Not implemented yet - use auth-functions", "NOT_IMPLEMENTED");
  },
});
