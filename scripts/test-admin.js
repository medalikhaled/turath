#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
require("dotenv").config({ path: '.env.local' });

async function testAdminSystem() {
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables");
      console.log("Make sure .env.local exists and contains NEXT_PUBLIC_CONVEX_URL");
      process.exit(1);
    }

    console.log("🔗 Convex URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
    console.log("🧪 Testing admin system...\n");

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    
    // Test 1: Check if admin email is recognized
    console.log("1️⃣ Testing admin email recognition...");
    const emailCheck = await convex.query("otp:isAdminEmail", {
      email: "medalikhaled331@gmail.com"
    });
    
    if (emailCheck.isAdmin) {
      console.log("✅ Admin email is properly recognized");
    } else {
      console.log("❌ Admin email is NOT recognized");
    }
    
    // Test 2: List all admins
    console.log("\n2️⃣ Listing all admin users...");
    const admins = await convex.query("createAdmin:getAllAdmins", {});
    
    if (admins.length > 0) {
      console.log(`✅ Found ${admins.length} admin user(s):`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - ${admin.isActive ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log("⚠️  No admin users found in database");
    }
    
    // Test 3: Check admin emails configuration
    console.log("\n3️⃣ Checking admin emails configuration...");
    const adminEmails = await convex.query("otp:getAdminEmails", {});
    console.log(`✅ Configured admin emails (${adminEmails.count}):`);
    adminEmails.emails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email}`);
    });
    
    console.log("\n🎉 Admin system test completed!");
    
  } catch (error) {
    console.error("❌ Error testing admin system:", error.message);
    console.error("Full error:", error);
  }
}

// Run the test
if (require.main === module) {
  testAdminSystem()
    .then(() => {
      console.log("\n✨ Test completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error);
      process.exit(1);
    });
}

module.exports = { testAdminSystem };