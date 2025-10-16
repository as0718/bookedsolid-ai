import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/dashboard/nav-bar";
import { AdminClientList } from "@/components/admin/admin-client-list";
import { prisma } from "@/lib/prisma";
import { ClientAccount } from "@/lib/types";

export default async function AdminClientsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string; name?: string } | undefined;

  if (!session || !user || user.role !== "admin") {
    redirect("/login");
  }

  // Fetch all clients from database
  const clients = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform to match ClientAccount interface
  const allClientsData = clients.map(client => ({
    ...client,
    createdDate: client.createdAt.toISOString(),
  })) as unknown as ClientAccount[];

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
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">View and manage all client accounts</p>
        </div>

        {/* Client List */}
        <AdminClientList initialClients={allClientsData} />
      </main>
    </div>
  );
}
