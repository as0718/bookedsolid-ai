# Email System Setup Guide

## Overview

This application uses **Resend** to send transactional emails, specifically for team invitation emails. When business owners invite team members, they receive a professional email with a link to join the team.

## Why Resend?

- **Simple API**: Clean, developer-friendly API with TypeScript support
- **Reliable**: 99.9% uptime SLA with enterprise-grade infrastructure
- **Affordable**: Free tier includes 3,000 emails/month, then $20/month for 50,000 emails
- **Fast Setup**: Get started in under 5 minutes
- **Modern**: Built for Next.js and React applications

## Setup Instructions

### Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** in the sidebar
3. Click **Create API Key**
4. Give it a name (e.g., "Voice Agent Dashboard - Production")
5. Select permissions (Full Access recommended)
6. Copy the API key (starts with `re_...`)
7. Save it securely - you'll only see it once!

### Step 3: Configure Email Domain

You have two options for the "from" email address:

#### Option A: Use Resend's Test Domain (Quick Start)

For testing and development, you can use Resend's built-in test domain:

```bash
RESEND_FROM_EMAIL=noreply@resend.dev
```

**Note**: Emails from this domain may go to spam and have limited deliverability.

#### Option B: Use Your Own Domain (Recommended for Production)

For production use, verify your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `bookedsolid.ai`)
4. Add the DNS records to your domain provider:
   - SPF record
   - DKIM records (3 records)
   - DMARC record (optional but recommended)
5. Wait for verification (usually takes a few minutes)
6. Once verified, use your domain:

```bash
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 4: Update Environment Variables

Add these variables to your `.env.local` file:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Important**:
- Never commit your actual API key to version control
- Keep it in `.env.local` (already in `.gitignore`)
- For production deployment, add these to your hosting platform's environment variables

### Step 5: Restart Your Development Server

```bash
npm run dev
```

## Testing Email Configuration

### Method 1: Send a Test Team Invitation

1. Log in to your dashboard
2. Go to Team Management
3. Click "Invite Team Member"
4. Enter a test email address you control
5. Send the invitation
6. Check your inbox (and spam folder)

### Method 2: Use the Test Function (Advanced)

Create a test API route (optional):

```typescript
// app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfiguration } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const result = await testEmailConfiguration(email);
  return NextResponse.json(result);
}
```

Then send a test email:

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

## Email Template Details

The team invitation email includes:

- **Professional HTML design** with responsive layout
- **Clear call-to-action button** to accept invitation
- **Invitation details**: Inviter name, business name, role
- **Fallback URL** for email clients that don't support buttons
- **Expiration notice** (7 days)
- **Branded footer** with business name

## Troubleshooting

### Problem: Email not sending

**Check:**
1. API key is correct and starts with `re_`
2. API key is in `.env.local` (not `.env`)
3. Server has been restarted after adding environment variables
4. Check server logs for error messages

**Debug:**
```bash
# Check if env vars are loaded
console.log(process.env.RESEND_API_KEY ? 'API key found' : 'API key missing');
```

### Problem: Email going to spam

**Solutions:**
1. Use a verified domain (not `resend.dev`)
2. Add SPF, DKIM, and DMARC records
3. Warm up your sending domain (start with low volume)
4. Avoid spam trigger words in subject/content
5. Include unsubscribe link (optional for transactional emails)

### Problem: "Email service not configured" error

This means `RESEND_API_KEY` is not set. Check:

```bash
# In your terminal
echo $RESEND_API_KEY
```

If empty, add it to `.env.local` and restart the server.

### Problem: Invalid API key error

**Solutions:**
1. Verify the API key hasn't been deleted in Resend dashboard
2. Check for extra spaces or quotes in `.env.local`
3. Regenerate a new API key if needed

### Problem: "From email not verified" error

You're trying to send from an unverified domain. Either:
- Use Resend's test domain: `noreply@resend.dev`
- Verify your domain in Resend dashboard

## Production Deployment

### Netlify

1. Go to Site Settings → Environment Variables
2. Add:
   - `RESEND_API_KEY`: Your production API key
   - `RESEND_FROM_EMAIL`: Your verified domain email

### Vercel

```bash
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
```

### DigitalOcean App Platform

1. Go to Settings → App-Level Environment Variables
2. Add both variables
3. Redeploy your app

### Docker

Add to your `docker-compose.yml`:

```yaml
environment:
  - RESEND_API_KEY=${RESEND_API_KEY}
  - RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL}
```

## Monitoring Email Delivery

### Resend Dashboard

1. Go to **Logs** in Resend dashboard
2. See all sent emails with:
   - Delivery status
   - Opens and clicks (if enabled)
   - Bounce/complaint rates
   - Error messages

### Application Logs

Check your server logs for:

```
[Email] Team invitation sent successfully: re_xxx
```

Or errors:

```
[Email] Failed to send invitation: Invalid API key
```

## Pricing & Limits

### Free Tier
- 3,000 emails/month
- 100 emails/day
- Full API access
- Email logs for 30 days

### Pro Plan ($20/month)
- 50,000 emails/month
- Unlimited daily sending
- Email logs for 90 days
- Priority support

### Enterprise
- Custom volume
- Dedicated IPs
- Custom SLA
- Advanced analytics

**For most small businesses**: Free tier is sufficient (3,000 invites/month)

## Security Best Practices

1. **Never commit API keys** to version control
2. **Rotate keys regularly** (every 90 days recommended)
3. **Use separate keys** for development and production
4. **Monitor logs** for unusual activity
5. **Enable 2FA** on your Resend account
6. **Restrict API key permissions** if possible

## Support & Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend Status Page](https://status.resend.com)
- [Email Best Practices](https://resend.com/docs/send-with-nextjs)

## Advanced Features (Optional)

### Email Analytics

Track opens and clicks by adding to the email send:

```typescript
const { data } = await resend.emails.send({
  from: FROM_EMAIL,
  to: [email],
  subject: 'Team Invitation',
  html: emailHtml,
  tags: [
    { name: 'category', value: 'team-invitation' },
  ],
});
```

### Custom Headers

Add reply-to or other headers:

```typescript
const { data } = await resend.emails.send({
  from: FROM_EMAIL,
  to: [email],
  subject: 'Team Invitation',
  html: emailHtml,
  reply_to: 'support@yourdomain.com',
  headers: {
    'X-Entity-Ref-ID': invitationId,
  },
});
```

### Attachments

Include files in emails:

```typescript
const { data } = await resend.emails.send({
  from: FROM_EMAIL,
  to: [email],
  subject: 'Team Invitation',
  html: emailHtml,
  attachments: [
    {
      filename: 'welcome.pdf',
      content: Buffer.from('...'),
    },
  ],
});
```

## Email Template Customization

To customize the invitation email template, edit:

```
lib/email.ts
```

Key sections:
- **Subject line**: Line 30
- **Email header**: Line 70-75
- **Body content**: Line 80-100
- **CTA button**: Line 105-110
- **Footer**: Line 125-135

## Rate Limiting

Resend implements rate limiting:
- Free tier: 2 requests/second
- Pro tier: 10 requests/second

If you need to send bulk invitations, implement batching:

```typescript
// Send in batches of 10 per second
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

for (const email of emails) {
  await sendTeamInvitationEmail(email);
  await delay(100); // 100ms delay = 10/second
}
```

## Conclusion

Your email system is now configured! Team invitations will be sent automatically with professional, branded emails. Monitor the Resend dashboard for delivery metrics and troubleshoot any issues using the logs.

For questions or issues, check the [Resend documentation](https://resend.com/docs) or contact their support team.
