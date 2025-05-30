
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GrammarModuleClient } from "@/components/learn/GrammarModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';

export default function GrammarPage() {
  const { userData, isLoading } = useUserData(); // Use isLoading from context
  const router = useRouter();

  useEffect(() => {
    // Only redirect if data has loaded (isLoading is false) AND settings are null.
    if (!isLoading && userData.settings === null) {
      router.replace('/');
    }
  }, [userData, isLoading, router]); // Changed userData.settings to userData

  // Show loading spinner if user data context is still loading.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Загрузка модуля грамматики...</p>
      </div>
    );
  }

  // If data has loaded, but settings are null, show loading/redirecting message.
  // The useEffect above will handle the actual redirect.
  if (userData.settings === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Перенаправление...</p>
      </div>
    );
  }
  
  // At this point, isLoading is false and userData.settings is an object.
  return (
    <AppShell>
      <GrammarModuleClient />
    </AppShell>
  );
}
