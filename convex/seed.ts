import { mutation } from "./_generated/server";

export const seedTestData = mutation({
  handler: async (ctx) => {
    // Create multiple test users with different roles
    const users = [
      {
        name: "أحمد محمد الطالب",
        email: "ahmed@student.com",
        role: "student"
      },
      {
        name: "فاطمة علي الطالبة", 
        email: "fatima@student.com",
        role: "student"
      },
      {
        name: "محمد عبدالله المدرس",
        email: "mohammed@admin.com", 
        role: "admin"
      },
      {
        name: "عائشة حسن الطالبة",
        email: "aisha@student.com",
        role: "student"
      }
    ];

    const createdUsers = [];
    const createdStudents = [];

    // Create users and students
    for (const userData of users) {
      const userId = await ctx.db.insert("users", {
        name: userData.name,
        email: userData.email,
        emailVerificationTime: Date.now(),
        image: undefined,
      });

      const studentId = await ctx.db.insert("students", {
        userId: userId,
        name: userData.name,
        enrollmentDate: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000, // Random enrollment within last 90 days
        isActive: true,
        courses: [],
        role: userData.role as "student" | "admin",
      });

      createdUsers.push({ id: userId, ...userData });
      createdStudents.push({ id: studentId, userId, ...userData });
    }

    // Use the first student for main operations
    const mainStudent = createdStudents[0];
    const adminUser = createdUsers.find(u => u.role === "admin");

    // Create test courses
    const course1Id = await ctx.db.insert("courses", {
      name: "أصول الفقه الحنبلي",
      description: "دراسة أصول الفقه على المذهب الحنبلي",
      instructor: "الشيخ محمد العثيمين",
      isActive: true,
      createdAt: Date.now(),
      students: [],
    });

    const course2Id = await ctx.db.insert("courses", {
      name: "العقيدة الإسلامية",
      description: "دراسة العقيدة الإسلامية الصحيحة",
      instructor: "الشيخ عبد العزيز بن باز",
      isActive: true,
      createdAt: Date.now(),
      students: [],
    });

    // Update all students with courses
    for (const student of createdStudents) {
      await ctx.db.patch(student.id, {
        courses: [course1Id, course2Id],
      });
    }

    // Update courses with all students
    await ctx.db.patch(course1Id, {
      students: createdStudents.map(s => s.id),
    });
    
    await ctx.db.patch(course2Id, {
      students: createdStudents.map(s => s.id),
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
      createdBy: adminUser?.id || mainStudent.userId,
    });

    const meeting2Id = await ctx.db.insert("meetings", {
      courseId: course2Id,
      googleMeetLink: "https://meet.google.com/xyz-uvwx-yzab",
      password: "789012",
      scheduledTime: tomorrow,
      duration: 60, // 60 minutes
      isActive: true,
      createdBy: adminUser?.id || mainStudent.userId,
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
      createdBy: adminUser?.id || mainStudent.userId,
    });

    await ctx.db.insert("news", {
      title: "تحديث في جدول الدروس",
      content: "تم تحديث جدول الدروس لهذا الأسبوع. يرجى مراجعة الجدول الجديد والاستعداد للدروس القادمة.",
      publishedAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
      isPublished: true,
      attachments: [],
      createdBy: adminUser?.id || mainStudent.userId,
    });

    // Create additional news items
    const newsItems = [
      {
        title: "إعلان عن محاضرة خاصة",
        content: "ستقام محاضرة خاصة بعنوان 'منهج السلف في طلب العلم' يوم الجمعة القادم بإذن الله.",
        publishedAt: now - 3 * 60 * 60 * 1000,
      },
      {
        title: "تذكير بآداب طلب العلم",
        content: "نذكر إخواننا الطلاب بأهمية الالتزام بآداب طلب العلم والحضور في الوقت المحدد.",
        publishedAt: now - 6 * 60 * 60 * 1000,
      },
      {
        title: "مكتبة الكتب الإلكترونية",
        content: "تم إضافة مجموعة جديدة من الكتب الإلكترونية في مكتبة الأكاديمية. يمكنكم الاطلاع عليها في قسم المراجع.",
        publishedAt: now - 12 * 60 * 60 * 1000,
      }
    ];

    for (const newsItem of newsItems) {
      await ctx.db.insert("news", {
        title: newsItem.title,
        content: newsItem.content,
        publishedAt: newsItem.publishedAt,
        isPublished: true,
        attachments: [],
        createdBy: adminUser?.id || mainStudent.userId,
      });
    }

    return {
      message: "Test data seeded successfully",
      users: createdUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
      students: createdStudents.map(s => ({ id: s.id, name: s.name, role: s.role })),
      courses: [course1Id, course2Id],
      meetings: [meeting1Id, meeting2Id],
      loginCredentials: [
        { email: "ahmed@student.com", password: "password123", role: "student" },
        { email: "fatima@student.com", password: "password123", role: "student" },
        { email: "mohammed@admin.com", password: "admin123", role: "admin" },
        { email: "aisha@student.com", password: "password123", role: "student" }
      ]
    };
  },
});