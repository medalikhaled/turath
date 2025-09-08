import { mutation } from "./_generated/server";

export const createSimpleTestData = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { message: "Data already exists, skipping seed" };
    }

    // Create a simple test user (you'll need to create auth separately)
    const userId = await ctx.db.insert("users", {
      name: "أحمد محمد",
      email: "test@example.com",
      emailVerificationTime: Date.now(),
      image: undefined,
    });

    // Create student profile
    const studentId = await ctx.db.insert("students", {
      userId: userId,
      name: "أحمد محمد",
      enrollmentDate: Date.now(),
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

    // Create meetings
    const now = Date.now();
    const nextHour = now + 60 * 60 * 1000;
    const tomorrow = now + 24 * 60 * 60 * 1000;

    const meeting1Id = await ctx.db.insert("meetings", {
      courseId: course1Id,
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
      password: "123456",
      scheduledTime: nextHour,
      duration: 90,
      isActive: true,
      createdBy: userId,
    });

    const meeting2Id = await ctx.db.insert("meetings", {
      courseId: course2Id,
      googleMeetLink: "https://meet.google.com/xyz-uvwx-yzab",
      password: "789012",
      scheduledTime: tomorrow,
      duration: 60,
      isActive: true,
      createdBy: userId,
    });

    // Create lessons
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

    // Create news
    await ctx.db.insert("news", {
      title: "مرحباً بكم في أكاديمية تراث الحنابلة",
      content: "نرحب بجميع الطلاب في منصتنا التعليمية الجديدة.",
      publishedAt: now - 60 * 60 * 1000,
      isPublished: true,
      attachments: [],
      createdBy: userId,
    });

    return {
      message: "Simple test data created successfully!",
      userId,
      studentId,
      courses: [course1Id, course2Id],
      meetings: [meeting1Id, meeting2Id],
      note: "You need to create authentication credentials separately through Convex Auth"
    };
  },
});

export const clearAllData = mutation({
  handler: async (ctx) => {
    // Delete everything
    const lessons = await ctx.db.query("lessons").collect();
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    const meetings = await ctx.db.query("meetings").collect();
    for (const meeting of meetings) {
      await ctx.db.delete(meeting._id);
    }

    const news = await ctx.db.query("news").collect();
    for (const newsItem of news) {
      await ctx.db.delete(newsItem._id);
    }

    const courses = await ctx.db.query("courses").collect();
    for (const course of courses) {
      await ctx.db.delete(course._id);
    }

    const students = await ctx.db.query("students").collect();
    for (const student of students) {
      await ctx.db.delete(student._id);
    }

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    return { message: "All data cleared" };
  },
});