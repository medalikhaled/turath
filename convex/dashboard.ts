import { v } from "convex/values";
import { query } from "./_generated/server";

// Simplified query to get all lessons for a time period
export const getAllLessonsForPeriod = query({
  args: { 
    startTime: v.number(), 
    endTime: v.number() 
  },
  handler: async (ctx, args) => {
    // Get all lessons within the time period
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
    
    // Get course details for each lesson
    const lessonsWithCourse = await Promise.all(
      lessons.map(async (lesson) => {
        const course = await ctx.db.get(lesson.courseId);
        return {
          ...lesson,
          course,
        };
      })
    );
    
    // Sort lessons by time
    lessonsWithCourse.sort((a, b) => a.scheduledTime - b.scheduledTime);
    
    return lessonsWithCourse;
  },
});

// Simplified query to get all active courses
export const getAllActiveCourses = query({
  handler: async (ctx) => {
    // Get all active courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return courses;
  },
});

// Simplified query to get all published news
export const getAllPublishedNews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit || 5;
    
    // Get all published news
    const recentNews = await ctx.db
      .query("news")
      .withIndex("by_published", (q) => 
        q.eq("isPublished", true).lt("publishedAt", now)
      )
      .order("desc")
      .take(limit);
    
    // Get news with attachments (same as admin dashboard)
    const newsWithAttachments = await Promise.all(
      recentNews.map(async (news) => {
        const attachments = await Promise.all(
          news.attachments.map(fileId => ctx.db.get(fileId))
        );
        return {
          ...news,
          attachments: attachments.filter(file => file !== null),
        };
      })
    );
    
    return newsWithAttachments;
  },
});

// Get complete student dashboard data
export const getStudentDashboard = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    // For mock data, try to find student by clerkId if direct ID lookup fails
    let student = await ctx.db.get(args.studentId);
    
    if (!student && args.studentId === "mock_student_id") {
      // Try to find by clerkId for mock data
      student = await ctx.db
        .query("students")
        .withIndex("by_user_id", (q) => q.eq("userId", "mock_user_id" as any))
        .first();
    }
    
    if (!student) return null;
    
    const now = Date.now();
    
    // Get current/next meeting
    let currentMeeting = null;
    let nextLesson = null;
    let earliestTime = Infinity;
    
    // Check all student's courses for upcoming lessons and meetings
    for (const courseId of student.courses) {
      // Get next lesson for this course
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_course_and_time", (q) => 
          q.eq("courseId", courseId).gt("scheduledTime", now)
        )
        .first();
      
      if (lessons && lessons.scheduledTime < earliestTime) {
        earliestTime = lessons.scheduledTime;
        nextLesson = lessons;
        
        // Get associated meeting if exists
        if (lessons.meetingId) {
          currentMeeting = await ctx.db.get(lessons.meetingId);
        }
      }
    }
    
    // Get weekly schedule
    const startOfWeek = now - (now % (7 * 24 * 60 * 60 * 1000));
    const endOfWeek = startOfWeek + (7 * 24 * 60 * 60 * 1000);
    
    const weeklyLessons = [];
    for (const courseId of student.courses) {
      const courseLessons = await ctx.db
        .query("lessons")
        .withIndex("by_course_and_time", (q) => 
          q.eq("courseId", courseId)
            .gte("scheduledTime", startOfWeek)
            .lte("scheduledTime", endOfWeek)
        )
        .collect();
      
      // Get course details for each lesson
      const course = await ctx.db.get(courseId);
      const lessonsWithCourse = courseLessons.map(lesson => ({
        ...lesson,
        course,
      }));
      
      weeklyLessons.push(...lessonsWithCourse);
    }
    
    // Sort weekly lessons by time
    weeklyLessons.sort((a, b) => a.scheduledTime - b.scheduledTime);
    
    // Get recent news
    const recentNews = await ctx.db
      .query("news")
      .withIndex("by_published", (q) => 
        q.eq("isPublished", true).lt("publishedAt", now)
      )
      .order("desc")
      .take(5);
    
    // Get news with attachments
    const newsWithAttachments = await Promise.all(
      recentNews.map(async (news) => {
        const attachments = await Promise.all(
          news.attachments.map(fileId => ctx.db.get(fileId))
        );
        return {
          ...news,
          attachments: attachments.filter(file => file !== null),
        };
      })
    );
    
    return {
      student,
      currentMeeting,
      nextLesson,
      weeklySchedule: weeklyLessons,
      recentNews: newsWithAttachments,
    };
  },
});

