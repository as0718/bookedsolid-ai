import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeamManagementContent from "@/components/team/team-management-content";

export default async function TeamManagementPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Fetch user data to check permissions
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
      isTeamMember: true,
    },
  });

  // Check if user has permission to manage team (business owners only, not team members)
  const canManage = user?.role === "client" && !user?.isTeamMember;

  if (!canManage) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access team management.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TeamManagementContent />
    </main>
  );
}
