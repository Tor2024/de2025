
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GrammarModuleClient } from "@/components/learn/GrammarModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';

const pageTranslations: Record<string, Record<string, string>> = {
  en: {
    loadingModule: "Loading grammar module...",
    redirecting: "Redirecting...",
  },
  ru: {
    loadingModule: "Загрузка модуля грамматики...",
    redirecting: "Перенаправление...",
  },
  // Add other languages as needed
};

export default function GrammarPage() {
  const { userData, isLoading: isUserDataContextLoading } = useUserData(); 
  const router = useRouter();

  useEffect(() => {
    if (!isUserDataContextLoading && userData.settings === null) {
      router.replace('/');
    }
  }, [userData, isUserDataContextLoading, router]); 

  const currentLang = isUserDataContextLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const tPage = (key: string, defaultText?: string): string => {
    return pageTranslations[currentLang]?.[key] || pageTranslations['en']?.[key] || defaultText || key;
  };

  if (isUserDataContextLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{tPage('loadingModule')}</p>
      </div>
    );
  }

  if (userData.settings === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{tPage('redirecting')}</p>
      </div>
    );
  }
  
  return (
    <AppShell>
      <GrammarModuleClient />
    </AppShell>
  );
}
