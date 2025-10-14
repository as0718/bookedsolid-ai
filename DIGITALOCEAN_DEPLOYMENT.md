# Digital Ocean App Platform Deployment Guide

Complete guide for deploying the BookedSolid AI Dashboard to Digital Ocean App Platform.

## Prerequisites

- Digital Ocean account
- GitHub repository with your code
- Domain name (optional, for custom domain)
- Retell AI account with API key

## Quick Start

### 1. Prepare Your Repository

Push your code to GitHub:

```bash
git add .
git commit -m "Prepare for Digital Ocean deployment"
git push origin main
```

### 2. Generate Required Secrets

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

Save this value - you'll need it for environment variables.

### 3. Deploy to Digital Ocean

#### Option A: Using the App Spec File (Recommended)

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Select "GitHub" as source
4. Authorize Digital Ocean to access your GitHub
5. Select your repository and branch (main)
6. Click "Next"
7. Select "Import from App Spec"
8. Upload the `.do/app.yaml` file
9. Click "Next"

#### Option B: Manual Configuration

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Configure services manually (see Configuration section below)

### 4. Configure Environment Variables

In the Digital Ocean App Platform dashboard, add these environment variables:

**Required:**
- `NEXTAUTH_SECRET` = [value from openssl command above]
- `NEXTAUTH_URL` = `${APP_URL}` (will auto-populate with your app URL)
- `DATABASE_URL` = `${bookedsolid-db.DATABASE_URL}` (auto-populated)
- `DIRECT_DATABASE_URL` = `${bookedsolid-db.DATABASE_URL}` (auto-populated)
- `RETELL_WEBHOOK_SECRET` = [your Retell webhook secret]
- `RETELL_API_KEY` = [your Retell API key]

**Optional (if using Google OAuth):**
- `GOOGLE_CLIENT_ID` = [your Google OAuth client ID]
- `GOOGLE_CLIENT_SECRET` = [your Google OAuth client secret]

### 5. Review and Deploy

1. Review your app configuration
2. Choose your plan (Basic $5/month recommended for start)
3. Click "Create Resources"
4. Wait for deployment (usually 5-10 minutes)

## Detailed Configuration

### Database Configuration

The app spec automatically creates a PostgreSQL database with:
- **Engine:** PostgreSQL 16
- **Database Name:** bookedsolid
- **User:** bookedsolid_user
- **Connection:** Auto-configured via environment variables

### Web Service Configuration

- **Build Command:** `npm ci && npx prisma generate && npm run build`
- **Run Command:** `npm start`
- **HTTP Port:** 3000
- **Instance Size:** basic-xxs (can be upgraded later)
- **Health Check:** `/api/health` endpoint

### Database Migration Job

A pre-deploy job runs database migrations automatically:
- Runs before each deployment
- Executes `npx prisma migrate deploy`
- Ensures database schema is up to date

## Post-Deployment Steps

### 1. Verify Deployment

Your app will be available at:
```
https://[your-app-name]-[random-id].ondigitalocean.app
```

Test these endpoints:
- Homepage: `https://your-app.ondigitalocean.app`
- Health check: `https://your-app.ondigitalocean.app/api/health`
- Login: `https://your-app.ondigitalocean.app/login`

### 2. Create Admin User

Access your database and create an admin user:

1. Go to your app in Digital Ocean dashboard
2. Click "Console" tab
3. Select the database
4. Run SQL:

```sql
INSERT INTO "User" (id, email, password, role, "firstName", "lastName", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash
  'ADMIN',
  'Admin',
  'User',
  NOW(),
  NOW()
);
```

Or use the database seeding script:
```bash
npm run db:seed
```

### 3. Configure Retell Webhook

Update your Retell AI webhook URL to point to your Digital Ocean app:

1. Go to [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to Settings → Webhooks
3. Set webhook URL to:
   ```
   https://your-app.ondigitalocean.app/api/webhooks/retell
   ```
4. Save the webhook secret to your DO environment variables

### 4. Set Up Custom Domain (Optional)

1. In Digital Ocean App Platform dashboard
2. Go to "Settings" → "Domains"
3. Click "Add Domain"
4. Enter your domain name
5. Add DNS records as shown:
   - Type: CNAME
   - Name: @ (or subdomain)
   - Value: [provided by Digital Ocean]
6. Update `NEXTAUTH_URL` to your custom domain

### 5. Enable HTTPS

Digital Ocean automatically provisions SSL certificates:
- Certificate provisioning takes 1-5 minutes
- HTTPS is enforced automatically
- Certificates auto-renew

## Database Management

### Run Migrations

Migrations run automatically on each deployment via the pre-deploy job.

To run manually:
1. Go to app dashboard
2. Click "Console" tab
3. Select "web" service
4. Run:
   ```bash
   npx prisma migrate deploy
   ```

### Access Database

**Via Console:**
1. Go to app dashboard
2. Click "Console" tab
3. Select database service
4. Use `psql` commands

**Via Connection String:**
Get connection string from app dashboard:
```
Settings → [database-name] → Connection Details
```

Use with any PostgreSQL client (TablePlus, pgAdmin, etc.)

### Backup Database

Digital Ocean provides automatic daily backups:
1. Go to database in dashboard
2. Click "Backups" tab
3. Backups are retained for 7 days (free tier)

Manual backup:
```bash
pg_dump $DATABASE_URL > backup.sql
```

## Monitoring and Logs

### View Application Logs

1. Go to app dashboard
2. Click "Runtime Logs" tab
3. Select service (web, db-migrate)
4. Filter by time period or search

### Monitor Performance

1. Go to app dashboard
2. Click "Insights" tab
3. View metrics:
   - CPU usage
   - Memory usage
   - Request rate
   - Response time

### Set Up Alerts

1. Go to app dashboard
2. Click "Alerts" tab
3. Create alerts for:
   - High CPU usage
   - Memory exhaustion
   - Request errors

## Scaling

### Vertical Scaling (Increase Instance Size)

1. Go to app dashboard
2. Click "Settings" tab
3. Select "web" service
4. Change instance size:
   - basic-xxs: $5/month (512MB RAM)
   - basic-xs: $12/month (1GB RAM)
   - basic-s: $24/month (2GB RAM)
   - professional-xs: $50/month (2GB RAM, dedicated CPU)

### Horizontal Scaling (Add Instances)

1. Go to app dashboard
2. Click "Settings" tab
3. Select "web" service
4. Increase instance count
5. Load balancing is automatic

### Database Scaling

1. Go to database in dashboard
2. Click "Settings" tab
3. Upgrade plan:
   - Basic: $15/month (1GB RAM, 10GB storage)
   - Standard: $60/month (4GB RAM, 80GB storage)
   - Professional: Custom pricing

## Troubleshooting

### Build Failures

**Error: "Cannot find module 'prisma'"**
- Solution: Ensure `prisma` is in dependencies, not devDependencies

**Error: "Migration failed"**
- Solution: Check database connection string
- Verify database is running
- Check migration files for syntax errors

### Runtime Errors

**Error: "Database connection failed"**
- Check `DATABASE_URL` environment variable
- Verify database is running
- Check database credentials

**Error: "NEXTAUTH_SECRET is not set"**
- Add `NEXTAUTH_SECRET` environment variable
- Redeploy the app

**Error: "Module not found"**
- Clear build cache
- Trigger rebuild
- Check package.json for missing dependencies

### Performance Issues

**Slow Response Times:**
1. Check database query performance
2. Add database indexes if needed
3. Upgrade instance size
4. Enable Redis for session storage (optional)

**High Memory Usage:**
1. Monitor memory in Insights
2. Check for memory leaks
3. Upgrade to larger instance
4. Optimize code

### Database Issues

**Connection Pool Exhausted:**
- Add to DATABASE_URL: `?connection_limit=10`
- Increase database plan

**Slow Queries:**
1. Access database console
2. Enable slow query log
3. Add indexes to frequently queried columns

## Updating the Application

### Deploy New Changes

**Automatic:**
1. Push to main branch
2. Digital Ocean auto-deploys
3. Migrations run automatically

**Manual:**
1. Go to app dashboard
2. Click "Actions" → "Force Rebuild & Deploy"

### Rollback to Previous Version

1. Go to app dashboard
2. Click "Activity" tab
3. Find successful deployment
4. Click "Rollback to this version"

### Update Dependencies

1. Update `package.json` locally
2. Test thoroughly
3. Push to GitHub
4. Digital Ocean rebuilds automatically

## Cost Optimization

### Estimated Monthly Costs

**Minimal Setup:**
- Web service (basic-xxs): $5
- Database (basic): $15
- Total: ~$20/month

**Production Setup:**
- Web service (basic-s): $24
- Database (standard): $60
- Total: ~$84/month

### Cost Reduction Tips

1. Use basic-xxs for development
2. Upgrade database only when needed
3. Use connection pooling
4. Enable caching
5. Optimize queries

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Digital Ocean secret storage
   - Rotate secrets regularly

2. **Database:**
   - Keep database in private network
   - Use strong passwords
   - Enable automated backups
   - Regular security updates

3. **Application:**
   - Keep dependencies updated
   - Use HTTPS only
   - Implement rate limiting
   - Monitor for suspicious activity

4. **Access Control:**
   - Use least privilege principle
   - Enable 2FA on Digital Ocean
   - Limit team access
   - Audit access logs

## Support and Resources

- [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [Digital Ocean Community](https://www.digitalocean.com/community)
- [Digital Ocean Support](https://www.digitalocean.com/support)

## CI/CD Best Practices

1. **Use Preview Deployments:**
   - Enable for pull requests
   - Test before merging
   - Automatic cleanup

2. **Environment Separation:**
   - Development branch → dev app
   - Main branch → production app
   - Separate databases

3. **Automated Testing:**
   - Run tests in build command
   - Fail deployment on test failure
   - Use GitHub Actions for pre-checks

## Maintenance Schedule

**Daily:**
- Monitor logs for errors
- Check performance metrics

**Weekly:**
- Review database performance
- Check disk usage
- Update dependencies

**Monthly:**
- Review costs
- Test backup restoration
- Security audit
- Update documentation
