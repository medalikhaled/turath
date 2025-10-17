/**
 * Initialize the first admin user
 * Run this once to set up your admin account
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require("dotenv").config({ path: '.env.local' });


const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
    console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL not found");
    console.log("Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function initAdmin() {
    const email = "medalikhaled331@gmail.com";

    console.log("\n🚀 Initializing admin user...\n");
    console.log(`   Email: ${email}`);

    try {
        const result = await client.mutation(api.adminManagement.createOrUpdateAdminUser, {
            email: email,
        });

        if (result.isNew) {
            console.log("\n✅ Admin user created successfully!");
        } else {
            console.log("\n✅ Admin user already exists and is active!");
        }

        console.log(`   User ID: ${result.userId}`);
        console.log("\n📧 You can now login at /login with this email");
        console.log("   An OTP will be sent to your email\n");

    } catch (error) {
        console.error("\n❌ Error:", error.message);

        if (error.message.includes("not authorized")) {
            console.log("\n💡 Make sure the email is in ADMIN_EMAILS in:");
            console.log("   - convex/adminManagement.ts");
            console.log("   - convex/authFunctions.ts\n");
        }
    }
}

initAdmin().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});
