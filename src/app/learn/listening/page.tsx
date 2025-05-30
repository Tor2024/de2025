
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ListeningModuleClient } from "@/components/learn/ListeningModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';
import { interfaceLanguageCodes, type InterfaceLanguage } from "@/lib/types";

const baseEnTranslations = {
  loadingModule: "Loading listening module...",
  redirecting: "Redirecting...",
};

const baseRuTranslations = {
  loadingModule: "Загрузка модуля аудирования...",
  redirecting: "Перенаправление...",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {
    en: baseEnTranslations,
    ru: baseRuTranslations,
  };
  interfaceLanguageCodes.forEach(code => {
    if (!translations[code]) { 
      translations[code] = { ...baseEnTranslations }; 
    }
  });
  return translations;
};

const pageTranslations = generateTranslations();

export default function ListeningPage() {
  const { userData, isLoading: isUserDataLoading } = useUserData(); 
  const router = useRouter();

  useEffect(() => {
    if (!isUserDataLoading && userData.settings === null) {
      router.replace('/');
    }
  }, [userData, isUserDataLoading, router]); 

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const tPage = (key: string, defaultText?: string): string => {
    const langTranslations = pageTranslations[currentLang as keyof typeof pageTranslations];
    return langTranslations?.[key] || pageTranslations['en']?.[key] || defaultText || key;
  };

  if (isUserDataLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={32} />
          <p className="ml-2">{tPage('loadingModule')}</p>
        </div>
      </AppShell>
    );
  }

  if (userData.settings === null) {
     return (
      <AppShell>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">{tPage('redirecting')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ListeningModuleClient />
    </AppShell>
  );
}
