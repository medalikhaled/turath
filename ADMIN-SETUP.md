# 🛡️ Admin User Setup Guide

This guide will help you set up the admin user for the Hanbali Heritage Academy system.

## 📋 Admin User Details

- **Email**: `medalikhaled331@gmail.com`
- **Password**: `medalimoi1`
- **Name**: `daly`
- **Role**: `admin`

## 🚀 Quick Setup

### Step 1: Start Convex Development Server

```bash
pnpm dev:convex
```

Keep this running in a separate terminal.

### Step 2: Create Admin User

```bash
pnpm create-admin
```

This will:
- Hash the password securely
- Create the admin user in the database
- Verify the creation was successful

### Step 3: Test the Setup

```bash
pnpm test-admin
```

This will verify:
- Admin email is recognized by the system
- Admin user exists in the database
- OTP system is configured correctly

## 🔐 Login Process

1. **Start the application**:
   ```bash
   pnpm dev
   ```

2. **Navigate to login page**: `http://localhost:3000/login`

3. **Enter admin email**: `medalikhaled331@gmail.com`

4. **System detects admin**: You'll see "🛡️ حساب إداري - سيتم إرسال رمز التحقق"

5. **OTP is generated**: Check the console/terminal for the 6-digit OTP

6. **Enter OTP**: Complete the login process

7. **Redirected to admin dashboard**: `http://localhost:3000/admin/dashboard`

## 🔧 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Create Admin | `pnpm create-admin` | Creates the admin user with hashed password |
| Test Admin | `pnpm test-admin` | Tests admin system configuration |
| Development | `pnpm dev` | Starts both Next.js and Convex servers |
| Convex Only | `pnpm dev:convex` | Starts only Convex development server |

## 📁 Files Created

```
scripts/
├── create-admin.js      # Admin creation script
├── test-admin.js        # Admin system test script
└── README-admin.md      # Detailed documentation

convex/
└── createAdmin.ts       # Convex mutations for admin management

ADMIN-SETUP.md          # This setup guide
```

## 🛠️ Troubleshooting

### "Admin already exists" Error
```
⚠️  Admin user already exists!
```
This is normal if you've run the script before. The admin is already set up.

### "Convex URL not found" Error
Make sure your `.env.local` file contains:
```
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
```

### "Database connection error"
Ensure Convex development server is running:
```bash
pnpm dev:convex
```

### OTP Not Showing in Development
The OTP appears in the terminal where you're running the Convex server. Look for:
```
رمز التحقق (للتطوير فقط): 123456
```

## 🔒 Security Features

- **Password Hashing**: Uses bcrypt with 12 salt rounds
- **OTP Authentication**: 6-digit codes with 15-minute expiry
- **Rate Limiting**: Maximum 3 OTP requests per hour
- **Session Management**: 24-hour admin sessions
- **JWT Tokens**: Secure authentication tokens

## 📞 Support

If you encounter any issues:

1. **Check Convex server**: Make sure `pnpm dev:convex` is running
2. **Verify environment**: Ensure `.env.local` has correct Convex URL
3. **Run tests**: Use `pnpm test-admin` to diagnose issues
4. **Check logs**: Look at terminal output for error messages

## 🎯 Next Steps

After setting up the admin user:

1. **Test login flow** using the unified login interface
2. **Access admin dashboard** to manage the system
3. **Create additional admin users** if needed
4. **Configure email sending** for production OTP delivery

---

**Note**: This setup is for development. In production, ensure proper email delivery for OTP codes and secure environment variable management.