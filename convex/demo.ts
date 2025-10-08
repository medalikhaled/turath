import { query } from "./_generated/server";

// Get first student for demo purposes (no auth required)
export const getFirstStudentForDemo = query({
  args: {},
  handler: async (ctx) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    return student;
  },
});

export const getAllStudentsForDemo = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("students")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});
