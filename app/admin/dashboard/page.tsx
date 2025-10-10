import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NavBar } from "@/components/dashboard/nav-bar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { allClients, demoCallHistory } from "@/lib/mock-data";
import { Users, Phone, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  // Calculate admin metrics
  const activeClients = allClients.filter((c) => c.status === "active").length;
  const totalCalls = demoCallHistory.length * allClients.length; // Simulate total across all clients
  const totalRevenue = allClients.reduce((sum, c) => sum + c.billing.monthlyRate, 0);

  // Clients nearing limit
  const clientsNearingLimit = allClients.filter((c) => {
    if (c.plan === "unlimited") return false;
    const usage = (c.billing.minutesUsed / c.billing.minutesIncluded) * 100;
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
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Client List</h2>
            <Button size="sm">+ Add Client</Button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Client Name</th>
                    <th className="p-3 text-left text-sm font-medium">Plan</th>
                    <th className="p-3 text-left text-sm font-medium">Calls/Mo</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allClients.map((client) => {
                    const usagePercent =
                      (client.billing.minutesUsed / client.billing.minutesIncluded) * 100;
                    const isNearingLimit = usagePercent >= 90 && client.plan !== "unlimited";

                    return (
                      <tr
                        key={client.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 text-sm font-medium">{client.businessName}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {client.plan}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{client.billing.minutesUsed}</td>
                        <td className="p-3">
                          {isNearingLimit ? (
                            <Badge variant="destructive">⚠️ Limit</Badge>
                          ) : client.status === "demo" ? (
                            <Badge variant="secondary">Demo</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

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
