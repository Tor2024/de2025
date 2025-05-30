
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Activity } from "lucide-react"; // Added more icons
import { useUserData } from "@/contexts/UserDataContext";
import { interfaceLanguageCodes } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const baseEnTranslations = {
  title: "Your Progress Overview",
  description: "Detailed progress tracking, including a personalized CEFR tree, error archive, and custom review modes, will be available here soon.",
  loading: "Loading progress...",
  currentXPLabel: "Current XP:",
  currentStreakLabel: "Streak:",
  days: "days",
  quickStats: "Quick Stats",
  roadmapProgressTitle: "Roadmap Progress",
  roadmapProgressDesc: "Track your journey through the CEFR levels and completed lessons. (Coming Soon)",
  errorArchiveTitle: "Error Insights",
  errorArchiveDesc: "Review common mistakes and focus areas for improvement. (Coming Soon)",
};

const baseRuTranslations = {
  title: "Обзор вашего прогресса",
  description: "Подробное отслеживание прогресса, включая персонализированное дерево CEFR, архив ошибок и настраиваемые режимы повторения, скоро будут доступны здесь.",
  loading: "Загрузка прогресса...",
  currentXPLabel: "Текущие XP:",
  currentStreakLabel: "Серия:",
  days: "дней",
  quickStats: "Быстрая статистика",
  roadmapProgressTitle: "Прогресс по плану",
  roadmapProgressDesc: "Отслеживайте свой путь по уровням CEFR и выполненным урокам. (Скоро)",
  errorArchiveTitle: "Анализ ошибок",
  errorArchiveDesc: "Просматривайте частые ошибки и области для улучшения. (Скоро)",
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

export default function ProgressPage() {
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
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Card className="w-full shadow-xl border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center"><Activity className="mr-2 h-5 w-5 text-accent"/>{t('quickStats')}</h3>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                <p><strong>{t('currentXPLabel')}</strong> {userData.progress?.xp || 0}</p>
                <p><strong>{t('currentStreakLabel')}</strong> {userData.progress?.streak || 0} {t('days')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-accent"/>{t('roadmapProgressTitle')}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('roadmapProgressDesc')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-accent"/>{t('errorArchiveTitle')}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('errorArchiveDesc')}</p>
              </CardContent>
            </Card>

            <p className="text-center text-muted-foreground pt-4">{t('description')}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
