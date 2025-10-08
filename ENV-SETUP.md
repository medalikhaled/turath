# 🔧 Environment Variables Setup Guide

This guide explains all the environment variables needed for the Hanbali Heritage Academy system.

## 📋 Required Environment Variables

### 🗄️ **Convex Database & Backend**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CONVEX_DEPLOYMENT` | ✅ **Yes** | Auto-generated deployment ID | `dev:flippant-nightingale-506` |
| `NEXT_PUBLIC_CONVEX_URL` | ✅ **Yes** | Public Convex URL for frontend | `https://flippant-nightingale-506.convex.cloud` |

### 🔐 **Authentication & Security**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `JWT_SECRET` | ✅ **Yes** | Secret key for JWT token signing | `your-secret-key-change-in-production` |

### 📧 **Email Service (Optional)**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RESEND_API_KEY` | 🔶 **Production** | API key for sending OTP emails | `re_your_resend_api_key` |

### 🌍 **Environment**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | 🔶 **Auto** | Environment mode (auto-set by Next.js) | `development` or `production` |

## 🚀 Quick Setup

### Step 1: Create Environment File

```bash
# Copy the example file
cp .env.example .env.local
```

### Step 2: Generate Convex Variables

```bash
# Start Convex development (this generates the deployment)
npx convex dev
```

This will automatically populate:
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`

### Step 3: Set JWT Secret

For **development**:
```bash
# Use a simple secret (already set in .env.local)
JWT_SECRET=secret
```

For **production**:
```bash
# Generate a strong secret
openssl rand -base64 32
# Then add it to your .env.local or production environment
JWT_SECRET=your-generated-strong-secret
```

### Step 4: (Optional) Email Service

For **development**:
- OTP codes are shown in the console/terminal
- No email service needed

For **production**:
1. Sign up at [Resend.com](https://resend.com)
2. Get your API key from [API Keys page](https://resend.com/api-keys)
3. Add to environment:
   ```bash
   RESEND_API_KEY=re_your_resend_api_key
   ```

## 📁 Current Configuration

Your current `.env.local` should look like:

```bash
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:flippant-nightingale-506 # team: mohamed-ali-khaled, project: turath
JWT_SECRET=secret
NEXT_PUBLIC_CONVEX_URL=https://flippant-nightingale-506.convex.cloud
```

## 🔍 How Variables Are Used

### **CONVEX_DEPLOYMENT**
- Used by Convex CLI commands
- Links your local development to the cloud database
- Auto-generated when you run `npx convex dev`

### **NEXT_PUBLIC_CONVEX_URL**
- Used by frontend React components
- Used by API routes to connect to Convex
- Used by admin creation scripts
- **Must be public** (prefixed with `NEXT_PUBLIC_`)

### **JWT_SECRET**
- Signs authentication tokens for students and admins
- Used for session validation
- **Keep this secret and secure!**

### **RESEND_API_KEY** (Optional)
- Sends OTP emails in production
- In development, OTPs are shown in console
- Only needed for production email delivery

### **NODE_ENV**
- Automatically set by Next.js
- `development` - Shows debug info, uses console OTP
- `production` - Hides debug info, requires email service

## 🛠️ Troubleshooting

### "NEXT_PUBLIC_CONVEX_URL not found"
```bash
# Make sure Convex is running
npx convex dev

# Check if .env.local exists and has the URL
cat .env.local
```

### "JWT verification failed"
```bash
# Make sure JWT_SECRET is set
echo $JWT_SECRET

# Or check .env.local
grep JWT_SECRET .env.local
```

### "Convex deployment not found"
```bash
# Restart Convex development
npx convex dev

# This will regenerate the deployment if needed
```

### Admin creation script fails
```bash
# Check all required variables are set
node -e "console.log('Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL)"

# Make sure Convex dev server is running
pnpm dev:convex
```

## 🔒 Security Best Practices

### Development
- ✅ Use simple secrets for `JWT_SECRET`
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use console OTP (no email service needed)

### Production
- 🔐 Generate strong `JWT_SECRET` (32+ characters)
- 🔐 Use environment variables, not files
- 🔐 Set up proper email service with `RESEND_API_KEY`
- 🔐 Enable HTTPS for secure cookies

## 📞 Support

If you encounter issues:

1. **Check file exists**: `ls -la .env.local`
2. **Verify Convex is running**: `pnpm dev:convex`
3. **Test environment loading**: `pnpm test-admin`
4. **Check console output** for specific error messages

---

**Note**: Never commit `.env.local` or any file containing real API keys to version control!