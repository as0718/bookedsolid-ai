import { prisma } from "./prisma";
import { AuditAction } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * Audit Logger Utility
 * Tracks all admin actions for compliance and security monitoring
 */

interface AuditLogParams {
  action: AuditAction;
  performedBy: string; // User ID of admin performing action
  targetType?: "user" | "business" | "system" | "admin";
  targetId?: string;
  changes?: Record<string, any>; // Before/after data
  metadata?: Record<string, any>; // Additional context
  req?: NextRequest; // For extracting IP and user agent
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const { action, performedBy, targetType, targetId, changes, metadata, req } = params;

    // Extract IP address from request
    let ipAddress = 'unknown';
    if (req) {
      ipAddress = req.headers.get('x-forwarded-for') ||
                  req.headers.get('x-real-ip') ||
                  req.headers.get('cf-connecting-ip') ||
                  'unknown';
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action,
        performedBy,
        targetType: targetType || null,
        targetId: targetId || null,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        ipAddress,
      },
    });

    console.log(`[Audit] ${action} performed by ${performedBy} on ${targetType}:${targetId}`);
  } catch (error) {
    console.error("[Audit] Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log user-related actions
 */
export async function logUserAction(params: {
  action: Extract<AuditAction, "USER_CREATED" | "USER_UPDATED" | "USER_DELETED" | "USER_PASSWORD_RESET" | "USER_ACCOUNT_LOCKED" | "USER_ACCOUNT_UNLOCKED">;
  performedBy: string;
  userId: string;
  changes?: Record<string, any>;
  req?: NextRequest;
}): Promise<void> {
  await createAuditLog({
    ...params,
    targetType: "user",
    targetId: params.userId,
  });
}

/**
 * Log business-related actions
 */
export async function logBusinessAction(params: {
  action: Extract<AuditAction, "BUSINESS_CREATED" | "BUSINESS_UPDATED" | "BUSINESS_DELETED" | "BUSINESS_SUSPENDED" | "BUSINESS_ACTIVATED">;
  performedBy: string;
  businessId: string;
  changes?: Record<string, any>;
  req?: NextRequest;
}): Promise<void> {
  await createAuditLog({
    ...params,
    targetType: "business",
    targetId: params.businessId,
  });
}

/**
 * Log admin-related actions
 */
export async function logAdminAction(params: {
  action: Extract<AuditAction, "ADMIN_INVITED" | "ADMIN_REMOVED">;
  performedBy: string;
  adminId: string;
  changes?: Record<string, any>;
  req?: NextRequest;
}): Promise<void> {
  await createAuditLog({
    ...params,
    targetType: "admin",
    targetId: params.adminId,
  });
}

/**
 * Log system configuration changes
 */
export async function logSystemAction(params: {
  action: Extract<AuditAction, "SETTINGS_UPDATED" | "SYSTEM_CONFIG_CHANGED" | "BULK_ACTION_PERFORMED" | "DATA_EXPORTED">;
  performedBy: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  req?: NextRequest;
}): Promise<void> {
  await createAuditLog({
    ...params,
    targetType: "system",
  });
}

/**
 * Log authentication events
 */
export async function logAuthAction(params: {
  action: Extract<AuditAction, "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT">;
  performedBy: string;
  metadata?: Record<string, any>;
  req?: NextRequest;
}): Promise<void> {
  await createAuditLog({
    ...params,
    targetType: "system",
  });
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(options: {
  limit?: number;
  performedBy?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const {
    limit = 100,
    performedBy,
    action,
    targetType,
    targetId,
    startDate,
    endDate,
  } = options;

  const where: any = {};

  if (performedBy) where.performedBy = performedBy;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  return prisma.auditLog.findMany({
    where,
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          adminRole: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(startDate?: Date, endDate?: Date) {
  const where: any = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Total actions
  const totalActions = await prisma.auditLog.count({ where });

  // Actions by type
  const actionsByType = await prisma.auditLog.groupBy({
    by: ['action'],
    where,
    _count: true,
  });

  // Most active admins
  const mostActiveAdmins = await prisma.auditLog.groupBy({
    by: ['performedBy'],
    where,
    _count: true,
    orderBy: {
      _count: {
        performedBy: 'desc',
      },
    },
    take: 10,
  });

  // Recent critical actions
  const criticalActions = await prisma.auditLog.findMany({
    where: {
      ...where,
      action: {
        in: [
          'USER_DELETED',
          'BUSINESS_DELETED',
          'ADMIN_REMOVED',
          'SYSTEM_CONFIG_CHANGED',
          'DATA_EXPORTED',
        ],
      },
    },
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  return {
    totalActions,
    actionsByType: actionsByType.map(item => ({
      action: item.action,
      count: item._count,
    })),
    mostActiveAdmins: await Promise.all(
      mostActiveAdmins.map(async (item) => {
        const admin = await prisma.user.findUnique({
          where: { id: item.performedBy },
          select: { name: true, email: true },
        });
        return {
          adminId: item.performedBy,
          adminName: admin?.name || 'Unknown',
          adminEmail: admin?.email || 'Unknown',
          count: item._count,
        };
      })
    ),
    criticalActions,
  };
}
