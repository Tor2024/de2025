
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from 'react';

export default function HomePage() {
  const { userData, isLoading } = useUserData(); // Use isLoading from context
  const router = useRouter();

  useEffect(() => {
    // Only attempt to redirect if data has loaded (isLoading is false)
    // AND user settings exist (user is onboarded)
    if (!isLoading && userData.settings && typeof userData.settings === 'object') {
      router.replace('/dashboard');
    }
  }, [userData.settings, isLoading, router]);

  // Case 1: UserData context is still loading (initial check of localStorage)
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Загрузка...</p>
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

  // Case 3: UserData is loaded (isLoading is false), but settings are null (onboarding needed)
  // At this point, userData.settings must be null.
  return <OnboardingFlow />;
}
