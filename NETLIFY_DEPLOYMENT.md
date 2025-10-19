# Netlify Deployment Guide

## Prerequisites

Before deploying to Netlify, ensure you have:

1. ✅ A Netlify account
2. ✅ Your Stripe API keys (test or production)
3. ✅ Stripe Product and Price IDs created
4. ✅ A PostgreSQL or SQLite database (SQLite works for small deployments)

## Quick Deploy

### Option 1: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify site
netlify init

# Deploy
netlify deploy --prod
```

### Option 2: Deploy via Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure build settings (already set in `netlify.toml`)
6. Add environment variables (see below)
7. Click "Deploy site"

## Required Environment Variables

Add these environment variables in the Netlify dashboard under:
**Site settings → Environment variables**

### Core Configuration

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Database (Use Supabase for production PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database
# OR for SQLite (small deployments only)
# DATABASE_URL=file:./prod.db
```

### Stripe Configuration (CRITICAL)

```bash
# Stripe API Keys (Get from https://dashboard.stripe.com/apikeys)
# Use sk_test_* for testing, sk_live_* for production
STRIPE_SECRET_KEY=sk_test_51QMsXqNFXjIQEevl...
STRIPE_PUBLISHABLE_KEY=pk_test_51QMsXqNFXjIQEevl...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Create in Stripe Dashboard → Products)
# Missed Call Plan: $297/month, $2970/year
STRIPE_PRICE_MISSED_MONTHLY=price_1234567890abcdef
STRIPE_PRICE_MISSED_ANNUAL=price_0987654321fedcba

# Complete Plan: $497/month, $4970/year
STRIPE_PRICE_COMPLETE_MONTHLY=price_abcdef1234567890
STRIPE_PRICE_COMPLETE_ANNUAL=price_fedcba0987654321

# Unlimited Plan: $997/month, $9970/year
STRIPE_PRICE_UNLIMITED_MONTHLY=price_1111222233334444
STRIPE_PRICE_UNLIMITED_ANNUAL=price_4444333322221111
```

### Optional Configuration

```bash
# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Vapi.ai Configuration (Optional)
VAPI_API_KEY=your-vapi-api-key
VAPI_WEBHOOK_SECRET=your-vapi-webhook-secret

# Retell.ai Configuration (Optional)
RETELL_API_KEY=your-retell-api-key
RETELL_WEBHOOK_SECRET=your-retell-webhook-secret

# Admin User Seed Password
ADMIN_PASSWORD=ChangeMe2025!
```

## Setting Up Stripe

### Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in
3. Toggle to "Test mode" for testing

### Step 2: Get API Keys

1. Go to **Developers → API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add these to Netlify environment variables

### Step 3: Create Products and Prices

1. Go to **Products → Add product**
2. Create three products:

**Missed Call Plan**
- Name: Missed Call Plan
- Description: After-hours call coverage
- Pricing:
  - Monthly: $297/month (recurring)
  - Annual: $2970/year (recurring)
- Copy the Price IDs

**Complete Plan**
- Name: Complete Plan
- Description: Full-featured call management
- Pricing:
  - Monthly: $497/month (recurring)
  - Annual: $4970/year (recurring)
- Copy the Price IDs

**Unlimited Plan**
- Name: Unlimited Plan
- Description: Enterprise-grade solution
- Pricing:
  - Monthly: $997/month (recurring)
  - Annual: $9970/year (recurring)
- Copy the Price IDs

3. Add all 6 Price IDs to Netlify environment variables

### Step 4: Set Up Webhooks

