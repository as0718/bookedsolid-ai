# Vercel + Supabase Deployment Guide

**Zero-cost deployment for BookedSolid AI**

## ⚠️ CRITICAL FIX - Environment Variables Error

If you're seeing: **"Environment Variable 'DATABASE_URL' references Secret 'database_url', which does not exist"**

### Root Cause
The `vercel.json` file was using `@secret_name` syntax (e.g., `@database_url`), which tells Vercel to look for **secret references** instead of using direct environment variable values.

### Fix Applied
1. ✅ Removed the `env` section from `vercel.json`
2. ✅ Created `.env.production` with correct values
3. ✅ Updated `.gitignore` to allow `.env.production`
4. ✅ Environment variables now set in Vercel Dashboard (see Step 2 below)

**What Changed:**
- `vercel.json` no longer contains secret references
- Environment variables are managed in Vercel Dashboard
- `.env.production` serves as deployment reference

---

## Prerequisites
- GitHub account
- Vercel account (free)
- Supabase account (free)

---

## Step 1: Setup Supabase Database (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - Name: `bookedsolid-ai`
   - Database Password: Generate strong password (SAVE THIS!)
   - Region: Choose closest to users
4. Click **Create Project** (takes ~2 minutes)
5. Go to **Project Settings > Database**
6. Copy these connection strings:
   - **Connection Pooling** (Transaction mode): `postgresql://postgres.[PROJECT-REF].pooler.supabase.com:6543/postgres`
   - **Connection String** (Direct): `postgresql://postgres.[PROJECT-REF].supabase.co:5432/postgres`

---

## Step 2: Deploy to Vercel (5 minutes)

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or `./dashboard` if needed)
   - **Build Command**: `prisma generate && prisma migrate deploy && next build`
   - **Install Command**: `npm install --legacy-peer-deps`

5. Add Environment Variables in Vercel Dashboard:

   Go to **Settings > Environment Variables** and add these **WITHOUT QUOTES**:

   **Variable Name**: `DATABASE_URL`
   **Value**: `postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres`
   **Environment**: Production

   **Variable Name**: `DIRECT_DATABASE_URL`
   **Value**: `postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres`
   **Environment**: Production

   **Variable Name**: `NEXTAUTH_URL`
   **Value**: `https://bookedsolid-ai.vercel.app`
   **Environment**: Production

   **Variable Name**: `NEXTAUTH_SECRET`
   **Value**: `eqNXkOQfX4utUSCeoYzw4oCZGf4LY6VLdtV5Y7qs`
   **Environment**: Production

   **IMPORTANT**:
   - Do NOT wrap values in quotes
   - Do NOT add extra spaces
   - Copy values exactly as shown
   - Select "Production" environment for each

6. Click **Deploy**

---

## Step 3: Run Database Migration (2 minutes)

After first deploy:

**Option A: Using Vercel CLI** (recommended)
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Via Vercel Dashboard**
1. Go to your project > **Settings > Functions**
2. Run command in terminal:
```bash
DATABASE_URL="your-pooler-url" DIRECT_DATABASE_URL="your-direct-url" npx prisma migrate deploy
```

**Option C: Manual SQL** (if above fails)
1. Go to Supabase Dashboard > **SQL Editor**
2. Copy SQL from `prisma/migrations/` folders
3. Run each migration in order

---

## Step 4: Configure Retell Webhook (2 minutes)

1. Go to https://app.retellai.com/dashboard
2. Navigate to **Settings > Webhooks**
3. Add webhook URL: `https://your-app.vercel.app/api/webhooks/retell`
4. Copy **Webhook Secret** and update in Vercel env vars

---

## Step 5: Seed Database (Optional - 1 minute)

```bash
vercel env pull .env.local
npm run db:seed
```

---

## Free Tier Limits

### Vercel (Hobby)
- 100GB bandwidth/month
- 1,000 deployments/month
- Serverless functions: 10s timeout
- **Upgrade at**: ~10k monthly visitors

### Supabase (Free)
- 500MB database
- 2GB bandwidth/month
- 50k monthly active users
- Paused after 7 days inactivity (auto-resumes on access)
- **Upgrade at**: 500MB data or 2GB bandwidth

---

## Cost Estimator

**Current setup: $0/month**

When to upgrade:
- **Vercel Pro** ($20/mo): 1TB bandwidth, 100GB-hrs compute
- **Supabase Pro** ($25/mo): 8GB database, 50GB bandwidth
- **Total**: ~$45/mo for growing business (500+ calls/month)

---

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations deployed
- [ ] Retell webhook configured
- [ ] Custom domain added (optional)
- [ ] Test call flow end-to-end
- [ ] Monitor Vercel Analytics
- [ ] Set up Supabase backups (Pro only)

---

## Troubleshooting

**❌ Error: "Environment Variable 'DATABASE_URL' references Secret 'database_url', which does not exist"**
- **Cause**: `vercel.json` was using `@secret_name` syntax
- **Fix**: Remove `env` section from `vercel.json` (already done)
- **Action**: Set environment variables in Vercel Dashboard (Settings > Environment Variables)
- **Result**: Deployment should now succeed

**Build Error: "Prisma Client not generated"**
- Fix: Update build command to `prisma generate && next build`
- Verify: Check `vercel.json` has correct buildCommand

**Database Connection Timeout**
- Check DATABASE_URL is correct in Vercel Dashboard
- Verify Supabase project is active (not paused)
- Ensure no extra quotes or spaces in environment variable values

**Webhook 401 Unauthorized**
- Verify `RETELL_WEBHOOK_SECRET` matches Retell dashboard
- Check URL in Retell: `https://bookedsolid-ai.vercel.app/api/webhooks/retell`

**Supabase Paused After 7 Days**
- Free tier pauses inactive projects
- Auto-resumes on next request (2-3 second delay)
- Upgrade to Pro for always-on

**Environment Variables Not Loading**
- Ensure no quotes around values in Vercel Dashboard
- Check environment is set to "Production"
- Redeploy after adding/changing environment variables

---

## Migration from Digital Ocean

If migrating from existing deployment:

1. **Export data** from old database:
```bash
pg_dump $OLD_DATABASE_URL > backup.sql
```

2. **Import to Supabase**:
```bash
psql $SUPABASE_DIRECT_URL < backup.sql
```

3. **Update DNS** (if using custom domain):
   - Remove Digital Ocean A records
   - Add Vercel CNAME: `cname.vercel-dns.com`

4. **Update Retell webhook** to new Vercel URL

---

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Retell.ai Docs: https://docs.retellai.com