// Get student dashboard by userId (for auth integration)
export const getStudentDashboardByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!student) return null;
    
    const now = Date.now();
    
    // Get current/next meeting
    let currentMeeting = null;
    let nextLesson = null;
    let earliestTime = Infinity;
    
    // Check all student's courses for upcoming lessons and meetings
    for (const courseId of student.courses) {
      // Get next lesson for this course
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_course_and_time", (q) => 
          q.eq("courseId", courseId).gt("scheduledTime", now)
        )
        .first();
      
      if (lessons && lessons.scheduledTime < earliestTime) {
        earliestTime = lessons.scheduledTime;
        nextLesson = lessons;
        
        // Get associated meeting if exists
        if (lessons.meetingId) {
          currentMeeting = await ctx.db.get(lessons.meetingId);
        }
      }
    }
    
    // Get weekly schedule
    const startOfWeek = now - (now % (7 * 24 * 60 * 60 * 1000));
    const endOfWeek = startOfWeek + (7 * 24 * 60 * 60 * 1000);
    
    const weeklyLessons = [];
    for (const courseId of student.courses) {
      const courseLessons = await ctx.db
        .query("lessons")
        .withIndex("by_course_and_time", (q) => 
          q.eq("courseId", courseId)
            .gte("scheduledTime", startOfWeek)
            .lte("scheduledTime", endOfWeek)
        )
        .collect();
      
      // Get course details for each lesson
      const course = await ctx.db.get(courseId);
      const lessonsWithCourse = courseLessons.map(lesson => ({
        ...lesson,
        course,
      }));
      
      weeklyLessons.push(...lessonsWithCourse);
    }
    
    // Sort weekly lessons by time
    weeklyLessons.sort((a, b) => a.scheduledTime - b.scheduledTime);
    
    // Get recent news
    const recentNews = await ctx.db
      .query("news")
      .withIndex("by_published", (q) => 
        q.eq("isPublished", true).lt("publishedAt", now)
      )
      .order("desc")
      .take(5);
    
    // Get news with attachments
    const newsWithAttachments = await Promise.all(
      recentNews.map(async (news) => {
        const attachments = await Promise.all(
          news.attachments.map(fileId => ctx.db.get(fileId))
        );
        return {
          ...news,
          attachments: attachments.filter(file => file !== null),
        };
      })
    );
    
    return {
      student,
      currentMeeting,
      nextLesson,
      weeklySchedule: weeklyLessons,
      recentNews: newsWithAttachments,
    };
  },
});

// Get admin dashboard statistics
export const getAdminDashboard = query({
  handler: async (ctx) => {
    // Get basic counts
    const totalStudents = await ctx.db
      .query("students")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    const totalCourses = await ctx.db
      .query("courses")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    const now = Date.now();
    const startOfToday = now - (now % (24 * 60 * 60 * 1000));
    const endOfToday = startOfToday + (24 * 60 * 60 * 1000);
    
    // Get today's meetings
    const todaysMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.and(
          q.gte(q.field("scheduledTime"), startOfToday),
          q.lt(q.field("scheduledTime"), endOfToday)
        )
      )
      .collect();
    
    // Get upcoming meetings (next 7 days)
    const nextWeek = now + (7 * 24 * 60 * 60 * 1000);
    const upcomingMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.and(
          q.gt(q.field("scheduledTime"), now),
          q.lte(q.field("scheduledTime"), nextWeek)
        )
      )
      .collect();
    
    // Get recent news
    const recentNews = await ctx.db
      .query("news")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .take(5);
    
    // Get file statistics
    const allFiles = await ctx.db.query("files").collect();
    const totalFiles = allFiles.length;
    const totalFileSize = allFiles.reduce((sum, file) => sum + file.size, 0);
    
    // Get recent activity (files uploaded in last 7 days)
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentFiles = allFiles.filter(file => file.uploadedAt > weekAgo);
    
    return {
      statistics: {
        totalStudents: totalStudents.length,
        totalCourses: totalCourses.length,
        todaysMeetings: todaysMeetings.length,
        upcomingMeetings: upcomingMeetings.length,
        totalFiles,
        totalFileSize,
        recentFiles: recentFiles.length,
      },
      todaysMeetings,
      upcomingMeetings: upcomingMeetings.slice(0, 5), // Limit to 5 for dashboard
      recentNews,
      recentActivity: recentFiles.slice(0, 10), // Last 10 recent files
    };
  },
});

// Get course details with all related data
export const getCourseDetails = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;
    
    // Get all lessons for this course
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .collect();
    
    // Get lessons with their resources
    const lessonsWithResources = await Promise.all(
      lessons.map(async (lesson) => {
        const resources = await Promise.all(
          lesson.resources.map(fileId => ctx.db.get(fileId))
        );
        return {
          ...lesson,
          resources: resources.filter(file => file !== null),
        };
      })
    );
    
    // Get enrolled students
    const students = await Promise.all(
      course.students.map(studentId => ctx.db.get(studentId))
    );
    
    // Get upcoming meetings for this course
    const now = Date.now();
    const upcomingMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gt(q.field("scheduledTime"), now)
        )
      )
      .collect();
    
    return {
      course,
      lessons: lessonsWithResources,
      students: students.filter(student => student !== null),
      upcomingMeetings,
    };
  },
});