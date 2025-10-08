#!/usr/bin/env node

require("dotenv").config({ path: '.env.local' });

console.log("🔍 Environment Variables Check\n");

// Required variables
const requiredVars = [
  {
    name: "NEXT_PUBLIC_CONVEX_URL",
    value: process.env.NEXT_PUBLIC_CONVEX_URL,
    description: "Convex database URL"
  },
  {
    name: "JWT_SECRET",
    value: process.env.JWT_SECRET,
    description: "JWT token signing secret"
  },
  {
    name: "CONVEX_DEPLOYMENT",
    value: process.env.CONVEX_DEPLOYMENT,
    description: "Convex deployment ID"
  }
];

// Optional variables
const optionalVars = [
  {
    name: "RESEND_API_KEY",
    value: process.env.RESEND_API_KEY,
    description: "Email service API key (production only)"
  },
  {
    name: "NODE_ENV",
    value: process.env.NODE_ENV,
    description: "Environment mode (auto-set by Next.js)"
  }
];

let allGood = true;

console.log("✅ Required Variables:");
requiredVars.forEach(({ name, value, description }) => {
  if (value) {
    console.log(`   ✅ ${name}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
    console.log(`      ${description}`);
  } else {
    console.log(`   ❌ ${name}: NOT SET`);
    console.log(`      ${description}`);
    allGood = false;
  }
  console.log();
});

console.log("🔶 Optional Variables:");
optionalVars.forEach(({ name, value, description }) => {
  if (value) {
    console.log(`   ✅ ${name}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
  } else {
    console.log(`   ⚪ ${name}: Not set (optional)`);
  }
  console.log(`      ${description}`);
  console.log();
});

console.log("📋 Summary:");
if (allGood) {
  console.log("✅ All required environment variables are set!");
  console.log("🚀 You can now run:");
  console.log("   - pnpm dev:convex (start Convex server)");
  console.log("   - pnpm create-admin (create admin user)");
  console.log("   - pnpm dev (start full application)");
} else {
  console.log("❌ Some required environment variables are missing!");
  console.log("📖 Please check ENV-SETUP.md for setup instructions");
}

console.log("\n🔗 Environment file location: .env.local");
console.log("📚 Full setup guide: ENV-SETUP.md");