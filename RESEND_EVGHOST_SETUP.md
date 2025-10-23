# Resend Setup Guide for evghost.com

Complete guide for setting up Resend email service with your custom domain (evghost.com) for team invitation emails.

---

## Quick Start

### 1. Get Your Resend API Key

1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Sign in or create an account
3. Click "Create API Key"
4. Name it (e.g., "Production - evghost.com")
5. Copy the API key (starts with `re_`)

### 2. Add Domain to Resend

1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `evghost.com`
4. Click "Add"
5. Resend will provide DNS records to configure

---

## DNS Configuration

### Required DNS Records

After adding your domain, Resend will provide these records. Add them to your domain registrar (where evghost.com is registered):

#### 1. SPF Record (TXT)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### 2. DKIM Record (TXT)
```
Type: TXT
Name: resend._domainkey
Value: [Provided by Resend - copy exactly]
TTL: 3600
```

#### 3. Domain Verification (TXT)
```
Type: TXT
Name: _resend
Value: [Provided by Resend - copy exactly]
TTL: 3600
```

#### 4. Return-Path (CNAME) - Optional but Recommended
```
Type: CNAME
Name: resend
Value: feedback-smtp.resend.com
TTL: 3600
```

### Where to Add DNS Records

Common domain registrars:
- **GoDaddy**: Domain Settings → Manage DNS → Add Record
- **Namecheap**: Domain List → Manage → Advanced DNS → Add New Record
- **Cloudflare**: DNS → Add Record
- **Google Domains**: DNS → Custom Records → Manage Custom Records

---

## Environment Variables Setup

### Option 1: Local Development (.env.local)

Create or update `.env.local` (this file is gitignored):

```bash
# Resend Configuration
RESEND_API_KEY="re_your_actual_api_key_here"
RESEND_FROM_EMAIL="noreply@evghost.com"
```

### Option 2: Vercel Production

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```
Name: RESEND_API_KEY
Value: re_your_actual_api_key_here
Environment: Production, Preview, Development
```

```
Name: RESEND_FROM_EMAIL
Value: noreply@evghost.com
Environment: Production, Preview, Development
```

4. Click "Save"
5. Redeploy your application

---

## DNS Propagation Timeline

After adding DNS records:
- **Initial verification**: 5-15 minutes (sometimes instant)
- **Full propagation**: 24-48 hours
- **Best practice**: Wait 24 hours before production use

### Check DNS Propagation

