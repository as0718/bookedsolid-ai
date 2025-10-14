# PostgreSQL Database Setup Guide

This guide will walk you through setting up a PostgreSQL database for the BookedSolid AI dashboard using Digital Ocean's Managed Database service.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Digital Ocean Setup](#digital-ocean-setup)
- [Local Development Setup](#local-development-setup)
- [Running Migrations](#running-migrations)
- [Seeding the Database](#seeding-the-database)
- [Production Deployment](#production-deployment)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)
- [Backup and Recovery](#backup-and-recovery)

---

## Prerequisites

- Digital Ocean account
- Node.js 18+ installed
- PostgreSQL client (optional, for direct database access)
- Access to your `.env.local` file

---

## Digital Ocean Setup

### 1. Create a Managed PostgreSQL Database

1. Log in to your [Digital Ocean Dashboard](https://cloud.digitalocean.com/)
2. Click **"Create"** > **"Databases"**
3. Configure your database:
   - **Database Engine**: PostgreSQL (version 14 or higher recommended)
   - **Plan**: Choose based on your needs
     - Basic: $15/month (1GB RAM, 10GB storage) - Good for development
     - Production: $30/month+ (2GB+ RAM, 25GB+ storage)
   - **Datacenter Region**: Choose closest to your users
   - **Database Name**: `bookedsolid` (or your preferred name)
   - **Project**: Select or create a project
4. Click **"Create Database Cluster"**
5. Wait 3-5 minutes for provisioning

### 2. Configure Database Settings

1. Once created, go to **"Settings"** tab
2. Under **"Trusted Sources"**:
   - Add your development machine's IP
   - Add your production server's IP
   - For Vercel: Add all Vercel IP ranges or use connection pooling
3. Under **"Connection Pools"**:
   - Click **"Create a Connection Pool"**
   - Name: `bookedsolid-pool`
   - Database: Select your database
   - Mode: **Transaction** (recommended for Next.js/Prisma)
   - User: Default user
   - Pool Size: 15 (adjust based on plan)
   - Click **"Create Pool"**

### 3. Get Connection Strings

1. Go to **"Connection Details"** tab
2. You'll need TWO connection strings:

   **Connection Pool URL** (for application queries):
   ```
   Connection type: Connection pool
   Database/Pool: bookedsolid-pool
   ```
   Format: `postgresql://username:password@host:port/database?sslmode=require&pgbouncer=true`

   **Direct Connection URL** (for migrations):
   ```
   Connection type: Connection parameters
   Database/Pool: bookedsolid (your database name)
   ```
   Format: `postgresql://username:password@host:port/database?sslmode=require`

3. Copy both connection strings - you'll need them next

---

## Local Development Setup

### 1. Configure Environment Variables

Update your `.env.local` file with your Digital Ocean database credentials:

```bash
# PostgreSQL Database Configuration (Digital Ocean Managed Database)

# Connection pooling URL (use this for Prisma queries)
# This uses the connection pool for optimal performance
DATABASE_URL="postgresql://username:password@host:25060/database?schema=public&sslmode=require&pgbouncer=true&connection_limit=1"

# Direct connection URL (use this for migrations)
# This bypasses the connection pool for schema changes
DIRECT_DATABASE_URL="postgresql://username:password@host:25060/database?schema=public&sslmode=require"
```

**Important Notes:**
- Replace `username`, `password`, `host`, and `database` with your actual values
- Keep `sslmode=require` - Digital Ocean requires SSL
- Add `&pgbouncer=true&connection_limit=1` to `DATABASE_URL` for connection pooling
- Use port `25060` for connection pool, `25061` for direct connection (check your Digital Ocean dashboard)

### 2. Test Database Connection

```bash
# Test connection
npx prisma db pull --schema=prisma/schema.prisma

# If successful, you'll see: "Introspected X tables from your database"
# If it's a new database, you'll see: "✔ Introspected 0 models"
```

---

## Running Migrations

Migrations create the database tables and schema based on your Prisma schema file.

### First-Time Setup

```bash
# Generate Prisma client
npm run db:generate

# Create and apply initial migration
npm run db:migrate

# When prompted, enter a migration name: "init"
```

This will:
1. Create a `prisma/migrations` directory
2. Generate SQL migration files
3. Apply the migration to your database
4. Create all tables (User, Account, Session, Client, CallRecord, etc.)

### Subsequent Migrations

When you modify `prisma/schema.prisma`:

```bash
# Create and apply migration
npm run db:migrate

# Enter a descriptive name: "add_user_role" or "update_client_billing"
```

### Production Migrations

For production, use:

```bash
# Deploy migrations without prompts
npm run db:migrate:deploy
```

---

## Seeding the Database

The seed script populates your database with demo data (5 clients, 2 users, ~250 call records).

### Run Seed Script

```bash
# Seed the database with demo data
npm run db:seed
```

Expected output:
```
🌱 Starting database seed...
Clearing existing data...
Seeding clients...
✓ Created 5 clients
Seeding users...
✓ Created 2 users
Seeding call records...
✓ Created 247 call records
🎉 Database seeded successfully!
```

### Demo Accounts After Seeding

**Client Login:**
- Email: `demo@bookedsolid.ai`
- Password: `DemoClient2025!`

**Admin Login:**
- Email: `admin@bookedsolid.ai`
- Password: `AdminAccess2025!`

**Note:** Credentials-based login requires additional database records. For now, use Google OAuth with these emails.

---

## Production Deployment

### Vercel Deployment

1. **Add Environment Variables** in Vercel Dashboard:
   - Go to Project Settings > Environment Variables
   - Add both `DATABASE_URL` and `DIRECT_DATABASE_URL`
   - Add for "Production", "Preview", and "Development" environments

2. **Run Migrations** (one-time):
   ```bash
   # From your local machine with production DATABASE_URL
   npm run db:migrate:deploy
   ```

3. **Run Seed** (one-time):
   ```bash
   npm run db:seed
   ```

4. **Deploy Application**:
   ```bash
   git push origin main
   # Vercel will automatically deploy
   ```

### Other Platforms (Heroku, Railway, etc.)

1. Add `DATABASE_URL` and `DIRECT_DATABASE_URL` to environment variables
2. Add build command:
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```
3. Deploy your application

---

## Database Management

### Useful Commands

```bash
# Generate Prisma Client
npm run db:generate

# Open Prisma Studio (GUI for database)
npm run db:studio

# Push schema changes without migrations (development only)
npm run db:push

# View migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Format Prisma schema
npx prisma format
```

### Prisma Studio

Prisma Studio provides a GUI to view and edit your database:

```bash
npm run db:studio
```

This opens `http://localhost:5555` with a visual interface to:
- Browse all tables
- Edit records
- Run queries
- View relationships

---

## Troubleshooting

### Error: "Can't reach database server"

**Cause:** Network/firewall issue or incorrect connection string

**Solutions:**
1. Check your IP is in Digital Ocean **Trusted Sources**
2. Verify connection string has correct host, port, username, password
3. Ensure SSL is enabled: `?sslmode=require`
4. Test with direct connection URL first (not connection pool)

```bash
# Test direct connection
DATABASE_URL="your-direct-url" npx prisma db pull
```

### Error: "Prepared statements are not supported"

**Cause:** Using connection pool for migrations

**Solution:** Use `DIRECT_DATABASE_URL` for migrations:
```bash
# Run migration with direct connection
npx prisma migrate dev --schema=prisma/schema.prisma
```

### Error: "Too many connections"

**Cause:** Connection pool exhausted or not using connection pooling

**Solutions:**
1. Ensure `DATABASE_URL` includes `&pgbouncer=true&connection_limit=1`
2. Check your connection pool size in Digital Ocean (increase if needed)
3. Use Prisma connection pooling:
   ```typescript
   // In lib/prisma.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   });
   ```

### Error: "P1001: Can't connect to database"

**Cause:** SSL/TLS certificate issues

**Solution:** Add SSL mode to connection string:
```
?sslmode=require&sslaccept=strict
```

### Seed Script Fails

**Symptoms:** Unique constraint violations or foreign key errors

**Solutions:**
```bash
# Clear database and re-seed
npx prisma migrate reset --force
npm run db:seed
```

---

## Backup and Recovery

### Automated Backups (Digital Ocean)

Digital Ocean automatically backs up your database:
- **Daily backups**: Retained for 7 days (Basic plan) or 14 days (Professional+)
- **Point-in-time recovery**: Available on Professional plans
- Access backups: Digital Ocean Dashboard > Databases > Backups tab

### Manual Backup

```bash
# Install pg_dump (PostgreSQL client tools)
# Mac: brew install postgresql

# Create backup
pg_dump "your-direct-database-url" > backup-$(date +%Y%m%d).sql

# Restore from backup
psql "your-direct-database-url" < backup-20250114.sql
```

### Backup via Prisma

```bash
# Export schema
npx prisma db pull --schema=backup-schema.prisma

# Export data (manual approach)
npm run db:studio
# Use Prisma Studio to export tables as CSV/JSON
```

### Disaster Recovery Steps

1. **Create new database** in Digital Ocean
2. **Update connection strings** in `.env.local`
3. **Run migrations**:
   ```bash
   npm run db:migrate:deploy
   ```
4. **Restore backup**:
   ```bash
   psql "new-database-url" < backup-20250114.sql
   ```
5. **Verify data**:
   ```bash
   npm run db:studio
   ```

---

## Connection Pooling Best Practices

### Why Use Connection Pooling?

- **Prevents connection exhaustion**: PostgreSQL has limited connections (typically 20-100)
- **Improves performance**: Reuses existing connections
- **Reduces latency**: No connection overhead per request
- **Required for serverless**: Vercel/Netlify Edge Functions need pooling

### Configuration

**DATABASE_URL (Application Queries):**
```
postgresql://user:pass@host:25060/db?sslmode=require&pgbouncer=true&connection_limit=1
```

**DIRECT_DATABASE_URL (Migrations):**
```
postgresql://user:pass@host:25061/db?sslmode=require
```

### Digital Ocean Pool Settings

- **Transaction Mode**: Best for Prisma/Next.js
- **Pool Size**: 15-20 for small apps, 25-50 for production
- **Timeout**: 30 seconds default

---

## Schema Changes Workflow

When you need to modify the database schema:

1. **Update Prisma Schema** (`prisma/schema.prisma`)
   ```prisma
   model Client {
     id String @id @default(cuid())
     // Add new field
     phoneVerified Boolean @default(false)
   }
   ```

2. **Create Migration**
   ```bash
   npm run db:migrate
   # Enter name: "add_phone_verification"
   ```

3. **Update Seed Script** (if needed)
   ```typescript
   // prisma/seed.ts
   await prisma.client.create({
     data: {
       // ... existing fields
       phoneVerified: false,
     },
   });
   ```

4. **Test Locally**
   ```bash
   npm run db:seed
   npm run dev
   ```

5. **Deploy to Production**
   ```bash
   npm run db:migrate:deploy
   git push origin main
   ```

---

## Security Best Practices

1. **Never commit credentials**:
   - Ensure `.env.local` is in `.gitignore`
   - Use environment variables for all secrets

2. **Use connection pooling**:
   - Prevents connection exhaustion attacks
   - Required for production environments

3. **Enable SSL/TLS**:
   - Always use `sslmode=require` in connection strings
   - Digital Ocean enforces this by default

4. **Restrict network access**:
   - Use Digital Ocean **Trusted Sources** whitelist
   - Only allow necessary IPs

5. **Regular backups**:
   - Verify automatic backups are running
   - Test restore procedures periodically

6. **Monitor usage**:
   - Check Digital Ocean metrics dashboard
   - Set up alerts for high CPU, memory, or storage

7. **Rotate credentials**:
   - Change database password periodically
   - Update all environments after rotation

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Digital Ocean PostgreSQL Docs](https://docs.digitalocean.com/products/databases/postgresql/)
- [NextAuth.js Prisma Adapter](https://next-auth.js.org/adapters/prisma)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/tutorial.html)

---

## Quick Reference

```bash
# Setup
npm run db:generate          # Generate Prisma client
npm run db:migrate           # Create and apply migration
npm run db:seed              # Seed database with demo data

# Development
npm run db:studio            # Open Prisma Studio GUI
npm run db:push              # Quick schema push (no migration)

# Production
npm run db:migrate:deploy    # Deploy migrations
npx prisma migrate status    # Check migration status

# Troubleshooting
npx prisma db pull           # Test connection
npx prisma migrate reset     # Reset database (deletes all data)
npx prisma format            # Format schema file
```

---

**Last Updated**: 2025-10-14
