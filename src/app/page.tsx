
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from 'react';

export default function HomePage() {
  const { userData, isLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // Redirect only when data is fully loaded and a learning roadmap exists.
    if (!isLoading && userData.settings && userData.progress?.learningRoadmap) {
      router.replace('/dashboard');
    }
  }, [userData, isLoading, router]);
  
  const getLoadingMessage = () => {
      const langToUse = userData.settings?.interfaceLanguage || 'en';
      if (langToUse === 'ru') return 'Загрузка...';
      return 'Loading...';
  };

  const getRedirectingMessage = () => {
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
  
  // If user data is loaded but there are no settings, show onboarding.
  // Also show if settings exist but somehow the roadmap is missing.
  if (!userData.settings || !userData.progress?.learningRoadmap) {
    return <OnboardingFlow />;
  }
  
  // If user data is loaded and settings/roadmap exist, we are about to redirect.
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner size={48} />
      <p className="ml-4">{getRedirectingMessage()}</p>
    </div>
  );
}
