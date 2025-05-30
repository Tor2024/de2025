"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const { userData } = useUserData();
  const router = useRouter();
  // Add a loading state to prevent flash of onboarding flow when user data is being loaded
  const [isCheckingUser, setIsCheckingUser] = React.useState(true);

  useEffect(() => {
    // userData might take a moment to load from localStorage
    if (userData.settings !== undefined) { // Check if settings has been attempted to load
      setIsCheckingUser(false);
      if (userData.settings) {
        router.replace('/dashboard');
      }
    }
  }, [userData, router]);

  if (isCheckingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!userData.settings) {
    return <OnboardingFlow />;
  }

  // Should have been redirected, but as a fallback:
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner size={48} />
      <p className="ml-4">Redirecting to your dashboard...</p>
    </div>
  );
}

// Need to import React for useState
import * as React from 'react';
