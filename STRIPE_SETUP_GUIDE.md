# Stripe Setup Guide for BookedSolid AI

This guide will help you configure Stripe for local development and production deployment.

## Quick Start

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Toggle to **Test mode** (for development)
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Update Local Environment

Open `.env.local` and replace the placeholder values:

```bash
# Replace these with your actual Stripe test keys
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

### 3. Create Subscription Products

#### Create Missed Call Plan ($297/month)

1. Go to [Products](https://dashboard.stripe.com/test/products)
2. Click **Add product**
3. Fill in:
   - Name: `Missed Call Plan`
   - Description: `After-hours call coverage with 500 minutes per month`
4. Add pricing:
   - **Monthly**: $297.00 / month (recurring)
   - **Annual**: $2,970.00 / year (recurring)
5. Click **Save product**
6. Copy both Price IDs (they start with `price_`)

#### Create Complete Plan ($497/month)

1. Click **Add product**
2. Fill in:
   - Name: `Complete Plan`
   - Description: `Full-featured call management with 1,000 minutes per month`
3. Add pricing:
   - **Monthly**: $497.00 / month (recurring)
   - **Annual**: $4,970.00 / year (recurring)
4. Click **Save product**
5. Copy both Price IDs

#### Create Unlimited Plan ($997/month)

1. Click **Add product**
2. Fill in:
   - Name: `Unlimited Plan`
   - Description: `Enterprise-grade solution with unlimited minutes`
3. Add pricing:
   - **Monthly**: $997.00 / month (recurring)
   - **Annual**: $9,970.00 / year (recurring)
4. Click **Save product**
5. Copy both Price IDs

### 4. Add Price IDs to Environment

Update `.env.local` with your Price IDs:

```bash
# Missed Call Plan
STRIPE_PRICE_MISSED_MONTHLY=price_1234567890abcdef    # Replace with actual ID
STRIPE_PRICE_MISSED_ANNUAL=price_0987654321fedcba     # Replace with actual ID

# Complete Plan
STRIPE_PRICE_COMPLETE_MONTHLY=price_abcdef1234567890  # Replace with actual ID
STRIPE_PRICE_COMPLETE_ANNUAL=price_fedcba0987654321   # Replace with actual ID

# Unlimited Plan
STRIPE_PRICE_UNLIMITED_MONTHLY=price_1111222233334444 # Replace with actual ID
STRIPE_PRICE_UNLIMITED_ANNUAL=price_4444333322221111  # Replace with actual ID
```

### 5. Set Up Webhook

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Endpoint URL:
   - Local: `http://localhost:3000/api/webhooks/stripe`
   - Production: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### 6. Test Your Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the billing page:
   ```
   http://localhost:3000/dashboard/billing
   ```

3. You should now see:
   - ✅ No "Stripe configuration missing" warning
   - ✅ Subscription plans display correctly
   - ✅ "Subscribe Now" button works

### 7. Test Stripe Checkout

Use Stripe's test cards:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Decline:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing#cards

## Testing Webhooks Locally

### Option 1: Stripe CLI (Recommended)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   # or
   scoop install stripe
   ```

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. The CLI will output a webhook signing secret. Add it to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Option 2: ngrok (Alternative)

1. Install ngrok: https://ngrok.com/download

2. Start ngrok:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Add webhook endpoint in Stripe Dashboard:
   - URL: `https://abc123.ngrok.io/api/webhooks/stripe`

## Going to Production

### 1. Switch to Live Mode

1. Go to [Live API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **live** keys (start with `sk_live_` and `pk_live_`)

### 2. Create Live Products

Repeat the product creation steps in **Live mode**:
- Create all 3 products (Missed, Complete, Unlimited)
- Create both monthly and annual pricing for each
- Copy all 6 live Price IDs

### 3. Update Production Environment

In your Netlify/Vercel dashboard, update environment variables with **live** values:

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# Live Price IDs
STRIPE_PRICE_MISSED_MONTHLY=price_live_...
STRIPE_PRICE_MISSED_ANNUAL=price_live_...
STRIPE_PRICE_COMPLETE_MONTHLY=price_live_...
STRIPE_PRICE_COMPLETE_ANNUAL=price_live_...
STRIPE_PRICE_UNLIMITED_MONTHLY=price_live_...
STRIPE_PRICE_UNLIMITED_ANNUAL=price_live_...
```

### 4. Set Up Live Webhook

1. Go to [Live Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-production-domain.com/api/webhooks/stripe`
3. Select the same events as test mode
4. Copy the **live** signing secret
5. Add to production environment variables

## Troubleshooting

### "Stripe configuration missing" warning

**Issue:** Placeholder values still in `.env.local`

**Fix:**
1. Ensure all Stripe environment variables are set with **actual** values
2. No value should contain "REPLACE_WITH_YOUR"
3. Keys should start with `sk_test_` or `pk_test_` (for test mode)

### "Invalid API key" error

**Issue:** Using wrong key or key for wrong mode

**Fix:**
1. Verify you're using **test** keys for development
2. Check there are no extra spaces or quotes in `.env.local`
3. Ensure keys match the format: `sk_test_...` and `pk_test_...`

### Checkout not loading

**Issue:** Price IDs are incorrect or missing

**Fix:**
1. Go to Stripe Dashboard → Products
2. Click on each product
3. Find the Price IDs under "Pricing"
4. Copy the exact ID (starts with `price_`)
5. Update `.env.local` with correct IDs

### Webhooks not receiving events

**Issue:** Webhook endpoint not configured or signing secret incorrect

**Fix:**
1. For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. For production, verify webhook URL is accessible: `https://your-domain.com/api/webhooks/stripe`
3. Check webhook logs in Stripe Dashboard for delivery status

### "No such customer" error

**Issue:** Customer not created in Stripe

**Fix:**
1. Delete the user's Stripe customer ID from database
2. Try subscribing again (will create new customer)

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Test Cards**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Webhooks Guide**: https://stripe.com/docs/webhooks
- **Dashboard**: https://dashboard.stripe.com

## Security Best Practices

⚠️ **IMPORTANT**:

1. ✅ Never commit `.env.local` to version control
2. ✅ Use test keys for development, live keys for production only
3. ✅ Rotate keys if they're ever exposed
4. ✅ Always verify webhook signatures (already implemented)
5. ✅ Monitor Stripe Dashboard for suspicious activity
6. ✅ Set up email alerts for failed payments
7. ✅ Use Stripe's fraud detection tools (Radar)

---

Need help? Contact support or check the [Stripe Support Center](https://support.stripe.com)
