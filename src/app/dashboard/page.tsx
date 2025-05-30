
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { AppShell } from '@/components/layout/AppShell';
import { RoadmapDisplay } from '@/components/dashboard/RoadmapDisplay';
import { GoalTracker } from '@/components/dashboard/GoalTracker';
import { ModuleLinkCard } from '@/components/dashboard/ModuleLinkCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BookOpen, Edit3, Headphones, Mic, FileText, Repeat, BarChart3, Award, Settings, Bot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supportedLanguages, type InterfaceLanguage } from '@/lib/types';
import * as React from 'react';

const learningModules = [
  { titleKey: "grammar", defaultTitle: "Grammar", descriptionKey: "grammarDescription", defaultDescription: "Master sentence structures.", href: "/learn/grammar", icon: BookOpen },
  { titleKey: "writingAssistant", defaultTitle: "Writing Assistant", descriptionKey: "writingAssistantDescription", defaultDescription: "Get feedback on your texts.", href: "/learn/writing", icon: Edit3 },
  { titleKey: "vocabulary", defaultTitle: "Vocabulary", descriptionKey: "vocabularyDescription", defaultDescription: "Expand your word bank.", href: "/learn/vocabulary", icon: FileText, disabled: true },
  { titleKey: "listening", defaultTitle: "Listening", descriptionKey: "listeningDescription", defaultDescription: "Sharpen your comprehension.", href: "/learn/listening", icon: Headphones, disabled: true },
  { titleKey: "reading", defaultTitle: "Reading", descriptionKey: "readingDescription", defaultDescription: "Understand written texts.", href: "/learn/reading", icon: BookOpen, disabled: true },
  { titleKey: "speaking", defaultTitle: "Speaking", descriptionKey: "speakingDescription", defaultDescription: "Practice your pronunciation.", href: "/learn/speaking", icon: Mic, disabled: true },
  { titleKey: "wordPractice", defaultTitle: "Word Practice", descriptionKey: "wordPracticeDescription", defaultDescription: "Reinforce with fun drills.", href: "/learn/practice", icon: Repeat, disabled: true },
];

const translations: Record<string, Record<string, string>> = {
  en: {
    loadingUserData: "Loading user data...",
    redirecting: "Redirecting...",
    exploreLearningModules: "Explore Learning Modules",
    progressOverview: "Progress Overview",
    achievements: "Achievements",
    quickSettings: "Quick Settings",
    aiTutorTip: "Remember to review your mistakes in the Error Archive. Consistent practice is key!",
    xp: "XP",
    streak: "Streak",
    days: "days",
    detailedCefrProgress: "Detailed CEFR progress tree coming soon!",
    badges: "Badges",
    noneYet: "None yet",
    unlockBadges: "Unlock badges as you learn!",
    interface: "Interface",
    learning: "Learning",
    goToSettings: "Go to Settings",
    grammar: "Grammar",
    grammarDescription: "Master sentence structures.",
    writingAssistant: "Writing Assistant",
    writingAssistantDescription: "Get feedback on your texts.",
    vocabulary: "Vocabulary",
    vocabularyDescription: "Expand your word bank.",
    listening: "Listening",
    listeningDescription: "Sharpen your comprehension.",
    reading: "Reading",
    readingDescription: "Understand written texts.",
    speaking: "Speaking",
    speakingDescription: "Practice your pronunciation.",
    wordPractice: "Word Practice",
    wordPracticeDescription: "Reinforce with fun drills.",
    aiTutorTipsTitle: "AI Tutor Tips",
  },
  ru: {
    loadingUserData: "Загрузка данных пользователя...",
    redirecting: "Перенаправление...",
    exploreLearningModules: "Исследуйте учебные модули",
    progressOverview: "Обзор прогресса",
    achievements: "Достижения",
    quickSettings: "Быстрые настройки",
    aiTutorTip: "Не забывайте просматривать свои ошибки в Архиве ошибок. Постоянная практика — ключ к успеху!",
    xp: "ОП",
    streak: "Серия",
    days: "дней",
    detailedCefrProgress: "Подробное дерево прогресса CEFR скоро появится!",
    badges: "Значки",
    noneYet: "Пока нет",
    unlockBadges: "Открывайте значки по мере обучения!",
    interface: "Интерфейс",
    learning: "Изучение",
    goToSettings: "Перейти к настройкам",
    grammar: "Грамматика",
    grammarDescription: "Освойте структуры предложений.",
    writingAssistant: "Помощник по письму",
    writingAssistantDescription: "Получайте обратную связь по вашим текстам.",
    vocabulary: "Словарный запас",
    vocabularyDescription: "Расширяйте свой словарный банк.",
    listening: "Аудирование",
    listeningDescription: "Оттачивайте понимание на слух.",
    reading: "Чтение",
    readingDescription: "Понимайте письменные тексты.",
    speaking: "Говорение",
    speakingDescription: "Практикуйте произношение.",
    wordPractice: "Практика слов",
    wordPracticeDescription: "Закрепляйте знания с помощью увлекательных упражнений.",
    aiTutorTipsTitle: "Советы от AI-Репетитора",
  },
  // Add other languages as needed
};

