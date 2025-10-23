# Database Seeding Guide

## Overview
This project has **two separate seed scripts** to prevent accidentally modifying the wrong database:

1. `prisma/seed.ts` - **Local development only**
2. `prisma/seed-production.ts` - **Production database only**

---

## Local Development Seed

### Command
```bash
npm run db:seed
```

### What it does
- Checks if admin user already exists
- If admin exists: **Does nothing** (safe!)
- If admin doesn't exist: Creates new admin user
- **Never** clears existing data unless `FORCE_CLEAR_DATA=true`

### Default Admin Credentials
- Email: `admin@bookedsolid.ai`
- Password: Value from `.env` file (`ADMIN_PASSWORD`)
- Default password: `ChangeMe2025!`

### Force Clear Data (DANGER!)
Only use this if you want to completely reset your local database:

```bash
FORCE_CLEAR_DATA=true npm run db:seed
```

⚠️ **WARNING**: This will delete ALL data in your local database!

---

## Production Seed

### Command
```bash
npm run db:seed:production
```

### What it does
- **Safety check**: Only runs if `NODE_ENV=production`
- Checks if admin user already exists in production
- If admin exists: Does nothing (safe!)
- If admin doesn't exist: Creates new admin user in production
- **Never** clears any data

### How to use in production

#### Option 1: Direct Production Seed
Connect to your production database and run:

```bash
# Make sure your .env points to production database
DATABASE_URL="your_production_db_url" npm run db:seed:production
```

#### Option 2: Manual Admin Creation
If you prefer, you can manually create the admin user in production using Prisma Studio or SQL:

```sql
-- Connect to production database
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@bookedsolid.ai',
  'Admin User',
  '$2a$10$your_hashed_password_here',
  'admin',
  NOW(),
  NOW(),
  NOW()
);
```

---

## Common Scenarios

### Scenario 1: Local admin login broken
**Problem**: You ran the seed script and it changed your local admin password

**Solution**: Your local admin password is now the value from `.env` (`ADMIN_PASSWORD`)
```bash
# Check your current admin password
grep ADMIN_PASSWORD .env

# Default is: ChangeMe2025!
```

### Scenario 2: Need to reset local database
**Solution**: Use the force clear option
```bash
FORCE_CLEAR_DATA=true npm run db:seed
```

### Scenario 3: Setting up production for the first time
**Solution**: Run the production seed script
```bash
# Connect to production database first
DATABASE_URL="your_production_db_url" npm run db:seed:production
```

### Scenario 4: Production admin already exists
**Solution**: Nothing needed! The script will skip creation
```bash
npm run db:seed:production
# Output: ✓ Admin user already exists in production
```

---

## Environment Variables

### Required Variables
```env
# Admin user password (for seed scripts)
ADMIN_PASSWORD="ChangeMe2025!"

# PostgreSQL Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### Optional Variables
```env
# Force clear local data (USE WITH CAUTION)
FORCE_CLEAR_DATA="true"

# Environment mode
NODE_ENV="production"  # For production seed only
```

---

## Security Best Practices

1. ✅ **Always** change the admin password after first login
2. ✅ **Never** commit `.env` files with real passwords
3. ✅ **Never** run production seed on local database
4. ✅ **Always** verify which database you're connected to before seeding
5. ✅ **Use strong passwords** in production (not the default!)

---

## Troubleshooting

### Error: "Admin user already exists"
This is not an error - it's a safety feature! Your admin user is already set up.

### Error: "This script is PRODUCTION-ONLY"
You're trying to run `seed-production.ts` in development mode. Either:
- Use `npm run db:seed` for local development
- Or set `NODE_ENV=production` for production seeding

### Error: "Database connection failed"
Check your `DATABASE_URL` in `.env` file. Make sure:
- Database server is running
- Credentials are correct
- Connection string format is valid

---

## Quick Reference

| Task | Command |
|------|---------|
| Seed local database | `npm run db:seed` |
| Seed production database | `npm run db:seed:production` |
| Reset local database | `FORCE_CLEAR_DATA=true npm run db:seed` |
| Check current admin | `npx tsx scripts/check-admin.ts` |
| Open Prisma Studio | `npm run db:studio` |

---

## Summary

- **Local seed**: Safe by default, won't clear data unless forced
- **Production seed**: Requires `NODE_ENV=production`, never clears data
- **Admin credentials**: Email `admin@bookedsolid.ai`, password from `.env`
- **Safety first**: Scripts check for existing admin before making changes
