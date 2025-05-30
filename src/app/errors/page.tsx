
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserData } from "@/contexts/UserDataContext";
import { interfaceLanguageCodes } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Archive, CalendarDays, BookOpen, Target, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from 'date-fns';
import { enUS, ru } from 'date-fns/locale'; // Import locales

const baseEnTranslations = {
  title: "Your Error Archive",
  description: "Review your past mistakes to learn and improve. Click on an error for more details (future feature).",
  loading: "Loading error archive...",
  noErrors: "Your error archive is empty for now. Keep practicing!",
  errorDate: "Date",
  errorModule: "Module",
  errorContext: "Context",
  errorUserAttempt: "Your Attempt",
  errorCorrectAnswer: "Correct Answer",
};

const baseRuTranslations = {
  title: "Архив ваших ошибок",
  description: "Просматривайте свои прошлые ошибки, чтобы учиться и совершенствоваться. Нажмите на ошибку для получения подробной информации (будущая функция).",
  loading: "Загрузка архива ошибок...",
  noErrors: "Ваш архив ошибок пока пуст. Продолжайте практиковаться!",
  errorDate: "Дата",
  errorModule: "Модуль",
  errorContext: "Контекст",
  errorUserAttempt: "Ваш ответ",
  errorCorrectAnswer: "Правильный ответ",
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

export default function ErrorArchivePage() {
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

  const getDateLocale = () => {
    if (currentLang === 'ru') return ru;
    return enUS;
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

  const errorArchive = userData.progress?.errorArchive || [];

  return (
    <AppShell>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Card className="w-full shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <Archive className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorArchive.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/30 rounded-md">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('noErrors')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {errorArchive.slice().reverse().map((error) => ( // Show newest errors first
                  <Card key={error.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <h3 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary/80" />
                        {error.module}
                      </h3>
                      <CardDescription className="text-xs flex items-center gap-1 text-muted-foreground pt-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(new Date(error.date), 'PPP p', { locale: getDateLocale() })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3 pt-2">
                      {error.context && (
                        <div className="space-y-1">
                          <p className="font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Target className="h-4 w-4" />
                            {t('errorContext')}:
                          </p>
                          <p className="italic bg-muted/20 p-2 rounded-sm ml-5">{error.context}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="font-semibold text-muted-foreground flex items-center gap-1.5">
                           <UserCheck className="h-4 w-4" />
                           {t('errorUserAttempt')}:
                        </p>
                        <p className="text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded-sm ml-5">{error.userAttempt}</p>
                      </div>
                      {error.correctAnswer && (
                        <div className="space-y-1">
                          <p className="font-semibold text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            {t('errorCorrectAnswer')}:
                          </p>
                          <p className="text-green-600 dark:text-green-400 bg-green-500/10 p-2 rounded-sm ml-5">{error.correctAnswer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
