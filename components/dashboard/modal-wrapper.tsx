'use client';

import { useRouter } from 'next/navigation';
import SetupModal from '@/components/setup-modal';
import CRMPreferenceModal from '@/components/crm-preference-modal';

interface ModalWrapperProps {
  showCRMPreferenceModal: boolean;
}

export function ModalWrapper({ showCRMPreferenceModal }: ModalWrapperProps) {
  const router = useRouter();

  const handleCRMPreferenceComplete = () => {
    // Refresh the page to update the CRM preference
    router.refresh();
  };

  return (
    <>
      <SetupModal />
      <CRMPreferenceModal
        isOpen={showCRMPreferenceModal}
        onComplete={handleCRMPreferenceComplete}
      />
    </>
  );
}
