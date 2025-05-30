
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ReadingModuleClient } from "@/components/learn/ReadingModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';
import { interfaceLanguageCodes, type InterfaceLanguage } from "@/lib/types";


const baseEnTranslations = {
  loadingModule: "Loading reading module...",
  redirecting: "Redirecting...",
};

const baseRuTranslations = {
  loadingModule: "Загрузка модуля чтения...",
  redirecting: "Перенаправление...",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {};
  interfaceLanguageCodes.forEach(code => {
    if (code === 'ru') {
      translations[code] = { ...baseEnTranslations, ...baseRuTranslations };
    } else {
      translations[code] = { ...baseEnTranslations };
    }
  });
  return translations;
};

const pageTranslations = generateTranslations();


export default function ReadingPage() {
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
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = pageTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key]; 
    }
    return defaultText || key; 
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
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">{tPage('redirecting')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ReadingModuleClient />
    </AppShell>
  );
}