Use these tools to verify your DNS records are live:
- [https://dnschecker.org/](https://dnschecker.org/)
- [https://mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx)

---

## Temporary Testing Solutions

While waiting for DNS to propagate, you have two options:

### Option A: Use Verified Test Emails (Recommended)

1. Go to [https://resend.com/emails](https://resend.com/emails)
2. Click "Verified Emails" or "Add Email"
3. Add the email addresses you want to test with
4. Verify each email by clicking the link sent to that inbox
5. Keep using `onboarding@resend.dev` as FROM address temporarily

Update `.env.local` temporarily:
```bash
RESEND_API_KEY="re_your_actual_api_key_here"
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

### Option B: Use Alternative Resend Domains

Resend provides these domains for testing:
```bash
RESEND_FROM_EMAIL="notifications@resend.dev"
# or
RESEND_FROM_EMAIL="team@resend.dev"
```

⚠️ **Important**: With Resend's default domains, you can ONLY send to verified email addresses!

---

## Verifying Domain Setup in Resend

1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Check the status of evghost.com:
   - ✅ **Verified** = Ready to send emails!
   - ⏳ **Pending** = DNS records not yet propagated
   - ❌ **Failed** = DNS records incorrect

3. Click on your domain to see specific record verification status
4. Fix any records showing as "Not Found" or "Invalid"

---

## Testing Your Setup

### Test Email Function

Your application includes a test email function. Test it via the API:

```bash
# Using curl
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "your-test@email.com"}'

# Or using the Admin Settings UI
# Navigate to: Settings → Integrations → Test Email Configuration
```

### Send a Test Team Invitation

1. Log in as an admin
2. Go to Team Management
3. Click "Invite Team Member"
4. Enter a test email address
5. Select role and permissions
6. Click "Send Invitation"
7. Check the email inbox and server logs

### Check Logs

Monitor your application logs for email sending:
```bash
# Development
npm run dev

# Look for these log messages:
[Email] Attempting to send invitation to: test@example.com
[Email] From address: noreply@evghost.com
[Email] ✅ Team invitation sent successfully to: test@example.com
```

---

## Troubleshooting

### Error: "Email service not configured"
**Cause**: Missing `RESEND_API_KEY`
**Solution**: Add the API key to your environment variables and restart the server

### Error: "Failed to send email: Domain not verified"
**Cause**: Domain not yet verified in Resend
**Solution**:
1. Check DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Use temporary workaround with verified test emails

### Error: "Can only send to verified emails"
**Cause**: Using a Resend default domain (`@resend.dev`)
**Solution**:
1. Add recipient emails to verified list in Resend dashboard
2. OR wait for custom domain verification to complete

### Emails Not Arriving
**Checklist**:
- [ ] Check spam/junk folder
- [ ] Verify RESEND_API_KEY is correct
- [ ] Verify RESEND_FROM_EMAIL matches verified domain
- [ ] Check Resend dashboard logs: [https://resend.com/emails](https://resend.com/emails)
- [ ] Verify DNS records are propagated

### DNS Records Not Verifying
**Solutions**:
1. Double-check you copied the exact values from Resend
2. Ensure no extra spaces in the record values
3. Try using TTL of 3600 instead of Auto
4. Wait 24 hours for full propagation
5. Clear your local DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

## Production Checklist

Before going live with team invitations:

- [ ] Domain added to Resend
- [ ] All DNS records configured at domain registrar
- [ ] DNS records verified in Resend dashboard (all green checkmarks)
- [ ] RESEND_API_KEY added to Vercel environment variables
- [ ] RESEND_FROM_EMAIL set to `noreply@evghost.com`
- [ ] Test email sent successfully
- [ ] Test team invitation sent and received
- [ ] Email appears in recipient inbox (not spam)
- [ ] Email formatting looks correct
- [ ] Invitation link works correctly
- [ ] Monitor Resend dashboard for delivery status

---

## Monitoring & Analytics

### Resend Dashboard
[https://resend.com/emails](https://resend.com/emails)

Monitor:
- Email delivery status (sent, delivered, bounced, complained)
- Open rates
- Click rates
- Bounce rates
- Spam complaints

### Application Logs

Check your application logs for:
```
[Email] ✅ Team invitation sent successfully to: user@example.com
[Email] Message ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## Cost & Limits

### Resend Free Tier
- 100 emails/day
- 3,000 emails/month
- Perfect for testing and small teams

### Paid Plans (if needed)
- Pro: $20/month - 50,000 emails/month
- Business: Custom pricing

Check current pricing: [https://resend.com/pricing](https://resend.com/pricing)

---

## Support & Resources

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend API Reference**: [https://resend.com/docs/api-reference](https://resend.com/docs/api-reference)
- **DNS Setup Help**: [https://resend.com/docs/dashboard/domains/introduction](https://resend.com/docs/dashboard/domains/introduction)
- **Resend Support**: support@resend.com

---

## Quick Reference Commands

```bash
# Install dependencies (if needed)
npm install resend

# Test locally
npm run dev

# Deploy to Vercel
vercel deploy --prod

# Check environment variables in Vercel
vercel env ls

# Add environment variable to Vercel
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
```

---

## Security Best Practices

1. ✅ Never commit `.env` or `.env.local` to version control
2. ✅ Use different API keys for development and production
3. ✅ Rotate API keys periodically
4. ✅ Monitor Resend dashboard for suspicious activity
5. ✅ Set up SPF, DKIM, and DMARC records for email authentication
6. ✅ Use HTTPS for all invitation links
7. ✅ Implement rate limiting for invitation endpoints

---

## Next Steps

Once your domain is verified:

1. Update production environment variables to use `noreply@evghost.com`
2. Send test invitations to verify everything works
3. Monitor the first few invitations closely
4. Set up email monitoring and alerts
5. Consider adding a "Resend Invitation" feature for failed deliveries

---

## Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review application logs for error messages
3. Check Resend dashboard for email status
4. Verify all DNS records are correct
5. Contact Resend support if domain verification issues persist

Happy emailing! 🚀
