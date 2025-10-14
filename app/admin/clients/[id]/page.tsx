import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/dashboard/nav-bar";
import { ClientDetailView } from "@/components/admin/client-detail-view";
import { allClients, demoCallHistory } from "@/lib/mock-data";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { role?: string; email?: string; name?: string }
    | undefined;

  if (!session || !user || user.role !== "admin") {
    redirect("/login");
  }

  // Await params before using
  const { id } = await params;

  // Find client from mock data
  const client = allClients.find((c) => c.id === id);

  if (!client) {
    redirect("/admin/dashboard");
  }

  // Get client's call history
  const clientCalls = demoCallHistory.filter((call) => call.clientId === id);

  // Calculate metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCalls = clientCalls.filter(
    (call) => new Date(call.timestamp) >= today
  );

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthCalls = clientCalls.filter(
    (call) => new Date(call.timestamp) >= thisMonth
  );
  const monthBooked = monthCalls.filter((call) => call.outcome === "booked");

  const metrics = {
    totalCalls: clientCalls.length,
    todayCalls: todayCalls.length,
    monthCalls: monthCalls.length,
    monthBooked: monthBooked.length,
    conversionRate:
      monthCalls.length > 0 ? (monthBooked.length / monthCalls.length) * 100 : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        userName={user.name || "Admin"}
        userEmail={user.email || ""}
        isAdmin={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientDetailView
          client={client}
          callRecords={clientCalls.slice(0, 20)}
          metrics={metrics}
        />
      </main>
    </div>
  );
}
