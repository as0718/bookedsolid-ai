import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClientContent } from "@/components/settings/settings-client-content";

export default async function SettingsPage() {
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

  return <SettingsClientContent client={client} />;
}