export default function DashboardPage() {
  const { userData, isLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && userData.settings === null) {
      router.replace('/');
    }
  }, [userData, isLoading, router]);

  const currentLang = userData.settings?.interfaceLanguage || 'en';
  const t = (key: string, defaultText?: string) => {
    return translations[currentLang]?.[key] || translations['en']?.[key] || defaultText || key;
  };
  
  const getLoadingMessage = (lang?: InterfaceLanguage) => {
    return t('loadingUserData', 'Loading user data...');
  };

  const getRedirectingMessage = (lang?: InterfaceLanguage) => {
     return t('redirecting', 'Redirecting...');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{getLoadingMessage(userData.settings?.interfaceLanguage)}</p>
      </div>
    );
  }

  if (userData.settings === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">{getRedirectingMessage(userData.settings?.interfaceLanguage)}</p>
      </div>
    );
  }

  const getLanguageDisplayName = (codeOrName: string | undefined, type: 'interface' | 'target'): string => {
    if (!codeOrName) return 'N/A';
    if (type === 'interface') {
      const lang = supportedLanguages.find(l => l.code === codeOrName);
      return lang ? `${lang.nativeName} (${lang.name})` : codeOrName;
    }
    const lang = supportedLanguages.find(l => l.name === codeOrName);
    return lang ? `${lang.nativeName} (${lang.name})` : codeOrName;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3">
            <RoadmapDisplay />
          </div>
          <div className="md:w-1/3 space-y-6">
            <GoalTracker />
            <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/>{t('aiTutorTipsTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('aiTutorTip')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">{t('exploreLearningModules')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningModules.map((mod) => (
              <ModuleLinkCard
                key={mod.titleKey}
                title={t(mod.titleKey, mod.defaultTitle)}
                description={t(mod.descriptionKey, mod.defaultDescription)}
                href={mod.href}
                icon={mod.icon}
                disabled={mod.disabled}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/>{t('progressOverview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('xp')}: {userData.progress?.xp || 0}</p>
                <p className="text-sm text-muted-foreground">{t('streak')}: {userData.progress?.streak || 0} {t('days')}</p>
                <p className="text-sm mt-2 italic">{t('detailedCefrProgress')}</p>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="text-primary"/>{t('achievements')}</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground">{t('badges')}: {(userData.progress?.badges || []).join(', ') || t('noneYet')}</p>
                 <p className="text-sm mt-2 italic">{t('unlockBadges')}</p>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="text-primary"/>{t('quickSettings')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('interface')}: {getLanguageDisplayName(userData.settings.interfaceLanguage, 'interface')}</p>
                <p className="text-sm text-muted-foreground">{t('learning')}: {getLanguageDisplayName(userData.settings.targetLanguage, 'target')}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/settings')}>{t('goToSettings')}</Button>
              </CardContent>
            </Card>
        </div>

      </div>
    </AppShell>
  );
}
