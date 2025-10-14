import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma"; // Disabled for local testing
import { NavBar } from "@/components/dashboard/nav-bar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AdminClientList } from "@/components/admin/admin-client-list";
import { Users, Phone, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { BillingInfo } from "@/lib/types";
import { allClients, demoCallHistory } from "@/lib/mock-data";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string; name?: string } | undefined;

  if (!session || !user || user.role !== "admin") {
    redirect("/login");
  }

  // Use mock client data for local testing
  const allClientsData = allClients;

  // Use mock call records count for local testing
  const totalCallRecords = demoCallHistory.length;

  // Calculate admin metrics
  const activeClients = allClientsData.filter((c) => c.status === "active").length;
  const totalCalls = totalCallRecords;
  const totalRevenue = allClientsData.reduce((sum, c) => {
    const billing = c.billing as BillingInfo;
    return sum + billing.monthlyRate;
  }, 0);

  // Clients nearing limit
  const clientsNearingLimit = allClientsData.filter((c) => {
    if (c.plan === "unlimited") return false;
    const billing = c.billing as BillingInfo;
    const usage = (billing.minutesUsed / billing.minutesIncluded) * 100;
    return usage >= 90;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        userName={user.name || "Admin"}
        userEmail={user.email || ""}
        isAdmin={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">All Clients Overview</p>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Active Clients"
            value={activeClients}
            change={2}
            changeLabel="new this month"
            icon={Users}
            trend="up"
          />
          <MetricCard
            title="Total Calls Today"
            value={totalCalls}
            change={156}
            changeLabel="MTD"
            icon={Phone}
            trend="up"
          />
          <MetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            change={23}
            changeLabel="MTD"
            subtitle="This month"
            icon={DollarSign}
            trend="up"
          />
        </div>

        {/* Client List */}
        <AdminClientList initialClients={allClientsData} />

        {/* System Health */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">System Health</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                <strong>Retell.ai API:</strong> Connected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                <strong>Call Routing:</strong> Operational
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                <strong>CRM Integrations:</strong> All synced
              </span>
            </div>
            {clientsNearingLimit.length > 0 && (
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-sm">
                  <strong>Alerts:</strong> {clientsNearingLimit.length} client
                  {clientsNearingLimit.length > 1 ? "s" : ""} near minute limit
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
