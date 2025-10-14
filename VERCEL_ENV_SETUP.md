# Vercel Environment Variables - Quick Setup Guide

## 🚀 Copy-Paste Ready Values

Use these exact values in your Vercel Dashboard: **Settings > Environment Variables**

---

### 1. DATABASE_URL
```
postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres
```
- Environment: **Production**
- No quotes, no spaces

---

### 2. DIRECT_DATABASE_URL
```
postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres
```
- Environment: **Production**
- No quotes, no spaces

---

### 3. NEXTAUTH_URL
```
https://bookedsolid-ai.vercel.app
```
- Environment: **Production**
- No quotes, no spaces

---

### 4. NEXTAUTH_SECRET
```
eqNXkOQfX4utUSCeoYzw4oCZGf4LY6VLdtV5Y7qs
```
- Environment: **Production**
- No quotes, no spaces

---

## ✅ How to Add Each Variable

1. Go to your Vercel project dashboard
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. For each variable above:
   - Click **Add New**
   - **Key**: Copy the variable name (e.g., `DATABASE_URL`)
   - **Value**: Copy the value exactly (no quotes!)
   - **Environments**: Check **Production**
   - Click **Save**

---

## 🔄 After Adding Variables

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
   - Or just push a new commit to trigger deployment

---

## ⚠️ Common Mistakes to Avoid

- ❌ DON'T add quotes: `"postgresql://..."`
- ❌ DON'T add spaces before/after value
- ❌ DON'T use `@secret_name` syntax
- ✅ DO copy values exactly as shown above
- ✅ DO select "Production" environment
- ✅ DO click Save for each variable

---

## 📋 Verification Checklist

After adding all variables:

- [ ] 4 environment variables added (DATABASE_URL, DIRECT_DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)
- [ ] All set to "Production" environment
- [ ] No quotes around any values
- [ ] Values match exactly (no typos)
- [ ] Deployment triggered (automatic or manual)
- [ ] Build succeeds without "references Secret" error

---

## 🔍 How to Check if Variables Are Set

In Vercel Dashboard:
1. Go to **Settings > Environment Variables**
2. You should see 4 variables listed
3. Each should show "Production" badge
4. Click "eye" icon to verify values (without revealing full secret)

---

## 🛠️ If Deployment Still Fails

1. **Clear Vercel cache**:
   - Go to **Settings > General**
   - Scroll to "Clear Cache"
   - Click "Clear Build Cache & Redeploy"

2. **Check build logs**:
   - Go to **Deployments**
   - Click on failed deployment
   - Check logs for specific error messages

3. **Verify vercel.json**:
   - Ensure no `env` section with `@` references
   - Should only have: `buildCommand`, `installCommand`, `framework`, `regions`

---

## 📞 Need Help?

If you're still seeing errors:
1. Check the full deployment guide: `VERCEL_DEPLOYMENT.md`
2. Review troubleshooting section
3. Verify Supabase database is active (not paused)

---

## 🎯 Expected Result

After completing this setup:
- ✅ Deployment succeeds
- ✅ App accessible at https://bookedsolid-ai.vercel.app
- ✅ Database connection works
- ✅ Authentication functions properly
