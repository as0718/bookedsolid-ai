'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SetupModal from '@/components/setup-modal';
import CRMPreferenceModal from '@/components/crm-preference-modal';
import { ServicesSetupModal } from '@/components/team/services-setup-modal';

interface ModalWrapperProps {
  showCRMPreferenceModal: boolean;
  showServicesSetupModal: boolean;
}

export function ModalWrapper({ showCRMPreferenceModal, showServicesSetupModal }: ModalWrapperProps) {
  const router = useRouter();
  const [servicesModalOpen, setServicesModalOpen] = useState(showServicesSetupModal);

  const handleCRMPreferenceComplete = () => {
    // Refresh the page to update the CRM preference
    router.refresh();
  };

  const handleServicesModalChange = (open: boolean) => {
    setServicesModalOpen(open);
    if (!open) {
      router.refresh(); // Refresh when modal is closed
    }
  };

  return (
    <>
      <SetupModal />
      <CRMPreferenceModal
        isOpen={showCRMPreferenceModal}
        onComplete={handleCRMPreferenceComplete}
      />
      <ServicesSetupModal
        open={servicesModalOpen}
        onOpenChange={handleServicesModalChange}
      />
    </>
  );
}
