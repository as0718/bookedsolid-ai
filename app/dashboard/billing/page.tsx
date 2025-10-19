import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubscriptionPortal } from "@/components/billing/subscription-portal";
import { UsageAnalytics } from "@/components/billing/usage-analytics";
import StripeErrorBoundary from "@/components/stripe-error-boundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  return (
    <StripeErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
            <TabsTrigger value="usage">Current Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <SubscriptionPortal
              currentPlan={client.plan}
              currentBillingInterval={client.billingInterval}
              stripeCustomerId={client.stripeCustomerId}
              stripeSubscriptionId={client.stripeSubscriptionId}
              subscriptionEndsAt={client.subscriptionEndsAt}
              stripeSubscriptionStatus={client.stripeSubscriptionStatus}
            />
          </TabsContent>

          <TabsContent value="usage">
            <UsageAnalytics clientId={user.clientId} />
          </TabsContent>
        </Tabs>
      </div>
    </StripeErrorBoundary>
  );
}
