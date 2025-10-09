import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

// Update lesson and its associated meeting (unified update)
export const updateLessonWithMeeting = mutation({
  args: {
    lessonId: v.id("lessons"),
    lessonData: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      scheduledTime: v.optional(v.number()),
      recordingUrl: v.optional(v.string()),
    }),
    meetingData: v.optional(v.object({
      googleMeetLink: v.optional(v.string()),
      password: v.optional(v.string()),
      duration: v.optional(v.number()),
      scheduledTime: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    // Update lesson
    const lessonUpdates = Object.fromEntries(
      Object.entries(args.lessonData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(lessonUpdates).length > 0) {
      await ctx.db.patch(args.lessonId, lessonUpdates);
    }

    // Update associated meeting if it exists and meeting data is provided
    if (lesson.meetingId && args.meetingData) {
      const meetingUpdates = Object.fromEntries(
        Object.entries(args.meetingData).filter(([_, value]) => value !== undefined)
      );
      if (Object.keys(meetingUpdates).length > 0) {
        await ctx.db.patch(lesson.meetingId, meetingUpdates);
      }
    }

    return args.lessonId;
  },
});

// Link an existing meeting to a lesson
export const linkMeetingToLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    const meeting = await ctx.db.get(args.meetingId);
    
    if (!lesson) throw new Error("Lesson not found");
    if (!meeting) throw new Error("Meeting not found");
    
    // Ensure they're for the same course
    if (lesson.courseId !== meeting.courseId) {
      throw new Error("Lesson and meeting must be for the same course");
    }

    // Link the meeting to the lesson
    await ctx.db.patch(args.lessonId, { meetingId: args.meetingId });
    
    return args.lessonId;
  },
});

// Unlink a meeting from a lesson
export const unlinkMeetingFromLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    // Remove the meeting link
    await ctx.db.patch(args.lessonId, { meetingId: undefined });
    
    return args.lessonId;
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

// Check for scheduling conflicts
export const checkSchedulingConflicts = query({
  args: {
    scheduledTime: v.number(),
    excludeLessonId: v.optional(v.id("lessons")),
    conflictWindowMs: v.optional(v.number()), // Default to 1 hour
  },
  handler: async (ctx, args) => {
    const conflictWindow = args.conflictWindowMs || (60 * 60 * 1000); // 1 hour default
    
    const startTime = args.scheduledTime - conflictWindow;
    const endTime = args.scheduledTime + conflictWindow;
    
    const conflictingLessons = await ctx.db
      .query("lessons")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.gte(q.field("scheduledTime"), startTime),
          q.lte(q.field("scheduledTime"), endTime)
        )
      )
      .collect();
    
    // Exclude the lesson being edited if provided
    const filteredConflicts = args.excludeLessonId 
      ? conflictingLessons.filter(lesson => lesson._id !== args.excludeLessonId)
      : conflictingLessons;
    
    return filteredConflicts;
  },
});

// Get lessons with course information for admin dashboard
export const getLessonsWithCourses = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("lessons").withIndex("by_scheduled_time");
    
    if (args.startTime && args.endTime) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("scheduledTime"), args.startTime!),
          q.lte(q.field("scheduledTime"), args.endTime!)
        )
      );
    }
    
    const lessons = await query
      .order("desc")
      .take(args.limit || 100);
    
    // Get course information for each lesson
    const lessonsWithCourses = await Promise.all(
      lessons.map(async (lesson) => {
        const course = await ctx.db.get(lesson.courseId);
        return {
          ...lesson,
          course,
        };
      })
    );
    
    return lessonsWithCourses;
  },
});

// Create lesson with optional meeting creation (unified scheduling)
export const createLessonWithMeeting = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledTime: v.number(),
    recordingUrl: v.optional(v.string()),
    resources: v.optional(v.array(v.id("files"))),
    // Meeting creation options
    createMeeting: v.optional(v.boolean()),
    meetingData: v.optional(v.object({
      googleMeetLink: v.string(),
      password: v.optional(v.string()),
      duration: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    let meetingId: Id<"meetings"> | undefined = undefined;

    // Create meeting first if requested
    if (args.createMeeting && args.meetingData) {
      meetingId = await ctx.db.insert("meetings", {
        courseId: args.courseId,
        googleMeetLink: args.meetingData.googleMeetLink,
        password: args.meetingData.password,
        scheduledTime: args.scheduledTime,
        duration: args.meetingData.duration,
        isActive: true,
      });
    }

    // Create lesson with optional meeting reference
    const lessonId = await ctx.db.insert("lessons", {
      courseId: args.courseId,
      meetingId: meetingId,
      title: args.title,
      description: args.description,
      scheduledTime: args.scheduledTime,
      recordingUrl: args.recordingUrl,
      resources: args.resources || [],
    });

    return { lessonId, meetingId };
  },
});

// Get lesson with associated meeting information
export const getLessonWithMeeting = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) return null;

    let meeting = null;
    if (lesson.meetingId) {
      meeting = await ctx.db.get(lesson.meetingId);
    }

    return {
      ...lesson,
      meeting,
    };
  },
});

// Get lessons with their associated meetings for a course
export const getLessonsWithMeetingsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .collect();

    const lessonsWithMeetings = await Promise.all(
      lessons.map(async (lesson) => {
        let meeting = null;
        if (lesson.meetingId) {
          meeting = await ctx.db.get(lesson.meetingId);
        }
        return {
          ...lesson,
          meeting,
        };
      })
    );

    return lessonsWithMeetings;
  },
});

// Get unified schedule events (lessons and standalone meetings) for a date range
export const getUnifiedScheduleEvents = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all lessons in the date range
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.gte(q.field("scheduledTime"), args.startTime),
          q.lte(q.field("scheduledTime"), args.endTime)
        )
      )
      .collect();

    // Get all meetings in the date range
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gte(q.field("scheduledTime"), args.startTime),
          q.lte(q.field("scheduledTime"), args.endTime)
        )
      )
      .collect();

    // Get lesson IDs that have associated meetings
    const lessonMeetingIds = new Set(
      lessons
        .filter(lesson => lesson.meetingId)
        .map(lesson => lesson.meetingId!)
    );

    // Filter out meetings that are already associated with lessons
    const standaloneMeetings = meetings.filter(
      meeting => !lessonMeetingIds.has(meeting._id)
    );

    // Create unified event objects
    const lessonEvents = await Promise.all(
      lessons.map(async (lesson) => {
        const course = await ctx.db.get(lesson.courseId);
        let associatedMeeting = null;
        if (lesson.meetingId) {
          associatedMeeting = await ctx.db.get(lesson.meetingId);
        }
        
        return {
          id: lesson._id,
          type: "lesson" as const,
          title: lesson.title,
          description: lesson.description,
          scheduledTime: lesson.scheduledTime,
          courseId: lesson.courseId,
          course,
          lesson,
          meeting: associatedMeeting,
        };
      })
    );

    const meetingEvents = await Promise.all(
      standaloneMeetings.map(async (meeting) => {
        const course = await ctx.db.get(meeting.courseId);
        
        return {
          id: meeting._id,
          type: "meeting" as const,
          title: `جلسة - ${course?.name || 'غير محدد'}`,
          description: undefined,
          scheduledTime: meeting.scheduledTime,
          courseId: meeting.courseId,
          course,
          lesson: null,
          meeting,
        };
      })
    );

    // Combine and sort by scheduled time
    const allEvents = [...lessonEvents, ...meetingEvents];
    allEvents.sort((a, b) => a.scheduledTime - b.scheduledTime);

    return allEvents;
  },
});