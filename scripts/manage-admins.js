/**
 * Admin Management Script
 * 
 * Usage:
 *   npm run admin:add <email> [name]     - Add a new admin
 *   npm run admin:list                   - List all admins
 *   npm run admin:deactivate <email>     - Deactivate an admin
 *   npm run admin:reactivate <email>     - Reactivate an admin
 * 
 * Note: You must also add the email to ADMIN_EMAILS in convex/adminManagement.ts
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require("dotenv").config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
    console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL not found in environment");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

const commands = {
    add: async (email, name) => {
        try {
            console.log(`\n🔄 Adding admin: ${email}...`);

            const result = await client.mutation(api.adminManagement.createOrUpdateAdminUser, {
                email,
                name,
            });

            if (result.isNew) {
                console.log(`✅ Admin user created successfully!`);
            } else {
                console.log(`✅ Admin user updated successfully!`);
            }

            console.log(`   User ID: ${result.userId}`);
            console.log(`\n⚠️  IMPORTANT: Make sure "${email}" is added to ADMIN_EMAILS in convex/adminManagement.ts\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            if (error.message.includes("not authorized")) {
                console.log(`\n💡 Add "${email}" to ADMIN_EMAILS in convex/adminManagement.ts first\n`);
            }
        }
    },

    list: async () => {
        try {
            console.log(`\n📋 Listing all admin users...\n`);

            const admins = await client.query(api.adminManagement.listAdminUsers, {});

            if (admins.length === 0) {
                console.log("No admin users found.\n");
                return;
            }

            console.log("┌─────────────────────────────────────────────────────────────────┐");
            console.log("│ Email                          │ Active │ Authorized │ Created   │");
            console.log("├─────────────────────────────────────────────────────────────────┤");

            admins.forEach((admin) => {
                const email = admin.email.padEnd(30);
                const active = admin.isActive ? "✓" : "✗";
                const authorized = admin.isAuthorized ? "✓" : "✗";
                const created = admin.createdAt
                    ? new Date(admin.createdAt).toLocaleDateString()
                    : "Unknown";

                console.log(`│ ${email} │   ${active}    │     ${authorized}      │ ${created.padEnd(9)} │`);
            });

            console.log("└─────────────────────────────────────────────────────────────────┘\n");
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    },

    deactivate: async (email) => {
        try {
            console.log(`\n🔄 Deactivating admin: ${email}...`);

            await client.mutation(api.adminManagement.deactivateAdmin, { email });

            console.log(`✅ Admin deactivated successfully!`);
            console.log(`   They will no longer be able to log in.\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    },

    reactivate: async (email) => {
        try {
            console.log(`\n🔄 Reactivating admin: ${email}...`);

            await client.mutation(api.adminManagement.reactivateAdmin, { email });

            console.log(`✅ Admin reactivated successfully!`);
            console.log(`   They can now log in again.\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    },

    help: () => {
        console.log(`
📚 Admin Management Commands:

  npm run admin:add <email> [name]     Add a new admin user
  npm run admin:list                   List all admin users
  npm run admin:deactivate <email>     Deactivate an admin
  npm run admin:reactivate <email>     Reactivate an admin

Examples:
  npm run admin:add admin@example.com "John Doe"
  npm run admin:list
  npm run admin:deactivate admin@example.com

⚠️  Important:
  - You must add the email to ADMIN_EMAILS in convex/adminManagement.ts
  - Deactivated admins cannot log in even if they're in ADMIN_EMAILS
  - The ADMIN_EMAILS list acts as an authorization filter
`);
    },
};

// Parse command line arguments
const [command, ...args] = process.argv.slice(2);

async function main() {
    if (!command || command === "help" || command === "--help" || command === "-h") {
        commands.help();
        process.exit(0);
    }

    switch (command) {
        case "add":
            if (!args[0]) {
                console.error("❌ Error: Email is required");
                console.log("Usage: npm run admin:add <email> [name]");
                process.exit(1);
            }
            await commands.add(args[0], args[1]);
            break;

        case "list":
            await commands.list();
            break;

        case "deactivate":
            if (!args[0]) {
                console.error("❌ Error: Email is required");
                console.log("Usage: npm run admin:deactivate <email>");
                process.exit(1);
            }
            await commands.deactivate(args[0]);
            break;

        case "reactivate":
            if (!args[0]) {
                console.error("❌ Error: Email is required");
                console.log("Usage: npm run admin:reactivate <email>");
                process.exit(1);
            }
            await commands.reactivate(args[0]);
            break;

        default:
            console.error(`❌ Unknown command: ${command}`);
            commands.help();
            process.exit(1);
    }
}

main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});
