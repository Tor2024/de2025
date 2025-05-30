
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GrammarModuleClient } from "@/components/learn/GrammarModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';

export default function GrammarPage() {
  const { userData } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // If userData.settings has loaded and is null, redirect to onboarding.
    if (userData.settings === null) {
      router.replace('/');
    }
    // If userData.settings is an object, the page will render.
    // If userData.settings is undefined, the loading spinner will be shown.
  }, [userData.settings, router]);

  // Show loading spinner if user data (and settings) are not yet loaded.
  if (userData.settings === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Загрузка модуля грамматики...</p>
      </div>
    );
  }

  // Fallback for redirect if useEffect hasn't caught it yet.
  if (userData.settings === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Перенаправление...</p>
      </div>
    );
  }
  
  // At this point, userData.settings is an object.
  return (
    <AppShell>
      <GrammarModuleClient />
    </AppShell>
  );
}
