
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from 'react';

export default function HomePage() {
  const { userData } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // Only attempt to redirect if userData.settings is definitively loaded and truthy (an object)
    if (userData.settings && typeof userData.settings === 'object') {
      router.replace('/dashboard');
    }
    // If userData.settings is null, OnboardingFlow will be rendered.
    // If userData.settings is undefined, the loading spinner will be rendered.
  }, [userData.settings, router]);

  // Case 1: UserData is still loading from context/localStorage
  if (userData.settings === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-2">Загрузка...</p>
      </div>
    );
  }

  // Case 2: UserData is loaded, and settings exist (user is onboarded)
  // This state is primarily to show a loading spinner while the redirect initiated by useEffect is in progress.
  if (userData.settings && typeof userData.settings === 'object') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Перенаправление на вашу панель управления...</p>
      </div>
    );
  }

  // Case 3: UserData is loaded, but settings are null (onboarding needed)
  // At this point, userData.settings must be null.
  return <OnboardingFlow />;
}
