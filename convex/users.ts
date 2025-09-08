import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

// Get current student profile
export const getCurrentStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    const student = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    return student;
  },
});

// Create student profile after user registration
export const createStudentProfile = mutation({
  args: {
    name: v.string(),
    role: v.optional(v.union(v.literal("student"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if student profile already exists
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (existingStudent) {
      throw new Error("Student profile already exists");
    }
    
    const studentId = await ctx.db.insert("students", {
      userId,
      name: args.name,
      enrollmentDate: Date.now(),
      isActive: true,
      courses: [],
      role: args.role || "student",
    });
    
    return studentId;
  },
});

// Check if user is admin
export const isUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;
    
    const student = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    return student?.role === "admin";
  },
});

// Get all students (admin only)
export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const currentStudent = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (currentStudent?.role !== "admin") {
      throw new Error("Admin access required");
    }
    
    return await ctx.db.query("students").collect();
  },
});