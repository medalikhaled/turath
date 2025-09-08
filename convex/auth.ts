import { query } from "./_generated/server";

// Get default admin user (temporary solution until Clerk is integrated)
export const getDefaultAdminUser = query({
  handler: async (ctx) => {
    // For now, return the seeded test user as admin
    const adminUser = await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("clerkId"), "mock_student_id"))
      .first();
    
    return adminUser;
  },
});

// Check if user is admin (temporary solution)
export const isUserAdmin = query({
  handler: async (ctx) => {
    // For now, all users are considered admin
    // This will be replaced with proper role-based authentication
    return true;
  },
});