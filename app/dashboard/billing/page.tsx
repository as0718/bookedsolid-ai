import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/dashboard/nav-bar";
import { BillingContent } from "@/components/billing/billing-content";
import { BillingInfo } from "@/lib/types";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string; name?: string; clientId?: string } | undefined;

  if (!session || !user || !user.clientId) {
    redirect("/login");
  }

  // Fetch client data from database
  const client = await prisma.client.findUnique({
    where: { id: user.clientId },
  });

  if (!client) {
    redirect("/login");
  }

  // Fetch call history from database (last 30 days) for usage calculations
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
  });

  const billing = client.billing as unknown as BillingInfo;

  // Calculate current usage
  const totalMinutesUsed = Math.floor(
    last30Days.reduce((sum, call) => sum + call.duration, 0) / 60
  );

  // Calculate metrics
  const totalCalls = last30Days.length;
  const avgCallLength = totalCalls > 0
    ? Math.floor(last30Days.reduce((sum, c) => sum + c.duration, 0) / totalCalls)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        userName={session.user?.name || "User"}
        userEmail={session.user?.email || ""}
        isAdmin={false}
      />

      <BillingContent
        client={{
          ...client,
          billing: {
            ...billing,
            minutesUsed: totalMinutesUsed,
          },
        }}
        totalCalls={totalCalls}
        avgCallLength={avgCallLength}
      />
    </div>
  );
}
