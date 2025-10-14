# Production Database Migration Guide

## Overview

Since there are no existing Prisma migrations in this project, we'll initialize the production database using `prisma db push`. This will create all tables directly from the schema without requiring migration files.

---

## Option 1: Let Vercel Build Handle It (Recommended)

The `vercel.json` build command includes `prisma migrate deploy`, but since there are no migrations yet, we need to use `prisma db push` for the initial setup.

### Steps:

1. **Update the build command temporarily** (do this in Vercel Dashboard):
   - Go to: **Settings > General > Build & Development Settings**
   - Override Build Command: `prisma generate && prisma db push --accept-data-loss && next build`
   - Save and redeploy

2. **After first successful deployment**:
   - Revert build command to: `prisma generate && prisma migrate deploy && next build`
   - Create proper migrations going forward

---

## Option 2: Manual Database Setup via CLI (Alternative)

If you want to set up the database manually before deployment:

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Push Schema to Production Database
```bash
DATABASE_URL="postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres" \
npx prisma db push --accept-data-loss
```

This will:
- Create all tables from `prisma/schema.prisma`
- Set up relationships and indexes
- Not create migration history (for initial setup)

### Step 3: Verify Database Setup
```bash
DATABASE_URL="postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres" \
npx prisma studio
```

Then open: http://localhost:5555 to browse the database

---

## Option 3: Create Initial Migration (Best Practice)

For a proper migration history:

### Step 1: Create Initial Migration
```bash
# Use production database URL
DATABASE_URL="postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres" \
npx prisma migrate dev --name init
```

This creates a migration file in `prisma/migrations/`

### Step 2: Commit Migration Files
```bash
git add prisma/migrations
git commit -m "Add initial database migration"
git push
```

### Step 3: Vercel Will Auto-Deploy
The next deployment will automatically run `prisma migrate deploy` and apply the migration.

---

## Seeding Production Database

After the database is set up, seed it with demo data:

### Using CLI:
```bash
DATABASE_URL="postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres" \
npm run db:seed
```

### Using Helper Script:
```bash
./scripts/deploy-production.sh
# Select option 2: Seed production database
```

---

## What Gets Created

The database schema includes:

### NextAuth Tables:
- `Account` - OAuth account connections
- `Session` - User sessions
- `User` - User accounts
- `VerificationToken` - Email verification tokens

### BookedSolid AI Tables:
- `Client` - Business clients (salons, etc.)
- `CallRecord` - AI call logs and transcripts

### Demo Data (from seed):
- 2 demo clients
- 2 demo users (demo@bookedsolid.ai, admin@bookedsolid.ai)
- 10+ sample call records

---

## Verification Checklist

After running migrations:

- [ ] All tables created in Supabase
- [ ] Indexes created properly
- [ ] Relations set up correctly
- [ ] Demo data seeded (optional)
- [ ] Vercel deployment succeeds
- [ ] Login works on production site

---

## Troubleshooting

### Error: "Can't reach database server"
- Check DATABASE_URL is correct
- Verify Supabase project is active (not paused)
- Test connection: `psql "postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres"`

### Error: "No migrations found"
- This is expected on first setup
- Use `prisma db push` instead of `migrate deploy`
- Or create initial migration with `migrate dev --name init`

### Build Fails on Vercel: "Prisma migrate failed"
- Update build command to use `db push` for first deploy
- After tables exist, revert to `migrate deploy`

### Tables Already Exist
- If tables were created manually, Prisma will detect them
- Run `prisma db pull` to sync schema
- Then `prisma generate` to update client

---

## Production URL After Setup

Once database is migrated and seeded:

**🌐 https://bookedsolid-ai.vercel.app**

**Demo Login:**
- Email: `demo@bookedsolid.ai`
- Password: `DemoClient2025!`

**Admin Login:**
- Email: `admin@bookedsolid.ai`
- Password: `AdminAccess2025!`

---

## Next Steps

1. ✅ Choose migration approach (Option 1, 2, or 3)
2. ✅ Run database setup
3. ✅ Seed with demo data
4. ✅ Verify production deployment
5. ✅ Test login and functionality
6. ✅ Share production URL with stakeholders

---

## Quick Command Reference

```bash
# Generate Prisma client
npx prisma generate

# Push schema (no migrations)
DATABASE_URL="..." npx prisma db push

# Create migration (with history)
DATABASE_URL="..." npx prisma migrate dev --name init

# Apply migrations
DATABASE_URL="..." npx prisma migrate deploy

# Seed database
DATABASE_URL="..." npm run db:seed

# Open Prisma Studio
DATABASE_URL="..." npx prisma studio

# Pull schema from existing database
DATABASE_URL="..." npx prisma db pull
```

Replace `DATABASE_URL="..."` with the full production connection string.
