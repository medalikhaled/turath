# Email Setup with Resend

## Development vs Production Configuration

The email service automatically handles different configurations for development and production environments.

### Development Mode
- **Domain**: Uses Resend's built-in `@resend.dev` domain
- **No DNS setup required**: Works immediately for testing
- **From addresses**:
  - Student emails: `Hanbali Academy <onboarding@resend.dev>`
  - Admin emails: `Hanbali Academy Admin <admin@resend.dev>`

### Production Mode
- **Domain**: Uses custom domain (requires DNS verification)
- **From addresses**:
  - Student emails: `أكاديمية التراث الحنبلي <noreply@hanbali-academy.com>`
  - Admin emails: `Hanbali Heritage Academy <admin@hanbali-academy.com>`

## Environment Variables

```env
RESEND_API_KEY=your-resend-api-key
NODE_ENV=development  # or production
```

## Testing in Development

1. Set up your Resend API key in `.env.local`
2. The system will automatically use `@resend.dev` domain
3. Check console logs for email content when emails are sent
4. Emails will be delivered to real email addresses for testing

## Production Setup

1. Add your custom domain to Resend dashboard
2. Complete DNS verification (add TXT/CNAME records)
3. Update the domain in the email service if needed
4. Set `NODE_ENV=production`

## Troubleshooting

### "Domain loading forever" in Resend Dashboard
This happens when trying to add `localhost` or Convex dev domains to Resend. Use the built-in `@resend.dev` domain for development instead.

### Emails not sending in development
1. Check that `RESEND_API_KEY` is set correctly
2. Verify the API key has sending permissions
3. Check console logs for detailed error messages
4. Ensure you're using a valid recipient email address