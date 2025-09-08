import { mutation } from "./_generated/server";
import { auth } from "./auth";

export const seedWithAuthData = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { message: "Data already exists, skipping seed" };
    }

    // Create test accounts with authentication
    const testAccounts = [
      {
        name: "أحمد محمد الطالب",
        email: "ahmed@student.com",
        password: "password123",
        role: "student" as const
      },
      {
        name: "فاطمة علي الطالبة", 
        email: "fatima@student.com",
        password: "password123",
        role: "student" as const
      },
      {
        name: "محمد عبدالله المدرس",
        email: "mohammed@admin.com", 
        password: "admin123",
        role: "admin" as const
      },
      {
        name: "محمد علي",
        email: "medalikhaled331@gmail.com", 
        password: "admin123",
        role: "admin" as const
      },
      {
        name: "عائشة حسن الطالبة",
        email: "aisha@student.com",
        password: "password123",
        role: "student" as const
      }
    ];

    const createdUsers = [];
    const createdStudents = [];

    // Create users with authentication
    for (const account of testAccounts) {
      // Create user with auth
      const userId = await ctx.db.insert("users", {
        name: account.name,
        email: account.email,
        emailVerificationTime: Date.now(),
        image: undefined,
      });

      // Create student profile
      const studentId = await ctx.db.insert("students", {
        userId: userId,
        name: account.name,
        enrollmentDate: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
        isActive: true,
        courses: [],
        role: account.role,
      });

      createdUsers.push({ id: userId, ...account });
      createdStudents.push({ id: studentId, userId, ...account });
    }

    // Create test courses
    const course1Id = await ctx.db.insert("courses", {
      name: "أصول الفقه الحنبلي",
      description: "دراسة أصول الفقه على المذهب الحنبلي مع التطبيقات العملية",
      instructor: "الشيخ محمد العثيمين",
      isActive: true,
      createdAt: Date.now(),
      students: createdStudents.map(s => s.id),
    });

    const course2Id = await ctx.db.insert("courses", {
      name: "العقيدة الإسلامية",
      description: "دراسة العقيدة الإسلامية الصحيحة على منهج السلف الصالح",
      instructor: "الشيخ عبد العزيز بن باز",
      isActive: true,
      createdAt: Date.now(),
      students: createdStudents.map(s => s.id),
    });

    const course3Id = await ctx.db.insert("courses", {
      name: "الحديث النبوي الشريف",
      description: "دراسة الأحاديث النبوية الصحيحة وشرحها",
      instructor: "الشيخ الألباني",
      isActive: true,
      createdAt: Date.now(),
      students: createdStudents.filter(s => s.role === "student").map(s => s.id),
    });

    // Update students with courses
    for (const student of createdStudents) {
      const courses = student.role === "admin" 
        ? [course1Id, course2Id, course3Id]
        : [course1Id, course2Id];
      
      await ctx.db.patch(student.id, { courses });
    }

    // Create meetings for the next week
    const now = Date.now();
    const adminUser = createdUsers.find(u => u.role === "admin");
    const meetings = [];

    // Create meetings for each course
    const courseMeetings = [
      {
        courseId: course1Id,
        title: "أصول الفقه",
        link: "https://meet.google.com/abc-defg-hij",
        password: "123456"
      },
      {
        courseId: course2Id,
        title: "العقيدة",
        link: "https://meet.google.com/xyz-uvwx-yzab",
        password: "789012"
      },
      {
        courseId: course3Id,
        title: "الحديث",
        link: "https://meet.google.com/def-ghij-klm",
        password: "345678"
      }
    ];

    // Create meetings for the next 7 days
    for (let day = 0; day < 7; day++) {
      for (let i = 0; i < courseMeetings.length; i++) {
        const course = courseMeetings[i];
        const meetingTime = now + (day * 24 * 60 * 60 * 1000) + (i * 2 * 60 * 60 * 1000) + (9 * 60 * 60 * 1000); // Start at 9 AM, 2 hours apart
        
        if (meetingTime > now) { // Only future meetings
          const meetingId = await ctx.db.insert("meetings", {
            courseId: course.courseId,
            googleMeetLink: course.link,
            password: course.password,
            scheduledTime: meetingTime,
            duration: 90, // 90 minutes
            isActive: true,
            createdBy: adminUser?.id || createdUsers[0].id,
          });
          
          meetings.push(meetingId);

          // Create corresponding lesson
          await ctx.db.insert("lessons", {
            courseId: course.courseId,
            meetingId: meetingId,
            title: `${course.title} - الدرس ${day + 1}`,
            description: `درس في ${course.title} - اليوم ${day + 1}`,
            scheduledTime: meetingTime,
            resources: [],
          });
        }
      }
    }

    // Create news and announcements
    const newsItems = [
      {
        title: "مرحباً بكم في أكاديمية تراث الحنابلة",
        content: "نرحب بجميع الطلاب في منصتنا التعليمية الجديدة. نسأل الله أن ينفع بها وأن يبارك في جهودكم العلمية. ستجدون هنا جميع الدروس والمحاضرات والمواد التعليمية.",
        publishedAt: now - 60 * 60 * 1000,
      },
      {
        title: "جدول الدروس الأسبوعي",
        content: "تم نشر جدول الدروس لهذا الأسبوع. يرجى مراجعة الجدول والاستعداد للدروس. نذكركم بأهمية الحضور في الوقت المحدد والاستعداد المسبق للدروس.",
        publishedAt: now - 2 * 60 * 60 * 1000,
      },
      {
        title: "محاضرة خاصة: منهج السلف في طلب العلم",
        content: "ستقام محاضرة خاصة بعنوان 'منهج السلف الصالح في طلب العلم' يوم الجمعة القادم الساعة 8 مساءً. المحاضرة مفتوحة لجميع الطلاب.",
        publishedAt: now - 4 * 60 * 60 * 1000,
      },
      {
        title: "آداب طلب العلم",
        content: "نذكر إخواننا الطلاب بأهمية الالتزام بآداب طلب العلم: الوضوء قبل الدرس، الحضور المبكر، إحضار الكتب والأدوات، واحترام المعلم والزملاء.",
        publishedAt: now - 8 * 60 * 60 * 1000,
      },
      {
        title: "مكتبة الكتب الإلكترونية",
        content: "تم إضافة مجموعة جديدة من الكتب الإلكترونية في مكتبة الأكاديمية تشمل: كتب الفقه، العقيدة، الحديث، والتفسير. يمكنكم تحميلها من قسم المراجع.",
        publishedAt: now - 12 * 60 * 60 * 1000,
      },
      {
        title: "تنبيه مهم: امتحانات نهاية الشهر",
        content: "نذكر الطلاب بأن امتحانات نهاية الشهر ستبدأ الأسبوع القادم. يرجى مراجعة المواد والاستعداد الجيد. وفقكم الله جميعاً.",
        publishedAt: now - 24 * 60 * 60 * 1000,
      }
    ];

    for (const newsItem of newsItems) {
      await ctx.db.insert("news", {
        title: newsItem.title,
        content: newsItem.content,
        publishedAt: newsItem.publishedAt,
        isPublished: true,
        attachments: [],
        createdBy: adminUser?.id || createdUsers[0].id,
      });
    }

    return {
      message: "Complete test data with authentication seeded successfully!",
      accounts: testAccounts.map(acc => ({
        name: acc.name,
        email: acc.email,
        password: acc.password,
        role: acc.role
      })),
      stats: {
        users: createdUsers.length,
        students: createdStudents.length,
        courses: 3,
        meetings: meetings.length,
        news: newsItems.length
      },
      loginInstructions: "Use any of the email/password combinations above to login to the system."
    };
  },
});

// Helper function to clear all data (for development)
export const clearAllData = mutation({
  handler: async (ctx) => {
    // Delete in reverse dependency order
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

    const files = await ctx.db.query("files").collect();
    for (const file of files) {
      await ctx.db.delete(file._id);
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

    return { message: "All data cleared successfully" };
  },
});