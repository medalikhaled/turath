import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  
  // Student Model - now linked to auth users
  students: defineTable({
    userId: v.id("users"), // Link to Convex Auth user
    name: v.string(),
    enrollmentDate: v.number(),
    isActive: v.boolean(),
    courses: v.array(v.id("courses")),
    role: v.union(v.literal("student"), v.literal("admin")),
  })
    .index("by_user_id", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_role", ["role"]),

  // Course Model
  courses: defineTable({
    name: v.string(),
    description: v.string(),
    instructor: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    students: v.array(v.id("students")),
  })
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  // Meeting Model
  meetings: defineTable({
    courseId: v.id("courses"),
    googleMeetLink: v.string(),
    password: v.optional(v.string()),
    scheduledTime: v.number(),
    duration: v.number(),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_course", ["courseId"])
    .index("by_scheduled_time", ["scheduledTime"])
    .index("by_active", ["isActive"]),

  // Lesson Model
  lessons: defineTable({
    courseId: v.id("courses"),
    meetingId: v.optional(v.id("meetings")),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledTime: v.number(),
    recordingUrl: v.optional(v.string()),
    resources: v.array(v.id("files")),
  })
    .index("by_course", ["courseId"])
    .index("by_scheduled_time", ["scheduledTime"])
    .index("by_course_and_time", ["courseId", "scheduledTime"]),

  // News Model
  news: defineTable({
    title: v.string(),
    content: v.string(),
    publishedAt: v.number(),
    isPublished: v.boolean(),
    attachments: v.array(v.id("files")),
    createdBy: v.id("users"),
  })
    .index("by_published", ["isPublished", "publishedAt"])
    .index("by_created_by", ["createdBy"]),

  // File Model (for Convex file storage)
  files: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
  })
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_uploaded_at", ["uploadedAt"]),

  // Admin OTP Model
  adminOTPs: defineTable({
    email: v.string(),
    otp: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    attempts: v.number(),
    isUsed: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_expires_at", ["expiresAt"]),

  // Admin Sessions Model
  adminSessions: defineTable({
    email: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastAccessAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_expires_at", ["expiresAt"]),
});
