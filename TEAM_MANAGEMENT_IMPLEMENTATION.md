# Team Management System Implementation

## Overview

A comprehensive team management system has been implemented for salon owners to invite team members (barbers, stylists, managers, assistants) with controlled access to their business dashboard.

## Features Implemented

### 1. Permission System
- **View Only Access**: Team members can view schedules, clients, and analytics but cannot edit
- **Full Access**: Team members can view AND edit appointments, clients, and data (except team management and settings)
- **Business Owner Access**: Full control including team management

### 2. Team Invitation System
- Business owners can invite team members by email
- Unique invitation tokens with 7-day expiration
- Custom invitation URLs: `https://yourapp.com/join/[token]`
- Role-based invitations: Barber, Stylist, Manager, Assistant

### 3. Team Member Onboarding
- Custom registration page for invited team members
- Automatic account creation with password setup
- Clear permission level display during signup
- Auto-login after successful registration

### 4. Team Management Dashboard
Located at `/dashboard/team` (visible only to business owners)

Features:
- View all team members with their roles and permissions
- View pending invitations
- Remove team members
- Cancel pending invitations
- Resend invitation links
- Tab-based interface for Members vs Invitations

## Database Schema Changes

### User Model Updates
```typescript
// New fields added to User model
isTeamMember: Boolean       // Identifies team members
teamRole: String?           // "barber" | "stylist" | "manager" | "assistant"
teamPermissions: String     // "view_only" | "full_access"
teamJoinedAt: DateTime?     // When they joined
invitedById: String?        // Who invited them
businessOwnerId: String?    // The business owner's User ID
```

### New TeamInvitation Model
```typescript
model TeamInvitation {
  id: String
  email: String
  token: String (unique)
  role: String
  permissions: String
  status: InvitationStatus  // PENDING, ACCEPTED, EXPIRED, CANCELLED
  expiresAt: DateTime
  invitedById: String
  businessId: String
}
```

## API Routes

### `/api/team/invite` (POST)
Send team invitation
```json
{
  "email": "team@example.com",
  "role": "barber",
  "permissions": "view_only"
}
```

### `/api/team/members` (GET)
Get all team members for the business

### `/api/team/invitations` (GET)
Get all pending invitations

### `/api/team/accept` (POST)
Accept invitation and create team member account
```json
{
  "token": "invitation-token",
  "name": "Full Name",
  "password": "password123"
}
```

### `/api/team/cancel` (POST)
Cancel a pending invitation
```json
{
  "invitationId": "invitation-id"
}
```

### `/api/team/remove` (POST)
Remove a team member
```json
{
  "memberId": "user-id"
}
```

## Permission Utilities

Location: `/lib/permissions.ts`

### Available Functions:
```typescript
hasPermission(user, permission)  // Check specific permission
canEdit(user)                    // Can user edit data?
isViewOnly(user)                 // Is user view-only?
canManageTeam(user)             // Can user manage team?
getPermissionLabel(permissions) // Get display label
getRoleLabel(role)              // Get role display label
```

### Permission Types:
- `view_schedule` - View business schedule
- `edit_appointments` - Create/edit appointments
- `view_clients` - View client profiles
- `edit_clients` - Edit client information
- `view_analytics` - View business analytics
- `manage_settings` - Manage business settings
- `manage_team` - Invite/remove team members

## User Flow

### For Business Owners:
1. Navigate to "Team" in the dashboard navigation
2. Click "Add Team Member"
3. Enter email, select role, and choose permission level
4. Copy invitation link or let system send email (when email is configured)
5. Manage team members and invitations from the dashboard

### For Team Members:
1. Receive invitation link
2. Visit `/join/[token]`
3. Enter name and create password
4. Review their permission level
5. Accept invitation
6. Automatically logged in to dashboard
7. View schedule and data based on permission level

## Navigation Updates

The "Team" link appears in the navigation bar for:
- Business owners (non-team-member clients)
- Admin users

Team members do NOT see the Team link.

## Security Features

1. **Token-based Invitations**: Secure, unique tokens for each invitation
2. **7-day Expiration**: Invitations expire after 7 days
3. **Permission Enforcement**: Backend validation of all actions
4. **Business Owner Verification**: Only the business owner can manage their team
5. **Role-based Access**: Different permission levels enforced throughout the app

## View-Only Features

When a team member has "view_only" permissions:
- ✅ Can view full business schedule
- ✅ Can view all client profiles
- ✅ Can access business analytics
- ❌ Cannot edit appointments
- ❌ Cannot modify client information
- ❌ Cannot change business settings
- ❌ Cannot manage team members

## Full Access Features

When a team member has "full_access" permissions:
- ✅ All View-Only permissions
- ✅ Can create/edit appointments
- ✅ Can modify client information
- ✅ Can use all CRM features
- ❌ Cannot manage team members (owner only)
- ❌ Cannot change business settings (owner only)

## Files Created/Modified

### New Files:
- `/app/api/team/invite/route.ts` - Invitation API
- `/app/api/team/invitations/route.ts` - Get invitations
- `/app/api/team/members/route.ts` - Get team members
- `/app/api/team/accept/route.ts` - Accept invitation
- `/app/api/team/cancel/route.ts` - Cancel invitation
- `/app/api/team/remove/route.ts` - Remove team member
- `/app/dashboard/team/page.tsx` - Team management page
- `/app/join/[token]/page.tsx` - Team member onboarding
- `/components/team/team-management-content.tsx` - Main team UI
- `/components/team/add-team-member-modal.tsx` - Add member form
- `/lib/permissions.ts` - Permission utilities

### Modified Files:
- `/prisma/schema.prisma` - Added team models and fields
- `/lib/types.ts` - Added team types
- `/app/dashboard/layout.tsx` - Added team permission check
- `/components/dashboard/nav-bar.tsx` - Added Team link

## Testing Checklist

- [ ] Business owner can access /dashboard/team
- [ ] Business owner can send invitation
- [ ] Invitation link works and shows correct info
- [ ] Team member can complete registration
- [ ] Team member auto-logs in after registration
- [ ] Team member sees correct navigation (no Team link)
- [ ] View-only permissions are enforced
- [ ] Full-access permissions work correctly
- [ ] Business owner can remove team members
- [ ] Business owner can cancel invitations
- [ ] Invitations expire after 7 days

## Future Enhancements

1. **Email Integration**: Automatic email sending for invitations
2. **Permission Upgrades**: Allow team members to request permission upgrades
3. **Activity Logs**: Track team member actions
4. **Individual Schedules**: Personal schedules for each team member
5. **Commission Tracking**: Track appointments by team member
6. **Custom Roles**: Create custom roles beyond the default 4
7. **Bulk Invitations**: Invite multiple team members at once
8. **Team Member Profiles**: Extended profiles with photos and bios

## Notes

- All team members are linked to the business via `clientId`
- Team members can only access data for their business
- Only business owners (and admins) can manage team
- The system supports multiple team members per business
- Invitations are tracked in the database with status updates

## Support

For questions or issues with the team management system, refer to:
- Permission utilities in `/lib/permissions.ts`
- API route implementations in `/app/api/team/`
- UI components in `/components/team/`
