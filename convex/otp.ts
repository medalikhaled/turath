import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Hardcoded admin emails - these should be managed directly in the database
const ADMIN_EMAILS = [
  "medalikhaled331@gmail.com",
  "admin@hanbaliacademy.com",
];

// OTP configuration
const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_MINUTES = 5;

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if email is in admin list
export const isAdminEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ADMIN_EMAILS.includes(args.email.toLowerCase());
  },
});

// Request OTP for admin login
export const requestAdminOTP = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    // Check if email is in admin list
    if (!ADMIN_EMAILS.includes(email)) {
      throw new ConvexError("البريد الإلكتروني غير مصرح له بالوصول للوحة الإدارة", "UNAUTHORIZED");
    }

    // Check rate limiting
    const recentOTP = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.gt(q.field("createdAt"), Date.now() - (RATE_LIMIT_MINUTES * 60 * 1000)))
      .first();

    if (recentOTP) {
      throw new ConvexError("يرجى الانتظار قبل طلب رمز جديد", "RATE_LIMITED");
    }

    // Generate OTP
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

    // TODO: Send email with OTP
    // For now, we'll log it to console (in production, integrate with email service)
    console.log(`OTP for ${email}: ${otp}`);

    return {
      success: true,
      message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === "development" && { otp }),
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
    const email = args.email.toLowerCase();

    // Find the most recent unused OTP for this email
    const otpRecord = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .order("desc")
      .first();

    if (!otpRecord) {
      throw new ConvexError("رمز التحقق غير صالح أو منتهي الصلاحية", "INVALID_OTP");
    }

    // Check if OTP is expired
    if (Date.now() > otpRecord.expiresAt) {
      await ctx.db.patch(otpRecord._id, { isUsed: true });
      throw new ConvexError("رمز التحقق منتهي الصلاحية", "EXPIRED_OTP");
    }

    // Check attempts limit
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await ctx.db.patch(otpRecord._id, { isUsed: true });
      throw new ConvexError("تم تجاوز عدد المحاولات المسموح", "MAX_ATTEMPTS_EXCEEDED");
    }

    // Verify OTP
    if (otpRecord.otp !== args.otp) {
      await ctx.db.patch(otpRecord._id, {
        attempts: otpRecord.attempts + 1
      });
      throw new ConvexError("رمز التحقق غير صحيح", "INVALID_OTP");
    }

    // Mark OTP as used
    await ctx.db.patch(otpRecord._id, { isUsed: true });

    // Create or update admin session (24 hours)
    const sessionExpiresAt = Date.now() + (24 * 60 * 60 * 1000);

    // Check if admin session already exists
    const existingSession = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    let sessionId;
    if (existingSession) {
      // Update existing session
      await ctx.db.patch(existingSession._id, {
        expiresAt: sessionExpiresAt,
        lastAccessAt: Date.now(),
      });
      sessionId = existingSession._id;
    } else {
      // Create new session
      sessionId = await ctx.db.insert("adminSessions", {
        email,
        expiresAt: sessionExpiresAt,
        createdAt: Date.now(),
        lastAccessAt: Date.now(),
      });
    }

    return {
      success: true,
      sessionId,
      expiresAt: sessionExpiresAt,
      message: "تم تسجيل الدخول بنجاح",
    };
  },
});

// Validate admin session
export const validateAdminSession = query({
  args: { sessionId: v.id("adminSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      return { valid: false, reason: "SESSION_NOT_FOUND" };
    }

    if (Date.now() > session.expiresAt) {
      return { valid: false, reason: "SESSION_EXPIRED" };
    }

    return {
      valid: true,
      email: session.email,
      expiresAt: session.expiresAt,
    };
  },
});

// Get admin session by email
export const getAdminSessionByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!session || Date.now() > session.expiresAt) {
      return null;
    }

    return {
      sessionId: session._id,
      email: session.email,
      expiresAt: session.expiresAt,
    };
  },
});

// Logout admin (invalidate session)
export const logoutAdmin = mutation({
  args: { sessionId: v.id("adminSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
    return { success: true, message: "تم تسجيل الخروج بنجاح" };
  },
});

// Clean up expired OTPs and sessions (maintenance function)
export const cleanupExpiredRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Clean up expired OTPs
    const expiredOTPs = await ctx.db
      .query("adminOTPs")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const otp of expiredOTPs) {
      await ctx.db.delete(otp._id);
    }

    // Clean up expired sessions
    const expiredSessions = await ctx.db
      .query("adminSessions")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    return {
      deletedOTPs: expiredOTPs.length,
      deletedSessions: expiredSessions.length,
    };
  },
});
