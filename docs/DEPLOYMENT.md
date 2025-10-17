# Deployment Guide

## Quick Deploy Steps

### 1. Deploy Convex Backend

```bash
# Install Convex CLI if not already installed
npm install -g convex

# Login to Convex
npx convex login

# Deploy to production
npx convex deploy --prod
```

After deployment, Convex will give you a production URL like:
`https://your-project-name.convex.cloud`

### 2. Deploy Next.js to Vercel

1. **Push to GitHub** (if not already done)
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables** in Vercel dashboard:

```env
# Convex (get from convex dashboard after deploy)
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
CONVEX_DEPLOY_KEY=your-convex-deploy-key

# Resend Email
RESEND_API_KEY=your-resend-api-key

# App URL (your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Environment
NODE_ENV=production
```

4. **Deploy**: Vercel will automatically deploy when you push to main branch

### 3. Environment Variables Setup

#### Get Convex Variables:
1. Run `npx convex dashboard` after deploying
2. Go to Settings → Environment Variables
3. Copy `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY`

#### Get Resend API Key:
1. Go to [resend.com](https://resend.com)
2. Create account and get API key
3. Add your custom domain (optional for production)

#### Set in Vercel:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add all the variables above
4. Redeploy if needed

### 4. Custom Domain (Optional)

#### For Resend:
1. Add your domain in Resend dashboard
2. Add DNS records as instructed
3. Update email service with your domain

#### For Vercel:
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## Quick Checklist

- [ ] `npx convex deploy --prod`
- [ ] Get Convex production URL and deploy key
- [ ] Push code to GitHub
- [ ] Import to Vercel
- [ ] Set environment variables in Vercel
- [ ] Test deployment
- [ ] (Optional) Set up custom domains

## Troubleshooting

### Convex Issues:
- **"Not authenticated"**: Run `npx convex login`
- **"No project found"**: Run `npx convex dev` first in development

### Vercel Issues:
- **Build fails**: Check environment variables are set
- **Runtime errors**: Check Vercel function logs
- **CORS errors**: Ensure `NEXT_PUBLIC_CONVEX_URL` is correct

### Email Issues:
- **Emails not sending**: Verify `RESEND_API_KEY` in production
- **Domain issues**: Use `@resend.dev` or verify custom domain DNS

## Environment Differences

| Variable | Development | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_CONVEX_URL` | `http://localhost:3210` | `https://your-project.convex.cloud` |
| `NODE_ENV` | `development` | `production` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |
| Email domain | `@resend.dev` | Your custom domain |

## Post-Deployment

1. **Test admin login** with OTP
2. **Test student creation** and login
3. **Verify email sending** works
4. **Check all dashboard features**
5. **Monitor Vercel and Convex logs** for any issues