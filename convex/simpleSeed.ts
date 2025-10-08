import { mutation } from "./_generated/server";

export const createCompleteTestData = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { message: "Data already exists, skipping seed" };
    }

    // Define test accounts with login credentials
    const testAccounts = [
      {
        name: "أحمد محمد الطالب",
        email: "ahmed@student.com",
        password: "student123",
        role: "student" as const
      },
      {
        name: "فاطمة علي الطالبة", 
        email: "fatima@student.com",
        password: "student123",
        role: "student" as const
      },
      {
        name: "عائشة حسن الطالبة",
        email: "aisha@student.com",
        password: "student123",
        role: "student" as const
      },
      {
        name: "محمد عبدالله المدرس",
        email: "admin@academy.com", 
        password: "admin123",
        role: "admin" as const
      },
      {
        name: "سارة أحمد المساعدة",
        email: "sara@academy.com",
        password: "admin123", 
        role: "admin" as const
      }
    ];

    const createdUsers = [];
    const createdStudents = [];

    // Create users with password placeholders (for future auth implementation)
    for (const account of testAccounts) {
      const userId = await ctx.db.insert("users", {
        name: account.name,
        email: account.email,
        emailVerificationTime: Date.now(),
        image: undefined,
        // Note: In real implementation, passwords would be hashed by Convex Auth
        // For now, we'll store them as a reference in the return data
      });

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

    const adminUsers = createdUsers.filter(u => u.role === "admin");
    const studentUsers = createdUsers.filter(u => u.role === "student");
    const adminStudents = createdStudents.filter(s => s.role === "admin");
    const regularStudents = createdStudents.filter(s => s.role === "student");

    // Create comprehensive course catalog
    const courses = [
      {
        name: "أصول الفقه الحنبلي",
        description: "دراسة شاملة لأصول الفقه على المذهب الحنبلي مع التطبيقات العملية والأمثلة المعاصرة",
        instructor: "الشيخ محمد العثيمين",
        level: "متوسط"
      },
      {
        name: "العقيدة الإسلامية",
        description: "دراسة العقيدة الإسلامية الصحيحة على منهج السلف الصالح مع الرد على الشبهات",
        instructor: "الشيخ عبد العزيز بن باز",
        level: "مبتدئ"
      },
      {
        name: "الحديث النبوي الشريف",
        description: "دراسة الأحاديث النبوية الصحيحة وشرحها مع بيان درجات الأحاديث وعلوم المصطلح",
        instructor: "الشيخ الألباني",
        level: "متقدم"
      },
      {
        name: "التفسير وعلوم القرآن",
        description: "تفسير آيات مختارة من القرآن الكريم مع دراسة علوم القرآن وأسباب النزول",
        instructor: "الشيخ ابن كثير",
        level: "متوسط"
      },
      {
        name: "السيرة النبوية",
        description: "دراسة سيرة النبي صلى الله عليه وسلم من الولادة إلى الوفاة مع استخراج الدروس والعبر",
        instructor: "الشيخ صفي الرحمن المباركفوري",
        level: "مبتدئ"
      }
    ];

    const createdCourses = [];
    for (const course of courses) {
      const courseId = await ctx.db.insert("courses", {
        name: course.name,
        description: course.description,
        instructor: course.instructor,
        isActive: true,
        createdAt: Date.now(),
        students: regularStudents.map(s => s.id),
      });
      createdCourses.push({ id: courseId, ...course });
    }

    // Update students with courses (students get all courses, admins get access to manage them)
    for (const student of regularStudents) {
      await ctx.db.patch(student.id, { 
        courses: createdCourses.map(c => c.id) 
      });
    }

    for (const admin of adminStudents) {
      await ctx.db.patch(admin.id, { 
        courses: createdCourses.map(c => c.id) 
      });
    }

    // Create comprehensive meeting schedule for the next 2 weeks
    const now = Date.now();
    const meetings = [];
    const meetingLinks = [
      { link: "https://meet.google.com/abc-defg-hij", password: "123456" },
      { link: "https://meet.google.com/xyz-uvwx-yzab", password: "789012" },
      { link: "https://meet.google.com/def-ghij-klm", password: "345678" },
      { link: "https://meet.google.com/mno-pqrs-tuv", password: "901234" },
      { link: "https://meet.google.com/wxy-zabc-def", password: "567890" }
    ];

    // Create meetings for the next 14 days
    for (let day = 0; day < 14; day++) {
      for (let courseIndex = 0; courseIndex < Math.min(createdCourses.length, 3); courseIndex++) {
        // Schedule 3 courses per day with different times
        const course = createdCourses[courseIndex];
        const meetingLink = meetingLinks[courseIndex % meetingLinks.length];
        
        // Different times: 9 AM, 2 PM, 7 PM
        const times = [9, 14, 19];
        const meetingTime = now + (day * 24 * 60 * 60 * 1000) + (times[courseIndex] * 60 * 60 * 1000);
        
        if (meetingTime > now) { // Only future meetings
          const meetingId = await ctx.db.insert("meetings", {
            courseId: course.id,
            googleMeetLink: meetingLink.link,
            password: meetingLink.password,
            scheduledTime: meetingTime,
            duration: 90, // 90 minutes
            isActive: true,
            createdBy: adminUsers[0]?.id || createdUsers[0].id,
          });
          
          meetings.push({
            id: meetingId,
            courseId: course.id,
            courseName: course.name,
            scheduledTime: meetingTime,
            day: day + 1
          });
        }
      }
    }

    // Create lessons for each meeting
    const lessons = [];
    for (const meeting of meetings) {
      const course = createdCourses.find(c => c.id === meeting.courseId);
      if (course) {
        const lessonId = await ctx.db.insert("lessons", {
          courseId: meeting.courseId,
          meetingId: meeting.id,
          title: `${course.name} - اليوم ${meeting.day}`,
          description: `درس في ${course.name} - المستوى: ${course.level}`,
          scheduledTime: meeting.scheduledTime,
          resources: [],
        });
        
        lessons.push({
          id: lessonId,
          title: `${course.name} - اليوم ${meeting.day}`,
          courseId: meeting.courseId
        });
      }
    }

    // Create additional standalone lessons (for courses without meetings)
    const additionalLessons = [
      { courseIndex: 2, title: "مقدمة في علم الحديث", description: "أساسيات علم الحديث ومصطلحاته" },
      { courseIndex: 3, title: "مقدمة في التفسير", description: "أصول التفسير وقواعده" },
      { courseIndex: 4, title: "ولادة النبي ونشأته", description: "سيرة النبي في مكة قبل البعثة" }
    ];

    for (let i = 0; i < additionalLessons.length; i++) {
      const lesson = additionalLessons[i];
      const course = createdCourses[lesson.courseIndex];
      if (course) {
        const lessonTime = now + ((i + 1) * 2 * 24 * 60 * 60 * 1000); // Every 2 days
        
        const lessonId = await ctx.db.insert("lessons", {
          courseId: course.id,
          title: lesson.title,
          description: lesson.description,
          scheduledTime: lessonTime,
          resources: [],
        });
        
        lessons.push({
          id: lessonId,
          title: lesson.title,
          courseId: course.id
        });
      }
    }

    // Create comprehensive news and announcements
    const newsItems = [
      {
        title: "🎉 مرحباً بكم في أكاديمية تراث الحنابلة",
        content: "بسم الله الرحمن الرحيم، نرحب بجميع الطلاب والطالبات في منصتنا التعليمية الجديدة. تهدف الأكاديمية إلى نشر العلم الشرعي على منهج السلف الصالح. نسأل الله أن ينفع بها وأن يبارك في جهودكم العلمية ويجعلها في ميزان حسناتكم.",
        publishedAt: now - 30 * 60 * 1000, // 30 minutes ago
        priority: "high"
      },
      {
        title: "📅 جدول الدروس للأسبوعين القادمين",
        content: "تم نشر جدول الدروس للأسبوعين القادمين. يشمل الجدول دروساً في أصول الفقه، العقيدة، الحديث، التفسير، والسيرة النبوية. يرجى مراجعة الجدول والاستعداد للدروس بقراءة المراجع المطلوبة.",
        publishedAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
        priority: "medium"
      },
      {
        title: "🎓 محاضرة خاصة: منهج السلف في طلب العلم",
        content: "ستقام محاضرة خاصة بعنوان 'منهج السلف الصالح في طلب العلم وآدابه' يوم الجمعة القادم الساعة 8 مساءً بتوقيت مكة المكرمة. المحاضرة مفتوحة لجميع الطلاب والمهتمين. سيتم إرسال رابط الحضور قبل الموعد بساعة.",
        publishedAt: now - 4 * 60 * 60 * 1000, // 4 hours ago
        priority: "high"
      },
      {
        title: "📚 مكتبة الكتب الإلكترونية الجديدة",
        content: "تم إضافة مجموعة جديدة من الكتب الإلكترونية في مكتبة الأكاديمية تشمل: كتب الفقه الحنبلي، شروح العقيدة الطحاوية، مجموعات الأحاديث الصحيحة، وكتب التفسير المعتمدة. يمكنكم تحميلها من قسم المراجع في كل مقرر.",
        publishedAt: now - 8 * 60 * 60 * 1000, // 8 hours ago
        priority: "medium"
      },
      {
        title: "⚠️ تذكير مهم: آداب طلب العلم",
        content: "نذكر إخواننا وأخواتنا الطلاب بأهمية الالتزام بآداب طلب العلم: الوضوء قبل الدرس، الحضور المبكر، إحضار الكتب والأدوات اللازمة، احترام المعلم والزملاء، وعدم مقاطعة الدرس إلا للضرورة. جعل الله علمكم نافعاً مباركاً.",
        publishedAt: now - 12 * 60 * 60 * 1000, // 12 hours ago
        priority: "medium"
      },
      {
        title: "📝 تنبيه: امتحانات نهاية الشهر",
        content: "نذكر الطلاب الكرام بأن امتحانات نهاية الشهر ستبدأ الأسبوع القادم بإذن الله. تشمل الامتحانات جميع المقررات المدروسة. يرجى مراجعة المواد والاستعداد الجيد. ندعو الله أن يوفقكم جميعاً ويسدد خطاكم.",
        publishedAt: now - 24 * 60 * 60 * 1000, // 1 day ago
        priority: "high"
      },
      {
        title: "🤝 برنامج الأسئلة والأجوبة الأسبوعي",
        content: "يسعدنا أن نعلن عن بدء برنامج الأسئلة والأجوبة الأسبوعي كل يوم أحد الساعة 9 مساءً. يمكنكم إرسال أسئلتكم العلمية مسبقاً أو طرحها مباشرة أثناء الجلسة. هذا البرنامج فرصة ذهبية لتعميق الفهم وحل الإشكالات العلمية.",
        publishedAt: now - 36 * 60 * 60 * 1000, // 1.5 days ago
        priority: "medium"
      }
    ];

    const createdNews = [];
    for (const newsItem of newsItems) {
      const newsId = await ctx.db.insert("news", {
        title: newsItem.title,
        content: newsItem.content,
        publishedAt: newsItem.publishedAt,
        isPublished: true,
        attachments: [],
        createdBy: adminUsers[0]?.id || createdUsers[0].id,
      });
      
      createdNews.push({
        id: newsId,
        title: newsItem.title,
        priority: newsItem.priority
      });
    }

    return {
      success: true,
      message: "🎉 تم إنشاء البيانات التجريبية الشاملة بنجاح!",
      
      // Login credentials for testing
      loginCredentials: testAccounts.map(acc => ({
        name: acc.name,
        email: acc.email,
        password: acc.password,
        role: acc.role,
        arabicRole: acc.role === "admin" ? "مدرس/مشرف" : "طالب"
      })),
      
      // Statistics
      statistics: {
        totalUsers: createdUsers.length,
        students: studentUsers.length,
        admins: adminUsers.length,
        courses: createdCourses.length,
        meetings: meetings.length,
        lessons: lessons.length,
        newsArticles: createdNews.length
      },
      
      // Quick access info
      quickInfo: {
        nextMeeting: meetings.length > 0 ? {
          courseName: meetings[0].courseName,
          time: new Date(meetings[0].scheduledTime).toLocaleString('ar-SA')
        } : null,
        
        latestNews: createdNews.length > 0 ? createdNews[0].title : null,
        
        // Redirect suggestions based on role
        redirects: {
          student: "/student/dashboard",
          admin: "/admin/dashboard",
          default: "/student/dashboard"
        }
      },
      
      // Instructions for next steps
      instructions: {
        ar: "استخدم أي من بيانات تسجيل الدخول أعلاه للدخول إلى النظام. الطلاب يتوجهون إلى لوحة الطلاب والمدرسون إلى لوحة الإدارة.",
        en: "Use any of the login credentials above to access the system. Students go to student dashboard, teachers/admins go to admin dashboard."
      }
    };
  },
});

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