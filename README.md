# BookedSolid AI Dashboard

A complete Next.js dashboard system for managing AI-powered call analytics and client data.

## 🚀 Features

### Phase 1 & 2 Implementation (Complete)

- ✅ **Authentication System**
  - Client login page with demo credentials
  - Admin login page with secure access
  - NextAuth.js integration with JWT sessions
  - Protected routes middleware

- ✅ **Client Dashboard**
  - 6 comprehensive metric cards (calls, appointments, revenue, conversion rate, etc.)
  - Interactive call volume chart (30-day trend with Recharts)
  - Recent call activity table with filtering
  - Responsive navigation with mobile support
  - Real-time metrics calculated from mock data

- ✅ **Admin Dashboard**
  - Client management overview
  - System health monitoring
  - Multi-client analytics
  - Client status tracking

- ✅ **Demo Data**
  - 30 days of realistic call history (~247 calls)
  - Multiple client accounts
  - Varied call outcomes (booked, info, voicemail, etc.)
  - Realistic timestamps and durations

## 📋 Demo Account Credentials

### Client Account
- **Email:** `demo@bookedsolid.ai`
- **Password:** `DemoClient2025!`
- **Access:** Client dashboard with full analytics

### Admin Account
- **Email:** `admin@bookedsolid.ai`
- **Password:** `AdminAccess2025!`
- **Access:** Admin portal with client management

## 🛠️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** NextAuth.js
- **Charts:** Recharts
- **Date Handling:** date-fns

## 📦 Installation & Local Development

### Prerequisites
- Node.js 18.17 or higher
- npm or yarn

### Step 1: Install Dependencies

```bash
cd dashboard
npm install
```

### Step 2: Configure Environment Variables

The `.env.local` file is already created with the following:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
```

**⚠️ IMPORTANT:** For production, generate a new secret:

```bash
openssl rand -base64 32
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Build for Production

```bash
npm run build
npm start
```

## 🌐 Deploying to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy from the dashboard directory**
```bash
cd dashboard
vercel
```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? `bookedsolid-dashboard` (or your choice)
   - In which directory is your code located? `./`
   - Want to override the settings? **N**

5. **Set Environment Variables in Vercel:**
   - Go to your project in Vercel dashboard
   - Settings → Environment Variables
   - Add:
     - `NEXTAUTH_URL` = `https://your-vercel-url.vercel.app` (or your custom domain)
     - `NEXTAUTH_SECRET` = `[generated secret from openssl]`

6. **Redeploy after setting environment variables:**
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub**
```bash
cd dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/bookedsolid-dashboard.git
git push -u origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (or select `dashboard` if it's in a subdirectory)

3. **Configure Environment Variables**
   - Add `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
   - Click Deploy

4. **Your app will be live at:**
   - `https://your-project-name.vercel.app`

## 🔗 Custom Domain Setup (app.bookedsolid.ai)

### Step 1: Add Domain in Vercel

1. Go to your project in Vercel
2. Settings → Domains
3. Add `app.bookedsolid.ai`

### Step 2: Update DNS Records

In your domain provider (Hostinger, Cloudflare, etc.):

**Option A: CNAME Record (Recommended)**
- Type: `CNAME`
- Name: `app`
- Value: `cname.vercel-dns.com`

**Option B: A Record**
- Type: `A`
- Name: `app`
- Value: `76.76.21.21` (Vercel's IP)

### Step 3: Update Environment Variable

Update `NEXTAUTH_URL` in Vercel:
```
NEXTAUTH_URL=https://app.bookedsolid.ai
```

### Step 4: Redeploy

Redeploy your application for changes to take effect.

## 🔐 Production Security Checklist

Before deploying to production:

- [ ] Generate a new `NEXTAUTH_SECRET` using `openssl rand -base64 32`
- [ ] Update `NEXTAUTH_URL` to your production domain
- [ ] Remove or secure demo account credentials (optional)
- [ ] Enable HTTPS only
- [ ] Review and update CORS settings if needed
- [ ] Set up proper error logging (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Plausible, etc.)

## 📁 Project Structure

```
dashboard/
├── app/
│   ├── api/auth/[...nextauth]/   # NextAuth API routes
│   ├── admin/
│   │   ├── login/                # Admin login page
│   │   └── dashboard/            # Admin dashboard
│   ├── dashboard/                # Client dashboard
│   ├── login/                    # Client login page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Redirect to login
├── components/
│   ├── dashboard/                # Dashboard components
│   │   ├── metric-card.tsx
│   │   ├── call-volume-chart.tsx
│   │   ├── call-activity-table.tsx
│   │   └── nav-bar.tsx
│   ├── providers/                # Context providers
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── mock-data.ts              # Demo data & generators
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
├── .env.local                    # Environment variables
└── middleware.ts                 # Route protection
```

## 🎨 Available Routes

- `/` - Redirects to `/login`
- `/login` - Client login page
- `/admin/login` - Admin login page
- `/dashboard` - Client dashboard (protected)
- `/admin/dashboard` - Admin dashboard (protected)
- `/api/auth/*` - NextAuth API routes

## 🔄 Future Integration (Phase 3+)

The application is structured to easily integrate with Retell.ai API:

- Webhook endpoints are planned for `/api/webhooks/retell/*`
- Mock data structure matches Retell.ai's data format
- Real-time updates ready for WebSocket integration
- Database schema designed for production data

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your current URL
- Clear cookies and try again

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📝 Development Notes

- The app uses Next.js 15 with the App Router
- All pages use React Server Components where possible
- Client components are marked with `"use client"`
- Authentication uses JWT strategy (no database required)
- Mock data is generated on each page load

## 🤝 Contributing

This is a production-ready dashboard system. To extend functionality:

1. Add new routes in `app/` directory
2. Create reusable components in `components/`
3. Update types in `lib/types.ts`
4. Add API routes in `app/api/`

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Next.js documentation: https://nextjs.org/docs
- Check NextAuth.js docs: https://next-auth.js.org

## 📄 License

This project is built for BookedSolid AI.

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
