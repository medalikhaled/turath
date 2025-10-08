#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Hard-code the URL since environment loading is problematic in scripts
const CONVEX_URL = "https://flippant-nightingale-506.convex.cloud";

async function seedData() {
  console.log("🌱 Starting database seeding...");
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    // Check if data already exists
    const existingUsers = await client.query("users", "list");
    if (existingUsers && existingUsers.length > 0) {
      console.log("✅ Data already exists, skipping seed");
      return;
    }

    console.log("📝 Creating users...");
    await client.mutation("simpleSeed", "seedUsers");
    
    console.log("📚 Creating courses...");
    await client.mutation("simpleSeed", "seedCourses");
    
    console.log("🗓️ Creating meetings...");
    await client.mutation("simpleSeed", "seedMeetings");
    
    console.log("📰 Creating news...");
    await client.mutation("simpleSeed", "seedNews");
    
    console.log("✅ Database seeding completed successfully!");
    console.log("\n🔑 Test Login Credentials:");
    console.log("Email: ahmed.student@example.com | Password: password123");
    console.log("Email: fatima.student@example.com | Password: password123");
    console.log("Email: omar.student@example.com | Password: password123");
    console.log("Email: aisha.student@example.com | Password: password123");
    console.log("Email: yusuf.student@example.com | Password: password123");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedData();