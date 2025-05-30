
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { AppShell } from '@/components/layout/AppShell';
import { RoadmapDisplay } from '@/components/dashboard/RoadmapDisplay';
import { GoalTracker } from '@/components/dashboard/GoalTracker';
import { ModuleLinkCard } from '@/components/dashboard/ModuleLinkCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BookOpen, Edit3, Headphones, Mic, FileText, Repeat, BarChart3, Award, Settings, Bot, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supportedLanguages, type InterfaceLanguage, interfaceLanguageCodes, proficiencyLevels, type TargetLanguage, type ProficiencyLevel } from '@/lib/types';
import * as React from 'react';
import { generateTutorTip } from '@/ai/flows/generate-tutor-tip-flow'; 
import { useToast } from "@/hooks/use-toast";


const learningModules = [
  { titleKey: "grammar", defaultTitle: "Grammar", descriptionKey: "grammarDescription", defaultDescription: "Master sentence structures.", href: "/learn/grammar", icon: BookOpen, disabled: false },
  { titleKey: "writingAssistant", defaultTitle: "Writing Assistant", descriptionKey: "writingAssistantDescription", defaultDescription: "Get feedback on your texts.", href: "/learn/writing", icon: Edit3, disabled: false },
  { titleKey: "vocabulary", defaultTitle: "Vocabulary", descriptionKey: "vocabularyDescription", defaultDescription: "Expand your word bank.", href: "/learn/vocabulary", icon: FileText, disabled: false },
  { titleKey: "reading", defaultTitle: "Reading", descriptionKey: "readingDescription", defaultDescription: "Understand written texts.", href: "/learn/reading", icon: BookOpen, disabled: false },
  { titleKey: "listening", defaultTitle: "Listening", descriptionKey: "listeningDescription", defaultDescription: "Sharpen your comprehension.", href: "/learn/listening", icon: Headphones, disabled: false },
  { titleKey: "speaking", defaultTitle: "Speaking", descriptionKey: "speakingDescription", defaultDescription: "Practice your pronunciation.", href: "/learn/speaking", icon: Mic, disabled: true },
  { titleKey: "wordPractice", defaultTitle: "Word Practice", descriptionKey: "wordPracticeDescription", defaultDescription: "Reinforce with fun drills.", href: "/learn/practice", icon: Repeat, disabled: true },
];

const baseEnTranslations: Record<string, string> = {
    loadingUserData: "Loading user data...",
    redirecting: "Redirecting...",
    exploreLearningModules: "Explore Learning Modules",
    progressOverview: "Progress Overview",
    achievements: "Achievements",
    quickSettings: "Quick Settings",
    aiTutorTipsTitle: "AI Tutor Tips",
    aiTutorTipStatic: "Remember to review your mistakes in the Error Archive. Consistent practice is key!",
    aiTutorTipLoading: "Generating a fresh tip for you...",
    aiTutorTipErrorTitle: "AI Tip Error",
    aiTutorTipErrorDescription: "Could not load a new tip from the AI tutor at this time.",
    xp: "XP",
    streak: "Streak",
    days: "days",
    badges: "Badges",
    noneYet: "None yet",
    interface: "Interface",
    learning: "Learning",
    goToSettings: "Go to Settings",
    viewFullProgress: "View Full Progress",
    viewAllAchievements: "View All Achievements",
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
    yourGoalPrefix: "Your Goal:",
    noGoalSet: "No goal set.",
    progressLabel: "Progress",
    progressMessage: "You're {value}% closer to achieving your goal! Keep it up!",
    roadmapTitle: "Your Learning Roadmap",
    roadmapDescription: "Follow this structured plan to achieve your language goals. All instructions and descriptions are in your chosen interface language.",
    roadmapLoadingTitle: "Learning Roadmap",
    roadmapLoadingDescription: "Your personalized learning plan is being prepared, not yet available, or is empty.",
    roadmapLoadingContent: "If you've just completed onboarding, it might take a moment for the AI to generate your plan. Otherwise, please check your settings or try generating it again if an option is available.",
    roadmapIntroduction: "Introduction",
    roadmapTopicsToCover: "Topics to Cover:",
    roadmapEstimatedDuration: "Estimated duration:",
    roadmapConclusion: "Conclusion",
    ttsPlayText: "Play description",
    ttsStopText: "Stop speech",
    ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
    startLearningButton: "Start Learning",
    comingSoonButton: "Coming Soon",
};

