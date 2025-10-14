# Digital Ocean Deployment - Quick Start

Get your BookedSolid AI Dashboard deployed in 15 minutes!

## Prerequisites

- GitHub account
- Digital Ocean account ([Sign up here](https://www.digitalocean.com))
- Your code pushed to GitHub

## Step 1: Generate Secret (1 minute)

Run this command to generate your `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

**Save this value!** You'll need it in Step 4.

## Step 2: Push to GitHub (2 minutes)

```bash
# Update .do/app.yaml with your GitHub username/repo
# Line 14: Change "your-username/your-repo-name" to "yourusername/yourrepo"

git add .
git commit -m "Add Digital Ocean deployment configuration"
git push origin main
```

## Step 3: Create App on Digital Ocean (5 minutes)

### Option A: Automated (with doctl CLI)

```bash
# Run the deployment helper
./scripts/deploy-digitalocean.sh
```

Follow the interactive prompts.

### Option B: Manual (in browser)

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **"GitHub"** as source
4. Authorize Digital Ocean to access your GitHub
5. Select your repository
6. Select branch: **main**
7. Click **"Next"**

## Step 4: Import App Spec (2 minutes)

1. Select **"Import from App Spec"**
2. Click **"Upload File"**
3. Select `.do/app.yaml` from your project
4. Click **"Next"**

Your app will be configured with:
- Web service (Next.js)
- PostgreSQL database
- Pre-deploy migration job

## Step 5: Set Environment Variables (3 minutes)

In the Digital Ocean dashboard, add these environment variables:

### Required Variables

| Key | Value | Type |
|-----|-------|------|
| `NEXTAUTH_SECRET` | [From Step 1] | Secret |
| `NEXTAUTH_URL` | `${APP_URL}` | Plain Text |
| `DATABASE_URL` | `${bookedsolid-db.DATABASE_URL}` | Plain Text |
| `DIRECT_DATABASE_URL` | `${bookedsolid-db.DATABASE_URL}` | Plain Text |
| `RETELL_WEBHOOK_SECRET` | [From Retell dashboard] | Secret |
| `RETELL_API_KEY` | [From Retell dashboard] | Secret |

**Important:**
- Mark secrets as **"Secret"** type (encrypted)
- Set scope to **"RUN_AND_BUILD_TIME"**
- `${APP_URL}` and `${bookedsolid-db.DATABASE_URL}` will auto-populate

### How to Add Variables

1. Click on **"web"** service
2. Scroll to **"Environment Variables"**
3. Click **"Edit"**
4. For each variable:
   - Click **"Add Variable"**
   - Enter **Key** and **Value**
   - Select **"Encrypt"** for secrets
   - Choose **"RUN_AND_BUILD_TIME"**
5. Click **"Save"**

## Step 6: Review and Deploy (2 minutes)

1. Review your configuration:
   - App name: `bookedsolid-ai-dashboard`
   - Region: `nyc` (New York)
   - Services: Web + Database
   - Environment variables: All set

2. Select your plan:
   - **Basic ($20/month):** Web ($5) + Database ($15)
   - Recommended for getting started

3. Click **"Create Resources"**

## Step 7: Wait for Deployment (5-10 minutes)

Digital Ocean will:
1. Create your database
2. Build your application
3. Run database migrations
4. Start your app

You can watch the progress in the **"Activity"** tab.

## Step 8: Test Your Deployment (2 minutes)

Once deployed, your app will be at:
```
https://bookedsolid-ai-dashboard-[random].ondigitalocean.app
```

**Test these endpoints:**

1. **Homepage:**
   ```
   https://your-app.ondigitalocean.app
   ```
   You should see the login page.

2. **Health Check:**
   ```
   https://your-app.ondigitalocean.app/api/health
   ```
   Should return: `{"status":"healthy"}`

3. **Login:**
   ```
   https://your-app.ondigitalocean.app/login
   ```
   You should be able to access the login form.

## Step 9: Create Admin User (3 minutes)

### Method 1: Via Console (Recommended)

1. In Digital Ocean dashboard, click **"Console"** tab
2. Select **"web"** service
3. Run:
   ```bash
   npm run db:seed
   ```

This creates a default admin user:
- **Email:** `admin@bookedsolid.com`
- **Password:** `admin123`

**Change this password immediately after first login!**

### Method 2: Via SQL

1. Click **"Console"** tab
2. Select **"bookedsolid-db"** database
3. Run this SQL:
   ```sql
   -- Generate a bcrypt hash for "admin123"
   -- You can use https://bcrypt-generator.com/

   INSERT INTO "User" (
     id, email, password, role,
     "firstName", "lastName",
     "createdAt", "updatedAt"
   )
   VALUES (
     gen_random_uuid(),
     'admin@yourdomain.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye8vEiX.YbxLUL15l1I.9TS4xSfWqm6Je', -- "admin123"
     'ADMIN',
     'Admin',
     'User',
     NOW(),
     NOW()
   );
   ```

## Step 10: Update Retell Webhook (2 minutes)

1. Go to [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to **Settings** → **Webhooks**
3. Update webhook URL:
   ```
   https://your-app.ondigitalocean.app/api/webhooks/retell
   ```
4. Verify the webhook secret matches your Digital Ocean environment variable
5. Click **"Test Webhook"** to verify

## Step 11: Login and Test (2 minutes)

1. Go to your app URL
2. Login with admin credentials
3. You should see the dashboard!

**Test these features:**
- View dashboard metrics
- Check call history
- View analytics
- Test all navigation

## You're Done!

Your BookedSolid AI Dashboard is now live on Digital Ocean!

## What's Next?

### Immediate Tasks

- [ ] Change admin password
- [ ] Add custom domain (optional)
- [ ] Create additional user accounts
- [ ] Configure client settings
- [ ] Test Retell AI integration

### Optional Enhancements

- [ ] Set up monitoring alerts
- [ ] Configure auto-scaling
- [ ] Enable daily backups
- [ ] Add custom SSL certificate
- [ ] Set up staging environment

## Common Issues

### Issue: Build Failed

**Error:** "Cannot find module 'prisma'"

**Solution:**
1. Ensure `prisma` is in `dependencies`, not `devDependencies`
2. Check `package.json`
3. Redeploy

### Issue: Database Connection Failed

**Error:** "Database connection failed"

**Solution:**
1. Verify `DATABASE_URL` is set to `${bookedsolid-db.DATABASE_URL}`
2. Check database is running in Digital Ocean dashboard
3. View logs in **"Runtime Logs"** tab

### Issue: Environment Variable Not Found

**Error:** "NEXTAUTH_SECRET is not set"

**Solution:**
1. Go to **Settings** → **web** service
2. Scroll to **"Environment Variables"**
3. Verify `NEXTAUTH_SECRET` is added
4. Ensure scope is **"RUN_AND_BUILD_TIME"**
5. Redeploy

### Issue: 502 Bad Gateway

**Possible causes:**
- App is still starting (wait 1-2 minutes)
- Health check failing
- Port configuration issue

**Solution:**
1. Check **"Runtime Logs"** for errors
2. Verify health check endpoint: `/api/health`
3. Ensure app listens on port 3000

## Getting Help

- **Detailed Docs:** See `DIGITALOCEAN_DEPLOYMENT.md`
- **Digital Ocean Docs:** https://docs.digitalocean.com/products/app-platform/
- **Support:** https://www.digitalocean.com/support
- **Community:** https://www.digitalocean.com/community

## Deployment Costs

**Minimal Setup:**
- Web service (basic-xxs): $5/month
- Database (basic): $15/month
- **Total: $20/month**

**Production Setup:**
- Web service (basic-s): $24/month
- Database (standard): $60/month
- **Total: $84/month**

**Free tier:** Digital Ocean offers $200 credit for new accounts (60 days)

## Need to Rollback?

If something goes wrong:

1. Go to app dashboard
2. Click **"Activity"** tab
3. Find last successful deployment
4. Click **"Rollback to this version"**

## Custom Domain Setup

Want to use your own domain?

1. In app dashboard, go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `dashboard.yourdomain.com`
4. Add DNS records shown (CNAME)
5. Wait for SSL certificate (1-5 minutes)
6. Update `NEXTAUTH_URL` to your custom domain
7. Update Google OAuth redirect URIs (if using)
8. Update Retell webhook URL

## Monitoring Your App

**View Logs:**
1. Go to **"Runtime Logs"** tab
2. Filter by service (web, db-migrate)
3. Search for errors

**Monitor Performance:**
1. Go to **"Insights"** tab
2. View metrics:
   - CPU usage
   - Memory usage
   - Request rate
   - Response time

**Set Up Alerts:**
1. Go to **"Alerts"** tab
2. Create alerts for:
   - High CPU (>80%)
   - High memory (>80%)
   - Request errors (>5%)

## Backup Strategy

**Automatic Backups:**
- Digital Ocean backs up database daily
- Retention: 7 days (free tier)
- Retention: 14 days (standard tier)

**Manual Backup:**
```bash
# In app console
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

**Restore Backup:**
```bash
# In app console
psql $DATABASE_URL < backup-20240101.sql
```

## Scaling Your App

**When to scale:**
- CPU usage consistently >70%
- Memory usage consistently >80%
- Response time >1 second
- More than 100 concurrent users

**How to scale:**

**Vertical Scaling (Increase power):**
1. Go to **Settings** → **web** service
2. Change instance size:
   - basic-xs: $12/month (1GB RAM)
   - basic-s: $24/month (2GB RAM)
   - professional-xs: $50/month (2GB RAM + dedicated CPU)

**Horizontal Scaling (Add instances):**
1. Go to **Settings** → **web** service
2. Increase instance count to 2-3
3. Digital Ocean auto-balances load

## Congratulations!

You've successfully deployed your BookedSolid AI Dashboard to Digital Ocean!

For detailed documentation, see `DIGITALOCEAN_DEPLOYMENT.md`.
