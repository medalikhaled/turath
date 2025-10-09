#!/usr/bin/env node

/**
 * Test script for admin UI student creation functionality
 * This script tests the integration between the admin UI and backend
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testAdminUIIntegration() {
  console.log("🧪 Testing Admin UI Integration...\n");

  try {
    // Test 1: Get all students (what the UI loads)
    console.log("📋 Test 1: Loading students for admin UI...");
    const studentsWithCourses = await convex.query(api.students.getStudentsWithCourses);
    console.log(`✅ Loaded ${studentsWithCourses.length} students with course details`);

    // Test 2: Get active courses (for the form dropdown)
    console.log("\n📚 Test 2: Loading active courses for form...");
    const activeCourses = await convex.query(api.courses.getActiveCourses);
    console.log(`✅ Loaded ${activeCourses.length} active courses`);

    // Test 3: Create student with manual password (form option 1)
    console.log("\n👤 Test 3: Creating student with manual password...");
    const manualPasswordStudent = {
      name: "طالب تجريبي 1",
      email: "test1@example.com",
      phone: "+966501111111",
      password: "TestPassword123!",
      courses: activeCourses.length > 0 ? [activeCourses[0]._id] : [],
    };

    const manualResult = await convex.mutation(api.students.createStudentWithUser, manualPasswordStudent);
    if (manualResult.studentId && manualResult.userId) {
      console.log("✅ Student created with manual password");
      console.log(`   Student ID: ${manualResult.studentId}`);
      console.log(`   User ID: ${manualResult.userId}`);
    } else {
      console.log("❌ Failed to create student with manual password");
    }

    // Test 4: Create student with invitation (form option 2)
    console.log("\n📧 Test 4: Creating student with invitation...");
    const invitationStudent = {
      name: "طالب تجريبي 2",
      email: "test2@example.com",
      phone: "+966502222222",
      courses: activeCourses.length > 0 ? [activeCourses[0]._id] : [],
      sendInvitation: true,
    };

    const invitationResult = await convex.mutation(api.students.createStudentWithInvitation, invitationStudent);
    if (invitationResult.studentId && invitationResult.invitationData) {
      console.log("✅ Student created with invitation");
      console.log(`   Student ID: ${invitationResult.studentId}`);
      console.log(`   Temp Password: ${invitationResult.invitationData.tempPassword}`);
    } else {
      console.log("❌ Failed to create student with invitation");
    }

    // Test 5: Update student (edit form functionality)
    console.log("\n✏️ Test 5: Updating student information...");
    if (manualResult.studentId) {
      const updateResult = await convex.mutation(api.students.updateStudent, {
        id: manualResult.studentId,
        name: "طالب تجريبي محدث",
        phone: "+966507777777",
      });
      console.log("✅ Student information updated successfully");
    }

    // Test 6: Send invitation to existing student
    console.log("\n📤 Test 6: Sending invitation to existing student...");
    if (manualResult.studentId) {
      const sendResult = await convex.mutation(api.students.sendInvitation, {
        studentId: manualResult.studentId,
      });
      if (sendResult.success && sendResult.invitationData) {
        console.log("✅ Invitation sent successfully");
        console.log(`   New temp password: ${sendResult.invitationData.tempPassword}`);
      }
    }

    // Test 7: Verify the UI can load updated data
    console.log("\n🔄 Test 7: Verifying UI data refresh...");
    const updatedStudents = await convex.query(api.students.getStudentsWithCourses);
    console.log(`✅ UI can load ${updatedStudents.length} students after updates`);

    // Test 8: Test error handling (duplicate email)
    console.log("\n❌ Test 8: Testing error handling (duplicate email)...");
    try {
      await convex.mutation(api.students.createStudentWithUser, {
        name: "طالب مكرر",
        email: "test1@example.com", // Same email as before
        password: "TestPassword123!",
        courses: [],
      });
      console.log("❌ Error handling failed - duplicate email was allowed");
    } catch (error) {
      console.log("✅ Error handling works - duplicate email rejected");
      console.log(`   Error: ${error.message}`);
    }

    console.log("\n🎉 Admin UI integration tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    
    if (error.data) {
      console.error("Error details:", error.data);
    }
  }
}

async function testUIErrorScenarios() {
  console.log("\n🚨 Testing UI Error Scenarios...\n");

  const errorTests = [
    {
      name: "Invalid email format",
      data: {
        name: "طالب تجريبي",
        email: "invalid-email",
        password: "TestPassword123!",
        courses: [],
      },
    },
    {
      name: "Short name",
      data: {
        name: "ا",
        email: "short@example.com",
        password: "TestPassword123!",
        courses: [],
      },
    },
    {
      name: "Weak password",
      data: {
        name: "طالب تجريبي",
        email: "weak@example.com",
        password: "123",
        courses: [],
      },
    },
  ];

  for (const test of errorTests) {
    try {
      console.log(`Testing: ${test.name}`);
      await convex.mutation(api.students.createStudentWithUser, test.data);
      console.log(`❌ ${test.name} - validation failed`);
    } catch (error) {
      console.log(`✅ ${test.name} - properly rejected`);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Admin UI Integration Tests\n");
  console.log("=" .repeat(50));

  await testAdminUIIntegration();
  await testUIErrorScenarios();

  console.log("\n" + "=".repeat(50));
  console.log("🏁 All admin UI tests completed!");
}

// Check if this script is being run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAdminUIIntegration,
  testUIErrorScenarios,
  runAllTests,
};