const baseRuTranslations: Record<string, string> = {
    loadingUserData: "Загрузка данных пользователя...",
    redirecting: "Перенаправление...",
    exploreLearningModules: "Исследуйте учебные модули",
    progressOverview: "Обзор прогресса",
    achievements: "Достижения",
    quickSettings: "Быстрые настройки",
    aiTutorTipsTitle: "Советы от AI-Репетитора",
    aiTutorTipStatic: "Не забывайте просматривать свои ошибки в Архиве ошибок. Постоянная практика — ключ к успеху!",
    aiTutorTipLoading: "Генерирую свежий совет для вас...",
    aiTutorTipErrorTitle: "Ошибка совета ИИ",
    aiTutorTipErrorDescription: "В данный момент не удалось загрузить новый совет от AI-репетитора.",
    xp: "ОП",
    streak: "Серия",
    days: "дней",
    badges: "Значки",
    noneYet: "Пока нет",
    interface: "Интерфейс",
    learning: "Изучение",
    goToSettings: "Перейти к настройкам",
    viewFullProgress: "Посмотреть весь прогресс",
    viewAllAchievements: "Посмотреть все достижения",
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
    yourGoalPrefix: "Ваша цель:",
    noGoalSet: "Цель не установлена.",
    progressLabel: "Прогресс",
    progressMessage: "Вы на {value}% ближе к достижению цели! Продолжайте в том же духе!",
    roadmapTitle: "Ваш учебный план",
    roadmapDescription: "Следуйте этому структурированному плану для достижения ваших языковых целей. Все инструкции и описания на выбранном вами языке интерфейса.",
    roadmapLoadingTitle: "Учебный план",
    roadmapLoadingDescription: "Ваш персональный учебный план готовится, еще не доступен или пуст.",
    roadmapLoadingContent: "Если вы только что завершили первоначальную настройку, ИИ может потребоваться некоторое время для генерации вашего плана. В противном случае, пожалуйста, проверьте настройки или попробуйте сгенерировать его снова, если такая опция доступна.",
    roadmapIntroduction: "Введение",
    roadmapTopicsToCover: "Темы для изучения:",
    roadmapEstimatedDuration: "Предполагаемая длительность:",
    roadmapConclusion: "Заключение",
    ttsPlayText: "Озвучить описание",
    ttsStopText: "Остановить озвучку",
    ttsExperimentalText: "Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
    startLearningButton: "Начать обучение",
    comingSoonButton: "Скоро",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {};
  interfaceLanguageCodes.forEach(code => {
    let base = baseEnTranslations;
    if (code === 'ru') base = { ...baseEnTranslations, ...baseRuTranslations };
    translations[code] = base;
  });
  return translations;
};

const pageTranslations = generateTranslations();


export default function DashboardPage() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();
  const [aiTutorTip, setAiTutorTip] = useState<string | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    if (!isUserDataLoading && userData.settings === null) {
      router.replace('/');
    }
  }, [userData, isUserDataLoading, router]);

  useEffect(() => {
    if (!isUserDataLoading && userData.settings) {
      setIsTipLoading(true);
      generateTutorTip({
        interfaceLanguage: userData.settings.interfaceLanguage as InterfaceLanguage,
        targetLanguage: userData.settings.targetLanguage as TargetLanguage,
        proficiencyLevel: userData.settings.proficiencyLevel as ProficiencyLevel,
      })
      .then(response => {
        setAiTutorTip(response.tip);
      })
      .catch(error => {
        console.error("Failed to generate tutor tip:", error);
        setAiTutorTip(t('aiTutorTipStatic')); 
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
            title: t('aiTutorTipErrorTitle'),
            description: `${t('aiTutorTipErrorDescription')} ${errorMessage ? `(${errorMessage})` : ''}`,
            variant: "destructive",
        });
      })
      .finally(() => {
        setIsTipLoading(false);
      });
    }
  }, [isUserDataLoading, userData.settings, currentLang, t, toast]); 
  
  if (isUserDataLoading) {
    return (
      <AppShell>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">{t('loadingUserData')}</p>
        </div>
      </AppShell>
    );
  }

  if (userData.settings === null) {
    return (
       <AppShell>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">{t('redirecting')}</p>
        </div>
      </AppShell>
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

  const targetLanguageDisplayName = getLanguageDisplayName(userData.settings.targetLanguage, 'target');
  const userGoalText = userData.settings.goal || t('noGoalSet');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3">
            <RoadmapDisplay
              titleText={t('roadmapTitle')}
              descriptionText={t('roadmapDescription')}
              loadingTitleText={t('roadmapLoadingTitle')}
              loadingDescriptionText={t('roadmapLoadingDescription')}
              loadingContentText={t('roadmapLoadingContent')}
              introductionHeaderText={t('roadmapIntroduction')}
              topicsToCoverText={t('roadmapTopicsToCover')}
              estimatedDurationText={t('roadmapEstimatedDuration')}
              conclusionHeaderText={t('roadmapConclusion')}
              ttsPlayText={t('ttsPlayText')}
              ttsStopText={t('ttsStopText')}
              ttsExperimentalText={t('ttsExperimentalText')}
            />
          </div>
          <div className="md:w-1/3 space-y-6">
            <GoalTracker
              titlePrefix={t('yourGoalPrefix')}
              targetLanguageDisplayName={targetLanguageDisplayName}
              goalText={userGoalText}
              progressLabelText={t('progressLabel')}
              progressMessageTextTemplate={t('progressMessage')}
            />
            <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/>{t('aiTutorTipsTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isTipLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoadingSpinner size={16}/> {t('aiTutorTipLoading')}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{aiTutorTip || t('aiTutorTipStatic')}</p>
                )}
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
                startLearningButtonText={t('startLearningButton', 'Start Learning')}
                comingSoonButtonText={t('comingSoonButton', 'Coming Soon')}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/>{t('progressOverview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('xp')}: {userData.progress?.xp || 0}</p>
                <p className="text-sm text-muted-foreground">{t('streak')}: {userData.progress?.streak || 0} {t('days')}</p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push('/progress')}>
                  {t('viewFullProgress')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="text-primary"/>{t('achievements')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <p className="text-sm text-muted-foreground">{t('badges')}: {(userData.progress?.badges || []).join(', ') || t('noneYet')}</p>
                 <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push('/achievements')}>
                   {t('viewAllAchievements')} <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="text-primary"/>{t('quickSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('interface')}: {getLanguageDisplayName(userData.settings.interfaceLanguage, 'interface')}</p>
                <p className="text-sm text-muted-foreground">{t('learning')}: {getLanguageDisplayName(userData.settings.targetLanguage, 'target')}</p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push('/settings')}>
                  {t('goToSettings')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
        </div>

      </div>
    </AppShell>
  );
}
