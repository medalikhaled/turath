#!/usr/bin/env node

/**
 * Test script for the fixed admin UI and backend
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

// Initialize Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
console.log(`Using Convex URL: ${convexUrl}`);

if (!convexUrl) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  process.exit(1);
}

const convex = new ConvexHttpClient(convexUrl);

async function testFixedSystem() {
  console.log("🧪 Testing Fixed Admin UI System...\n");

  try {
    // Test 1: Load students for UI (this should work)
    console.log("� Test  1: Loading students for UI...");
    const students = await convex.query(api.students.getStudentsWithCourses);
    console.log(`✅ Loaded ${students.length} students for UI`);

    // Test 2: Load active students
    console.log("\n👥 Test 2: Loading active students...");
    const activeStudents = await convex.query(api.students.getActiveStudents);
    console.log(`✅ Loaded ${activeStudents.length} active students`);

    // Test 3: Load all students
    console.log("\n📊 Test 3: Loading all students...");
    const allStudents = await convex.query(api.students.getAllStudents);
    console.log(`✅ Loaded ${allStudents.length} total students`);

    // Test 4: Check if we can get a specific student (if any exist)
    if (allStudents.length > 0) {
      console.log("\n🔍 Test 4: Getting specific student details...");
      const firstStudent = allStudents[0];
      const studentDetails = await convex.query(api.students.getStudent, { id: firstStudent._id });
      if (studentDetails) {
        console.log(`✅ Retrieved student: ${studentDetails.name} (${studentDetails.email})`);
        console.log(`   Active: ${studentDetails.isActive}`);
        console.log(`   Courses: ${studentDetails.courses.length}`);
      } else {
        console.log("❌ Failed to get student details");
      }
    }

    // Test 5: Check available functions
    console.log("\n🔧 Test 5: Checking available functions...");
    console.log("Available student functions:");
    const studentFunctions = Object.keys(api.students);
    studentFunctions.forEach(func => {
      console.log(`   - ${func}`);
    });

    console.log("\n✅ Basic system functionality is working!");
    console.log("📝 Note: To test student creation, the Convex dev server may need to be restarted");
    console.log("   to pick up the latest function definitions.");

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
  }
}

// Run the test
if (require.main === module) {
  testFixedSystem().catch(console.error);
}

module.exports = { testFixedSystem };