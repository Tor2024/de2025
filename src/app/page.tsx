
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirebase } from '@/firebase';
import { User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useUserData } from '@/contexts/UserDataContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as React from 'react';

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
    const { auth } = useFirebase();

    const handleGoogleLogin = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            onLogin(result.user);
        } catch (error) {
            console.error("Authentication error:", error);
            // Optionally, show a toast to the user
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
            <Card className="w-full max-w-sm text-center shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight">Добро пожаловать в LinguaLab!</CardTitle>
                    <CardDescription>Ваш персональный AI-репетитор по языкам. Пожалуйста, войдите, чтобы начать.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGoogleLogin} className="w-full">
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 57.9l-67.4 67.4C313.8 113.2 283.4 104 248 104c-80.6 0-146 65.4-146 146s65.4 146 146 146c94.9 0 131.3-64.4 135.8-98.2H248v-65.4h238.5c1.3 8.3 2.5 16.6 2.5 25.4z"></path></svg>
                        Войти через Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // Redirect only when data is fully loaded, user is logged in, and a learning roadmap exists.
    if (!authLoading && !isUserDataLoading && user && userData.settings && userData.progress?.learningRoadmap) {
      router.replace('/dashboard');
    }
  }, [user, userData, authLoading, isUserDataLoading, router]);
  
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

  if (authLoading || isUserDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{getLoadingMessage()}</p>
      </div>
    );
  }
  
  // If user is not logged in, show login page.
  if (!user) {
    // The onLogin callback is a dummy here since the useAuth hook will trigger a re-render
    return <LoginPage onLogin={() => {}} />;
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
