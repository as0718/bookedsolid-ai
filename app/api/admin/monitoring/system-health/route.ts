import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminPermission } from "@/lib/admin-permissions";

/**
 * GET /api/admin/monitoring/system-health
 * Get system health metrics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin with permission
    const admin = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!admin || !hasAdminPermission(admin, "view_system_health")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const startTime = Date.now();

    // Database health check
    let dbStatus = "healthy";
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbStatus = dbResponseTime < 100 ? "healthy" : dbResponseTime < 500 ? "warning" : "critical";
    } catch (error) {
      dbStatus = "critical";
      dbResponseTime = -1;
    }

    // Count active users (logged in within last 24 hours)
    const activeUsersCount = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Count active businesses
    const activeBusinessesCount = await prisma.client.count({
      where: {
        status: "active",
      },
    });

    // Count locked accounts
    const lockedAccountsCount = await prisma.user.count({
      where: {
        accountLockedUntil: {
          gte: new Date(),
        },
      },
    });

    // Get recent errors (last hour)
    const recentErrors = await prisma.errorLog.count({
      where: {
        resolved: false,
        lastOccurred: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    // Calculate error rate
    const totalApiCalls = await prisma.apiUsageLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    const failedApiCalls = await prisma.apiUsageLog.count({
      where: {
        statusCode: {
          gte: 500,
        },
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    const errorRate = totalApiCalls > 0 ? (failedApiCalls / totalApiCalls) * 100 : 0;

    // Get recent audit activity
    const recentAuditActivity = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    const totalResponseTime = Date.now() - startTime;

    // Determine overall system status
    let overallStatus = "healthy";
    if (dbStatus === "critical" || errorRate > 5 || recentErrors > 10) {
      overallStatus = "critical";
    } else if (dbStatus === "warning" || errorRate > 2 || recentErrors > 5) {
      overallStatus = "warning";
    }

    // Record health metric
    await prisma.systemHealthMetric.create({
      data: {
        metricType: "system_health_check",
        value: overallStatus === "healthy" ? 100 : overallStatus === "warning" ? 50 : 0,
        unit: "percent",
        status: overallStatus,
        metadata: {
          dbStatus,
          dbResponseTime,
          activeUsersCount,
          errorRate,
          recentErrors,
        },
      },
    });

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          unit: "ms",
        },
        users: {
          active24h: activeUsersCount,
          lockedAccounts: lockedAccountsCount,
        },
        businesses: {
          active: activeBusinessesCount,
        },
        errors: {
          recentCount: recentErrors,
          errorRate: errorRate.toFixed(2) + "%",
          status: errorRate > 5 ? "critical" : errorRate > 2 ? "warning" : "healthy",
        },
        api: {
          totalCalls1h: totalApiCalls,
          failedCalls1h: failedApiCalls,
        },
        audit: {
          activity1h: recentAuditActivity,
        },
      },
      responseTime: totalResponseTime,
    });
  } catch (error) {
    console.error("Error fetching system health:", error);
    return NextResponse.json(
      {
        status: "critical",
        error: "Failed to fetch system health",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
