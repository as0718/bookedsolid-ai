import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/dashboard/nav-bar";
import { ClientDetailView } from "@/components/admin/client-detail-view";
import { prisma } from "@/lib/prisma";
import { ClientAccount, CallRecord } from "@/lib/types";

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

  // Fetch client from database with user information
  const clientData = await prisma.client.findUnique({
    where: { id },
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

  if (!clientData) {
    redirect("/admin/dashboard");
  }

  // Transform Prisma client to match ClientAccount interface
  const client = {
    ...clientData,
    createdDate: clientData.createdAt.toISOString(),
  } as unknown as ClientAccount;

  // Get client's call history from database
  const clientCalls = await prisma.callRecord.findMany({
    where: { clientId: id },
    orderBy: { timestamp: "desc" },
  });

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
          callRecords={clientCalls.slice(0, 20) as unknown as CallRecord[]}
          metrics={metrics}
        />
      </main>
    </div>
  );
}
