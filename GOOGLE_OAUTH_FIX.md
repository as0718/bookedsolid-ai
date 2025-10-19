# Google OAuth Configuration Guide

## ✅ LOCAL ENVIRONMENT - FIXED!

The local environment now works correctly with automatic user creation.

---

## 🔧 PRODUCTION (NETLIFY) - CONFIGURATION REQUIRED

### Step 1: Find Your Netlify URL

Your Netlify app is deployed at a URL like:
- `https://your-app-name.netlify.app`
- OR your custom domain if configured

### Step 2: Configure Netlify Environment Variables

Go to: **Netlify Dashboard > Site settings > Environment variables**

Add/Update these variables:

```bash
# Required for NextAuth
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth (same as local)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database (SQLite for simplicity)
DATABASE_URL=file:./prod.db

# Other required variables
ADMIN_PASSWORD=ChangeMe2025!
```

**CRITICAL:** Replace `https://your-app-name.netlify.app` with your actual Netlify URL!

### Step 3: Update Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID from Google Cloud Console
3. Click on it to edit
4. Under **Authorized redirect URIs**, add:

```
http://localhost:3000/api/auth/callback/google
https://your-app-name.netlify.app/api/auth/callback/google
```

**IMPORTANT:** Replace `your-app-name.netlify.app` with your actual Netlify domain!

5. Click **Save**

### Step 4: Deploy Changes

After setting environment variables in Netlify:

1. Go to Netlify Dashboard > Deploys
2. Click "Trigger deploy" > "Deploy site"
3. Wait for deployment to complete (~2-3 minutes)

### Step 5: Test Production

1. Visit your Netlify URL: `https://your-app-name.netlify.app/login`
2. Click "Continue with Google"
3. Select your Google account
4. You should land on the dashboard! 🎉

---

## 🐛 Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Solution:** The redirect URI in Google Cloud Console doesn't match your domain.
- Double-check the redirect URI in Google Console matches exactly
- Format: `https://your-domain.com/api/auth/callback/google`
- Wait 30 seconds after saving for changes to propagate

### Issue: Page Refreshes, Can't Select Google Account

**Solution:** NEXTAUTH_URL is missing or incorrect in Netlify
- Go to Netlify > Site settings > Environment variables
- Verify NEXTAUTH_URL matches your Netlify domain exactly
- Re-deploy after making changes

### Issue: "Invalid JWT Token" or Session Errors

**Solution:** NEXTAUTH_SECRET is missing
- Verify NEXTAUTH_SECRET is set in Netlify environment variables
- Use the same secret: `Xh5bjmGTIcnOTJTGAxuyMaLJ4pubxBDBHtSNL5a5ghM=`
- Re-deploy after making changes

### Issue: User Lands Back on Login Instead of Dashboard

**Solution:** This was the original bug, now fixed!
- The code now automatically creates a User and Client when signing in with Google
- If you still see this, ensure the latest code is deployed

---

## 📋 Quick Checklist

### Local Development ✅
- [x] Code updated with signIn callback
- [x] Google OAuth redirect URI includes localhost:3000
- [x] .env file has correct credentials
- [x] Dev server running
- [x] Test: Google login → Dashboard works

### Production (Netlify) 🔧
- [ ] Find Netlify URL
- [ ] Set NEXTAUTH_URL in Netlify environment variables
- [ ] Set NEXTAUTH_SECRET in Netlify environment variables
- [ ] Set Google OAuth credentials in Netlify
- [ ] Add production redirect URI to Google Console
- [ ] Trigger new deployment
- [ ] Test: Google login → Dashboard works

---

## 🔐 Security Notes

1. **Never commit .env files** - They're in .gitignore for a reason
2. **Use different secrets for production** - Currently using the same for demo
3. **Rotate secrets regularly** - Especially if exposed
4. **Enable Google OAuth consent screen** - Configure in Google Cloud Console

---

## 📞 What Happens When a User Signs in with Google?

1. User clicks "Continue with Google" button
2. Redirected to Google account selection
3. User selects account and grants permissions
4. Google redirects back to `/api/auth/callback/google`
5. **NEW:** Our `signIn` callback checks if user exists:
   - If NO: Creates new User + Client with trial subscription
   - If YES: Loads existing user data
6. User is logged in with JWT session
7. Redirected to `/dashboard` with full access

---

## 🎯 Next Steps After OAuth is Working

Once OAuth is working in both environments:

1. **Configure Business Logic**
   - Set up Vapi.ai or Retell.ai integration
   - Configure Stripe for payments
   - Set up webhook endpoints

2. **Production Hardening**
   - Switch to PostgreSQL database (Supabase recommended)
   - Add rate limiting
   - Configure email verification
   - Set up monitoring and logging

3. **User Experience**
   - Add email verification flow
   - Add password reset functionality
   - Add user profile management
   - Add subscription management

---

## ❓ Need Help?

If you're still experiencing issues:

1. Check the browser console for JavaScript errors
2. Check Netlify function logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure Google Cloud Console settings match exactly
5. Try clearing browser cache and cookies
