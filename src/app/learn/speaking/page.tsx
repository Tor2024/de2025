
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { interfaceLanguageCodes } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const baseEnTranslations = {
  title: "Speaking Module",
  description: "Practice your pronunciation with microphone input, voice recognition, and AI-powered correction tips, all adapted to your current proficiency level. Coming soon!",
  loading: "Loading speaking module...",
};

const baseRuTranslations = {
  title: "Модуль Говорения",
  description: "Практикуйте произношение с помощью микрофона, распознавания голоса и советов по исправлению от ИИ, адаптированных к вашему текущему уровню владения языком. Скоро!",
  loading: "Загрузка модуля говорения...",
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

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
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
          <p className="ml-2">{t('loading')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
              <Mic className="h-8 w-8 text-primary" />
              {t('title')}
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              {t('description')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppShell>
  );
}
