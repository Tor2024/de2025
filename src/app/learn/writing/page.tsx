
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { WritingAssistantClient } from "@/components/learn/WritingAssistantClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';
import { interfaceLanguageCodes, type InterfaceLanguage } from "@/lib/types";

const baseEnTranslations = {
  loadingModule: "Loading writing assistance module...",
  redirecting: "Redirecting...",
};

const baseRuTranslations = {
  loadingModule: "Загрузка модуля помощи в письме...",
  redirecting: "Перенаправление...",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {
    en: baseEnTranslations,
    ru: baseRuTranslations,
  };
  interfaceLanguageCodes.forEach(code => {
    if (code !== 'en' && code !== 'ru') {
      translations[code] = { ...baseEnTranslations }; 
    }
  });
  return translations;
};

const pageTranslations = generateTranslations();

export default function WritingPage() {
  const { userData, isLoading: isUserDataContextLoading } = useUserData(); 
  const router = useRouter();

  useEffect(() => {
    if (!isUserDataContextLoading && userData.settings === null) {
      router.replace('/');
    }
  }, [userData, isUserDataContextLoading, router]); 

  const currentLang = isUserDataContextLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
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
      <WritingAssistantClient />
    </AppShell>
  );
}
