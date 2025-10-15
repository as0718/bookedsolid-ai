# BookedSolid AI - Production Deployment Guide

## ✅ Completed Implementation

### 1. Authentication System
- ✅ Database-backed sessions using Prisma Adapter
- ✅ Google OAuth integration ready
- ✅ Email/password authentication
- ✅ Role-based access control (admin/client)
- ✅ SQLite database for production

### 2. Dashboard Integration
- ✅ Real-time data from SQLite database
- ✅ Client dashboard with live metrics
- ✅ Admin dashboard with all clients overview
- ✅ Call history tracking and analytics

### 3. Stripe Payment Integration
- ✅ Three subscription tiers (Missed/Complete/Unlimited)
- ✅ Monthly and annual billing options
- ✅ Stripe Checkout for new subscriptions
- ✅ Stripe Billing Portal for subscription management
- ✅ Automatic billing updates via webhooks
- ✅ Usage-based billing for call minutes
- ✅ Overage tracking ($0.15/min after plan limit)

### 4. Webhook Handlers
- ✅ Retell.ai webhook endpoint (`/api/webhooks/retell`)
- ✅ Vapi.ai webhook endpoint (`/api/webhooks/vapi`)
- ✅ Stripe webhook endpoint (`/api/webhooks/stripe`)
- ✅ Automatic call minute tracking
- ✅ Real-time billing updates

### 5. Database Schema
- ✅ User management (NextAuth tables)
- ✅ Client management with Stripe integration
- ✅ Call records with full metadata
- ✅ Billing and subscription tracking

## 🚀 Deployment Steps

### Step 1: Set Up Stripe Products

1. Go to https://dashboard.stripe.com/products
2. Create three products:

#### Missed Call Plan
- Name: "Missed Call Recovery"
- Monthly Price: $297/month
- Annual Price: $2,970/year
- Description: "500 minutes/month, After-hours coverage"

#### Complete Plan
- Name: "Complete Receptionist"
- Monthly Price: $497/month
- Annual Price: $4,970/year
- Description: "1,000 minutes/month, 24/7 coverage"

#### Unlimited Plan
- Name: "Unlimited Plan"
- Monthly Price: $997/month
- Annual Price: $9,970/year
- Description: "Unlimited minutes, Premium features"

3. Copy the Price IDs for each plan (they look like `price_xxxxx`)

### Step 2: Configure Environment Variables on Vercel

Set these environment variables in your Vercel project settings:

```bash
# Database
DATABASE_URL="file:./prod.db"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="[Generate: openssl rand -base64 32]"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="[From Google Cloud Console]"
GOOGLE_CLIENT_SECRET="[From Google Cloud Console]"

# Retell.ai
RETELL_WEBHOOK_SECRET="[From Retell Dashboard]"

# Vapi.ai (optional)
VAPI_WEBHOOK_SECRET="[From Vapi Dashboard]"

# Stripe
STRIPE_SECRET_KEY="sk_live_xxxxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"

# Stripe Price IDs (from Step 1)
STRIPE_PRICE_MISSED_MONTHLY="price_xxxxx"
STRIPE_PRICE_MISSED_ANNUAL="price_xxxxx"
STRIPE_PRICE_COMPLETE_MONTHLY="price_xxxxx"
STRIPE_PRICE_COMPLETE_ANNUAL="price_xxxxx"
STRIPE_PRICE_UNLIMITED_MONTHLY="price_xxxxx"
STRIPE_PRICE_UNLIMITED_ANNUAL="price_xxxxx"
```

### Step 3: Deploy to Vercel

Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

Option B: Using Git Integration
1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

### Step 4: Configure Webhooks

After deployment, configure these webhook endpoints:

#### Stripe Webhooks
- URL: `https://your-domain.vercel.app/api/webhooks/stripe`
- Events to subscribe:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`

#### Retell.ai Webhooks
- URL: `https://your-domain.vercel.app/api/webhooks/retell`
- Copy the webhook secret to `RETELL_WEBHOOK_SECRET`

#### Vapi.ai Webhooks (if using)
- URL: `https://your-domain.vercel.app/api/webhooks/vapi`
- Copy the webhook secret to `VAPI_WEBHOOK_SECRET`

### Step 5: Initialize Database

After first deployment, you may need to seed the database with initial data. Create a client in the database or use the admin interface.

## 📊 Post-Deployment Checklist

- [ ] Test authentication (login/logout)
- [ ] Test Google OAuth (if configured)
- [ ] Test Stripe checkout flow
- [ ] Test Stripe billing portal
- [ ] Test webhook endpoints (use webhook testing tools)
- [ ] Verify call tracking and minute billing
- [ ] Create admin user
- [ ] Create test client
- [ ] Monitor webhook logs in Vercel dashboard
- [ ] Set up monitoring/alerts for webhook failures

## 🔒 Security Notes

1. **Webhook Secrets**: Always verify webhook signatures
2. **Environment Variables**: Never commit `.env` files to git
3. **API Keys**: Use Stripe test keys for development
4. **Database**: SQLite works for moderate traffic; consider PostgreSQL for high scale
5. **Rate Limiting**: Consider adding rate limiting to API routes

## 🛠 Maintenance

### Updating Stripe Prices
1. Create new prices in Stripe Dashboard
2. Update environment variables with new Price IDs
3. Redeploy to Vercel

### Database Migrations
```bash
npx prisma migrate deploy
```

### Viewing Database
```bash
npx prisma studio
```

## 📝 Webhook URLs Summary

```
Stripe:   https://your-domain.vercel.app/api/webhooks/stripe
Retell:   https://your-domain.vercel.app/api/webhooks/retell
Vapi:     https://your-domain.vercel.app/api/webhooks/vapi
```

## 🆘 Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run build`
- Verify all environment variables are set

### Database Issues
- Ensure `DATABASE_URL` is correctly set
- Run migrations: `npx prisma migrate deploy`

### Stripe Not Working
- Verify webhook secret matches Stripe dashboard
- Check webhook endpoint is publicly accessible
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Call Tracking Not Working
- Verify Retell/Vapi webhook secrets
- Check logs in Vercel dashboard
- Ensure client has correct agent IDs in settings

## 🎉 Success!

Your BookedSolid AI platform is now fully deployed and ready for production use!

### Key Features:
- ✅ Secure authentication with database sessions
- ✅ Real-time dashboards with live data
- ✅ Stripe payment processing and subscriptions
- ✅ Automatic call minute tracking
- ✅ Usage-based billing with overage handling
- ✅ Production-ready webhook handlers

### Next Steps:
1. Configure your Retell.ai or Vapi.ai agents
2. Add client metadata with `client_id` in agent settings
3. Test the full flow: signup → subscribe → receive calls → track minutes
4. Monitor webhooks and billing in Stripe Dashboard
