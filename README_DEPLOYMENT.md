# BookedSolid AI Dashboard - Deployment Guide

Deploy your BookedSolid AI Dashboard to Digital Ocean App Platform in minutes.

## Quick Start

**Want to deploy right now?**

```bash
# 1. Generate your secret
openssl rand -base64 32

# 2. Run the deployment helper
./scripts/deploy-digitalocean.sh
```

That's it! The script will guide you through the entire process.

## Documentation Structure

We've created comprehensive deployment documentation to help you get started:

### 📋 Choose Your Path

#### 1. **DEPLOY_QUICKSTART.md** - 15 Minute Deployment
**Best for:** First-time deployers, quick setup
- Step-by-step guide with time estimates
- 11 simple steps to production
- Common issues and quick fixes
- [Start here →](./DEPLOY_QUICKSTART.md)

#### 2. **DIGITALOCEAN_DEPLOYMENT.md** - Complete Guide
**Best for:** Production deployments, detailed understanding
- Comprehensive deployment instructions
- Database management guide
- Monitoring and scaling strategies
- Security best practices
- Troubleshooting guide
- [Read the full guide →](./DIGITALOCEAN_DEPLOYMENT.md)

#### 3. **DEPLOYMENT_SUMMARY.md** - Overview
**Best for:** Understanding the architecture
- Files created and their purpose
- Architecture diagram
- Cost breakdown
- Command reference
- Success criteria checklist
- [View summary →](./DEPLOYMENT_SUMMARY.md)

### 🔧 Configuration Files

#### `.do/app.yaml`
Digital Ocean App Platform specification
- Defines all services and configuration
- Import this file in Digital Ocean dashboard

#### `.env.digitalocean.template`
Environment variables reference
- All required and optional variables
- Security best practices
- Troubleshooting tips

#### `scripts/deploy-digitalocean.sh`
Interactive deployment helper
- Automated checks and setup
- Secret generation
- doctl CLI integration

#### `app/api/health/route.ts`
Health check endpoint
- Used by Digital Ocean for monitoring
- Verifies database connection
- Validates environment variables

## Deployment Options

### Option 1: Interactive Script (Easiest)
```bash
./scripts/deploy-digitalocean.sh
```
- Automated pre-flight checks
- Generates secrets for you
- Interactive menu system
- Creates app automatically (if doctl installed)

### Option 2: Manual via Dashboard (Most Common)
1. Follow [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md)
2. Upload `.do/app.yaml` to Digital Ocean
3. Configure environment variables
4. Deploy!

### Option 3: CLI with doctl (Advanced)
```bash
# Install doctl
brew install doctl  # macOS
# or snap install doctl  # Linux

# Authenticate
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml
```

## What Gets Deployed

### Web Service (Next.js Application)
- **Instance:** basic-xxs ($5/month)
- **Port:** 3000
- **Build:** `npm ci && npx prisma generate && npm run build`
- **Start:** `npm start`

### Database (PostgreSQL)
- **Version:** PostgreSQL 16
- **Plan:** Basic ($15/month)
- **Storage:** 10GB
- **Backups:** Daily (7-day retention)

### Pre-Deploy Job (Migrations)
- Runs before each deployment
- Executes: `npx prisma migrate deploy`
- Ensures database schema is current

**Total Cost:** ~$20/month (minimal setup)

## Required Credentials

Before deploying, you'll need:

1. **GitHub Account**
   - Your code must be in a GitHub repository
   - Digital Ocean needs read access

2. **Digital Ocean Account**
   - Sign up at https://www.digitalocean.com
   - $200 free credit for new accounts (60 days)

3. **Retell AI Credentials**
   - Get from https://app.retellai.com
   - Need: API Key and Webhook Secret

