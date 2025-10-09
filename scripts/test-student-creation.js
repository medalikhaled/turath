#!/usr/bin/env node

/**
 * Test script for student creation backend functionality
 * This script tests the new student creation and invitation system
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testStudentCreation() {
  console.log("🧪 Testing Student Creation Backend...\n");

  try {
    // Test 1: Create student with invitation
    console.log("📝 Test 1: Creating student with invitation...");
    const testStudent = {
      name: "أحمد محمد",
      email: "ahmed.test@example.com",
      phone: "+966501234567",
      courses: [],
      sendInvitation: true,
    };

    const createResult = await convex.mutation(api.students.createStudentWithInvitation, testStudent);
    
    if (createResult.studentId && createResult.userId) {
      console.log("✅ Student created successfully");
      console.log(`   Student ID: ${createResult.studentId}`);
      console.log(`   User ID: ${createResult.userId}`);
      
      if (createResult.invitationData) {
        console.log("✅ Invitation data generated");
        console.log(`   Email: ${createResult.invitationData.email}`);
        console.log(`   Temp Password: ${createResult.invitationData.tempPassword}`);
        console.log(`   Login URL: ${createResult.invitationData.loginUrl}`);
      }
    } else {
      console.log("❌ Student creation failed");
      return;
    }

    // Test 2: Check invitation status
    console.log("\n📊 Test 2: Checking invitation status...");
    const invitationStatus = await convex.query(api.students.getStudentInvitationStatus, {
      studentId: createResult.studentId,
    });

    if (invitationStatus) {
      console.log("✅ Invitation status retrieved");
      console.log(`   Name: ${invitationStatus.name}`);
      console.log(`   Email: ${invitationStatus.email}`);
      console.log(`   Invitation Sent: ${invitationStatus.invitationSent}`);
      console.log(`   Has User Account: ${invitationStatus.hasUserAccount}`);
    } else {
      console.log("❌ Failed to get invitation status");
    }

    // Test 3: Send invitation (resend)
    console.log("\n📧 Test 3: Resending invitation...");
    const resendResult = await convex.mutation(api.students.sendInvitation, {
      studentId: createResult.studentId,
    });

    if (resendResult.success) {
      console.log("✅ Invitation resent successfully");
      console.log(`   Message: ${resendResult.message}`);
      
      if (resendResult.invitationData) {
        console.log(`   New Temp Password: ${resendResult.invitationData.tempPassword}`);
      }
    } else {
      console.log("❌ Failed to resend invitation");
    }

    // Test 4: Verify credentials
    console.log("\n🔐 Test 4: Verifying student credentials...");
    const credentialsResult = await convex.mutation(api.students.verifyStudentCredentials, {
      email: testStudent.email,
      password: resendResult.invitationData.tempPassword,
    });

    if (credentialsResult) {
      console.log("✅ Credentials verified successfully");
      console.log(`   Student Name: ${credentialsResult.student.name}`);
      console.log(`   Last Login: ${credentialsResult.student.lastLogin}`);
    } else {
      console.log("❌ Credential verification failed");
    }

    // Test 5: Update student information
    console.log("\n✏️ Test 5: Updating student information...");
    const updateResult = await convex.mutation(api.students.updateStudent, {
      id: createResult.studentId,
      name: "أحمد محمد المحدث",
      phone: "+966507654321",
    });

    if (updateResult) {
      console.log("✅ Student information updated successfully");
    } else {
      console.log("❌ Failed to update student information");
    }

    // Test 6: Get all students
    console.log("\n📋 Test 6: Getting all students...");
    const allStudents = await convex.query(api.students.getAllStudents);
    console.log(`✅ Retrieved ${allStudents.length} students`);

    // Test 7: Deactivate student
    console.log("\n🚫 Test 7: Deactivating student...");
    const deactivateResult = await convex.mutation(api.students.deactivateStudent, {
      studentId: createResult.studentId,
      reason: "Test cleanup",
    });

    if (deactivateResult.success) {
      console.log("✅ Student deactivated successfully");
      console.log(`   Message: ${deactivateResult.message}`);
    } else {
      console.log("❌ Failed to deactivate student");
    }

    // Test 8: Reactivate student
    console.log("\n🔄 Test 8: Reactivating student...");
    const reactivateResult = await convex.mutation(api.students.reactivateStudent, {
      studentId: createResult.studentId,
    });

    if (reactivateResult.success) {
      console.log("✅ Student reactivated successfully");
      console.log(`   Message: ${reactivateResult.message}`);
    } else {
      console.log("❌ Failed to reactivate student");
    }

    console.log("\n🎉 All tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    
    if (error.data) {
      console.error("Error details:", error.data);
    }
  }
}

async function testBulkCreation() {
  console.log("\n🔄 Testing Bulk Student Creation...\n");

  try {
    const bulkStudents = [
      {
        name: "فاطمة أحمد",
        email: "fatima.test@example.com",
        phone: "+966501111111",
      },
      {
        name: "محمد علي",
        email: "mohammed.test@example.com",
        phone: "+966502222222",
      },
      {
        name: "عائشة سالم",
        email: "aisha.test@example.com",
      },
    ];

    const bulkResult = await convex.mutation(api.students.bulkCreateStudentsWithInvitations, {
      students: bulkStudents,
      sendInvitations: true,
    });

    console.log(`✅ Bulk creation completed`);
    console.log(`   Created: ${bulkResult.created} students`);
    console.log(`   Errors: ${bulkResult.errors} students`);

    if (bulkResult.errorDetails.length > 0) {
      console.log("\n❌ Error details:");
      bulkResult.errorDetails.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.email}: ${error.error}`);
      });
    }

    if (bulkResult.results.length > 0) {
      console.log("\n✅ Successfully created students:");
      bulkResult.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.invitationData?.name} (${result.invitationData?.email})`);
      });
    }

  } catch (error) {
    console.error("❌ Bulk creation test failed:", error.message);
  }
}

async function testEmailValidation() {
  console.log("\n📧 Testing Email Validation...\n");

  const testCases = [
    { email: "invalid-email", shouldFail: true },
    { email: "test@", shouldFail: true },
    { email: "@example.com", shouldFail: true },
    { email: "valid@example.com", shouldFail: false },
    { email: "user.name+tag@domain.co.uk", shouldFail: false },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing email: ${testCase.email}`);
      
      const result = await convex.mutation(api.students.createStudentWithInvitation, {
        name: "Test User",
        email: testCase.email,
        sendInvitation: false,
      });

      if (testCase.shouldFail) {
        console.log(`❌ Expected failure but succeeded for: ${testCase.email}`);
      } else {
        console.log(`✅ Valid email accepted: ${testCase.email}`);
        
        // Clean up
        await convex.mutation(api.students.deactivateStudent, {
          studentId: result.studentId,
        });
      }

    } catch (error) {
      if (testCase.shouldFail) {
        console.log(`✅ Invalid email rejected: ${testCase.email}`);
      } else {
        console.log(`❌ Valid email rejected: ${testCase.email} - ${error.message}`);
      }
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Student Creation Backend Tests\n");
  console.log("=" .repeat(50));

  await testStudentCreation();
  await testBulkCreation();
  await testEmailValidation();

  console.log("\n" + "=".repeat(50));
  console.log("🏁 All tests completed!");
}

// Check if this script is being run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testStudentCreation,
  testBulkCreation,
  testEmailValidation,
  runAllTests,
};