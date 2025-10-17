# Admin Setup Guide

## ✅ What Was Fixed

### Problem
- Admins existed only as hardcoded emails
- No database records for admins
- Session validation failed because no user record existed
- No way to manage or revoke admin access

### Solution
- **Two-layer security**: Authorization list + Database records
- **Auto-creation**: Admin user records created on first OTP login
- **Management scripts**: Easy CLI tools to add/remove admins
- **Consistent validation**: Same flow for both admins and students

## 🚀 Quick Start

### 1. Initialize Your Admin Account

Run this command to create your admin user record:

```bash
npm run admin:init
```

This will create a user record for `medalikhaled331@gmail.com`.

### 2. Login

1. Go to `http://localhost:3000/login`
2. Enter your email: `medalikhaled331@gmail.com`
3. Click "إرسال رمز التحقق" (Send OTP)
4. Check your email for the OTP code
5. Enter the OTP and login
6. You'll be redirected to `/admin/dashboard` ✅

## 📝 Adding More Admins

### Step 1: Update Authorization List

Edit **both** of these files and add the new email:

**File 1**: `convex/adminManagement.ts`
```typescript
const ADMIN_EMAILS = [
  "medalikhaled331@gmail.com",
  "newadmin@example.com",  // Add here
];
```

**File 2**: `convex/authFunctions.ts`
```typescript
const ADMIN_EMAILS = [
  "medalikhaled331@gmail.com",
  "newadmin@example.com",  // Add here
];
```

### Step 2: Deploy Changes

```bash
# Convex will auto-deploy when you save the files
# Or manually push:
npx convex deploy
```

### Step 3: Create User Record

```bash
npm run admin:add newadmin@example.com "Admin Name"
```

### Step 4: Admin Can Login

The new admin can now login at `/login` with their email.

## 🛠️ Management Commands

```bash
# Initialize first admin (run once)
npm run admin:init

# Add a new admin
npm run admin:add <email> [name]

# List all admins
npm run admin:list

# Temporarily disable an admin
npm run admin:deactivate <email>

# Re-enable an admin
npm run admin:reactivate <email>
```

## 🔒 Security Model

An admin can login only if **ALL** of these are true:
- ✅ Email is in `ADMIN_EMAILS` list (both files)
- ✅ User record exists in database
- ✅ User has `role="admin"`
- ✅ User has `isActive=true`
- ✅ Valid OTP provided

## 📋 Files Changed

### New Files
- `convex/adminManagement.ts` - Admin user management functions
- `scripts/manage-admins.ts` - CLI tool for managing admins
- `scripts/init-admin.js` - Quick setup script
- `docs/admin-management.md` - Detailed documentation
- `ADMIN_SETUP.md` - This file

### Modified Files
- `convex/authFunctions.ts` - Updated admin validation
- `app/api/auth/admin/verify-otp/route.ts` - Auto-create admin records
- `app/api/auth/validate/route.ts` - Unified validation for admin/student
- `package.json` - Added admin management scripts

## 🧪 Testing

1. **Test Admin Login**:
   ```bash
   npm run admin:init
   # Then login at /login
   ```

2. **Test Admin List**:
   ```bash
   npm run admin:list
   ```

3. **Test Deactivation**:
   ```bash
   npm run admin:deactivate medalikhaled331@gmail.com
   # Try to login - should fail
   npm run admin:reactivate medalikhaled331@gmail.com
   # Try to login - should work
   ```

## 🐛 Troubleshooting

### "Email not authorized for admin access"
- Add email to `ADMIN_EMAILS` in both files
- Redeploy Convex functions

### "Admin user not found"
- Run `npm run admin:add <email>`
- Or login once (auto-creates record)

### Can't access admin dashboard
- Check `npm run admin:list` - is user active?
- Check browser console for errors
- Check server logs for validation errors

## 📚 More Info

See `docs/admin-management.md` for detailed documentation.
