import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CallVolumeChart } from "@/components/dashboard/call-volume-chart";
import { CallActivityTable } from "@/components/dashboard/call-activity-table";
import { UpcomingAppointmentsOverview } from "@/components/dashboard/upcoming-appointments-overview";
import { BillingInfo, CallRecord } from "@/lib/types";
import { Phone, Calendar, DollarSign, PhoneIncoming, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string; name?: string; clientId?: string } | undefined;

  if (!session || !user || !user.clientId) {
    redirect("/login");
  }

  // Fetch user data including CRM preference and team member status
  const userData = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      crmPreference: true,
      isTeamMember: true,
    },
  });

  // Redirect team members to their personal dashboard
  if (userData?.isTeamMember) {
    redirect("/dashboard/my-dashboard");
  }

  // Fetch client data from database
  const client = await prisma.client.findUnique({
    where: { id: user.clientId },
  });

  if (!client) {
    redirect("/login");
  }

  // Fetch call history from database (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30Days = await prisma.callRecord.findMany({
    where: {
      clientId: user.clientId,
      timestamp: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  }) as unknown as CallRecord[];

  // Calculate metrics
  const totalCalls = last30Days.length;
  const appointmentsBooked = last30Days.filter((c) => c.outcome === "booked").length;
  const missedCallsRecovered = last30Days.filter(
    (c) => c.outcome === "booked" || c.outcome === "info"
  ).length;
  const revenueRecovered = last30Days
    .filter((c) => c.appointmentDetails)
    .reduce((sum, c) => sum + (c.appointmentDetails?.estimatedValue || 0), 0);
  const conversionRate = totalCalls > 0 ? (appointmentsBooked / totalCalls) * 100 : 0;

  const metrics = {
    totalCalls,
    appointmentsBooked,
    missedCallsRecovered,
    revenueRecovered,
    conversionRate,
    minutesUsed: Math.floor(last30Days.reduce((sum, c) => sum + c.duration, 0) / 60),
  };

  const billing = client.billing as unknown as BillingInfo;

  // Calculate percentage usage and alert status
  const usagePercent = (billing.minutesUsed / billing.minutesIncluded) * 100;
  let minutesAlert: "success" | "warning" | "error" = "success";
  let minutesAlertMsg = "";

  if (usagePercent >= 90) {
    minutesAlert = "error";
    minutesAlertMsg = "🔴 Nearing limit";
  } else if (usagePercent >= 75) {
    minutesAlert = "warning";
    minutesAlertMsg = "⚠️ 85% used";
  }

  return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {client.businessName}
          </p>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Calls"
            value={metrics.totalCalls}
            change={12}
            changeLabel="MTD"
            subtitle="Last 30 days"
            icon={Phone}
            trend="up"
          />
          <MetricCard
            title="Appointments Booked"
            value={metrics.appointmentsBooked}
            change={8}
            changeLabel="MTD"
            subtitle="Success rate"
            icon={Calendar}
            trend="up"
          />
          <MetricCard
            title="Revenue Recovered"
            value={`$${metrics.revenueRecovered.toLocaleString()}`}
            change={15}
            changeLabel="MTD"
            subtitle="Based on avg service value"
            icon={DollarSign}
            trend="up"
          />
        </div>

        {/* Second Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Missed Calls Recovered"
            value={metrics.missedCallsRecovered}
            alertMessage="✅ No losses!"
            subtitle="Calls that would have been lost"
            icon={PhoneIncoming}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${metrics.conversionRate.toFixed(1)}%`}
            alertMessage="📊 Above avg"
            subtitle="Industry: 55%"
            icon={TrendingUp}
          />
          <MetricCard
            title="Minutes Used"
            value={`${billing.minutesUsed}/${billing.minutesIncluded}`}
            alert={minutesAlert}
            alertMessage={minutesAlertMsg}
            subtitle="This month"
            icon={Clock}
          />
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <UpcomingAppointmentsOverview />
        </div>

        {/* Call Volume Chart */}
        <div className="mb-8">
          <CallVolumeChart calls={last30Days} days={30} />
        </div>

        {/* Recent Call Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Call Activity</h2>
            <Link href="/dashboard/call-history">
              <Button variant="outline" size="sm">
                View All →
              </Button>
            </Link>
          </div>
          <div className="p-6">
            <CallActivityTable calls={last30Days} limit={5} />
          </div>
        </div>
      </main>
  );
}
