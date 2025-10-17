import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Hardcoded admin emails - must match adminManagement.ts
const ADMIN_EMAILS = ["medalikhaled331@gmail.com"];

// Admin email validation - checks both authorization list and user record
export const isAdminEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // First check if email is in authorized list
    if (!ADMIN_EMAILS.includes(email)) {
      return { isAdmin: false };
    }

    // Check if user exists and is active in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    // Admin must be both authorized AND have an active user record
    return {
      isAdmin: user?.role === "admin" && user?.isActive === true,
    };
  },
});

// Student credential checking - supports both username and email
export const getStudentCredentials = query({
  args: { identifier: v.string() }, // Can be username or email
  handler: async (ctx, args) => {
    const identifier = args.identifier.toLowerCase().trim();

    // First try to find by username
    const studentByUsername = await ctx.db
      .query("students")
      .withIndex("by_username", (q) => q.eq("username", identifier))
      .first();

    let user: any = null;
    let student: any = null;

    if (studentByUsername) {
      // Found by username, get the user
      user = await ctx.db.get(studentByUsername.userId);
      student = studentByUsername;
    } else {
      // Try to find by email
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identifier))
        .first();

      if (user && user.role === "student") {
        student = await ctx.db
          .query("students")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
      }
    }

    if (!user || user.role !== "student" || !user.isActive || !student) {
      return null;
    }

    return {
      userId: user._id,
      studentId: student._id,
      email: user.email,
      username: student.username,
      name: student.name,
      passwordHash: user.passwordHash,
      requiresPasswordChange: student.requiresPasswordChange,
      courses: student.courses,
    };
  },
});

// Store OTP for admin authentication
export const storeAdminOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Delete any existing OTPs for this email
    const existingOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const otp of existingOTPs) {
      await ctx.db.delete(otp._id);
    }

    // Store new OTP
    await ctx.db.insert("adminOTPs", {
      email,
      otp: args.otp,
      expiresAt: args.expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Verify admin OTP
export const verifyAdminOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const otpRecord = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!otpRecord) {
      return { success: false, error: "OTP_NOT_FOUND" };
    }

    // Check if OTP is expired
    if (Date.now() > otpRecord.expiresAt) {
      await ctx.db.delete(otpRecord._id);
      return { success: false, error: "OTP_EXPIRED" };
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 3) {
      await ctx.db.delete(otpRecord._id);
      return { success: false, error: "TOO_MANY_ATTEMPTS" };
    }

    // Verify OTP
    if (otpRecord.otp !== args.otp) {
      await ctx.db.patch(otpRecord._id, {
        attempts: otpRecord.attempts + 1,
      });
      return { success: false, error: "INVALID_OTP" };
    }

    // OTP is valid - delete it
    await ctx.db.delete(otpRecord._id);

    return { success: true };
  },
});

// Create admin session
export const createAdminSession = mutation({
  args: {
    email: v.string(),
    sessionId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    await ctx.db.insert("adminSessions", {
      email,
      sessionId: args.sessionId,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      lastAccessAt: Date.now(),
    });

    return { success: true };
  },
});

// Validate admin session
export const validateAdminSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      return { valid: false, error: "SESSION_NOT_FOUND" };
    }

    if (Date.now() > session.expiresAt) {
      return { valid: false, error: "SESSION_EXPIRED" };
    }

    return {
      valid: true,
      email: session.email,
      expiresAt: session.expiresAt,
    };
  },
});

// Update session last access time
export const updateSessionAccess = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        lastAccessAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Revoke session (logout)
export const revokeSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Update student last login
export const updateStudentLastLogin = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      lastLoginAt: Date.now(),
    });

    return { success: true };
  },
});

// Get user by email (for session validation)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || !user.isActive) {
      return null;
    }

    if (user.role === "student") {
      const student = await ctx.db
        .query("students")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .first();

      if (!student) {
        return null;
      }

      return {
        userId: user._id,
        studentId: student._id,
        email: user.email,
        name: student.name,
        role: user.role,
        courses: student.courses,
      };
    }

    // Admin user
    return {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
  },
});

// Clean up expired OTPs (maintenance function)
export const cleanupExpiredOTPs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_expires_at")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const otp of expiredOTPs) {
      await ctx.db.delete(otp._id);
    }

    return { deleted: expiredOTPs.length };
  },
});

// Clean up expired sessions (maintenance function)
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_expires_at")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    return { deleted: expiredSessions.length };
  },
});
