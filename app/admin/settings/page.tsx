import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/dashboard/nav-bar";
import { prisma } from "@/lib/prisma";
import { AdminSettingsContent } from "@/components/admin/admin-settings-content";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string; name?: string } | undefined;

  if (!session || !user || user.role !== "admin") {
    redirect("/login");
  }

  // Fetch database statistics
  const totalClients = await prisma.client.count();
  const totalCallRecords = await prisma.callRecord.count();

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
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configuration and integrations</p>
        </div>

        <AdminSettingsContent
          totalClients={totalClients}
          totalCallRecords={totalCallRecords}
        />
      </main>
    </div>
  );
}
