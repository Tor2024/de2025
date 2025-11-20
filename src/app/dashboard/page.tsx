
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { AppShell } from '@/components/layout/AppShell';
import { RoadmapDisplay } from '@/components/dashboard/RoadmapDisplay';
import { GoalTracker } from '@/components/dashboard/GoalTracker';
import { ModuleLinkCard } from '@/components/dashboard/ModuleLinkCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LayoutGrid, BarChart3, Settings, ArrowRight, Languages, GraduationCap, Flag, Archive } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supportedLanguages, type InterfaceLanguage, interfaceLanguageCodes } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { appModulesConfig } from "@/lib/modulesConfig";

const baseEnTranslations: Record<string, string> = {
    loadingUserData: "Loading user data...",
    redirecting: "Redirecting...",
    exploreLearningModules: "Explore Learning Modules",
    progressOverview: "Progress Overview",
    errorArchive: "Error Archive",
    quickSettings: "Quick Settings",
    lessonsCompleted: "Lessons Completed",
    interface: "Interface",
    learning: "Learning",
    proficiencyLabel: "Proficiency:",
    currentGoalLabel: "Current Goal:",
    goToSettings: "Go to Settings",
    viewFullProgress: "View Full Progress",
    viewErrorArchive: "View Error Archive",
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
    wordPractice: "Word Practice",
    wordPracticeDescription: "Reinforce with fun drills.",
    yourGoalPrefix: "Your Goal:",
    noGoalSet: "No goal set.",
    progressLabel: "Progress",
    progressMessageTextTemplate: "You're {value}% closer to achieving your goal! Keep it up!",
    roadmapTitle: "Your Learning Roadmap",
    roadmapDescription: "Follow this structured plan to achieve your language goals. All instructions and descriptions are in your chosen interface language.",
    roadmapLoadingTitle: "Learning Roadmap",
    roadmapLoadingDescription: "Your personalized learning plan is being prepared, not yet available, or is empty.",
    roadmapLoadingContent: "If you've just completed onboarding, it might take a moment for the AI to generate your plan. Otherwise, please check your settings or try generating it again if an option is available.",
    roadmapIntroduction: "Introduction",
    roadmapTopicsToCoverText: "Topics to Cover:",
    roadmapEstimatedDurationText: "Estimated duration:",
    roadmapConclusion: "Conclusion",
    markCompleteTooltip: "Mark as complete",
    markIncompleteTooltip: "Mark as incomplete",
    startLearningButton: "Start Learning",
    comingSoonButton: "Coming Soon",
    tooltipInterfaceLanguage: "Interface Language",
    tooltipTargetLanguage: "Target Language",
    tooltipProficiency: "Proficiency Level",
    tooltipGoal: "Current Goal",
    ttsPlayText: "Play description",
    ttsStopText: "Stop speech",
    ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
    ttsNotSupportedTitle: "TTS Not Supported",
    ttsNotSupportedDescription: "Text-to-Speech is not supported by your browser.",
    ttsUtteranceErrorTitle: "Speech Error",
    ttsUtteranceErrorDescription: "Could not play audio for the current text segment.",
    lessonMarkedCompleteToastTitle: "Lesson Complete!",
    lessonMarkedCompleteToastDescription: "Lesson '{lessonTitle}' marked as complete.",
    lessonMarkedIncompleteToastTitle: "Lesson Status Updated",
    lessonMarkedIncompleteToastDescription: "Lesson '{lessonTitle}' marked as incomplete.",
};

