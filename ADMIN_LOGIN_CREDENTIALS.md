# Admin Login Credentials

## Admin Portal Access

### Login URLs

- **Admin Portal**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin/dashboard

### Default Admin Credentials

```
Email: admin@bookedsolid.ai
Password: ChangeMe2025!
```

**IMPORTANT**: Change this password immediately after first login!

---

## How to Log In

1. Navigate to http://localhost:3000/admin/login
2. Enter the admin email: `admin@bookedsolid.ai`
3. Enter the password: `ChangeMe2025!`
4. Click "Admin Log In"
5. You'll be redirected to the admin dashboard

---

## Regular User Login

- **User Portal**: http://localhost:3000/login
- Users can register new accounts or sign in with Google OAuth

---

## Resetting/Recreating Admin User

If you need to reset or recreate the admin user:

```bash
# Run the database seed script
npm run db:seed
```

**IMPORTANT**: The seed script is now **safe by default**:
- ✅ Checks if admin exists BEFORE doing anything
- ✅ **Never** clears data unless `FORCE_CLEAR_DATA=true`
- ✅ Safe to run multiple times
- ✅ Only creates admin if one doesn't exist

### Verify Admin Password

You can verify your admin password anytime:
```bash
npx tsx scripts/verify-password.ts
```

This will check if the password from `.env` matches the database.

---

## Changing Admin Password

### Method 1: Environment Variable

Set a custom admin password before running the seed:

```bash
# In .env.local
ADMIN_PASSWORD="YourNewSecurePassword123!"
```

Then run:
```bash
npm run db:seed
```

### Method 2: Database Direct Update

You can also update the password directly in the database using Prisma Studio:

```bash
# Open Prisma Studio
npx prisma studio --port 5555
```

Then:
1. Navigate to the `User` model
2. Find admin@bookedsolid.ai
3. Update the password field with a bcrypt hash

**Note**: To generate a bcrypt hash, you can use:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('YourNewPassword', 10);
console.log(hash);
```

---

## Troubleshooting

### "Invalid admin credentials" Error

1. Verify the admin user exists in the database
2. Run `npm run db:seed` to create the admin user
3. Ensure you're using the correct email: `admin@bookedsolid.ai`
4. Ensure you're using the correct password: `ChangeMe2025!`

### Admin User Doesn't Exist

Run the seed script to create it:
```bash
npm run db:seed
```

### Need to Start Fresh

If you want to completely reset the database:
```bash
# Reset database and run migrations
npm run db:reset

# Seed the database
npm run db:seed
```

---

## Security Best Practices

1. Change the default password immediately after first login
2. Use a strong password (min 12 characters, mix of letters, numbers, symbols)
3. Never commit `.env` or `.env.local` files with credentials
4. In production, always use a custom `ADMIN_PASSWORD` environment variable
5. Consider implementing 2FA for admin accounts in production

---

## Additional Admin Features

Once logged in as admin, you'll have access to:

- Client management
- User management
- System settings
- Analytics and reporting
- Team management
- Billing and subscriptions

---

## Production Setup

When deploying to production, you need to create an admin user in your **production database**:

### Production Seed Script
```bash
# This ONLY runs in production (safe!)
npm run db:seed:production
```

This production seed script:
- ✅ Only runs if `NODE_ENV=production`
- ✅ Creates admin in production database
- ✅ **Never** touches local database
- ✅ Safe to run multiple times

For detailed production setup instructions, see `DATABASE_SEEDING.md`

---

## Support

If you continue experiencing login issues:

1. Check the server logs for authentication errors
2. Verify database connection is working
3. Run `npx tsx scripts/verify-password.ts` to test password
4. Ensure NextAuth is properly configured
5. Check that NEXTAUTH_SECRET is set in environment variables

**New Documentation:**
- `DATABASE_SEEDING.md` - Complete seeding guide
- `scripts/verify-password.ts` - Test admin password
- `scripts/check-admin.ts` - Check admin user exists

For more help, see the main README.md or contact support.
