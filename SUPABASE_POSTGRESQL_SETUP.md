# 🚀 Supabase PostgreSQL Setup Guide

## Current Status
✅ Prisma schema updated to PostgreSQL
✅ .env file configured with Supabase URL
⏳ Need to add your actual database password

---

## Step 1: Get Your Supabase Password

### Option A: From Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/mfndswtgocyzmbvsrbdu/settings/database
2. Look for "Database Password" section
3. Click "Reset Database Password" if needed, or find existing password
4. Copy the password

### Option B: Get Connection String Directly
1. Go to: https://supabase.com/dashboard/project/mfndswtgocyzmbvsrbdu/settings/database
2. Find "Connection string" section
3. Select "URI" format
4. Copy the ENTIRE connection string (it will have the password included)

---

## Step 2: Update Your Local .env File

Open `.env` file and replace `[YOUR_PASSWORD]` with your actual password in BOTH lines:

```bash
# BEFORE:
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres"

# AFTER (example with password "MySecretPassword123"):
DATABASE_URL="postgresql://postgres:MySecretPassword123@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:MySecretPassword123@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres"
```

**IMPORTANT:**
- If your password contains special characters like `@`, `#`, `%`, they need to be URL-encoded
- Or just copy the complete connection string from Supabase dashboard

---

## Step 3: Run Database Migrations

After updating the `.env` file with your real password, run these commands:

```bash
# Generate Prisma Client for PostgreSQL
npx prisma generate

# Create all database tables
npx prisma migrate dev --name init_postgresql

# (Optional) Seed the database with initial data
npx prisma db seed
```

---

## Step 4: Test Local Connection

Run this test script:

```bash
npx tsx scripts/test-db.ts
```

You should see:
```
✅ Database connected successfully!
📊 DATABASE CONTENTS:
   Type: PostgreSQL
   Location: Supabase
```

---

## Step 5: Update Vercel Environment Variables

Go to: https://vercel.com/as0718s-projects/dashboard/settings/environment-variables

Add these TWO variables:

```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres

DIRECT_URL=postgresql://postgres:[YOUR_PASSWORD]@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres
```

**Make sure to:**
- Set environment to: Production, Preview, Development (all three!)
- Use your ACTUAL password (same as local .env)

---

## Step 6: Deploy to Production

```bash
# Commit the Prisma schema change
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL (Supabase) for production database"
git push origin main

# OR deploy directly with Vercel CLI
vercel --prod
```

---

## Troubleshooting

### Issue: "Password authentication failed"
**Solution:** Check that password is correct and special characters are URL-encoded

### Issue: "Connection timeout"
**Solution:** Check that Supabase project is active and not paused

### Issue: "SSL connection required"
**Solution:** Add `?sslmode=require` to end of connection string:
```
DATABASE_URL="postgresql://postgres:password@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres?sslmode=require"
```

### Issue: Migration fails
**Solution:** Make sure database is empty or run:
```bash
npx prisma migrate reset  # Warning: deletes all data!
npx prisma migrate dev --name init_postgresql
```

---

## What This Fixes

### Before (SQLite)
❌ Database resets on every Vercel deployment
❌ Data lost between deployments
❌ Can't scale for production
❌ No connection pooling

### After (PostgreSQL/Supabase)
✅ Persistent database across all deployments
✅ Data is permanently stored
✅ Production-ready, scalable
✅ Connection pooling support
✅ Free tier: 500MB storage, unlimited API requests

---

## Next Steps After Setup

Once PostgreSQL is working:
1. Test all features locally
2. Deploy to production
3. Verify production works with persistent database
4. (Optional) Migrate data from old SQLite to PostgreSQL if needed

---

## Need Help?

If you get stuck:
1. Check Supabase dashboard for project status
2. Verify connection string is correct
3. Make sure no special characters need encoding
4. Try the connection in Prisma Studio: `npx prisma studio`
