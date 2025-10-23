'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  setupCompleted?: boolean;
  setupDismissed?: boolean;
  clientId?: string;
  hasExternalCRM?: boolean | null;
}

interface SetupContextType {
  showSetup: boolean;
  setupCompleted: boolean;
  setShowSetup: (show: boolean) => void;
  completeSetup: () => Promise<void>;
  dismissSetup: () => Promise<void>;
  user: User | null;
}

const SetupContext = createContext<SetupContextType | undefined>(undefined);

interface SetupProviderProps {
  children: React.ReactNode;
  user: User | null;
}

export function SetupProvider({ children, user }: SetupProviderProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    // Show setup modal if:
    // 1. User is logged in
    // 2. Hasn't completed setup and hasn't dismissed it
    // 3. Has already set CRM preference (hasExternalCRM is not null)
    // This ensures CRM selection happens BEFORE price selection
    if (user && !user.setupCompleted && !user.setupDismissed && user.hasExternalCRM !== null) {
      setShowSetup(true);
    } else {
      setShowSetup(false);
    }

    setSetupCompleted(user?.setupCompleted || false);
  }, [user]);

  const completeSetup = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setupCompleted: true,
        }),
      });

      if (response.ok) {
        setSetupCompleted(true);
        setShowSetup(false);
      } else {
        console.error('Failed to update setup status');
      }
    } catch (error) {
      console.error('Error completing setup:', error);
    }
  }, [user]);

  const dismissSetup = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setupDismissed: true,
        }),
      });

      if (response.ok) {
        setShowSetup(false);
      } else {
        console.error('Failed to dismiss setup');
      }
    } catch (error) {
      console.error('Error dismissing setup:', error);
    }
  }, [user]);

  const value: SetupContextType = {
    showSetup,
    setupCompleted,
    setShowSetup,
    completeSetup,
    dismissSetup,
    user,
  };

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetup() {
  const context = useContext(SetupContext);
  if (context === undefined) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
}
