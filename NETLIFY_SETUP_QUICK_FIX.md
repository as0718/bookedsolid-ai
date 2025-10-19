# 🚨 IMMEDIATE NETLIFY FIXES

## Your Netlify App URL
**https://curious-kelpie-b61c6f.netlify.app**

---

## ✅ STEP 1: Add Environment Variables to Netlify

Go to: **https://app.netlify.com** → Your Site → **Site settings** → **Environment variables**

Add these **exactly** as shown:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://curious-kelpie-b61c6f.netlify.app
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth (CRITICAL - Update redirect URIs!)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Stripe Keys (✅ Already have these)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Database (SQLite for now - works on Netlify)
DATABASE_URL=file:./prod.db

# Stripe Price IDs (⚠️ YOU MUST CREATE THESE IN STRIPE!)
STRIPE_PRICE_MISSED_MONTHLY=price_YOUR_ACTUAL_ID_HERE
STRIPE_PRICE_MISSED_ANNUAL=price_YOUR_ACTUAL_ID_HERE
STRIPE_PRICE_COMPLETE_MONTHLY=price_YOUR_ACTUAL_ID_HERE
STRIPE_PRICE_COMPLETE_ANNUAL=price_YOUR_ACTUAL_ID_HERE
STRIPE_PRICE_UNLIMITED_MONTHLY=price_YOUR_ACTUAL_ID_HERE
STRIPE_PRICE_UNLIMITED_ANNUAL=price_YOUR_ACTUAL_ID_HERE
```

---

## ✅ STEP 2: Fix Google OAuth Redirect URIs

### Go to Google Cloud Console:
https://console.cloud.google.com/apis/credentials

### Find your OAuth 2.0 Client ID:
`your_google_client_id.apps.googleusercontent.com`

### Click "Edit" and add these Authorized redirect URIs:

```
https://curious-kelpie-b61c6f.netlify.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

**CRITICAL:** Remove any old/incorrect redirect URIs like:
- ❌ `bookedsolid-ai.netlify.app` (wrong domain)
- ❌ Any URLs that don't match your actual Netlify URL

### Save Changes

---

## ✅ STEP 3: Create Stripe Products & Get Price IDs

### Go to Stripe Dashboard:
https://dashboard.stripe.com/test/products

### Create 3 Products with Recurring Pricing:

#### 1. Missed Call Plan
- Click **"+ Add product"**
- Name: `Missed Call Plan`
- Description: `After-hours call coverage with 500 minutes per month`
- Pricing model: **Standard pricing**
- Add Two Prices:
  - Price 1: `$297.00` / `month` (Recurring)
  - Price 2: `$2,970.00` / `year` (Recurring)
- **Copy both Price IDs** (start with `price_`)

#### 2. Complete Plan
- Click **"+ Add product"**
- Name: `Complete Plan`
- Description: `Full-featured call management with 1,000 minutes per month`
- Add Two Prices:
  - Price 1: `$497.00` / `month` (Recurring)
  - Price 2: `$4,970.00` / `year` (Recurring)
- **Copy both Price IDs**

#### 3. Unlimited Plan
- Click **"+ Add product"**
- Name: `Unlimited Plan`
- Description: `Enterprise-grade solution with unlimited minutes`
- Add Two Prices:
  - Price 1: `$997.00` / `month` (Recurring)
  - Price 2: `$9,970.00` / `year` (Recurring)
- **Copy both Price IDs**

### Update Netlify Environment Variables:
Replace the placeholder Price IDs with your actual ones:

```bash
STRIPE_PRICE_MISSED_MONTHLY=price_1A2B3C4D5E6F
STRIPE_PRICE_MISSED_ANNUAL=price_6F5E4D3C2B1A
STRIPE_PRICE_COMPLETE_MONTHLY=price_7G8H9I0J1K2L
STRIPE_PRICE_COMPLETE_ANNUAL=price_2L1K0J9I8H7G
STRIPE_PRICE_UNLIMITED_MONTHLY=price_3M4N5O6P7Q8R
STRIPE_PRICE_UNLIMITED_ANNUAL=price_8R7Q6P5O4N3M
```

