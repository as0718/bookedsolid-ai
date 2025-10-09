import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/dashboard/nav-bar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CallVolumeChart } from "@/components/dashboard/call-volume-chart";
import { CallActivityTable } from "@/components/dashboard/call-activity-table";
import { demoClient, demoCallHistory, calculateMetrics } from "@/lib/mock-data";
import { Phone, Calendar, DollarSign, PhoneIncoming, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Calculate metrics from mock data
  const metrics = calculateMetrics(demoCallHistory);

  // Get last 30 days of calls for chart
  const last30Days = demoCallHistory;

  // Calculate percentage usage and alert status
  const usagePercent = (demoClient.billing.minutesUsed / demoClient.billing.minutesIncluded) * 100;
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
    <div className="min-h-screen bg-gray-50">
      <NavBar
        userName={session.user.name || "User"}
        userEmail={session.user.email || ""}
        isAdmin={false}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {demoClient.businessName}
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
            value={`${demoClient.billing.minutesUsed}/${demoClient.billing.minutesIncluded}`}
            alert={minutesAlert}
            alertMessage={minutesAlertMsg}
            subtitle="This month"
            icon={Clock}
          />
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
    </div>
  );
}
