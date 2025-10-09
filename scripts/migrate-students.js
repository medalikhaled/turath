#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function runMigration() {
  try {
    console.log("🔍 Checking migration status...");
    
    // Check current status
    const status = await convex.mutation(api.migrations.checkMigrationStatus, {});
    console.log("Current status:", status);
    
    if (!status.migrationNeeded) {
      console.log("✅ No migration needed. All students are already in the new format.");
      return;
    }
    
    console.log("🚀 Starting student migration...");
    
    // Run migration
    const result = await convex.mutation(api.migrations.migrateStudentsToNewSchema, {});
    console.log("Migration result:", result);
    
    if (result.success) {
      console.log(`✅ Migration completed successfully!`);
      console.log(`   - Migrated: ${result.migratedCount} students`);
      console.log(`   - Skipped: ${result.skippedCount} students`);
      console.log(`   - Total: ${result.totalStudents} students`);
      
      // Check status again
      const newStatus = await convex.mutation(api.migrations.checkMigrationStatus, {});
      console.log("Post-migration status:", newStatus);
      
      if (newStatus.migrationNeeded) {
        console.log("⚠️  Some students still need migration. Please check the logs.");
      } else {
        console.log("🎉 All students successfully migrated!");
      }
    } else {
      console.error("❌ Migration failed");
    }
    
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration();