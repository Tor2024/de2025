
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SpeakingModuleClient } from "@/components/learn/SpeakingModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';
import { interfaceLanguageCodes } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MicOff } from "lucide-react";

const baseEnTranslations = {
  loadingModule: "Loading speaking module...",
  redirecting: "Redirecting...",
  moduleDisabledTitle: "Speaking Module Disabled",
  moduleDisabledDescription: "This module has been disabled to simplify the application.",
};

const baseRuTranslations = {
  loadingModule: "Загрузка модуля говорения...",
  redirecting: "Перенаправление...",
  moduleDisabledTitle: "Модуль говорения отключен",
  moduleDisabledDescription: "Этот модуль был отключен для упрощения приложения.",
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

export default function SpeakingPage() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = pageTranslations[currentLang as keyof typeof pageTranslations];
    return langTranslations?.[key] || pageTranslations['en']?.[key] || defaultText || key;
  };

  useEffect(() => {
    if (!isUserDataLoading && !userData.settings) {
      router.replace('/');
    }
  }, [userData, isUserDataLoading, router]);

  if (isUserDataLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loadingModule')}</p>
        </div>
      </AppShell>
    );
  }

  return (
     <AppShell>
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Card className="w-full max-w-lg text-center p-6 shadow-xl bg-gradient-to-br from-card via-card to-destructive/5 border border-destructive/20">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
              <MicOff className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="mt-4 text-2xl">{t('moduleDisabledTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {t('moduleDisabledDescription')}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
