import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new meeting
export const createMeeting = mutation({
  args: {
    courseId: v.id("courses"),
    googleMeetLink: v.string(),
    password: v.optional(v.string()),
    scheduledTime: v.number(),
    duration: v.number(),
    createdBy: v.optional(v.id("students")),
  },
  handler: async (ctx, args) => {
    const meetingData: any = {
      courseId: args.courseId,
      googleMeetLink: args.googleMeetLink,
      password: args.password,
      scheduledTime: args.scheduledTime,
      duration: args.duration,
      isActive: true,
    };

    // Only add createdBy if it's provided
    if (args.createdBy) {
      meetingData.createdBy = args.createdBy;
    }

    const meetingId = await ctx.db.insert("meetings", meetingData);
    return meetingId;
  },
});

// Get meeting by ID
export const getMeeting = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get meetings by course ID
export const getMeetingsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get current active meeting (happening now or next upcoming)
export const getCurrentMeeting = query({
  handler: async (ctx) => {
    const now = Date.now();
    
    // First, try to find a meeting that's currently happening
    const currentMeeting = await ctx.db
      .query("meetings")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("scheduledTime"), now),
          q.gte(q.add(q.field("scheduledTime"), q.mul(q.field("duration"), 60000)), now)
        )
      )
      .first();
    
    if (currentMeeting) return currentMeeting;
    
    // If no current meeting, find the next upcoming one
    return await ctx.db
      .query("meetings")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gt(q.field("scheduledTime"), now)
        )
      )
      .first();
  },
});

// Get current meeting with course information
export const getCurrentMeetingWithCourse = query({
  handler: async (ctx) => {
    const now = Date.now();
    
    // First, try to find a meeting that's currently happening
    let currentMeeting = await ctx.db
      .query("meetings")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("scheduledTime"), now),
          q.gte(q.add(q.field("scheduledTime"), q.mul(q.field("duration"), 60000)), now)
        )
      )
      .first();
    
    // If no current meeting, find the next upcoming one
    if (!currentMeeting) {
      currentMeeting = await ctx.db
        .query("meetings")
        .withIndex("by_scheduled_time")
        .filter((q) => 
          q.and(
            q.eq(q.field("isActive"), true),
            q.gt(q.field("scheduledTime"), now)
          )
        )
        .first();
    }

    if (!currentMeeting) return null;

    // Get the course information
    const course = await ctx.db.get(currentMeeting.courseId);

    return {
      ...currentMeeting,
      course
    };
  },
});

// Get upcoming meetings (next 7 days)
export const getUpcomingMeetings = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureTime = now + (daysAhead * 24 * 60 * 60 * 1000);
    
    return await ctx.db
      .query("meetings")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gte(q.field("scheduledTime"), now), // Changed from gt to gte to include current time
          q.lte(q.field("scheduledTime"), futureTime)
        )
      )
      .order("asc")
      .collect();
  },
});

// Update meeting information
export const updateMeeting = mutation({
  args: {
    id: v.id("meetings"),
    googleMeetLink: v.optional(v.string()),
    password: v.optional(v.string()),
    scheduledTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
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

// Delete meeting (soft delete by setting isActive to false)
export const deleteMeeting = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});

// Get meetings by date range
export const getMeetingsByDateRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
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
  },
});

// Get meetings with course information
export const getMeetingsWithCourses = query({
  handler: async (ctx) => {
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const meetingsWithCourses = await Promise.all(
      meetings.map(async (meeting) => {
        const course = await ctx.db.get(meeting.courseId);
        return {
          ...meeting,
          course,
        };
      })
    );

    return meetingsWithCourses.filter(item => item.course !== null);
  },
});

// Get all meetings for debugging
export const getAllMeetings = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("meetings")
      .collect();
  },
});

// Get all active meetings (no time filter)
export const getAllActiveMeetings = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();
  },
});



// Check for scheduling conflicts
export const checkSchedulingConflict = query({
  args: {
    scheduledTime: v.number(),
    duration: v.number(),
    excludeMeetingId: v.optional(v.id("meetings")),
  },
  handler: async (ctx, args) => {
    const meetingStart = args.scheduledTime;
    const meetingEnd = args.scheduledTime + (args.duration * 60 * 1000);

    const conflictingMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_scheduled_time")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          // Check if meetings overlap
          q.or(
            // New meeting starts during existing meeting
            q.and(
              q.gte(q.field("scheduledTime"), meetingStart),
              q.lt(q.field("scheduledTime"), meetingEnd)
            ),
            // New meeting ends during existing meeting
            q.and(
              q.gt(q.add(q.field("scheduledTime"), q.mul(q.field("duration"), 60000)), meetingStart),
              q.lte(q.add(q.field("scheduledTime"), q.mul(q.field("duration"), 60000)), meetingEnd)
            ),
            // New meeting completely contains existing meeting
            q.and(
              q.lte(q.field("scheduledTime"), meetingStart),
              q.gte(q.add(q.field("scheduledTime"), q.mul(q.field("duration"), 60000)), meetingEnd)
            )
          )
        )
      )
      .collect();

    // Filter out the meeting being edited
    const conflicts = args.excludeMeetingId 
      ? conflictingMeetings.filter(meeting => meeting._id !== args.excludeMeetingId)
      : conflictingMeetings;

    return {
      hasConflict: conflicts.length > 0,
      conflictingMeetings: conflicts,
    };
  },
});