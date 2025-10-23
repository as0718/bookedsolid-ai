import { AdminRole } from "@prisma/client";

/**
 * Admin Permission System
 * Defines granular permissions for different admin roles
 */

export type AdminPermission =
  // User Management
  | "view_users"
  | "create_users"
  | "edit_users"
  | "delete_users"
  | "reset_passwords"
  | "lock_unlock_accounts"

  // Business Management
  | "view_businesses"
  | "create_businesses"
  | "edit_businesses"
  | "delete_businesses"
  | "suspend_businesses"

  // System Configuration
  | "view_system_settings"
  | "edit_system_settings"
  | "manage_api_keys"
  | "manage_integrations"

  // Analytics & Reports
  | "view_analytics"
  | "view_financial_reports"
  | "export_data"

  // Admin Management
  | "view_admins"
  | "invite_admins"
  | "edit_admin_roles"
  | "remove_admins"

  // System Monitoring
  | "view_logs"
  | "view_audit_trail"
  | "view_system_health"
  | "manage_errors"

  // Advanced
  | "execute_sql"
  | "access_production_db"
  | "manage_backups";

/**
 * Admin Role Definitions with Permissions
 */
export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  // Developer: Full system access, API management, database access
  DEVELOPER: [
    "view_users", "create_users", "edit_users", "delete_users", "reset_passwords", "lock_unlock_accounts",
    "view_businesses", "create_businesses", "edit_businesses", "delete_businesses", "suspend_businesses",
    "view_system_settings", "edit_system_settings", "manage_api_keys", "manage_integrations",
    "view_analytics", "view_financial_reports", "export_data",
    "view_admins", "invite_admins", "edit_admin_roles", "remove_admins",
    "view_logs", "view_audit_trail", "view_system_health", "manage_errors",
    "execute_sql", "access_production_db", "manage_backups"
  ],

  // Business Partner: Business analytics and financial reports
  BUSINESS_PARTNER: [
    "view_users", "view_businesses",
    "view_analytics", "view_financial_reports", "export_data",
    "view_logs"
  ],

  // Support Staff: User management and password resets
  SUPPORT_STAFF: [
    "view_users", "edit_users", "reset_passwords", "lock_unlock_accounts",
    "view_businesses", "edit_businesses",
    "view_analytics",
    "view_logs", "view_audit_trail"
  ],

  // Super Admin: Full platform control
  SUPER_ADMIN: [
    "view_users", "create_users", "edit_users", "delete_users", "reset_passwords", "lock_unlock_accounts",
    "view_businesses", "create_businesses", "edit_businesses", "delete_businesses", "suspend_businesses",
    "view_system_settings", "edit_system_settings", "manage_api_keys", "manage_integrations",
    "view_analytics", "view_financial_reports", "export_data",
    "view_admins", "invite_admins", "edit_admin_roles", "remove_admins",
    "view_logs", "view_audit_trail", "view_system_health", "manage_errors",
    "execute_sql", "access_production_db", "manage_backups"
  ]
};

/**
 * Check if an admin has a specific permission
 */
export function hasAdminPermission(
  user: { isAdmin?: boolean; adminRole?: string | null; adminPermissions?: any },
  permission: AdminPermission
): boolean {
  // Non-admins have no admin permissions
  if (!user.isAdmin || !user.adminRole) {
    return false;
  }

  const role = user.adminRole as AdminRole;

  // Check role-based permissions
  const rolePermissions = ADMIN_ROLE_PERMISSIONS[role] || [];
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check custom permissions (if defined)
  if (user.adminPermissions && typeof user.adminPermissions === 'object') {
    const customPermissions = user.adminPermissions as Record<string, boolean>;
    return customPermissions[permission] === true;
  }

  return false;
}

/**
 * Get all permissions for an admin role
 */
export function getAdminPermissions(adminRole: AdminRole): AdminPermission[] {
  return ADMIN_ROLE_PERMISSIONS[adminRole] || [];
}

/**
 * Check if admin can perform bulk operations
 */
export function canPerformBulkOperations(user: any): boolean {
  return hasAdminPermission(user, "delete_users") ||
         hasAdminPermission(user, "suspend_businesses");
}

/**
 * Check if admin can access sensitive data
 */
export function canAccessSensitiveData(user: any): boolean {
  return hasAdminPermission(user, "view_financial_reports") ||
         hasAdminPermission(user, "execute_sql") ||
         hasAdminPermission(user, "access_production_db");
}

/**
 * Check if admin can manage other admins
 */
export function canManageAdmins(user: any): boolean {
  return hasAdminPermission(user, "invite_admins") &&
         hasAdminPermission(user, "edit_admin_roles");
}

/**
 * Get human-readable role label
 */
export function getAdminRoleLabel(role: AdminRole | string): string {
  const labels: Record<string, string> = {
    DEVELOPER: "Developer",
    BUSINESS_PARTNER: "Business Partner",
    SUPPORT_STAFF: "Support Staff",
    SUPER_ADMIN: "Super Admin"
  };
  return labels[role] || role;
}

/**
 * Get role description
 */
export function getAdminRoleDescription(role: AdminRole): string {
  const descriptions: Record<AdminRole, string> = {
    DEVELOPER: "Full system access, API management, and database operations",
    BUSINESS_PARTNER: "Access to business analytics and financial reports",
    SUPPORT_STAFF: "User management and password reset capabilities",
    SUPER_ADMIN: "Complete platform control with all permissions"
  };
  return descriptions[role];
}

/**
 * Validate if user is admin
 */
export function isAdmin(user: any): boolean {
  return user?.isAdmin === true && user?.adminRole != null;
}

/**
 * Get permission categories for UI
 */
export function getPermissionCategories(): Record<string, AdminPermission[]> {
  return {
    "User Management": [
      "view_users", "create_users", "edit_users", "delete_users",
      "reset_passwords", "lock_unlock_accounts"
    ],
    "Business Management": [
      "view_businesses", "create_businesses", "edit_businesses",
      "delete_businesses", "suspend_businesses"
    ],
    "System Configuration": [
      "view_system_settings", "edit_system_settings",
      "manage_api_keys", "manage_integrations"
    ],
    "Analytics & Reports": [
      "view_analytics", "view_financial_reports", "export_data"
    ],
    "Admin Management": [
      "view_admins", "invite_admins", "edit_admin_roles", "remove_admins"
    ],
    "System Monitoring": [
      "view_logs", "view_audit_trail", "view_system_health", "manage_errors"
    ],
    "Advanced": [
      "execute_sql", "access_production_db", "manage_backups"
    ]
  };
}
