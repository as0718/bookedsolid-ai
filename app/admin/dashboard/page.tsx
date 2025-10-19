import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/dashboard/nav-bar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AdminClientList } from "@/components/admin/admin-client-list";
import { Users, Phone, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { BillingInfo } from "@/lib/types";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string; name?: string } | undefined;

  if (!session || !user || user.role !== "admin") {
    redirect("/login");
  }

  // Fetch all clients from database with user information
  const allClientsData = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      users: {
        select: {
          id: true,
          fullName: true,
          name: true,
          hasExternalCRM: true,
          preferredCRM: true,
          crmAccessEnabled: true,
        },
      },
    },
  });

  // Get total call records count from database
  const totalCallRecords = await prisma.callRecord.count();

  // Get clients using external CRM
  const clientsWithExternalCRM = allClientsData.filter((client) =>
    client.users.some((user) => user.hasExternalCRM === true)
  );

  // Calculate admin metrics
  const activeClients = allClientsData.filter((c) => c.status === "active").length;
  const totalCalls = totalCallRecords;

  // Calculate MRR (Monthly Recurring Revenue) from active paying clients
  const mrr = allClientsData.reduce((sum, c) => {
    // Only count active subscriptions
    if (c.stripeSubscriptionStatus === "active" || c.stripeSubscriptionStatus === "trialing") {
      const billing = c.billing as unknown as BillingInfo;
      return sum + billing.monthlyRate;
    }
    return sum;
  }, 0);

  // Calculate total potential revenue (all clients)
  const totalRevenue = allClientsData.reduce((sum, c) => {
    const billing = c.billing as unknown as BillingInfo;
    return sum + billing.monthlyRate;
  }, 0);

  // Count clients by subscription status
  const activePayingClients = allClientsData.filter(
    (c) => c.stripeSubscriptionStatus === "active"
  ).length;

  const trialClients = allClientsData.filter(
    (c) => c.stripeSubscriptionStatus === "trialing"
  ).length;

  const notStartedClients = allClientsData.filter(
    (c) => !c.stripeSubscriptionId
  ).length;

  const overdueClients = allClientsData.filter(
    (c) => c.stripeSubscriptionStatus === "past_due" || c.stripeSubscriptionStatus === "unpaid"
  ).length;

  // Clients nearing limit
  const clientsNearingLimit = allClientsData.filter((c) => {
    if (c.plan === "unlimited") return false;
    const billing = c.billing as unknown as BillingInfo;
    const usage = (billing.minutesUsed / billing.minutesIncluded) * 100;
    return usage >= 90;
  });

  // Calculate average usage across all clients
  const totalMinutesUsed = allClientsData.reduce((sum, c) => {
    const billing = c.billing as unknown as BillingInfo;
    return sum + billing.minutesUsed;
  }, 0);

  const avgMinutesPerClient = allClientsData.length > 0
    ? Math.round(totalMinutesUsed / allClientsData.length)
    : 0;

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

        {/* Top Metrics Row - Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Monthly Recurring Revenue"
            value={`$${mrr.toLocaleString()}`}
            change={0}
            changeLabel="Active subscriptions"
            subtitle={`${activePayingClients} active paying`}
            icon={DollarSign}
            trend="up"
          />
          <MetricCard
            title="Total Clients"
            value={allClientsData.length}
            change={activePayingClients}
            changeLabel="paying"
            subtitle={`${trialClients} trial, ${notStartedClients} not started`}
            icon={Users}
            trend="up"
          />
          <MetricCard
            title="Total Calls"
            value={totalCalls}
            change={avgMinutesPerClient}
            changeLabel="avg min/client"
            subtitle="All time"
            icon={Phone}
            trend="up"
          />
          <MetricCard
            title="Potential MRR"
            value={`$${totalRevenue.toLocaleString()}`}
            change={notStartedClients}
            changeLabel="not started"
            subtitle={`${overdueClients} overdue`}
            icon={DollarSign}
            trend="neutral"
          />
        </div>

        {/* Client Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Paying</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {activePayingClients}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Trial</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {trialClients}
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Started</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">
                  {notStartedClients}
                </p>
              </div>
              <Users className="h-12 w-12 text-gray-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {overdueClients}
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* CRM Status Alert */}
        {clientsWithExternalCRM.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Clients Using External CRM ({clientsWithExternalCRM.length})
                </h3>
                <p className="text-sm text-amber-800 mb-4">
                  The following clients are managing contacts with their own CRM systems:
                </p>
                <div className="space-y-2">
                  {clientsWithExternalCRM.map((client) => {
                    const userWithCRM = client.users.find((u) => u.hasExternalCRM);
                    const displayName = userWithCRM?.fullName || userWithCRM?.name || client.contactName || 'N/A';
                    const crmName = userWithCRM?.preferredCRM || 'Unknown CRM';

                    return (
                      <div
                        key={client.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{displayName}</p>
                          <p className="text-sm text-gray-600">{client.businessName} ({client.email})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-amber-700 font-medium">
                            Uses {crmName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client List */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AdminClientList initialClients={allClientsData as any} />

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
