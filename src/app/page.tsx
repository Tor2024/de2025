
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from 'react';
import type { InterfaceLanguage } from '@/lib/types';

export default function HomePage() {
  const { userData, isLoading } = useUserData(); 
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && userData.settings && typeof userData.settings === 'object') {
      router.replace('/dashboard');
    }
  }, [userData.settings, isLoading, router]);

  const getLoadingMessage = () => {
    // If UserDataContext is loading, default to English to prevent hydration mismatch.
    const langToUse = isLoading ? 'en' : userData.settings?.interfaceLanguage;
    if (langToUse === 'ru') return 'Загрузка...';
    return 'Loading...';
  };

  const getRedirectingMessage = () => {
    // This function is called when isLoading is false and userData.settings is an object,
    // so userData.settings.interfaceLanguage is reliable.
    const langToUse = userData.settings?.interfaceLanguage;
    if (langToUse === 'ru') return 'Перенаправление на вашу панель управления...';
    return 'Redirecting to your dashboard...';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{getLoadingMessage()}</p>
      </div>
    );
  }

  if (userData.settings && typeof userData.settings === 'object') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{getRedirectingMessage()}</p>
      </div>
    );
  }

  return <OnboardingFlow />;
}
