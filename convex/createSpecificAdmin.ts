import { mutation } from "./_generated/server";

export const createSpecificAdmin = mutation({
  handler: async (ctx) => {
    const adminEmail = "medalikhaled331@gmail.com";
    
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", adminEmail))
      .first();

    if (existingAdmin) {
      return {
        success: true,
        message: "Admin user already exists",
        admin: {
          id: existingAdmin._id,
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role,
        }
      };
    }

    // Create the specific admin user
    const adminId = await ctx.db.insert("students", {
      email: adminEmail,
      name: "المدير الرئيسي",
      password: "hashed_password_placeholder", // This would be properly hashed in production
      role: "admin",
      isActive: true,
      enrollmentDate: Date.now(),
      courses: [],
    });

    return {
      success: true,
      message: "Admin user created successfully",
      admin: {
        id: adminId,
        email: adminEmail,
        name: "المدير الرئيسي",
        role: "admin",
      }
    };
  },
});