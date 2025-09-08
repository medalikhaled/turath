import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new student
export const createStudent = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const studentId = await ctx.db.insert("students", {
      userId: args.userId,
      name: args.name,
      enrollmentDate: Date.now(),
      isActive: true,
      courses: args.courses || [],
      role: "student",
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

// Get all active students
export const getActiveStudents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("students")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Update student information
export const updateStudent = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    courses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(id, filteredUpdates);
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
    await ctx.db.patch(args.studentId, { courses: updatedCourses });
    return args.studentId;
  },
});