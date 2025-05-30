
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Repeat } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { interfaceLanguageCodes } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const baseEnTranslations = {
  title: "Word Practice Module",
  description: "Reinforce your vocabulary with spaced repetition (SRS), word games, and mini-challenges, all adapted to your current learning level. This feature is planned for a future update!",
  loading: "Loading word practice module...",
};

const baseRuTranslations = {
  title: "Модуль Практики Слов",
  description: "Закрепляйте словарный запас с помощью интервального повторения (SRS), словесных игр и мини-заданий, адаптированных к вашему текущему уровню обучения. Эта функция запланирована на будущее обновление!",
  loading: "Загрузка модуля практики слов...",
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

export default function WordPracticePage() {
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
        <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 lg:p-8">
        <Card className="w-full max-w-md text-center shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader>
             <CardTitle className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
              <Repeat className="h-8 w-8 text-primary" />
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
