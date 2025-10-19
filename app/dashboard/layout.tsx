import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SetupProvider } from '@/contexts/SetupContext';
import { ModalWrapper } from '@/components/dashboard/modal-wrapper';
import { NavBar } from '@/components/dashboard/nav-bar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  // Fetch user data with setup status and CRM preference
  let user = null;
  let userData = null;
  let showCRMPreferenceModal = false;

  if (userEmail) {
    user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        setupCompleted: true,
        setupDismissed: true,
        clientId: true,
      },
    });

    userData = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        crmPreference: true,
        role: true,
        hasExternalCRM: true,
        crmAccessEnabled: true,
        setupCompleted: true,
        setupDismissed: true,
        isTeamMember: true,
      },
    });

    // Show CRM preference modal if:
    // 1. User is a client (not admin)
    // 2. Setup is completed or dismissed (billing is done)
    // 3. CRM preference hasn't been explicitly set yet
    if (
      userData?.role === 'client' &&
      (userData?.setupCompleted || userData?.setupDismissed) &&
      userData?.hasExternalCRM === null
    ) {
      showCRMPreferenceModal = true;
    }
  }

  // Determine if CRM should be shown based on preference AND admin access control
  const shouldShowCRM =
    userData?.crmPreference === 'BOOKEDSOLID_CRM' &&
    (userData?.crmAccessEnabled !== false);

  // Determine if user can manage team (business owners only)
  const canManageTeam = userData?.role === 'client' && !userData?.isTeamMember;

  return (
    <SetupProvider user={user}>
      <div className="min-h-screen bg-gray-50">
        <NavBar
          userName={session?.user?.name || "User"}
          userEmail={session?.user?.email || ""}
          isAdmin={userData?.role === "admin"}
          crmPreference={shouldShowCRM ? "BOOKEDSOLID_CRM" : "EXTERNAL_CRM"}
          canManageTeam={canManageTeam}
        />
        {children}
        <ModalWrapper showCRMPreferenceModal={showCRMPreferenceModal} />
      </div>
    </SetupProvider>
  );
}
