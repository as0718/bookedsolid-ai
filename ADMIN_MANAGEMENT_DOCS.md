# Admin Management & Security System Documentation

## Overview

This document describes the comprehensive admin management and security system implemented for the Voice Agent Dashboard. This system provides role-based access control, advanced security features, audit logging, system monitoring, and business analytics.

---

## Table of Contents

1. [Security Features](#security-features)
2. [Admin Role System](#admin-role-system)
3. [Admin Invitation System](#admin-invitation-system)
4. [Password Management](#password-management)
5. [Audit Logging](#audit-logging)
6. [System Monitoring](#system-monitoring)
7. [Business Analytics](#business-analytics)
8. [API Endpoints](#api-endpoints)
9. [Database Schema](#database-schema)
10. [Usage Examples](#usage-examples)

---

## 1. Security Features

### 1.1 Email Case Normalization

**What it does:** All emails are automatically converted to lowercase and trimmed to eliminate case sensitivity issues.

**Implementation:**
- Registration: `email.toLowerCase().trim()`
- Login (Credentials): Normalized before database lookup
- Login (Google OAuth): Normalized before user creation/lookup

**Benefits:**
- Prevents duplicate accounts with different email cases
- Consistent user lookup across authentication methods

### 1.2 Enhanced Password Requirements

**Requirements:**
- Minimum 8 characters
- At least 1 number

**Validation Regex:** `/^(?=.*\d).{8,}$/`

**Implementation:**
- Registration endpoint validates passwords before hashing
- Returns helpful error message if password is weak

### 1.3 Failed Login Tracking & Account Lockout

**Features:**
- Tracks failed login attempts per user
- Records IP address and timestamp of failed attempts
- Locks account after 5 failed attempts
- 15-minute lockout period
- Automatic unlock after lockout expires
- Resets failed attempts counter on successful login

**Database Fields:**
```typescript
failedLoginAttempts: Int @default(0)
lastFailedLoginAt: DateTime?
lastFailedLoginIp: String?
accountLockedUntil: DateTime?
lastLoginAt: DateTime?
lastLoginIp: String?
```

### 1.4 Login Tracking

**Tracked Information:**
- Last successful login timestamp
- Last login IP address
- Login history in audit logs

---

## 2. Admin Role System

### 2.1 Admin Roles

Four distinct admin roles with granular permissions:

#### 1. **Developer** (`DEVELOPER`)
- Full system access
- API management
- Database operations
- Production database access
- Execute SQL queries
- Manage backups

#### 2. **Business Partner** (`BUSINESS_PARTNER`)
- Business analytics
- Financial reports
- View users and businesses
- Export data

#### 3. **Support Staff** (`SUPPORT_STAFF`)
- User management
- Password resets
- Lock/unlock accounts
- View audit trails
- Edit business information

#### 4. **Super Admin** (`SUPER_ADMIN`)
- Complete platform control
- All permissions
- Manage other admins
- System configuration

### 2.2 Permission System

**Permission Categories:**

1. **User Management**
   - view_users
   - create_users
   - edit_users
   - delete_users
   - reset_passwords
   - lock_unlock_accounts

2. **Business Management**
   - view_businesses
   - create_businesses
   - edit_businesses
   - delete_businesses
   - suspend_businesses

3. **System Configuration**
   - view_system_settings
   - edit_system_settings
   - manage_api_keys
   - manage_integrations

4. **Analytics & Reports**
   - view_analytics
   - view_financial_reports
   - export_data

5. **Admin Management**
   - view_admins
   - invite_admins
   - edit_admin_roles
   - remove_admins

6. **System Monitoring**
   - view_logs
   - view_audit_trail
   - view_system_health
   - manage_errors

7. **Advanced**
   - execute_sql
   - access_production_db
   - manage_backups

### 2.3 Permission Helpers

**File:** `lib/admin-permissions.ts`

```typescript
// Check if admin has specific permission
hasAdminPermission(user, "reset_passwords")

// Check if admin can manage other admins
canManageAdmins(user)

// Check if admin can perform bulk operations
canPerformBulkOperations(user)

// Get all permissions for a role
getAdminPermissions(AdminRole.DEVELOPER)

// Get human-readable role label
getAdminRoleLabel(AdminRole.SUPPORT_STAFF) // "Support Staff"
```

---

## 3. Admin Invitation System

### 3.1 Flow

1. **Super Admin creates invitation**
   - Provides email and admin role
   - Optional: Custom permissions
   - System generates unique token
   - Invitation expires in 7 days

2. **Invitation email sent** (TODO: Implement email sending)
   - Contains invitation link with token
   - Displays admin role being granted

3. **Invitee accepts invitation**
   - Validates token
   - Creates admin account
   - Sets password
   - Assigns role and permissions

### 3.2 Database Schema

```prisma
model AdminInvitation {
  id          String           @id @default(cuid())
  email       String
  token       String           @unique
  adminRole   AdminRole
  permissions Json?
  status      InvitationStatus @default(PENDING)
  expiresAt   DateTime
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  invitedBy   User   @relation(fields: [invitedById], references: [id])
  invitedById String
}

enum AdminRole {
  DEVELOPER
  BUSINESS_PARTNER
  SUPPORT_STAFF
  SUPER_ADMIN
}
```

---

## 4. Password Management

### 4.1 Single User Password Reset

**Endpoint:** `POST /api/admin/users/passwords/reset`

**Features:**
- Admin can reset any user's password
- Can provide new password or generate temporary one
- Option to force password change on next login
- Tracks password reset history
- Resets failed login attempts
- Unlocks account if locked

**Request Body:**
```json
{
  "userId": "user_id",
  "newPassword": "NewPassword123",
  "forceChange": true,
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "tempPassword": "abc123def456",
  "forcePasswordChange": true
}
```

### 4.2 Bulk Password Reset

**Endpoint:** `POST /api/admin/users/passwords/bulk-reset`

**Features:**
- Reset passwords for multiple users at once
- Reset all users in a business
- Generates temporary passwords
- Force password change option
- Tracks all resets in history
- Returns results for each user

**Request Body:**
```json
{
  "userIds": ["user1", "user2"],
  // OR
  "businessId": "business_id",
  "forceChange": true,
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset completed. 5 successful, 0 failed.",
  "results": [
    {
      "userId": "user1",
      "email": "user@example.com",
      "tempPassword": "abc123",
      "success": true
    }
  ],
  "summary": {
    "total": 5,
    "successful": 5,
    "failed": 0
  }
}
```

### 4.3 Password Reset History

**Tracked Information:**
- User whose password was reset
- Admin who performed reset
- Reset type (self, admin_forced, admin_bulk)
- Whether it was forced
- IP address
- Timestamp

---

## 5. Audit Logging

### 5.1 Audit Actions

All admin actions are logged:

**User Actions:**
- USER_CREATED
- USER_UPDATED
- USER_DELETED
- USER_PASSWORD_RESET
- USER_ACCOUNT_LOCKED
- USER_ACCOUNT_UNLOCKED

**Business Actions:**
- BUSINESS_CREATED
- BUSINESS_UPDATED
- BUSINESS_DELETED
- BUSINESS_SUSPENDED
- BUSINESS_ACTIVATED

**Admin Actions:**
- ADMIN_INVITED
- ADMIN_REMOVED

**System Actions:**
- SETTINGS_UPDATED
- SYSTEM_CONFIG_CHANGED
- BULK_ACTION_PERFORMED
- DATA_EXPORTED

**Auth Actions:**
- LOGIN_SUCCESS
- LOGIN_FAILED
- LOGOUT

### 5.2 Audit Log Data

Each audit log entry contains:
- Action type
- Admin who performed it
- Target type and ID
- Before/after changes
- Additional metadata
- IP address
- Timestamp

### 5.3 Audit Log Utilities

**File:** `lib/audit-logger.ts`

```typescript
// Log user action
await logUserAction({
  action: "USER_PASSWORD_RESET",
  performedBy: adminId,
  userId: targetUserId,
  changes: { forcePasswordChange: true },
  req
});

// Log business action
await logBusinessAction({
  action: "BUSINESS_SUSPENDED",
  performedBy: adminId,
  businessId: businessId,
  req
});

// Get recent audit logs
const logs = await getRecentAuditLogs({
  limit: 100,
  performedBy: adminId,
  action: "USER_PASSWORD_RESET"
});

// Get audit statistics
const stats = await getAuditStats(startDate, endDate);
```

---

## 6. System Monitoring

### 6.1 System Health Check

**Endpoint:** `GET /api/admin/monitoring/system-health`

**Metrics Tracked:**

1. **Database Health**
   - Response time
   - Status (healthy/warning/critical)

2. **User Metrics**
   - Active users (24h)
   - Locked accounts

3. **Business Metrics**
   - Active businesses

4. **Error Metrics**
   - Recent error count
   - Error rate percentage

5. **API Metrics**
   - Total API calls (1h)
   - Failed API calls (1h)

6. **Audit Activity**
   - Recent audit actions (1h)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T10:00:00.000Z",
  "uptime": 3600,
  "metrics": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "unit": "ms"
    },
    "users": {
      "active24h": 150,
      "lockedAccounts": 2
    },
    "errors": {
      "recentCount": 3,
      "errorRate": "1.5%",
      "status": "healthy"
    }
  }
}
```

### 6.2 Error Logging

**Features:**
- Automatic error tracking
- Stack trace storage
- Frequency counting
- Error resolution tracking
- Endpoint and method tracking

---

## 7. Business Analytics

### 7.1 Analytics Overview

**Endpoint:** `GET /api/admin/analytics/business`

**Query Parameters:**
- `startDate`: Filter start date (ISO format)
- `endDate`: Filter end date (ISO format)

### 7.2 Metrics Provided

#### Overview Metrics
- Total businesses
- New businesses (30d)
- Churned businesses (30d)
- Churn rate
- Total users
- New users (30d)
- Active users (7d)

#### Revenue Metrics
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average revenue per business

#### Business Breakdown
- Businesses by status (active/suspended/demo)
- Businesses by plan (missed/complete/unlimited)
- Top 10 active businesses

#### Appointment Metrics
- Total appointments
- Appointments by status
- Cancellation rate

#### Call Metrics
- Total calls
- Calls by outcome (booked/info/voicemail/etc)

#### Subscription Health
- Subscriptions by status (active/trialing/past_due/etc)

### 7.3 Response Example

```json
{
  "overview": {
    "totalBusinesses": 250,
    "newBusinesses30d": 15,
    "churnRate": "2.40%",
    "activeUsers7d": 180
  },
  "revenue": {
    "monthlyRecurringRevenue": 74250,
    "annualRecurringRevenue": 891000,
    "averageRevenuePerBusiness": "297.00"
  },
  "appointments": {
    "total": 1523,
    "cancellationRate": "12.50%"
  }
}
```

---

## 8. API Endpoints

### 8.1 Admin Invitations

```
GET    /api/admin/invitations              # List all invitations
POST   /api/admin/invitations              # Create new invitation
GET    /api/admin/invitations/accept?token # Validate invitation
POST   /api/admin/invitations/accept       # Accept invitation
```

### 8.2 Password Management

```
POST   /api/admin/users/passwords/reset       # Reset single user password
POST   /api/admin/users/passwords/bulk-reset  # Bulk password reset
```

### 8.3 System Monitoring

```
GET    /api/admin/monitoring/system-health    # Get system health metrics
```

### 8.4 Business Analytics

```
GET    /api/admin/analytics/business          # Get business analytics
```

---

## 9. Database Schema

### 9.1 User Security Fields

```prisma
model User {
  // Admin fields
  isAdmin           Boolean   @default(false)
  adminRole         String?
  adminPermissions  Json?
  adminJoinedAt     DateTime?
  adminInvitedById  String?

  // Security fields
  failedLoginAttempts Int      @default(0)
  lastFailedLoginAt   DateTime?
  lastFailedLoginIp   String?
  accountLockedUntil  DateTime?
  lastLoginAt         DateTime?
  lastLoginIp         String?
  passwordChangedAt   DateTime?
  forcePasswordChange Boolean  @default(false)
}
```

### 9.2 New Models

```prisma
// Admin invitations
model AdminInvitation { ... }

// Audit logs
model AuditLog { ... }

// Password reset history
model PasswordResetHistory { ... }

// System health metrics
model SystemHealthMetric { ... }

// Error logs
model ErrorLog { ... }

// API usage logs
model ApiUsageLog { ... }
```

---

## 10. Usage Examples

### 10.1 Check Admin Permissions

```typescript
import { hasAdminPermission } from "@/lib/admin-permissions";

const canResetPasswords = hasAdminPermission(admin, "reset_passwords");
if (!canResetPasswords) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### 10.2 Create Audit Log

```typescript
import { logUserAction } from "@/lib/audit-logger";

await logUserAction({
  action: "USER_PASSWORD_RESET",
  performedBy: admin.id,
  userId: targetUser.id,
  changes: { resetBy: "admin", forceChange: true },
  req
});
```

### 10.3 Invite Admin

```typescript
// POST /api/admin/invitations
{
  "email": "developer@example.com",
  "adminRole": "DEVELOPER",
  "permissions": null
}
```

### 10.4 Reset User Password

```typescript
// POST /api/admin/users/passwords/reset
{
  "userId": "clxxx123",
  "forceChange": true,
  "sendEmail": true
}
```

---

## Security Best Practices

1. **Always validate admin permissions** before sensitive operations
2. **Log all admin actions** for audit trail
3. **Use HTTPS** for all API endpoints
4. **Store passwords hashed** with bcrypt (10 salt rounds)
5. **Normalize emails** before database queries
6. **Track IP addresses** for security monitoring
7. **Implement rate limiting** on sensitive endpoints
8. **Regular security audits** of admin actions
9. **Monitor failed login attempts** for suspicious activity
10. **Enforce strong password policies**

---

## Future Enhancements

1. **Email Notifications**
   - Password reset emails
   - Admin invitation emails
   - Security alert emails

2. **Two-Factor Authentication**
   - SMS verification
   - Authenticator app support
   - Backup codes

3. **Advanced Analytics**
   - Custom date range reports
   - Export to CSV/PDF
   - Scheduled reports

4. **IP Whitelisting**
   - Restrict admin access by IP
   - Geo-location tracking

5. **Session Management**
   - Active session viewing
   - Force logout
   - Session timeout configuration

---

## Support

For questions or issues:
1. Review this documentation
2. Check audit logs for errors
3. Contact system administrator

---

**Last Updated:** October 22, 2025
**Version:** 1.0.0
