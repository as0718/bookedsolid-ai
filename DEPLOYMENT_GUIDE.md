# BookedSolid AI - Production Deployment Guide

This guide provides step-by-step instructions for deploying the BookedSolid AI dashboard to production.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before deploying, ensure you have:

- [ ] Access to your deployment platform (Vercel, Netlify, Railway, etc.)
- [ ] Production database ready (PostgreSQL recommended)
- [ ] Vapi.ai account and API credentials
- [ ] Stripe account (if using billing features)
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate (auto-configured by most platforms)

---

## 🚀 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Built specifically for Next.js
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Free tier available

**Step-by-Step:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Environment Variables**

   Create a `.env.production` file or configure in Vercel dashboard:
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/db"

   # NextAuth
   NEXTAUTH_URL="https://yourdomain.com"
   NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

   # Vapi.ai
   VAPI_API_KEY="your-vapi-api-key"
   VAPI_WEBHOOK_SECRET="your-webhook-secret"
   VAPI_PHONE_NUMBER_ID="your-phone-number-id"

   # Admin
   ADMIN_PASSWORD="SecurePassword2025!"

   # Stripe (optional)
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_MISSED_MONTHLY="price_..."
   # ... other Stripe price IDs
   ```

4. **Deploy to Production**
   ```bash
   cd /path/to/dashboard
   vercel --prod
   ```

5. **Set Up Database**
   ```bash
   # SSH into Vercel or run locally with production DATABASE_URL
   npx prisma db push
   npm run db:seed
   ```

6. **Configure Webhooks**

   In Vapi.ai dashboard:
   - Webhook URL: `https://yourdomain.com/api/webhooks/vapi`
   - Copy webhook secret to environment variables

   In Stripe dashboard:
   - Webhook URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`

7. **Verify Deployment**
   ```bash
   curl https://yourdomain.com/api/health
   # Should return: {"status": "ok"}
   ```

---

### Option 2: Netlify

**Step-by-Step:**

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Create netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

5. **Configure Environment Variables** in Netlify dashboard

6. **Set Up Database** (same as Vercel)

---

### Option 3: Railway

**Why Railway?**
- Easy database provisioning
- Auto-scaling
- Simple pricing

**Step-by-Step:**

1. **Create Railway Account**
   Visit https://railway.app

2. **Create New Project**
   - Connect your GitHub repository
   - Railway auto-detects Next.js

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy `DATABASE_URL` from Variables tab

4. **Configure Environment Variables**
   In Railway dashboard → Variables tab:
   - Add all environment variables from `.env.example`
   - Use Railway's PostgreSQL `DATABASE_URL`

5. **Deploy**
   - Push to GitHub main branch
   - Railway auto-deploys

6. **Run Database Migrations**
   In Railway → Shell:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

---

### Option 4: Self-Hosted (Docker)

**Step-by-Step:**

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npx prisma generate
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/prisma ./prisma
   COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     db:
       image: postgres:15
       environment:
         POSTGRES_DB: bookedsolid
         POSTGRES_USER: admin
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"

     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: postgresql://admin:${DB_PASSWORD}@db:5432/bookedsolid
         NEXTAUTH_URL: ${NEXTAUTH_URL}
         NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
         VAPI_API_KEY: ${VAPI_API_KEY}
         VAPI_WEBHOOK_SECRET: ${VAPI_WEBHOOK_SECRET}
       depends_on:
         - db

   volumes:
     postgres_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   docker-compose exec app npx prisma db push
   docker-compose exec app npm run db:seed
   ```

---

## 🗄️ DATABASE CONFIGURATION

### PostgreSQL (Recommended for Production)

**Option 1: Supabase (Managed PostgreSQL)**

1. Create account at https://supabase.com
2. Create new project
3. Copy connection string:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```
4. Add to `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:password@db.host.supabase.co:5432/postgres"
   ```

**Option 2: Railway PostgreSQL**

1. Railway auto-provisions database
2. Copy `DATABASE_URL` from Variables tab
3. No additional configuration needed

**Option 3: Heroku Postgres**

1. Create Heroku app
2. Add PostgreSQL addon:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```
3. Connection string auto-added to environment

### SQLite (Development/Small Production)

**For smaller deployments:**
```bash
DATABASE_URL="file:./prod.db"
```

**Pros:**
- Zero configuration
- No external database needed
- Lower costs

**Cons:**
- Not suitable for high traffic
- No connection pooling
- Single-server only

---

## 🔐 SECURITY CONFIGURATION

### Generate Secrets

```bash
# NEXTAUTH_SECRET (32 characters minimum)
openssl rand -base64 32

# VAPI_WEBHOOK_SECRET (from Vapi.ai dashboard)
# STRIPE_WEBHOOK_SECRET (from Stripe dashboard)
```

### Environment Variable Security

**DO NOT:**
- ❌ Commit `.env` files to Git
- ❌ Use development secrets in production
- ❌ Share secrets in Slack/email
- ❌ Use weak passwords

**DO:**
- ✅ Use platform secret management (Vercel Secrets, Railway Variables)
- ✅ Rotate secrets regularly
- ✅ Use different secrets per environment
- ✅ Use strong, random passwords (20+ characters)

