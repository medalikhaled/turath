import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "./utils";

// Create admin user with hashed password
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(), // This should be already hashed when calling this function
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingAdmin) {
      throw new ConvexError("المدير موجود بالفعل", "ADMIN_EXISTS");
    }

    // Create admin user in students table with admin role
    const adminId = await ctx.db.insert("students", {
      email,
      name: args.name,
      password: args.password, // Should be hashed before calling this function
      role: "admin",
      isActive: true,
      enrollmentDate: Date.now(),
      courses: [],
    });

    return {
      success: true,
      adminId,
      email,
      name: args.name,
      message: "تم إنشاء حساب المدير بنجاح",
    };
  },
});

// Get all admin users
export const getAllAdmins = query({
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("students")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    return admins.map(admin => ({
      id: admin._id,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
      enrollmentDate: admin.enrollmentDate,
    }));
  },
});

// Delete admin user (for cleanup if needed)
export const deleteAdminUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    const admin = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!admin) {
      throw new ConvexError("المدير غير موجود", "ADMIN_NOT_FOUND");
    }

    await ctx.db.delete(admin._id);

    return {
      success: true,
      message: "تم حذف حساب المدير بنجاح",
    };
  },
});