import { v } from "convex/values";
import { mutation } from "./_generated/server";
import bcrypt from 'bcryptjs';

// Migration function to convert old student records to new format
export const migrateStudentsToNewSchema = mutation({
  handler: async (ctx) => {
    console.log("Starting student migration...");
    
    // Get all students
    const allStudents = await ctx.db.query("students").collect();
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const student of allStudents) {
      // Check if this is an old format student (has password field but no userId)
      if (student.password && !student.userId) {
        console.log(`Migrating student: ${student.email}`);
        
        try {
          // Create user account for this student
          const userId = await ctx.db.insert("users", {
            email: student.email,
            passwordHash: student.password, // Password is already hashed
            role: student.role || "student",
            isActive: student.isActive,
            createdAt: Date.now(),
          });
          
          // Update student record with new fields
          await ctx.db.patch(student._id, {
            userId,
            invitationSent: false, // Default value
            createdAt: student.enrollmentDate || Date.now(),
            updatedAt: Date.now(),
            // Keep legacy fields for now (will be cleaned up later)
          });
          
          migratedCount++;
          console.log(`Successfully migrated student: ${student.email}`);
        } catch (error) {
          console.error(`Failed to migrate student ${student.email}:`, error);
        }
      } else if (student.userId) {
        // Already migrated
        skippedCount++;
      } else {
        // Missing required data
        console.warn(`Student ${student.email} is missing required data for migration`);
      }
    }
    
    console.log(`Migration completed. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    
    return {
      success: true,
      migratedCount,
      skippedCount,
      totalStudents: allStudents.length,
    };
  },
});

// Clean up legacy fields after migration is confirmed working
export const cleanupLegacyStudentFields = mutation({
  handler: async (ctx) => {
    console.log("Starting cleanup of legacy student fields...");
    
    // Get all students with legacy fields
    const studentsWithLegacyFields = await ctx.db
      .query("students")
      .filter((q) => q.neq(q.field("password"), undefined))
      .collect();
    
    let cleanedCount = 0;
    
    for (const student of studentsWithLegacyFields) {
      if (student.userId) {
        // Only clean up if migration was successful (has userId)
        await ctx.db.patch(student._id, {
          password: undefined,
          role: undefined,
        });
        cleanedCount++;
      }
    }
    
    console.log(`Cleanup completed. Cleaned: ${cleanedCount} records`);
    
    return {
      success: true,
      cleanedCount,
    };
  },
});

// Helper function to check migration status
export const checkMigrationStatus = mutation({
  handler: async (ctx) => {
    const allStudents = await ctx.db.query("students").collect();
    const allUsers = await ctx.db.query("users").collect();
    const allCourses = await ctx.db.query("courses").collect();
    const allLessons = await ctx.db.query("lessons").collect();
    
    const studentsWithUserId = allStudents.filter(s => s.userId);
    const studentsWithPassword = allStudents.filter(s => s.password);
    const studentsWithoutCreatedAt = allStudents.filter(s => !s.createdAt);
    
    return {
      totalStudents: allStudents.length,
      totalUsers: allUsers.length,
      totalCourses: allCourses.length,
      totalLessons: allLessons.length,
      studentsWithUserId: studentsWithUserId.length,
      studentsWithLegacyPassword: studentsWithPassword.length,
      studentsNeedingMigration: studentsWithoutCreatedAt.length,
      migrationNeeded: studentsWithoutCreatedAt.length > 0,
      studentDetails: allStudents.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        coursesCount: s.courses?.length || 0,
        courses: s.courses || []
      })),
      courseDetails: allCourses.map(c => ({
        id: c._id,
        name: c.name,
        studentsCount: c.students?.length || 0,
        isActive: c.isActive
      }))
    };
  },
});

// Enroll student in all active courses (for testing)
export const enrollStudentInAllCourses = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const activeCourses = await ctx.db
      .query("courses")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const courseIds = activeCourses.map(c => c._id);

    // Update student with all course IDs
    await ctx.db.patch(args.studentId, {
      courses: courseIds,
      updatedAt: Date.now()
    });

    // Update each course to include this student
    for (const course of activeCourses) {
      const currentStudents = course.students || [];
      if (!currentStudents.includes(args.studentId)) {
        await ctx.db.patch(course._id, {
          students: [...currentStudents, args.studentId]
        });
      }
    }

    return {
      success: true,
      enrolledInCourses: courseIds.length,
      message: `Student enrolled in ${courseIds.length} courses`
    };
  },
});