1. Go to **Developers → Webhooks**
2. Click "Add endpoint"
3. Endpoint URL: `https://your-site-name.netlify.app/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Netlify as `STRIPE_WEBHOOK_SECRET`

## Database Setup

### Option 1: Supabase (Recommended for Production)

1. Create a [Supabase](https://supabase.com) account
2. Create a new project
3. Go to **Settings → Database**
4. Copy the **Connection String** (Pooler)
5. Add to Netlify as `DATABASE_URL`

### Option 2: SQLite (Development/Small Scale)

SQLite works for small deployments but has limitations on Netlify:
- Database resets on each deploy
- Not suitable for production with multiple users

If using SQLite, ensure `DATABASE_URL=file:./prod.db` is set.

## Deployment Checklist

Before going live, ensure:

- [ ] All environment variables are set in Netlify
- [ ] `NEXTAUTH_URL` matches your Netlify domain
- [ ] `NEXTAUTH_SECRET` is a strong random string
- [ ] Stripe API keys are correct (test or production)
- [ ] All 6 Stripe Price IDs are configured
- [ ] Stripe webhook endpoint is set up and verified
- [ ] Database is accessible and migrated
- [ ] Test a full user registration and subscription flow
- [ ] Verify billing page loads without errors
- [ ] Test Stripe checkout flow
- [ ] Verify webhook events are received

## Post-Deployment

### 1. Run Database Migrations

If using PostgreSQL, run migrations after first deploy:

```bash
# Via Netlify CLI
netlify env:import .env.local
npx prisma migrate deploy
```

Or add to your build command in `netlify.toml`:

```toml
[build]
  command = "prisma generate && prisma migrate deploy && npm run build"
```

### 2. Test the Application

1. Visit your Netlify URL
2. Create a test account (use test email)
3. Verify setup modal appears
4. Test subscription flow with [Stripe test cards](https://stripe.com/docs/testing#cards)
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`
5. Verify billing page shows subscription details
6. Test webhook delivery in Stripe Dashboard

### 3. Monitor Errors

Check for errors in:
- **Netlify Deploy Logs**: Build and deploy errors
- **Netlify Function Logs**: Runtime errors
- **Stripe Webhook Logs**: Webhook delivery status
- **Browser Console**: Frontend errors

## Troubleshooting

### Build Fails

**Error: "STRIPE_SECRET_KEY is not set"**
- Solution: Add all Stripe environment variables in Netlify dashboard

**Error: "Database connection failed"**
- Solution: Verify `DATABASE_URL` is correct and accessible

### App Not Loading

**White screen or 500 error**
1. Check Netlify function logs
2. Verify all required environment variables are set
3. Ensure database is accessible
4. Check build logs for errors

### Stripe Integration Issues

**"Stripe configuration missing" warning**
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_`
- Ensure no placeholder values remain

**Checkout not working**
- Verify Price IDs are correct
- Check Stripe dashboard for failed checkout sessions
- Ensure webhook endpoint is reachable

### Database Issues

**"Prisma Client is not ready yet"**
- Run `npx prisma generate` in build command
- Verify migrations ran successfully

**Data resets on deploy (SQLite)**
- SQLite database files are ephemeral on Netlify
- Migrate to PostgreSQL for persistent data

## Going to Production

When ready for production:

1. **Switch to Stripe Live Mode**
   - Get live API keys from Stripe Dashboard
   - Update all environment variables with `sk_live_*` and `pk_live_*`
   - Re-create webhook endpoint for production URL

2. **Use Production Database**
   - Migrate to PostgreSQL (Supabase recommended)
   - Run production migrations

3. **Update Security Settings**
   - Change `ADMIN_PASSWORD`
   - Rotate `NEXTAUTH_SECRET`
   - Enable HTTPS (automatic on Netlify)

4. **Custom Domain (Optional)**
   - Add custom domain in Netlify settings
   - Update `NEXTAUTH_URL` to custom domain
   - Update Stripe webhook endpoint URL

## Support

For issues with:
- **Netlify**: [Netlify Support](https://docs.netlify.com)
- **Stripe**: [Stripe Support](https://support.stripe.com)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **Prisma**: [Prisma Documentation](https://www.prisma.io/docs)

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` files to version control
- Use strong, unique values for all secrets
- Regularly rotate API keys and secrets
- Enable Stripe webhook signature verification
- Monitor Stripe dashboard for suspicious activity
- Set up alerts for failed payments

---

**Last Updated**: 2025-01-16
**Version**: 1.0.0
