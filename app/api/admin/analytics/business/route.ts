import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminPermission } from "@/lib/admin-permissions";

/**
 * GET /api/admin/analytics/business
 * Get comprehensive business analytics across all businesses
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

    if (!admin || !hasAdminPermission(admin, "view_analytics")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // 1. Total businesses by status
    const businessesByStatus = await prisma.client.groupBy({
      by: ['status'],
      _count: true,
    });

    // 2. Total businesses by plan
    const businessesByPlan = await prisma.client.groupBy({
      by: ['plan'],
      _count: true,
    });

    // 3. Total revenue by subscription status
    const activeSubscriptions = await prisma.client.findMany({
      where: {
        stripeSubscriptionStatus: "active",
      },
      select: {
        billing: true,
      },
    });

    let totalMRR = 0;
    activeSubscriptions.forEach(client => {
      const billing = client.billing as any;
      if (billing?.monthlyRate) {
        totalMRR += billing.monthlyRate;
      }
    });

    const totalARR = totalMRR * 12;

    // 4. New businesses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newBusinesses = await prisma.client.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 5. Churn rate (businesses that became inactive in last 30 days)
    const churnedBusinesses = await prisma.client.count({
      where: {
        status: { in: ["suspended", "demo"] },
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const totalBusinesses = await prisma.client.count();
    const churnRate = totalBusinesses > 0 ? (churnedBusinesses / totalBusinesses) * 100 : 0;

    // 6. Total appointments across all businesses
    const totalAppointments = await prisma.appointment.count({
      ...(Object.keys(dateFilter).length > 0 && {
        where: {
          createdAt: dateFilter,
        },
      }),
    });

    // 7. Appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: true,
      ...(Object.keys(dateFilter).length > 0 && {
        where: {
          createdAt: dateFilter,
        },
      }),
    });

    // 8. Cancellation rate
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        status: { in: ["CANCELLED", "NO_SHOW"] },
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
    });

    const cancellationRate = totalAppointments > 0
      ? (cancelledAppointments / totalAppointments) * 100
      : 0;

    // 9. Most active businesses (by appointment count)
    const businessActivity = await prisma.appointment.groupBy({
      by: ['userId'],
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
      ...(Object.keys(dateFilter).length > 0 && {
        where: {
          createdAt: dateFilter,
        },
      }),
    });

    // Get business details for top active businesses
    const topBusinesses = await Promise.all(
      businessActivity.map(async (activity) => {
        const user = await prisma.user.findUnique({
          where: { id: activity.userId },
          include: {
            client: true,
          },
        });

        return {
          businessId: user?.client?.id,
          businessName: user?.client?.businessName,
          appointmentCount: activity._count,
          email: user?.client?.email,
          plan: user?.client?.plan,
        };
      })
    );

    // 10. Call volume metrics
    const totalCalls = await prisma.callRecord.count({
      ...(Object.keys(dateFilter).length > 0 && {
        where: {
          timestamp: dateFilter,
        },
      }),
    });

    const callsByOutcome = await prisma.callRecord.groupBy({
      by: ['outcome'],
      _count: true,
      ...(Object.keys(dateFilter).length > 0 && {
        where: {
          timestamp: dateFilter,
        },
      }),
    });

    // 11. User growth metrics
    const totalUsers = await prisma.user.count();

    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // 12. Subscription health metrics
    const subscriptionHealth = await prisma.client.groupBy({
      by: ['stripeSubscriptionStatus'],
      _count: true,
      where: {
        stripeSubscriptionStatus: { not: null },
      },
    });

    return NextResponse.json({
      overview: {
        totalBusinesses,
        newBusinesses30d: newBusinesses,
        churnedBusinesses30d: churnedBusinesses,
        churnRate: churnRate.toFixed(2) + "%",
        totalUsers,
        newUsers30d: newUsers,
        activeUsers7d: activeUsers,
      },
      revenue: {
        monthlyRecurringRevenue: totalMRR,
        annualRecurringRevenue: totalARR,
        averageRevenuePerBusiness: totalBusinesses > 0 ? (totalMRR / totalBusinesses).toFixed(2) : 0,
      },
      businesses: {
        byStatus: businessesByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        byPlan: businessesByPlan.map(item => ({
          plan: item.plan,
          count: item._count,
        })),
        topActive: topBusinesses,
      },
      appointments: {
        total: totalAppointments,
        byStatus: appointmentsByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        cancellationRate: cancellationRate.toFixed(2) + "%",
      },
      calls: {
        total: totalCalls,
        byOutcome: callsByOutcome.map(item => ({
          outcome: item.outcome,
          count: item._count,
        })),
      },
      subscriptions: {
        health: subscriptionHealth.map(item => ({
          status: item.stripeSubscriptionStatus,
          count: item._count,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching business analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
