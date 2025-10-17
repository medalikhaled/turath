import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

export const createAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("Admin user already exists", "ADMIN_EXISTS");
    }

    // Create admin user in users table with proper OSLOJS hash
    const adminId = await ctx.db.insert("users", {
      email,
      passwordHash: args.password, // OSLOJS hashed password
      role: "admin",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create a corresponding entry in students table (for admin profile data)
    await ctx.db.insert("students", {
      userId: adminId,
      name: args.name,
      courses: [],
      enrollmentDate: Date.now(),
      requiresPasswordChange: false,
    });

    return {
      success: true,
      adminId,
      email,
      name: args.name,
      message: "Admin user created successfully",
    };
  },
});

// Get all admin users
export const getAllAdmins = query({
  handler: async (ctx) => {
    // Get admins from users table
    const userAdmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    // Get corresponding student records for user admins
    const adminProfiles = await Promise.all(
      userAdmins.map(async (user) => {
        const studentProfile = await ctx.db
          .query("students")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();

        return {
          id: user._id,
          email: user.email,
          name: studentProfile?.name || "Admin User",
          isActive: user.isActive,
          createdAt: user.createdAt,
          enrollmentDate: studentProfile?.enrollmentDate || user.createdAt,
          source: "users_table",
        };
      })
    );

    return adminProfiles;
  },
});

// Verify admin user exists and can be queried correctly
export const verifyAdminUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check users table
    const userAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (userAdmin) {
      const studentProfile = await ctx.db
        .query("students")
        .withIndex("by_user_id", (q) => q.eq("userId", userAdmin._id))
        .first();

      return {
        exists: true,
        source: "users_table",
        admin: {
          id: userAdmin._id,
          email: userAdmin.email,
          name: studentProfile?.name || "Admin User",
          isActive: userAdmin.isActive,
          createdAt: userAdmin.createdAt,
          hasStudentProfile: !!studentProfile,
        },
      };
    }

    return {
      exists: false,
      message: "Admin user not found in system",
    };
  },
});

// Reset all admin data and start fresh
export const resetAdminSystem = mutation({
  handler: async (ctx) => {
    console.log("🔥 Starting admin system reset...");
    
    // Delete all users with admin role
    const adminUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    
    // Delete associated student profiles first
    for (const admin of adminUsers) {
      const studentProfile = await ctx.db
        .query("students")
        .withIndex("by_user_id", (q) => q.eq("userId", admin._id))
        .first();
      
      if (studentProfile) {
        await ctx.db.delete(studentProfile._id);
      }
      
      await ctx.db.delete(admin._id);
    }
    
    // Delete all admin OTPs
    const adminOTPs = await ctx.db.query("adminOTPs").collect();
    for (const otp of adminOTPs) {
      await ctx.db.delete(otp._id);
    }
    
    // Delete all admin sessions
    const adminSessions = await ctx.db.query("adminSessions").collect();
    for (const session of adminSessions) {
      await ctx.db.delete(session._id);
    }
    
    console.log("🔥 Admin system reset complete");
    
    return {
      success: true,
      message: "Admin system reset successfully",
      deletedUsers: adminUsers.length,
      deletedOTPs: adminOTPs.length,
      deletedSessions: adminSessions.length,
    };
  },
});

// Create admin user with email only (password-less, OTP-based)
export const createAdminUserOTP = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check if admin already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("Admin user already exists", "ADMIN_EXISTS");
    }

    // Create admin user in users table (no password, OTP-based)
    const adminId = await ctx.db.insert("users", {
      email,
      role: "admin",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create corresponding entry in students table (for admin profile data)
    await ctx.db.insert("students", {
      userId: adminId,
      name: args.name,
      courses: [],
      enrollmentDate: Date.now(),
      requiresPasswordChange: false,
    });

    return {
      success: true,
      adminId,
      email,
      name: args.name,
      message: "OTP-based admin user created successfully",
    };
  },
});

// Delete admin user (for cleanup if needed)
export const deleteAdminUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check users table
    const userAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (userAdmin) {
      // Delete corresponding student profile first
      const studentProfile = await ctx.db
        .query("students")
        .withIndex("by_user_id", (q) => q.eq("userId", userAdmin._id))
        .first();
      
      if (studentProfile) {
        await ctx.db.delete(studentProfile._id);
      }

      // Delete from users table
      await ctx.db.delete(userAdmin._id);

      return {
        success: true,
        message: "Admin user deleted successfully",
      };
    }

    throw new ConvexError("Admin user not found", "ADMIN_NOT_FOUND");
  },
});