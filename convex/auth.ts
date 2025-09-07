import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create student from Clerk authentication
export const getOrCreateStudent = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if student already exists
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (existingStudent) {
      return existingStudent._id;
    }
    
    // Create new student
    const studentId = await ctx.db.insert("students", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      enrollmentDate: Date.now(),
      isActive: true,
      courses: [],
    });
    
    return studentId;
  },
});

// Check if user is admin (placeholder for future role-based access)
export const isAdmin = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!student) return false;
    
    // For now, we'll use a simple check - in production this would be role-based
    // This is a placeholder that can be expanded when proper role management is implemented
    return student.email.includes("admin") || student.name.includes("Admin");
  },
});

// Get current user's student record
export const getCurrentStudent = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Update student profile
export const updateStudentProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!student) {
      throw new Error("Student not found");
    }
    
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    
    await ctx.db.patch(student._id, updates);
    return student._id;
  },
});

// Deactivate student account
export const deactivateStudent = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!student) {
      throw new Error("Student not found");
    }
    
    await ctx.db.patch(student._id, { isActive: false });
    return student._id;
  },
});