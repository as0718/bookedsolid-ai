import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; clientId?: string; email?: string } | undefined;

    if (!session || !user || !user.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get time range from query params (default to 30 days)
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30";
    const rangeInt = parseInt(range, 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeInt);

    // Fetch call records for the time range
    const callRecords = await prisma.callRecord.findMany({
      where: {
        clientId: user.clientId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Calculate metrics
    const totalCalls = callRecords.length;
    const totalDuration = callRecords.reduce((sum, call) => sum + call.duration, 0);
    const totalMinutes = Math.floor(totalDuration / 60);
    const avgCallDuration = totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0;

    // Call outcomes breakdown
    const outcomeBreakdown = callRecords.reduce((acc, call) => {
      acc[call.outcome] = (acc[call.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate conversion rate (booked / total)
    const bookedCalls = outcomeBreakdown.booked || 0;
    const conversionRate = totalCalls > 0 ? (bookedCalls / totalCalls) * 100 : 0;

    // Peak hours analysis
    const hourlyDistribution = callRecords.reduce((acc, call) => {
      const hour = new Date(call.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Find peak hour
    const peakHour = Object.entries(hourlyDistribution).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 }
    );

    // Daily call volume for the range
    const dailyVolume = callRecords.reduce((acc, call) => {
      const date = new Date(call.timestamp).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array sorted by date
    const dailyVolumeArray = Object.entries(dailyVolume)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate estimated revenue (assuming avg $50 per booked appointment)
    const estimatedRevenue = bookedCalls * 50;

    // Get client billing info for cost analysis
    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
      select: { plan: true, billing: true },
    });

    const billing = client?.billing as any;
    const minutesIncluded = billing?.minutesIncluded || 0;
    const overageRate = billing?.overageRate || 0;
    const monthlyRate = billing?.monthlyRate || 0;

    // Calculate overage cost
    const overageMinutes = Math.max(0, totalMinutes - minutesIncluded);
    const overageCost = overageMinutes * overageRate;
    const totalCost = monthlyRate + overageCost;

    // Cost per call
    const costPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

    // ROI calculation (revenue recovered vs cost)
    const roi = totalCost > 0 ? ((estimatedRevenue - totalCost) / totalCost) * 100 : 0;

    return NextResponse.json({
      summary: {
        totalCalls,
        totalMinutes,
        avgCallDuration,
        conversionRate: Math.round(conversionRate * 10) / 10,
        estimatedRevenue,
      },
      outcomes: outcomeBreakdown,
      peakHour: {
        hour: peakHour.hour,
        count: peakHour.count,
        formatted: `${peakHour.hour % 12 || 12}:00 ${peakHour.hour >= 12 ? "PM" : "AM"}`,
      },
      hourlyDistribution,
      dailyVolume: dailyVolumeArray,
      costAnalysis: {
        monthlyRate,
        minutesIncluded,
        minutesUsed: totalMinutes,
        overageMinutes,
        overageRate,
        overageCost: Math.round(overageCost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        costPerCall: Math.round(costPerCall * 100) / 100,
        roi: Math.round(roi * 10) / 10,
      },
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: rangeInt,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
