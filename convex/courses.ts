import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new course
export const createCourse = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    instructor: v.string(),
    students: v.optional(v.array(v.id("students"))),
  },
  handler: async (ctx, args) => {
    const courseId = await ctx.db.insert("courses", {
      name: args.name,
      description: args.description,
      instructor: args.instructor,
      isActive: true,
      createdAt: Date.now(),
      students: args.students || [],
    });
    return courseId;
  },
});

// Get course by ID
export const getCourse = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all active courses
export const getActiveCourses = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get courses by student ID
export const getCoursesByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return [];
    
    const courses = await Promise.all(
      student.courses.map(courseId => ctx.db.get(courseId))
    );
    
    return courses.filter(course => course && course.isActive);
  },
});

// Update course information
export const updateCourse = mutation({
  args: {
    id: v.id("courses"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    instructor: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    students: v.optional(v.array(v.id("students"))),
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

// Delete course (soft delete by setting isActive to false)
export const deleteCourse = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});

// Add student to course
export const addStudentToCourse = mutation({
  args: {
    courseId: v.id("courses"),
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    
    const updatedStudents = [...course.students, args.studentId];
    await ctx.db.patch(args.courseId, { students: updatedStudents });
    return args.courseId;
  },
});

// Remove student from course
export const removeStudentFromCourse = mutation({
  args: {
    courseId: v.id("courses"),
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    
    const updatedStudents = course.students.filter(id => id !== args.studentId);
    await ctx.db.patch(args.courseId, { students: updatedStudents });
    return args.courseId;
  },
});