### SSL/HTTPS

**Vercel/Netlify:**
- Auto-configured ✅
- Free SSL certificates
- Automatic renewal

**Self-Hosted:**
```bash
# Use Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com
```

---

## 📊 POST-DEPLOYMENT VERIFICATION

### 1. Health Check
```bash
curl https://yourdomain.com/api/health
# Expected: {"status": "ok"}
```

### 2. Database Connection
```bash
# Test login at https://yourdomain.com/admin/login
# Email: admin@bookedsolid.ai
# Password: <your ADMIN_PASSWORD>
```

### 3. Webhook Testing

**Vapi.ai Webhook:**
```bash
curl -X POST https://yourdomain.com/api/webhooks/vapi \
  -H "Content-Type: application/json" \
  -H "X-Vapi-Signature: your-webhook-secret" \
  -d '{"event":"call_ended","call":{"id":"test","assistant_id":"test"}}'
```

**Stripe Webhook:**
Use Stripe CLI:
```bash
stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe
stripe trigger customer.subscription.created
```

### 4. Load Testing
```bash
# Install artillery
npm install -g artillery

# Create test config
echo '
config:
  target: "https://yourdomain.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - get:
        url: "/api/health"
' > load-test.yml

# Run test
artillery run load-test.yml
```

---

## 🔧 TROUBLESHOOTING

### Build Failures

**Issue:** `Prisma Client not found`
```bash
# Solution: Generate Prisma Client
npx prisma generate
```

**Issue:** `Module not found: can't resolve 'X'`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Errors

**Issue:** `P1001: Can't reach database server`
```bash
# Check DATABASE_URL format
# PostgreSQL: postgresql://user:pass@host:5432/db
# SQLite: file:./dev.db

# Test connection
npx prisma db pull
```

**Issue:** `relation "Client" does not exist`
```bash
# Run migrations
npx prisma db push

# Or reset database (⚠️ destroys data)
npx prisma migrate reset
```

### Webhook Issues

**Issue:** Webhooks return 401 Unauthorized
```bash
# Verify webhook secrets match
echo $VAPI_WEBHOOK_SECRET
echo $STRIPE_WEBHOOK_SECRET

# Check webhook URL configuration in provider dashboard
```

**Issue:** Calls not appearing in dashboard
```bash
# Check webhook logs
# Vercel: https://vercel.com/[project]/deployments/[deployment]/logs
# Railway: Railway dashboard → Logs tab

# Verify client configuration has vapiAssistantId
npx prisma studio
# Navigate to Client → settings → check vapiAssistantId
```

### Performance Issues

**Issue:** Slow page loads
```bash
# Enable database connection pooling
# Add to DATABASE_URL:
?connection_limit=10&pool_timeout=20

# Check database indexes
npx prisma studio
# Review query performance
```

**Issue:** High memory usage
```bash
# Reduce Next.js concurrency
# In next.config.ts:
experimental: {
  workerThreads: true,
  cpus: 1
}
```

---

## 📈 MONITORING & LOGGING

### Error Tracking (Recommended)

**Sentry Integration:**

1. Create account at https://sentry.io
2. Install SDK:
   ```bash
   npm install @sentry/nextjs
   ```
3. Configure:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
4. Add to `.env`:
   ```bash
   SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
   ```

### Logging

**Vercel:**
- Real-time logs in dashboard
- Log streaming with `vercel logs`

**Railway:**
- Live logs in dashboard
- Download logs for analysis

**Self-Hosted:**
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "bookedsolid" -- start
pm2 logs bookedsolid
pm2 monit
```

---

## 🚦 SCALING CONSIDERATIONS

### Database Scaling

**Connection Pooling:**
```bash
# Use Prisma Accelerate or PgBouncer
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```

**Read Replicas:**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}
```

### Application Scaling

**Vercel:**
- Auto-scales based on traffic
- No configuration needed

**Railway:**
- Horizontal scaling available on Pro plan
- Add replicas in dashboard

**Docker:**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## 🎯 PRODUCTION BEST PRACTICES

### Regular Maintenance

**Weekly:**
- [ ] Review error logs
- [ ] Check database size
- [ ] Monitor API response times

**Monthly:**
- [ ] Rotate secrets
- [ ] Review user access
- [ ] Update dependencies (`npm audit`)
- [ ] Database backup verification

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost analysis

### Backup Strategy

**Database Backups:**
```bash
# Automated daily backups (PostgreSQL)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20251015.sql
```

**Code Backups:**
- Use Git tags for releases
- Keep production branch protected
- Document deployment history

---

## 📞 SUPPORT & RESOURCES

**Documentation:**
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Vapi.ai: https://docs.vapi.ai
- Stripe: https://stripe.com/docs

**Community:**
- Next.js Discord: https://discord.gg/nextjs
- Prisma Discord: https://discord.gg/prisma

**Emergency Contacts:**
- Database Provider Support
- Hosting Platform Support
- Vapi.ai Support: support@vapi.ai

---

*Last Updated: October 15, 2025*
*Version: 1.0.0-production*
