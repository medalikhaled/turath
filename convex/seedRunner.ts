import { mutation } from "./_generated/server";

// This is a wrapper to run the seed function
export const runSeed = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "ahmed@example.com"))
      .first();

    if (existingUser) {
      const existingStudent = await ctx.db
        .query("students")
        .withIndex("by_user_id", (q) => q.eq("userId", existingUser._id))
        .first();
      return { message: "Test data already exists", studentId: existingStudent?._id };
    }

    // Create test data inline (copied from seed.ts)
    // Create a mock user first
    const userId = await ctx.db.insert("users", {
      name: "أحمد محمد",
      email: "ahmed@example.com",
      emailVerificationTime: Date.now(),
      image: undefined,
    });

    // Create a test student
    const studentId = await ctx.db.insert("students", {
      userId: userId,
      name: "أحمد محمد",
      enrollmentDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      isActive: true,
      courses: [],
      role: "student",
    });

    // Create test courses
    const course1Id = await ctx.db.insert("courses", {
      name: "أصول الفقه الحنبلي",
      description: "دراسة أصول الفقه على المذهب الحنبلي",
      instructor: "الشيخ محمد العثيمين",
      isActive: true,
      createdAt: Date.now(),
      students: [studentId],
    });

    const course2Id = await ctx.db.insert("courses", {
      name: "العقيدة الطحاوية",
      description: "شرح العقيدة الطحاوية",
      instructor: "الشيخ صالح الفوزان",
      isActive: true,
      createdAt: Date.now(),
      students: [studentId],
    });

    // Update student with courses
    await ctx.db.patch(studentId, {
      courses: [course1Id, course2Id],
    });

    // Create test news
    const newsId = await ctx.db.insert("news", {
      title: "مرحباً بكم في أكاديمية تراث الحنابلة",
      content: "نرحب بجميع الطلاب في منصتنا التعليمية المتخصصة في تدريس التراث الإسلامي على المذهب الحنبلي. نسأل الله أن ينفع بهذا العلم ويبارك فيه.",
      publishedAt: Date.now(),
      isPublished: true,
      attachments: [],
      createdBy: userId,
    });

    return {
      message: "Test data created successfully",
      studentId,
      courses: [course1Id, course2Id],
      meetings: [],
    };
  },
});