4. **NEXTAUTH_SECRET** (we'll generate this)
   - Generated via: `openssl rand -base64 32`

## Environment Variables

### Required
```bash
NEXTAUTH_SECRET=[generated secret]
NEXTAUTH_URL=${APP_URL}
DATABASE_URL=${bookedsolid-db.DATABASE_URL}
DIRECT_DATABASE_URL=${bookedsolid-db.DATABASE_URL}
RETELL_WEBHOOK_SECRET=[from Retell dashboard]
RETELL_API_KEY=[from Retell dashboard]
```

### Optional (for Google OAuth)
```bash
GOOGLE_CLIENT_ID=[from Google Console]
GOOGLE_CLIENT_SECRET=[from Google Console]
```

See [.env.digitalocean.template](./.env.digitalocean.template) for details.

## Deployment Timeline

### First Deployment
- **Setup:** 5 minutes (account, credentials)
- **Configuration:** 10 minutes (environment variables)
- **Build & Deploy:** 5-10 minutes (automatic)
- **Total:** ~20-25 minutes

### Subsequent Deployments
- **Push to GitHub:** Instant
- **Build & Deploy:** 5-10 minutes (automatic)
- **Total:** ~5-10 minutes

## Post-Deployment

After deployment completes:

### 1. Test Your App
```bash
# Health check
curl https://your-app.ondigitalocean.app/api/health

# Should return:
# {"status":"healthy","database":"connected"}
```

### 2. Create Admin User
```bash
# Via Digital Ocean console
npm run db:seed

# Default credentials:
# Email: admin@bookedsolid.com
# Password: admin123
```

### 3. Update Retell Webhook
```
https://your-app.ondigitalocean.app/api/webhooks/retell
```

### 4. Login and Test
Visit your app and verify all features work.

## Monitoring Your App

### View Logs
1. Go to Digital Ocean dashboard
2. Select your app
3. Click "Runtime Logs" tab
4. Filter by service (web, db-migrate)

### Monitor Performance
1. Click "Insights" tab
2. View metrics:
   - CPU usage
   - Memory usage
   - Request rate
   - Response time

### Set Up Alerts
1. Click "Alerts" tab
2. Create alerts for:
   - High CPU (>80%)
   - High memory (>80%)
   - Request errors (>5%)

## Scaling

### When to Scale
Scale up when you experience:
- Slow response times (>1 second)
- High CPU usage (>70%)
- High memory usage (>80%)
- More than 100 concurrent users

### How to Scale

**Vertical Scaling** (more power per instance):
- Settings → web service → Change instance size
- basic-xs: $12/month (1GB RAM)
- basic-s: $24/month (2GB RAM)
- professional-xs: $50/month (2GB RAM + dedicated CPU)

**Horizontal Scaling** (more instances):
- Settings → web service → Increase instance count
- Digital Ocean automatically load balances

## Troubleshooting

### Build Failed
```bash
# Check build logs in Activity tab
# Common issues:
# - Missing dependencies
# - TypeScript errors
# - Environment variable issues
```

### Database Connection Failed
```bash
# Verify environment variables:
# DATABASE_URL=${bookedsolid-db.DATABASE_URL}
# Check database is running in dashboard
```

### Health Check Failing
```bash
# Check /api/health endpoint
# Verify:
# - App is running
# - Database is connected
# - Environment variables are set
```

See detailed troubleshooting in [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md).

## Cost Breakdown

### Development Setup ($20/month)
- Web: basic-xxs ($5/month)
- Database: basic ($15/month)

### Production Setup ($84/month)
- Web: basic-s ($24/month)
- Database: standard ($60/month)

### Enterprise Setup (Custom)
- Web: professional-* ($50+/month)
- Database: advanced (custom pricing)

**Note:** New Digital Ocean accounts get $200 free credit (60 days)

## Security

### Automatic Features
- SSL/TLS certificates (auto-provisioned)
- HTTPS enforcement
- DDoS protection
- Database encryption at rest

### Best Practices
- [ ] Enable 2FA on Digital Ocean account
- [ ] Use strong, unique passwords
- [ ] Rotate secrets every 90 days
- [ ] Review access logs regularly
- [ ] Keep dependencies updated
- [ ] Use separate staging environment

## Backup and Recovery

### Automatic Backups
- Daily database backups
- 7-day retention (basic plan)
- Point-in-time recovery available

### Manual Backup
```bash
# In Digital Ocean console
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
# In Digital Ocean console
psql $DATABASE_URL < backup.sql
```

## Custom Domain

Want to use your own domain?

1. **Add Domain in Digital Ocean:**
   - Settings → Domains → Add Domain
   - Enter: `dashboard.yourdomain.com`

2. **Update DNS Records:**
   - Add CNAME record shown by Digital Ocean
   - Wait 5-60 minutes for propagation

3. **Update Environment Variables:**
   ```bash
   NEXTAUTH_URL=https://dashboard.yourdomain.com
   ```

4. **Update External Services:**
   - Google OAuth redirect URIs
   - Retell webhook URL

## CI/CD Integration

### Automatic Deployment
Every push to `main` branch triggers:
1. Pull latest code
2. Run build command
3. Run tests (if configured)
4. Run database migrations
5. Deploy new version
6. Health check
7. Rollback on failure

### GitHub Actions (Optional)
Add pre-deployment checks:
```yaml
# .github/workflows/test.yml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Getting Help

### Documentation
- **Quick Start:** [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md)
- **Full Guide:** [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md)
- **Summary:** [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)
- **Env Vars:** [.env.digitalocean.template](./.env.digitalocean.template)

### External Resources
- [Digital Ocean Docs](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment)

### Support
- [Digital Ocean Community](https://www.digitalocean.com/community)
- [Digital Ocean Support](https://www.digitalocean.com/support)
- [GitHub Issues](https://github.com/your-repo/issues)

## Success Checklist

Your deployment is successful when:
- [ ] Health check returns `{"status":"healthy"}`
- [ ] Login page loads without errors
- [ ] Admin can log in
- [ ] Dashboard displays correctly
- [ ] Database queries work
- [ ] Retell webhook receives events
- [ ] No critical errors in logs

## Next Steps

After successful deployment:

1. **Immediate:**
   - [ ] Change default admin password
   - [ ] Create additional user accounts
   - [ ] Test all features

2. **Short-term:**
   - [ ] Add custom domain
   - [ ] Set up monitoring alerts
   - [ ] Configure backup schedule

3. **Long-term:**
   - [ ] Set up staging environment
   - [ ] Implement CI/CD pipeline
   - [ ] Plan scaling strategy

## Ready to Deploy?

### Choose your path:

**🚀 Quick Deploy** (15 minutes)
```bash
./scripts/deploy-digitalocean.sh
```

**📚 Guided Deploy** (30 minutes)
Read [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md)

**🔧 Custom Deploy** (45 minutes)
Read [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md)

---

## Questions?

Check the troubleshooting sections in our documentation, or reach out for help!

**Happy Deploying! 🎉**
