
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

  const getLoadingMessage = (lang?: InterfaceLanguage) => {
    if (lang === 'ru') return 'Загрузка...';
    return 'Loading...';
  };

  const getRedirectingMessage = (lang?: InterfaceLanguage) => {
    if (lang === 'ru') return 'Перенаправление на вашу панель управления...';
    return 'Redirecting to your dashboard...';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{getLoadingMessage(userData.settings?.interfaceLanguage)}</p>
      </div>
    );
  }

  if (userData.settings && typeof userData.settings === 'object') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{getRedirectingMessage(userData.settings.interfaceLanguage)}</p>
      </div>
    );
  }

  return <OnboardingFlow />;
}
