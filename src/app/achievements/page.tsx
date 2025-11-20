
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { interfaceLanguageCodes } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const baseEnTranslations = {
  title: "Achievements",
  description: "This section is currently under construction as we simplify the app.",
  loading: "Loading page...",
};

const baseRuTranslations = {
  title: "Достижения",
  description: "Этот раздел находится на реконструкции в рамках упрощения приложения.",
  loading: "Загрузка страницы...",
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

export default function AchievementsPage() {
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
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Card className="w-full max-w-lg text-center p-6 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <Award className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
