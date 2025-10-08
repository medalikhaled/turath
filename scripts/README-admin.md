# Admin User Creation Script

This script creates an admin user in the Hanbali Heritage Academy system.

## Admin User Details

- **Email**: medalikhaled331@gmail.com
- **Password**: medalimoi1
- **Name**: daly
- **Role**: admin

## How to Run

### Prerequisites

1. Make sure your Convex development server is running:
   ```bash
   pnpm dev:convex
   ```

2. Ensure your `.env.local` file has the correct `NEXT_PUBLIC_CONVEX_URL`:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment-url
   ```

### Run the Script

```bash
# Using npm script (recommended)
pnpm create-admin

# Or run directly
node scripts/create-admin.js
```

## What the Script Does

1. **Hashes the password** using bcrypt with 12 salt rounds
2. **Creates the admin user** in the database with:
   - Email: medalikhaled331@gmail.com
   - Hashed password
   - Name: daly
   - Role: admin
   - Active status: true
3. **Verifies creation** by listing all admin users
4. **Handles duplicates** gracefully if the admin already exists

## Security Notes

- The password is securely hashed using bcrypt before storage
- The admin email is already configured in the OTP system (`convex/otp.ts`)
- The admin can log in using the unified login interface at `/login`

## Login Process

After creating the admin user:

1. Go to `/login`
2. Enter the email: `medalikhaled331@gmail.com`
3. The system will detect it's an admin email and request OTP
4. Check the console/logs for the OTP (in development mode)
5. Enter the 6-digit OTP to complete login

## Troubleshooting

### "Admin already exists" error
This is normal if you've run the script before. The script will show existing admins.

### "Convex URL not found" error
Make sure your `.env.local` file has the correct `NEXT_PUBLIC_CONVEX_URL`.

### "Database connection error"
Ensure your Convex development server is running with `pnpm dev:convex`.

## Files Created/Modified

- `convex/createAdmin.ts` - Convex mutations for admin management
- `scripts/create-admin.js` - Node.js script to create admin user
- `package.json` - Added `create-admin` script command