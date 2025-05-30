
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from 'react';

export default function HomePage() {
  const { userData } = useUserData();
  const router = useRouter();
  
  // isCheckingUser is true if userData.settings is initially undefined (context might be loading)
  const [isCheckingUser, setIsCheckingUser] = useState(() => userData.settings === undefined);

  useEffect(() => {
    // This effect runs when userData.settings from context changes or on initial mount.
    if (userData.settings !== undefined) {
      // Settings are now defined (either an object or null).
      setIsCheckingUser(false); 
      if (userData.settings) { // If settings object exists (user is onboarded)
        router.replace('/dashboard');
      }
      // If userData.settings is null, we do nothing here,
      // the return logic below will render OnboardingFlow.
    } else {
      // userData.settings is still undefined. Keep checking.
      setIsCheckingUser(true);
    }
  }, [userData.settings, router]); // Depend directly on userData.settings

  if (isCheckingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-2">Загрузка...</p>
      </div>
    );
  }

  // At this point, isCheckingUser is false. userData.settings is either an object or null.
  if (userData.settings) {
    // This case handles if the redirect from useEffect is pending 
    // or if onboarding just finished and settings are now populated.
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Перенаправление на вашу панель управления...</p>
      </div>
    );
  }

  // If settings are null (and not undefined), it means onboarding is needed.
  return <OnboardingFlow />;
}
