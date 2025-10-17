import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

const ADMIN_EMAILS = ["medalikhaled331@gmail.com"];
const MAX_OTP_REQUESTS_PER_HOUR = 3;
const OTP_EXPIRY_MINUTES = 15;
const SESSION_DURATION_HOURS = 24;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const isAdminEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    return { isAdmin: ADMIN_EMAILS.includes(email) };
  },
});

export const generateAdminOTP = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    if (!ADMIN_EMAILS.includes(email)) {
      throw new ConvexError("Email not authorized", "UNAUTHORIZED_EMAIL");
    }

    // Clean up expired OTPs
    const expiredOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const otp of expiredOTPs) {
      await ctx.db.delete(otp._id);
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

    const otpId = await ctx.db.insert("adminOTPs", {
      email,
      otp,
      expiresAt,
      createdAt: Date.now(),
      attempts: 0,
    });

    return {
      success: true,
      otpId,
      otp,
      expiresAt,
      message: `OTP sent to ${email}`,
    };
  },
});

export const verifyAdminOTP = mutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const otpCode = args.otp.trim();

    if (!ADMIN_EMAILS.includes(email)) {
      throw new ConvexError("Email not authorized", "UNAUTHORIZED_EMAIL");
    }

    const validOTP = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) =>
        q.and(q.eq(q.field("otp"), otpCode), q.gt(q.field("expiresAt"), Date.now()))
      )
      .first();

    if (!validOTP) {
      const allOTPs = await ctx.db
        .query("adminOTPs")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
        .collect();

      for (const otp of allOTPs) {
        await ctx.db.patch(otp._id, { attempts: otp.attempts + 1 });
      }

      throw new ConvexError("Invalid or expired OTP", "INVALID_OTP");
    }

    await ctx.db.delete(validOTP._id);

    const oldSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    const sessionExpiresAt = Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000;
    const sessionIdString = `session_${email}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const sessionId = await ctx.db.insert("adminSessions", {
      email,
      sessionId: sessionIdString,
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

export const validateAdminSession = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    if (!ADMIN_EMAILS.includes(email)) {
      return { isValid: false, reason: "UNAUTHORIZED_EMAIL" };
    }

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

export const updateAdminSessionAccess = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const activeSession = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!activeSession) {
      throw new ConvexError("No active session", "NO_ACTIVE_SESSION");
    }

    await ctx.db.patch(activeSession._id, { lastAccessAt: Date.now() });

    return { success: true, lastAccessAt: Date.now() };
  },
});

export const logoutAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const sessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true, message: "تم تسجيل الخروج بنجاح" };
  },
});

export const cleanupExpiredData = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    const expiredOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .collect();

    for (const otp of expiredOTPs) {
      await ctx.db.delete(otp._id);
    }

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

export const getAdminEmails = query({
  handler: async () => {
    return { emails: ADMIN_EMAILS, count: ADMIN_EMAILS.length };
  },
});

export const getOTPStats = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const allOTPs = await ctx.db
      .query("adminOTPs")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    const activeOTPs = allOTPs.filter((otp) => otp.expiresAt > Date.now());
    const expiredOTPs = allOTPs.filter((otp) => otp.expiresAt <= Date.now());

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentOTPs = allOTPs.filter((otp) => otp.createdAt >= oneHourAgo);

    return {
      total: allOTPs.length,
      active: activeOTPs.length,
      expired: expiredOTPs.length,
      recentRequests: recentOTPs.length,
      canRequestNew: recentOTPs.length < MAX_OTP_REQUESTS_PER_HOUR,
    };
  },
});
