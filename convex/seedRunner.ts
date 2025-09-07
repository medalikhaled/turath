import { mutation } from "./_generated/server";

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
    
    // Create test data inline (copied from seed.ts)
    // Create a test student
    const studentId = await ctx.db.insert("students", {
      clerkId: "mock_student_id",
      name: "أحمد محمد",
      email: "ahmed@example.com",
      enrollmentDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      isActive: true,
      courses: [],
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
      createdBy: studentId,
    });

    return { 
      message: "Test data created successfully", 
      studentId,
      courses: [course1Id, course2Id],
      meetings: [],
    };
  },
});