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
    createdBy: v.id("students"),
  },
  handler: async (ctx, args) => {
    const meetingId = await ctx.db.insert("meetings", {
      courseId: args.courseId,
      googleMeetLink: args.googleMeetLink,
      password: args.password,
      scheduledTime: args.scheduledTime,
      duration: args.duration,
      isActive: true,
      createdBy: args.createdBy,
    });
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
          q.gt(q.field("scheduledTime"), now),
          q.lte(q.field("scheduledTime"), futureTime)
        )
      )
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