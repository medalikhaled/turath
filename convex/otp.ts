import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Hardcoded admin email list - these are the only emails that can receive OTP
const ADMIN_EMAILS = [
  "medalikhaled331@gmail.com"
];

// Rate limiting: max 3 OTP requests per email per hour
const MAX_OTP_REQUESTS_PER_HOUR = 3;
const OTP_EXPIRY_MINUTES = 15;
const SESSION_DURATION_HOURS = 24;

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if email is in admin list
export const isAdminEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    return {
      isAdmin: ADMIN_EMAILS.includes(email),
    };
  },
});

// Generate and store OTP for admin email
export const generateAdminOTP = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Verify email is in admin list
    if (!ADMIN_EMAILS.includes(email)) {
      throw new ConvexError("البريد الإلكتروني غير مصرح له بالوصول للوحة الإدارة", "UNAUTHORIZED_EMAIL");
    }

    // Check rate limiting - count OTP requests in the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
      .collect();

    if (recentOTPs.length >= MAX_OTP_REQUESTS_PER_HOUR) {
      throw new ConvexError("تم تجاوز الحد الأقصى لطلبات رمز التحقق. يرجى المحاولة بعد ساعة", "RATE_LIMIT_EXCEEDED");
    }

    // Clean up expired OTPs for this email
    const expiredOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const expiredOTP of expiredOTPs) {
      await ctx.db.delete(expiredOTP._id);
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    const otpId = await ctx.db.insert("adminOTPs", {
      email,
      otp,
      expiresAt,
      createdAt: Date.now(),
      attempts: 0,
      isUsed: false,
    });

    return {
      success: true,
      otpId,
      otp, // Return OTP for email sending
      expiresAt,
      message: `تم إرسال رمز التحقق إلى ${email}`,
    };
  },
});

// Verify OTP and create admin session
export const verifyAdminOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const otpCode = args.otp.trim();

    // Verify email is in admin list
    if (!ADMIN_EMAILS.includes(email)) {
      throw new ConvexError("البريد الإلكتروني غير مصرح له بالوصول للوحة الإدارة", "UNAUTHORIZED_EMAIL");
    }

    // Find valid OTP for this email
    const validOTP = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) =>
        q.and(
          q.eq(q.field("otp"), otpCode),
          q.gt(q.field("expiresAt"), Date.now()),
          q.eq(q.field("isUsed"), false)
        )
      )
      .first();

    if (!validOTP) {
      // Increment attempts for all matching OTPs (to track failed attempts)
      const allOTPs = await ctx.db
        .query("adminOTPs")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter((q) =>
          q.and(
            q.gt(q.field("expiresAt"), Date.now()),
            q.eq(q.field("isUsed"), false)
          )
        )
        .collect();

      for (const otp of allOTPs) {
        await ctx.db.patch(otp._id, {
          attempts: otp.attempts + 1,
        });
      }

      throw new ConvexError("رمز التحقق غير صحيح أو منتهي الصلاحية", "INVALID_OTP");
    }

    // Mark OTP as used
    await ctx.db.patch(validOTP._id, {
      isUsed: true,
    });

    // Clean up old sessions for this email
    const oldSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    // Create new admin session (24 hours)
    const sessionExpiresAt = Date.now() + (SESSION_DURATION_HOURS * 60 * 60 * 1000);
    const sessionId = await ctx.db.insert("adminSessions", {
      email,
      expiresAt: sessionExpiresAt,
      createdAt: Date.now(),
      lastAccessAt: Date.now(),
    });

    return {
      success: true,
      sessionId,
      email,
      expiresAt: sessionExpiresAt,
      message: "تم تسجيل الدخول بنجاح",
    };
  },
});

// Validate admin session
export const validateAdminSession = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Verify email is in admin list
    if (!ADMIN_EMAILS.includes(email)) {
      return { isValid: false, reason: "UNAUTHORIZED_EMAIL" };
    }

    // Find active session
    const activeSession = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!activeSession) {
      return { isValid: false, reason: "NO_ACTIVE_SESSION" };
    }

    return {
      isValid: true,
      session: {
        id: activeSession._id,
        email: activeSession.email,
        expiresAt: activeSession.expiresAt,
        createdAt: activeSession.createdAt,
        lastAccessAt: activeSession.lastAccessAt,
      },
    };
  },
});

// Update admin session last access time
export const updateAdminSessionAccess = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Find active session
    const activeSession = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!activeSession) {
      throw new ConvexError("لا توجد جلسة نشطة", "NO_ACTIVE_SESSION");
    }

    // Update last access time
    await ctx.db.patch(activeSession._id, {
      lastAccessAt: Date.now(),
    });

    return {
      success: true,
      lastAccessAt: Date.now(),
    };
  },
});

// Logout admin (delete session)
export const logoutAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Delete all sessions for this email
    const sessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return {
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    };
  },
});

// Clean up expired OTPs and sessions (maintenance function)
export const cleanupExpiredData = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Clean up expired OTPs
    const expiredOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .collect();

    for (const otp of expiredOTPs) {
      await ctx.db.delete(otp._id);
    }

    // Clean up expired sessions
    const expiredSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    return {
      success: true,
      cleanedOTPs: expiredOTPs.length,
      cleanedSessions: expiredSessions.length,
    };
  },
});

// Get admin email list (for debugging/admin purposes)
export const getAdminEmails = query({
  handler: async () => {
    return {
      emails: ADMIN_EMAILS,
      count: ADMIN_EMAILS.length,
    };
  },
});

// Get OTP statistics for an email (for debugging)
export const getOTPStats = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const allOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    const activeOTPs = allOTPs.filter(otp => otp.expiresAt > Date.now() && !otp.isUsed);
    const expiredOTPs = allOTPs.filter(otp => otp.expiresAt <= Date.now());
    const usedOTPs = allOTPs.filter(otp => otp.isUsed);

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentOTPs = allOTPs.filter(otp => otp.createdAt >= oneHourAgo);

    return {
      total: allOTPs.length,
      active: activeOTPs.length,
      expired: expiredOTPs.length,
      used: usedOTPs.length,
      recentRequests: recentOTPs.length,
      canRequestNew: recentOTPs.length < MAX_OTP_REQUESTS_PER_HOUR,
    };
  },
});