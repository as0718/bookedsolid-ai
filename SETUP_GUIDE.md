# BookedSolid AI Dashboard - Quick Setup Guide

This guide will get you up and running in 5 minutes.

## ⚡ Quick Start (Local Development)

1. **Navigate to the dashboard directory**
   ```bash
   cd dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Go to [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to the login page

5. **Login with demo credentials**

   **Client Dashboard:**
   - Email: `demo@bookedsolid.ai`
   - Password: `DemoClient2025!`

   **Admin Portal:**
   - Email: `admin@bookedsolid.ai`
   - Password: `AdminAccess2025!`

That's it! You're now viewing the fully functional dashboard with 30 days of demo data.

---

## 🚀 Deploy to Vercel (Production)

### Method 1: One-Click Deploy via CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy from dashboard directory
cd dashboard
vercel

# Follow the prompts, then set environment variables in Vercel dashboard:
# NEXTAUTH_URL = https://your-app.vercel.app
# NEXTAUTH_SECRET = [run: openssl rand -base64 32]

# Deploy to production
vercel --prod
```

### Method 2: Deploy via GitHub + Vercel Dashboard

1. **Push to GitHub**
   ```bash
   cd dashboard
   git init
   git add .
   git commit -m "Initial commit - BookedSolid AI Dashboard"
   git branch -M main
   git remote add origin https://github.com/yourusername/bookedsolid-dashboard.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Add Environment Variables** (in Vercel dashboard)
   ```
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live!

---

## 🌐 Custom Domain Setup (app.bookedsolid.ai)

1. **In Vercel Dashboard**
   - Go to your project → Settings → Domains
   - Click "Add"
   - Enter: `app.bookedsolid.ai`
   - Follow the DNS instructions provided

2. **In Your DNS Provider (Hostinger/Cloudflare)**
   - Add a CNAME record:
     - Name: `app`
     - Value: `cname.vercel-dns.com`

3. **Update Environment Variable**
   - In Vercel → Settings → Environment Variables
   - Update `NEXTAUTH_URL` to `https://app.bookedsolid.ai`

4. **Redeploy**
   - Vercel will automatically redeploy
   - Your dashboard is now live at app.bookedsolid.ai!

---

## 📱 Testing the Dashboard

### What You Can Do:

1. **Client Dashboard** (`/dashboard`)
   - View 6 key metrics (calls, appointments, revenue, etc.)
   - See 30-day call volume trend chart
   - Browse recent call activity with details
   - Explore call outcomes (booked, info, voicemail, etc.)

2. **Admin Dashboard** (`/admin/dashboard`)
   - View all client accounts
   - Monitor system health
   - Track aggregate metrics across clients
   - Identify clients nearing usage limits

3. **Mobile Responsive**
   - Test on mobile devices
   - Collapsible navigation menu
   - Touch-friendly interface

---

## 🔐 Security Notes

**Before going to production:**

1. **Generate a secure NextAuth secret:**
   ```bash
   openssl rand -base64 32
   ```
   Add this to `NEXTAUTH_SECRET` in Vercel

2. **Update the production URL:**
   Set `NEXTAUTH_URL` to your actual domain

3. **Optional: Remove demo credentials**
   Edit `lib/mock-data.ts` to remove demo users if needed

---

## 🎯 What's Included

✅ **Complete authentication system** with NextAuth.js
✅ **6 metric cards** following the PRD design
✅ **Interactive charts** with Recharts
✅ **Call activity table** with realistic data
✅ **Admin portal** for multi-client management
✅ **30 days of demo data** (~247 calls)
✅ **Responsive design** for all devices
✅ **TypeScript** for type safety
✅ **Tailwind CSS** for styling
✅ **shadcn/ui components** for beautiful UI

---

## 📞 Need Help?

- **Build errors?** Run `rm -rf .next && npm run build`
- **Auth issues?** Check that `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly
- **Port in use?** Run `lsof -ti:3000 | xargs kill -9`

For detailed documentation, see [README.md](./README.md)

---

## 🎉 You're All Set!

Your BookedSolid AI Dashboard is ready to use. The system is designed to easily integrate with Retell.ai API in Phase 3.

**Live Demo Accounts:**
- Client: `demo@bookedsolid.ai` / `DemoClient2025!`
- Admin: `admin@bookedsolid.ai` / `AdminAccess2025!`

Enjoy exploring your new dashboard! 🚀
