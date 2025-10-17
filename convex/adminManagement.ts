import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Hardcoded admin emails - acts as authorization filter
const ADMIN_EMAILS = ["medalikhaled331@gmail.com"];

/**
 * Check if an email is in the authorized admin list
 */
export const isAuthorizedAdmin = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(email);
  },
});

/**
 * Create or update an admin user record
 * This should be called when an admin successfully verifies OTP
 */
export const createOrUpdateAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Verify email is in authorized list
    if (!ADMIN_EMAILS.includes(email)) {
      throw new Error("Email not authorized for admin access");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        role: "admin",
        isActive: true,
        updatedAt: Date.now(),
      });

      return {
        success: true,
        userId: existingUser._id,
        isNew: false,
      };
    }

    // Create new admin user
    const userId = await ctx.db.insert("users", {
      email,
      role: "admin",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // No password hash needed for OTP-based admin auth
    });

    return {
      success: true,
      userId,
      isNew: true,
    };
  },
});

/**
 * Get admin user by email
 */
export const getAdminUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // First check if email is authorized
    if (!ADMIN_EMAILS.includes(email)) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || user.role !== "admin" || !user.isActive) {
      return null;
    }

    return {
      userId: user._id,
      email: user.email,
      name: "مدير النظام",
      role: user.role,
      isActive: user.isActive,
    };
  },
});

/**
 * List all admin users
 */
export const listAdminUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    return users.map((user) => ({
      userId: user._id,
      email: user.email,
      name: "مدير النظام",
      isActive: user.isActive,
      isAuthorized: ADMIN_EMAILS.includes(user.email),
      createdAt: user.createdAt,
    }));
  },
});

/**
 * Deactivate an admin user
 */
export const deactivateAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Admin user not found");
    }

    await ctx.db.patch(user._id, {
      isActive: false,
    });

    return { success: true };
  },
});

/**
 * Reactivate an admin user
 */
export const reactivateAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Verify email is still in authorized list
    if (!ADMIN_EMAILS.includes(email)) {
      throw new Error("Email not authorized for admin access");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Admin user not found");
    }

    await ctx.db.patch(user._id, {
      isActive: true,
    });

    return { success: true };
  },
});
