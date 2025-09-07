import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new lesson
export const createLesson = mutation({
  args: {
    courseId: v.id("courses"),
    meetingId: v.optional(v.id("meetings")),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledTime: v.number(),
    recordingUrl: v.optional(v.string()),
    resources: v.optional(v.array(v.id("files"))),
  },
  handler: async (ctx, args) => {
    const lessonId = await ctx.db.insert("lessons", {
      courseId: args.courseId,
      meetingId: args.meetingId,
      title: args.title,
      description: args.description,
      scheduledTime: args.scheduledTime,
      recordingUrl: args.recordingUrl,
      resources: args.resources || [],
    });
    return lessonId;
  },
});

// Get lesson by ID
export const getLesson = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get lessons by course ID
export const getLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .collect();
  },
});

// Get upcoming lessons for a course
export const getUpcomingLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("lessons")
      .withIndex("by_course_and_time", (q) => 
        q.eq("courseId", args.courseId).gt("scheduledTime", now)
      )
      .collect();
  },
});

// Get past lessons for a course (for archive)
export const getPastLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("lessons")
      .withIndex("by_course_and_time", (q) => 
        q.eq("courseId", args.courseId).lt("scheduledTime", now)
      )
      .order("desc")
      .collect();
  },
});

// Get weekly schedule (all lessons for the week)
export const getWeeklySchedule = query({
  args: {
    startOfWeek: v.number(),
    endOfWeek: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.gte(q.field("scheduledTime"), args.startOfWeek),
          q.lte(q.field("scheduledTime"), args.endOfWeek)
        )
      )
      .collect();
  },
});

// Get next lesson for a student (across all their courses)
export const getNextLessonForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;
    
    const now = Date.now();
    let nextLesson = null;
    let earliestTime = Infinity;
    
    for (const courseId of student.courses) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_course_and_time", (q) => 
          q.eq("courseId", courseId).gt("scheduledTime", now)
        )
        .first();
      
      if (lessons && lessons.scheduledTime < earliestTime) {
        earliestTime = lessons.scheduledTime;
        nextLesson = lessons;
      }
    }
    
    return nextLesson;
  },
});

// Update lesson information
export const updateLesson = mutation({
  args: {
    id: v.id("lessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduledTime: v.optional(v.number()),
    recordingUrl: v.optional(v.string()),
    resources: v.optional(v.array(v.id("files"))),
    meetingId: v.optional(v.id("meetings")),
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

// Delete lesson
export const deleteLesson = mutation({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Add resource to lesson
export const addResourceToLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");
    
    const updatedResources = [...lesson.resources, args.fileId];
    await ctx.db.patch(args.lessonId, { resources: updatedResources });
    return args.lessonId;
  },
});

// Remove resource from lesson
export const removeResourceFromLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");
    
    const updatedResources = lesson.resources.filter(id => id !== args.fileId);
    await ctx.db.patch(args.lessonId, { resources: updatedResources });
    return args.lessonId;
  },
});