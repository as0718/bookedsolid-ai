# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for the BookedSolid AI dashboard.

## Prerequisites

- Google Account
- Access to Google Cloud Console
- Your application's domain/URL (localhost for development, production URL for deployment)

## Step-by-Step Setup

### 1. Access Google Cloud Console

1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account

### 2. Create or Select a Project

1. Click on the project dropdown at the top of the page
2. Click **"New Project"** or select an existing project
3. If creating new:
   - Enter a project name (e.g., "BookedSolid AI")
   - Click **"Create"**
   - Wait for the project to be created and select it

### 3. Configure OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: BookedSolid AI Dashboard
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On the **Scopes** page, click **"Save and Continue"** (default scopes are sufficient)
7. On the **Test users** page (optional for development):
   - Add test user emails if needed
   - Click **"Save and Continue"**
8. Review the summary and click **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

1. In the left sidebar, click **"APIs & Services"** > **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"** as the application type
5. Configure the OAuth client:
   - **Name**: BookedSolid AI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Click **"Create"**

### 5. Save Your Credentials

1. A modal will appear with your **Client ID** and **Client Secret**
2. Copy these values - you'll need them for the next step
3. Click **"OK"**

**Important**: Keep these credentials secure and never commit them to version control!

### 6. Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Add/update the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

Replace the placeholder values with your actual credentials from Step 5.

### 7. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

## Testing the Integration

### Test Client Login

1. Navigate to [http://localhost:3000/login](http://localhost:3000/login)
2. Click the **"Continue with Google"** button
3. Select or sign in with your Google account
4. Authorize the application
5. You should be redirected to the client dashboard

### Test Admin Login

1. Navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Click the **"Continue with Google"** button
3. Select or sign in with your Google account
4. Authorize the application
5. You should be redirected to the admin dashboard

**Note**: By default, new Google sign-ups are assigned the "client" role. To access admin features with a Google account, you'll need to manually set the role in your authentication logic or database.

## Production Deployment

### For Vercel (Recommended)

1. Add environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add `GOOGLE_CLIENT_ID` with your production Client ID
   - Add `GOOGLE_CLIENT_SECRET` with your production Client Secret
   - Add `NEXTAUTH_URL` with your production URL (e.g., `https://yourdomain.com`)
   - Add `NEXTAUTH_SECRET` with a random secret (generate with: `openssl rand -base64 32`)

2. Update Google Cloud Console:
   - Add your production domain to **Authorized JavaScript origins**
   - Add your production callback URL to **Authorized redirect URIs**

3. Redeploy your application

### Security Best Practices

1. **Never commit credentials**: Ensure `.env.local` is in your `.gitignore`
2. **Use different credentials**: Create separate OAuth clients for development and production
3. **Rotate secrets regularly**: Change your `NEXTAUTH_SECRET` periodically
4. **Monitor usage**: Check Google Cloud Console for unusual authentication activity
5. **Implement rate limiting**: Add rate limiting to prevent abuse

## Troubleshooting

### Error: "redirect_uri_mismatch"

- **Cause**: The redirect URI doesn't match what's configured in Google Cloud Console
- **Solution**: Ensure the redirect URI in your Google Cloud Console exactly matches:
  - `http://localhost:3000/api/auth/callback/google` (development)
  - `https://yourdomain.com/api/auth/callback/google` (production)

### Error: "invalid_client"

- **Cause**: Client ID or Client Secret is incorrect
- **Solution**: Double-check your environment variables match the credentials in Google Cloud Console

### Google Sign-in Button Not Working

- **Cause**: Environment variables not loaded or development server not restarted
- **Solution**:
  1. Verify `.env.local` has correct values
  2. Restart development server
  3. Clear browser cache and cookies

### User Role Issues

- **Problem**: Google users can't access admin features
- **Solution**: The default implementation assigns "client" role to new Google sign-ups. To make a Google account an admin:
  1. Option A: Add the Google email to the `demoUsers` array in `lib/mock-data.ts` with `role: "admin"`
  2. Option B: Implement a database and add role management in your admin panel
  3. Option C: Use a specific domain check (e.g., `@bookedsolid.ai` emails get admin role)

### Testing with Test Users

If your OAuth consent screen is in "Testing" mode:
- Only test users added in Step 3.7 can sign in
- To allow anyone to sign in, publish your OAuth consent screen (requires verification for production)

## Additional Resources

- [NextAuth.js Google Provider Documentation](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## Support

If you encounter issues not covered in this guide:
1. Check the browser console for error messages
2. Check the terminal/server logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure your Google Cloud project has the necessary APIs enabled

---

**Last Updated**: 2025-10-14
