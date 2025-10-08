#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: '.env.local' });

// Admin user data
const ADMIN_USER = {
  email: "medalikhaled331@gmail.com",
  password: "medalimoi1",
  name: "daly"
};

async function createAdminUser() {
  try {
    // Debug: Check if Convex URL is loaded
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables");
      console.log("Make sure .env.local exists and contains NEXT_PUBLIC_CONVEX_URL");
      process.exit(1);
    }

    console.log("🔗 Convex URL:", process.env.NEXT_PUBLIC_CONVEX_URL);

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    console.log("🔐 Hashing password...");

    // Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);

    console.log("👤 Creating admin user...");

    // Create admin user
    const result = await convex.mutation("createAdmin:createAdminUser", {
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      password: hashedPassword,
    });

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${result.email}`);
    console.log(`👤 Name: ${result.name}`);
    console.log(`🆔 ID: ${result.adminId}`);

    // Verify the admin was created
    console.log("\n🔍 Verifying admin creation...");
    const admins = await convex.query("createAdmin:getAllAdmins", {});

    console.log(`📊 Total admins in database: ${admins.length}`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    if (error.message?.includes("ADMIN_EXISTS")) {
      console.log("⚠️  Admin user already exists!");

      try {
        // Show existing admins
        console.log("\n📋 Existing admins:");
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
        const admins = await convex.query("createAdmin:getAllAdmins", {});
        admins.forEach((admin, index) => {
          console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.isActive ? 'Active' : 'Inactive'}`);
        });
      } catch (listError) {
        console.log("Could not list existing admins:", listError.message);
      }
    } else {
      console.error("❌ Error creating admin user:", error.message);
      console.error("Full error:", error);
    }
  }
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log("\n🎉 Script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };