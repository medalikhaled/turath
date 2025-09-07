import { mutation } from "./_generated/server";
import { seedTestData } from "./seed";

// This is a wrapper to run the seed function
export const runSeed = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "mock_student_id"))
      .first();
    
    if (existingStudent) {
      return { message: "Test data already exists", studentId: existingStudent._id };
    }
    
    // Run the seed function
    return await seedTestData(ctx, {});
  },
});