import { mutation } from "./_generated/server";

export const seedTestData = mutation({
  handler: async (ctx) => {
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
      name: "العقيدة الإسلامية",
      description: "دراسة العقيدة الإسلامية الصحيحة",
      instructor: "الشيخ عبد العزيز بن باز",
      isActive: true,
      createdAt: Date.now(),
      students: [studentId],
    });

    // Update student with courses
    await ctx.db.patch(studentId, {
      courses: [course1Id, course2Id],
    });

    // Create test meetings
    const now = Date.now();
    const nextHour = now + 60 * 60 * 1000; // 1 hour from now
    const tomorrow = now + 24 * 60 * 60 * 1000; // tomorrow

    const meeting1Id = await ctx.db.insert("meetings", {
      courseId: course1Id,
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
      password: "123456",
      scheduledTime: nextHour,
      duration: 90, // 90 minutes
      isActive: true,
      createdBy: studentId,
    });

    const meeting2Id = await ctx.db.insert("meetings", {
      courseId: course2Id,
      googleMeetLink: "https://meet.google.com/xyz-uvwx-yzab",
      password: "789012",
      scheduledTime: tomorrow,
      duration: 60, // 60 minutes
      isActive: true,
      createdBy: studentId,
    });

    // Create test lessons
    await ctx.db.insert("lessons", {
      courseId: course1Id,
      meetingId: meeting1Id,
      title: "مقدمة في أصول الفقه",
      description: "درس تمهيدي في أصول الفقه الحنبلي",
      scheduledTime: nextHour,
      resources: [],
    });

    await ctx.db.insert("lessons", {
      courseId: course2Id,
      meetingId: meeting2Id,
      title: "أركان الإيمان",
      description: "شرح أركان الإيمان الستة",
      scheduledTime: tomorrow,
      resources: [],
    });

    // Create more lessons for the week
    for (let i = 1; i <= 5; i++) {
      const lessonTime = now + i * 24 * 60 * 60 * 1000; // Each day this week
      
      await ctx.db.insert("lessons", {
        courseId: i % 2 === 0 ? course1Id : course2Id,
        title: `الدرس ${i} - ${i % 2 === 0 ? 'أصول الفقه' : 'العقيدة'}`,
        description: `وصف الدرس رقم ${i}`,
        scheduledTime: lessonTime,
        resources: [],
      });
    }

    // Create test news
    await ctx.db.insert("news", {
      title: "مرحباً بكم في أكاديمية تراث الحنابلة",
      content: "نرحب بجميع الطلاب في منصتنا التعليمية الجديدة. نسأل الله أن ينفع بها وأن يبارك في جهودكم العلمية.",
      publishedAt: now - 60 * 60 * 1000, // 1 hour ago
      isPublished: true,
      attachments: [],
      createdBy: studentId,
    });

    await ctx.db.insert("news", {
      title: "تحديث في جدول الدروس",
      content: "تم تحديث جدول الدروس لهذا الأسبوع. يرجى مراجعة الجدول الجديد والاستعداد للدروس القادمة.",
      publishedAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
      isPublished: true,
      attachments: [],
      createdBy: studentId,
    });

    return {
      message: "Test data seeded successfully",
      studentId,
      courses: [course1Id, course2Id],
      meetings: [meeting1Id, meeting2Id],
    };
  },
});