const baseRuTranslations: Record<string, string> = {
    loadingUserData: "Загрузка данных пользователя...",
    redirecting: "Перенаправление...",
    exploreLearningModules: "Исследуйте учебные модули",
    progressOverview: "Обзор прогресса",
    errorArchive: "Архив ошибок",
    quickSettings: "Быстрые настройки",
    lessonsCompleted: "Завершено уроков",
    interface: "Интерфейс",
    learning: "Изучение",
    proficiencyLabel: "Уровень:",
    currentGoalLabel: "Текущая цель:",
    goToSettings: "Перейти к настройкам",
    viewFullProgress: "Посмотреть весь прогресс",
    viewErrorArchive: "Перейти в архив ошибок",
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
    wordPractice: "Практика слов",
    wordPracticeDescription: "Закрепляйте знания с помощью увлекательных упражнений.",
    yourGoalPrefix: "Ваша цель:",
    noGoalSet: "Цель не установлена.",
    progressLabel: "Прогресс",
    progressMessageTextTemplate: "Вы на {value}% ближе к достижению цели! Продолжайте в том же духе!",
    roadmapTitle: "Ваш учебный план",
    roadmapDescription: "Следуйте этому структурированному плану для достижения ваших языковых целей. Все инструкции и описания на выбранном вами языке интерфейса.",
    roadmapLoadingTitle: "Учебный план",
    roadmapLoadingDescription: "Ваш персональный учебный план готовится, еще не доступен или пуст.",
    roadmapLoadingContent: "Если вы только что завершили первоначальную настройку, ИИ может потребоваться некоторое время для генерации вашего плана. В противном случае, пожалуйста, проверьте настройки или попробуйте сгенерировать его снова, если такая опция доступна.",
    roadmapIntroduction: "Введение",
    roadmapTopicsToCoverText: "Темы для изучения:",
    roadmapEstimatedDurationText: "Предполагаемая длительность:",
    roadmapConclusion: "Заключение",
    markCompleteTooltip: "Отметить как пройденный",
    markIncompleteTooltip: "Отметить как не пройденный",
    startLearningButton: "Начать обучение",
    comingSoonButton: "Скоро",
    tooltipInterfaceLanguage: "Язык интерфейса",
    tooltipTargetLanguage: "Изучаемый язык",
    tooltipProficiency: "Уровень владения",
    tooltipGoal: "Текущая цель",
    ttsPlayText: "Озвучить описание",
    ttsStopText: "Остановить озвучку",
    ttsExperimentalText: "Текст в речь (TTS) экспериментальный. Голос и поддержка языка зависят от вашего браузера/ОС.",
    ttsNotSupportedTitle: "TTS не поддерживается",
    ttsNotSupportedDescription: "Функция озвучивания текста не поддерживается вашим браузером.",
    ttsUtteranceErrorTitle: "Ошибка синтеза речи",
    ttsUtteranceErrorDescription: "Не удалось воспроизвести аудио для текущего фрагмента текста.",
    lessonMarkedCompleteToastTitle: "Урок завершен!",
    lessonMarkedCompleteToastDescription: "Урок '{lessonTitle}' отмечен как пройденный.",
    lessonMarkedIncompleteToastTitle: "Статус урока обновлен",
    lessonMarkedIncompleteToastDescription: "Урок '{lessonTitle}' отмечен как не пройденный.",
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

export default function DashboardPage() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();
  const { toast } = useToast();
  const roadmapDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserDataLoading && !userData.settings) {
      router.replace('/');
    }
  }, [isUserDataLoading, userData.settings, router]);


  const currentLang = isUserDataLoading || !userData.settings ? 'en' : (userData.settings.interfaceLanguage);
  const t = useCallback((key: string, defaultText?: string, params?: Record<string, string>): string => {
    const langTranslations = pageTranslations[currentLang as keyof typeof pageTranslations];
    let textToReturn = defaultText || key;

    if (langTranslations && langTranslations[key]) {
      textToReturn = langTranslations[key];
    } else {
      const enTranslations = pageTranslations['en'];
      if (enTranslations && enTranslations[key]) {
        textToReturn = enTranslations[key];
      }
    }
    
    if (params) {
        Object.keys(params).forEach(paramKey => {
            textToReturn = textToReturn.replace(`{${paramKey}}`, params[paramKey]);
        });
    }
    return textToReturn;
  }, [currentLang]);

  if (isUserDataLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">{t('loadingUserData')}</p>
        </div>
      </AppShell>
    );
  }

  if (!userData.settings) {
    return (
       <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">{t('redirecting')}</p>
        </div>
      </AppShell>
    );
  }

  const getLanguageDisplayName = (codeOrName: string | undefined, type: 'interface' | 'target'): string => {
    if (!codeOrName) return 'N/A';
    const langObj = supportedLanguages.find(l => (type === 'interface' ? l.code === codeOrName : l.name === codeOrName));
    return langObj ? `${langObj.nativeName} (${langObj.name})` : codeOrName;
  };

  const targetLanguageDisplayName = getLanguageDisplayName(userData.settings.targetLanguage, 'target');
  const userGoalText = (Array.isArray(userData.settings.goal) ? userData.settings.goal[0] : userData.settings.goal) || t('noGoalSet');

  const completedLessons = userData.progress.completedLessonIds?.length || 0;
  const totalLessons = userData.progress.learningRoadmap?.lessons?.length || 0;

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3" ref={roadmapDisplayRef}>
            <RoadmapDisplay
              titleText={t('roadmapTitle')}
              descriptionText={t('roadmapDescription')}
              loadingTitleText={t('roadmapLoadingTitle')}
              loadingDescriptionText={t('roadmapLoadingDescription')}
              loadingContentText={t('roadmapLoadingContent')}
              introductionHeaderText={t('roadmapIntroduction')}
              topicsToCoverText={t('roadmapTopicsToCoverText')}
              estimatedDurationText={t('roadmapEstimatedDurationText')}
              conclusionHeaderText={t('roadmapConclusion')}
              markCompleteTooltip={t('markCompleteTooltip')}
              markIncompleteTooltip={t('markIncompleteTooltip')}
              ttsPlayText={t('ttsPlayText')}
              ttsStopText={t('ttsStopText')}
              ttsExperimentalText={t('ttsExperimentalText')}
              ttsNotSupportedTitle={t('ttsNotSupportedTitle')}
              ttsNotSupportedDescription={t('ttsNotSupportedDescription')}
              ttsUtteranceErrorTitle={t('ttsUtteranceErrorTitle')}
              ttsUtteranceErrorDescription={t('ttsUtteranceErrorDescription')}
              lessonMarkedCompleteToastTitleKey="lessonMarkedCompleteToastTitle"
              lessonMarkedCompleteToastDescriptionKey="lessonMarkedCompleteToastDescription"
              lessonMarkedIncompleteToastTitleKey="lessonMarkedIncompleteToastTitle"
              lessonMarkedIncompleteToastDescriptionKey="lessonMarkedIncompleteToastDescription"
            />
          </div>
          <div className="md:w-1/3 space-y-6">
            <GoalTracker
              titlePrefix={t('yourGoalPrefix')}
              targetLanguageDisplayName={targetLanguageDisplayName}
              goalText={userGoalText}
              progressLabelText={t('progressLabel')}
              progressMessageTextTemplate={t('progressMessageTextTemplate')}
              completedLessonsCount={completedLessons}
              totalLessonsCount={totalLessons}
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
            <LayoutGrid className="text-primary h-6 w-6" />
            {t('exploreLearningModules')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appModulesConfig.map((mod) => (
              <ModuleLinkCard
                key={mod.id}
                title={t(mod.titleKey, mod.defaultTitle)}
                description={t(mod.descriptionKey, mod.defaultDescription)}
                href={mod.href}
                icon={mod.icon}
                disabled={mod.disabled}
                startLearningButtonText={t('startLearningButton')}
                comingSoonButtonText={t('comingSoonButton')}
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
                <p className="text-sm text-muted-foreground">{t('lessonsCompleted')}: {userData.progress?.completedLessonIds?.length || 0} / {userData.progress?.learningRoadmap?.lessons?.length || 0}</p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push('/progress')}>
                  {t('viewFullProgress')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Archive className="text-primary"/>{t('errorArchive')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <p className="text-sm text-muted-foreground">You have {userData.progress?.errorArchive?.length || 0} saved errors.</p>
                 <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push('/errors')}>
                   {t('viewErrorArchive')} <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="text-primary"/>{t('quickSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Languages className="h-4 w-4 text-primary/70" />
                    </TooltipTrigger>
                    <TooltipContent><p>{t('tooltipInterfaceLanguage')}</p></TooltipContent>
                  </Tooltip>
                  <span>{t('interface')}: {getLanguageDisplayName(userData.settings.interfaceLanguage, 'interface')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <GraduationCap className="h-4 w-4 text-primary/70" />
                    </TooltipTrigger>
                    <TooltipContent><p>{t('tooltipTargetLanguage')}</p></TooltipContent>
                  </Tooltip>
                  <span>{t('learning')}: {getLanguageDisplayName(userData.settings.targetLanguage, 'target')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Flag className="h-4 w-4 text-primary/70" />
                    </TooltipTrigger>
                    <TooltipContent><p>{t('tooltipGoal')}</p></TooltipContent>
                  </Tooltip>
                  <span className="whitespace-pre-wrap">{t('currentGoalLabel')}: <span className="font-medium text-foreground">{userGoalText}</span></span>
                </div>
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

    