---

## ✅ STEP 4: Set Up Stripe Webhook (Production)

### Go to Stripe Webhooks:
https://dashboard.stripe.com/test/webhooks

### Add Endpoint:
1. Click **"+ Add endpoint"**
2. Endpoint URL: `https://curious-kelpie-b61c6f.netlify.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Click **"Add endpoint"**
5. **Copy the Signing secret** (starts with `whsec_`)
6. Add to Netlify environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

---

## ✅ STEP 5: Redeploy Netlify

After adding all environment variables:

1. Go to your Netlify dashboard
2. Click **"Deploys"**
3. Click **"Trigger deploy"** → **"Deploy site"**
4. Wait for deployment to complete (2-3 minutes)

---

## ✅ STEP 6: Test Everything

### Test Authentication:
1. Go to: https://curious-kelpie-b61c6f.netlify.app/login
2. Click "Sign in with Google"
3. Should redirect properly (no more OAuth errors)

### Test Billing Page:
1. Go to: https://curious-kelpie-b61c6f.netlify.app/dashboard/billing
2. Should load without Stripe configuration errors
3. Plans should display correctly

### Test Stripe Checkout:
1. Click "Subscribe Now" on any plan
2. Should redirect to Stripe checkout page
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Should redirect back to your dashboard

---

## 🔍 Troubleshooting

### Issue: "OAuthSignin error" still appears

**Solution:**
1. Double-check redirect URI in Google Cloud Console
2. Make sure it's **exactly**: `https://curious-kelpie-b61c6f.netlify.app/api/auth/callback/google`
3. No trailing slashes
4. HTTPS (not HTTP)
5. Redeploy Netlify after changes

### Issue: "Failed to create checkout session"

**Solution:**
1. Verify all 6 Stripe Price IDs are set in Netlify
2. Check they start with `price_` (not `prod_`)
3. Make sure they're from your Stripe **test mode**
4. Redeploy after adding Price IDs

### Issue: Billing page shows "Stripe configuration missing"

**Solution:**
1. Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set (note the `NEXT_PUBLIC_` prefix)
2. Verify it starts with `pk_test_`
3. Clear browser cache
4. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Database errors after deployment

**Solution:**
SQLite database resets on each Netlify deploy. For production, migrate to PostgreSQL:

1. Create a Supabase account: https://supabase.com
2. Create a new project
3. Get connection string from **Settings → Database**
4. Update Netlify env: `DATABASE_URL=postgresql://...`
5. Redeploy

---

## 📋 Quick Checklist

Before going live, verify:

- [ ] `NEXTAUTH_URL` = `https://curious-kelpie-b61c6f.netlify.app`
- [ ] Google OAuth redirect URI matches Netlify URL
- [ ] All 6 Stripe Price IDs are added
- [ ] Stripe webhook endpoint is configured
- [ ] Netlify deployment successful
- [ ] OAuth login works
- [ ] Billing page loads without errors
- [ ] Stripe checkout creates session successfully
- [ ] Test purchase completes

---

## 🎯 Current Status

### ✅ Fixed:
- Stripe API keys configured
- Auth error page created
- Better error messages
- Correct environment variable names

### ⚠️ Required Actions (You Must Do):
1. **Add all environment variables to Netlify** (Step 1)
2. **Fix Google OAuth redirect URIs** (Step 2)
3. **Create Stripe products & get Price IDs** (Step 3)
4. **Set up Stripe webhook** (Step 4)
5. **Redeploy Netlify** (Step 5)

---

## 📞 Support

If you encounter issues:
1. Check Netlify deploy logs: `https://app.netlify.com/sites/curious-kelpie-b61c6f/deploys`
2. Check Stripe webhook logs: `https://dashboard.stripe.com/test/webhooks`
3. Check browser console for errors (F12 → Console)

---

**Last Updated:** Now
**Your Netlify URL:** https://curious-kelpie-b61c6f.netlify.app
**Status:** Ready to configure (follow steps above)
