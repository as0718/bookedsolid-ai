import { User } from "./types";

/**
 * Permission checking utilities for team management
 */

export type Permission =
  | "view_schedule"
  | "edit_appointments"
  | "view_clients"
  | "edit_clients"
  | "view_analytics"
  | "manage_settings"
  | "manage_team";

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;

  // Admins have all permissions
  if (user.role === "admin") return true;

  // Business owners (clients) have all permissions for their business
  if (user.role === "client" && !user.isTeamMember) return true;

  // Team members - check based on their permission level
  if (user.isTeamMember) {
    const permissions = user.teamPermissions || "view_only";

    if (permissions === "full_access") {
      // Full access team members can do everything except manage team
      return permission !== "manage_team" && permission !== "manage_settings";
    }

    if (permissions === "view_only") {
      // View-only team members can view and create appointments (but not edit clients)
      return permission === "view_schedule"
        || permission === "edit_appointments" // Allow appointment creation
        || permission === "view_clients"
        || permission === "view_analytics";
    }
  }

  return false;
}

/**
 * Check if user can edit (create/update/delete)
 */
export function canEdit(user: User | null): boolean {
  if (!user) return false;

  // Admins can edit
  if (user.role === "admin") return true;

  // Business owners can edit
  if (user.role === "client" && !user.isTeamMember) return true;

  // Team members with full access can edit
  if (user.isTeamMember && user.teamPermissions === "full_access") {
    return true;
  }

  return false;
}

/**
 * Check if user is view-only
 */
export function isViewOnly(user: User | null): boolean {
  if (!user) return true;

  return user.isTeamMember && user.teamPermissions === "view_only";
}

/**
 * Check if user can manage team (invite/remove members)
 */
export function canManageTeam(user: User | null): boolean {
  if (!user) return false;

  // Only business owners and admins can manage team
  return (user.role === "client" && !user.isTeamMember) || user.role === "admin";
}

/**
 * Get permission label for display
 */
export function getPermissionLabel(permissions: string): string {
  switch (permissions) {
    case "view_only":
      return "View Only";
    case "full_access":
      return "Full Access";
    default:
      return "Unknown";
  }
}

/**
 * Get role label for display
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case "barber":
      return "Barber";
    case "stylist":
      return "Stylist";
    case "manager":
      return "Manager";
    case "assistant":
      return "Assistant";
    default:
      return role;
  }
}
