# Supabase Database Setup Guide

**Time to complete: ~10 minutes**

This guide will walk you through setting up a free PostgreSQL database on Supabase for your Voice Agent Dashboard.

---

## Step 1: Create Supabase Account (2 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign in with GitHub (recommended) or email

---

## Step 2: Create a New Project (3 minutes)

1. Click **New Project**
2. Fill in the project details:
   - **Organization**: Select or create one
   - **Name**: `voice-agent-dashboard` (or your choice)
   - **Database Password**: Click **Generate** (SAVE THIS PASSWORD!)
   - **Region**: Choose the closest region to your users
     - US East (recommended for US): `us-east-1`
     - EU: `eu-west-1`
     - Asia: `ap-southeast-1`
   - **Pricing Plan**: Free (500MB database, 2GB bandwidth)

3. Click **Create new project**
4. Wait ~2 minutes while Supabase provisions your database

---

## Step 3: Get Your Database Connection String (2 minutes)

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Database** in the left menu
3. Scroll to **Connection String** section
4. Select **URI** tab
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you generated in Step 2

**Example:**
```
postgresql://postgres.abcdefgh:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## Step 4: Update Your Local Environment (1 minute)

1. In your dashboard directory, create/update `.env.local`:

```bash
cd /Users/alansine/Downloads/Voice\ Agent/dashboard
```

2. Create `.env.local` file with this content:

```bash
# PostgreSQL Database (from Supabase)
DATABASE_URL="postgresql://postgres.YOUR-REF:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Google OAuth Configuration (optional for now)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Retell.ai Webhook Configuration (optional for now)
RETELL_WEBHOOK_SECRET=your-retell-webhook-secret-here
```

**Replace the DATABASE_URL with your actual Supabase connection string!**

---

## Step 5: Test Database Connection (2 minutes)

Run these commands to test the connection:

```bash
# Install dependencies (if not already done)
npm install

# Generate Prisma Client
npm run db:generate

# Create database tables (run migrations)
npm run db:migrate

# Seed demo data
npm run db:seed
```

If successful, you should see:
```
✅ Database connected
✅ Tables created
✅ Demo data seeded
```

---

## Step 6: Verify in Supabase Dashboard (1 minute)

1. Go back to your Supabase dashboard
2. Click **Table Editor** in the sidebar
3. You should see these tables:
   - Account
   - CallRecord
   - Client
   - Session
   - User
   - VerificationToken
   - _prisma_migrations

4. Click on **Client** table - you should see 2 demo clients

---

## Step 7: Start Your Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and test login with:

- **Client account**: `demo@bookedsolid.ai` / `DemoClient2025!`
- **Admin account**: `admin@bookedsolid.ai` / `AdminAccess2025!`

---

## Troubleshooting

### Error: "Can't reach database server"

**Cause**: Wrong connection string or password

**Fix**:
1. Go to Supabase Dashboard > Settings > Database
2. Copy the connection string again
3. Make sure you replaced `[YOUR-PASSWORD]` with actual password
4. Check for extra spaces or quotes in `.env.local`

### Error: "P1001: Can't reach database"

**Cause**: Network/firewall issue or Supabase project paused

**Fix**:
1. Check if Supabase project is active (not paused)
2. Try disabling VPN if using one
3. Check your internet connection

### Error: "Password authentication failed"

**Cause**: Wrong database password

**Fix**:
1. Go to Supabase Dashboard > Settings > Database
2. Click **Reset Database Password**
3. Generate new password
4. Update `DATABASE_URL` in `.env.local` with new password

### Migration Fails

**Fix**: Try running migrations manually:
```bash
npx prisma migrate reset --force
npm run db:migrate
npm run db:seed
```

---

## Free Tier Limits & Monitoring

### What's Included (Free)
- 500 MB database storage
- 2 GB bandwidth per month
- 50k monthly active users
- Unlimited API requests
- Paused after 7 days inactivity (auto-resumes)

### Monitor Usage
1. Go to Supabase Dashboard
2. Click **Usage** in sidebar
3. Check:
   - Database size
   - Bandwidth usage
   - Active connections

### When to Upgrade to Pro ($25/month)
- Database exceeds 500 MB
- Need more than 2 GB bandwidth
- Want 24/7 uptime (no pausing)
- Need daily backups

---

## Security Best Practices

✅ **DO:**
- Keep your database password secure
- Use connection pooling (default in connection string)
- Enable Row Level Security (RLS) for production
- Regularly backup your data

❌ **DON'T:**
- Commit `.env.local` to git (already in .gitignore)
- Share your connection string publicly
- Use the same password for multiple services

---

## Next Steps

Once Supabase is set up:

1. ✅ Database is ready for local development
2. ⏭️ Deploy to Vercel (see `VERCEL_DEPLOYMENT.md`)
3. ⏭️ Configure Google OAuth
4. ⏭️ Set up Retell.ai webhooks

---

## Quick Reference

### Useful Commands

```bash
# View database in browser
npm run db:studio

# Run new migration
npm run db:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed demo data
npm run db:seed

# Generate Prisma Client
npm run db:generate
```

### Database URLs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]
- **Table Editor**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/editor
- **SQL Editor**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/sql

---

## Support

- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Supabase Discord: https://discord.supabase.com

**Need help?** Check Supabase status: https://status.supabase.com
