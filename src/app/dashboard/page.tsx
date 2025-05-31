
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
import { LayoutGrid, BarChart3, Award, Settings, Bot, ArrowRight, RefreshCw, Languages, GraduationCap, BarChartHorizontalBig, Flag, Sparkles as SparklesIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supportedLanguages, type InterfaceLanguage, interfaceLanguageCodes, proficiencyLevels, type TargetLanguage, type ProficiencyLevel, type ErrorRecord } from "@/lib/types";
import { generateTutorTip } from '@/ai/flows/generate-tutor-tip-flow';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import type { GetLessonRecommendationInput, GetLessonRecommendationOutput, Lesson as AiLessonType } from '@/ai/flows/get-lesson-recommendation-flow';
import { useToast } from "@/hooks/use-toast";
import { appModulesConfig } from "@/lib/modulesConfig";

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
    refreshTipButton: "Refresh Tip",
    xp: "XP",
    streak: "Streak",
    days: "days",
    badges: "Badges",
    noneYet: "None yet",
    interface: "Interface",
    learning: "Learning",
    proficiencyLabel: "Proficiency:",
    currentGoalLabel: "Current Goal:",
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
    recommendLessonButton: "AI Recommended Lesson",
    recommendLessonErrorTitle: "Recommendation Error",
    recommendLessonErrorDescription: "Could not get a lesson recommendation at this time.",
    aiRecommendationTitle: "AI Recommends: {lessonTitle}",
    aiRecommendationInfoTitle: "Lesson Recommendation",
    aiRecommendationNoLessonReasoning: "AI could not find a specific lesson to recommend right now.",
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
    refreshTipButton: "Обновить совет",
    xp: "ОП",
    streak: "Серия",
    days: "дней",
    badges: "Значки",
    noneYet: "Пока нет",
    interface: "Интерфейс",
    learning: "Изучение",
    proficiencyLabel: "Уровень:",
    currentGoalLabel: "Текущая цель:",
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
    ttsExperimentalText: "Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
    ttsNotSupportedTitle: "TTS не поддерживается",
    ttsNotSupportedDescription: "Функция озвучивания текста не поддерживается вашим браузером.",
    ttsUtteranceErrorTitle: "Ошибка синтеза речи",
    ttsUtteranceErrorDescription: "Не удалось воспроизвести аудио для текущего фрагмента текста.",
    recommendLessonButton: "Рекомендованный ИИ урок",
    recommendLessonErrorTitle: "Ошибка рекомендации",
    recommendLessonErrorDescription: "Не удалось получить рекомендацию урока в данный момент.",
    aiRecommendationTitle: "AI Рекомендует: {lessonTitle}",
    aiRecommendationInfoTitle: "Рекомендация урока",
    aiRecommendationNoLessonReasoning: "ИИ не смог найти конкретный урок для рекомендации в данный момент.",
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
  const [aiTutorTip, setAiTutorTip] = useState<string | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const { toast } = useToast();
  const [tipCooldownEndTime, setTipCooldownEndTime] = useState<number | null>(null);
  const cooldownTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const roadmapDisplayRef = useRef<HTMLDivElement>(null);

  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [lastRecommendation, setLastRecommendation] = useState<GetLessonRecommendationOutput | null>(null);

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = useCallback((key: string, defaultText?: string): string => {
    const langTranslations = pageTranslations[currentLang as keyof typeof pageTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = pageTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key];
    }
    return defaultText || key;
  }, [currentLang]);

  const fetchTutorTip = useCallback(async () => {
    if (!userData.settings) {
      setAiTutorTip(t('aiTutorTipStatic'));
      return;
    }
    if (isTipLoading || (tipCooldownEndTime !== null && Date.now() < tipCooldownEndTime)) {
      return;
    }

    setIsTipLoading(true);
    try {
      const response = await generateTutorTip({
        interfaceLanguage: userData.settings.interfaceLanguage as InterfaceLanguage,
        targetLanguage: userData.settings.targetLanguage as TargetLanguage,
        proficiencyLevel: userData.settings.proficiencyLevel as ProficiencyLevel,
        learningGoal: userData.settings.goal,
      });
      setAiTutorTip(response.tip);
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = null;
      }
      setTipCooldownEndTime(null); // Clear cooldown on success
    } catch (error) {
      console.error("Failed to generate tutor tip:", error);
      setAiTutorTip(t('aiTutorTipStatic')); // Show static tip on error
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('aiTutorTipErrorTitle'),
        description: `${t('aiTutorTipErrorDescription')} ${errorMessage ? `(${errorMessage})` : ''}`,
        variant: "destructive",
      });
      const cooldownDuration = 120 * 1000; // 120 seconds cooldown
      setTipCooldownEndTime(Date.now() + cooldownDuration);
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
      cooldownTimeoutRef.current = setTimeout(() => {
        setTipCooldownEndTime(null);
        cooldownTimeoutRef.current = null;
      }, cooldownDuration);
    } finally {
      setIsTipLoading(false);
    }
  }, [
    isTipLoading,
    tipCooldownEndTime,
    userData.settings,
    t,
    toast
  ]);

  useEffect(() => {
    if (!isUserDataLoading && userData.settings && (tipCooldownEndTime === null || Date.now() >= tipCooldownEndTime)) {
      fetchTutorTip();
    }
  }, [
      isUserDataLoading,
      userData.settings?.interfaceLanguage, // More specific dependencies
      userData.settings?.targetLanguage,
      userData.settings?.proficiencyLevel,
      userData.settings?.goal,
      fetchTutorTip, // Add fetchTutorTip itself as a dependency
      tipCooldownEndTime // Add tipCooldownEndTime to re-trigger if it changes
  ]);

  useEffect(() => {
    if (!isUserDataLoading && !userData.settings) {
      router.replace('/');
    }
  }, [userData, isUserDataLoading, router]); // Changed from userData.settings

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const handleRecommendLessonClick = async () => {
    if (!userData.settings || !userData.progress?.learningRoadmap) {
        toast({
            title: t('recommendLessonErrorTitle'),
            description: "User data or learning roadmap not available.",
            variant: "destructive",
        });
        return;
    }

    setIsRecommendationLoading(true);
    setLastRecommendation(null);

    try {
        let pastErrorsSummary = "No specific past errors noted for recommendation.";
        if (userData.progress.errorArchive && userData.progress.errorArchive.length > 0) {
            pastErrorsSummary = userData.progress.errorArchive
                .slice(-5) // Take last 5 errors
                .map((err: ErrorRecord) => `Module: ${err.module}, Context: ${err.context || 'N/A'}, User attempt: ${err.userAttempt}, Correct: ${err.correctAnswer || 'N/A'}`)
                .join('; ');
        }

        const input: GetLessonRecommendationInput = {
            interfaceLanguage: userData.settings.interfaceLanguage,
            currentLearningRoadmap: userData.progress.learningRoadmap,
            completedLessonIds: userData.progress.completedLessonIds || [],
            userGoal: userData.settings.goal,
            currentProficiencyLevel: userData.settings.proficiencyLevel,
            userPastErrors: pastErrorsSummary,
        };
        const recommendation = await getLessonRecommendation(input);
        setLastRecommendation(recommendation);

        if (recommendation.recommendedLessonId) {
            const lesson = userData.progress.learningRoadmap.lessons.find(l => l.id === recommendation.recommendedLessonId);
            const lessonTitle = lesson ? lesson.title : "a recommended lesson";
            toast({
                title: t('aiRecommendationTitle').replace('{lessonTitle}', lessonTitle),
                description: recommendation.reasoning || "",
            });
            if (roadmapDisplayRef.current) {
                roadmapDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        } else {
            toast({
                title: t('aiRecommendationInfoTitle'),
                description: recommendation.reasoning || t('aiRecommendationNoLessonReasoning'),
                variant: "default",
            });
        }

    } catch (error) {
        console.error("Failed to get lesson recommendation:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
            title: t('recommendLessonErrorTitle'),
            description: `${t('recommendLessonErrorDescription')} ${errorMessage ? `(${errorMessage})` : ''}`,
            variant: "destructive",
        });
    } finally {
        setIsRecommendationLoading(false);
    }
  };

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
    if (type === 'interface') {
      const lang = supportedLanguages.find(l => l.code === codeOrName);
      return lang ? `${lang.nativeName} (${lang.name})` : codeOrName;
    }
    const lang = supportedLanguages.find(l => l.name === codeOrName);
    return lang ? `${lang.nativeName} (${lang.name})` : codeOrName;
  };

  const targetLanguageDisplayName = getLanguageDisplayName(userData.settings.targetLanguage, 'target');
  const userGoalText = userData.settings.goal || t('noGoalSet');
  const isRefreshButtonDisabled = isTipLoading || (tipCooldownEndTime !== null && Date.now() < tipCooldownEndTime);

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">

        <Button
          onClick={handleRecommendLessonClick}
          disabled={isRecommendationLoading || !userData.progress?.learningRoadmap}
          className="w-full md:w-auto mb-6 py-6 text-lg"
          variant="default"
        >
          {isRecommendationLoading && <LoadingSpinner size={20} className="mr-2"/>}
          <SparklesIcon className="mr-2 h-5 w-5"/>
          {t('recommendLessonButton')}
        </Button>

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
            />
          </div>
          <div className="md:w-1/3 space-y-6">
            <GoalTracker
              titlePrefix={t('yourGoalPrefix')}
              targetLanguageDisplayName={targetLanguageDisplayName}
              goalText={userGoalText}
              progressLabelText={t('progressLabel')}
              progressMessageTextTemplate={t('progressMessageTextTemplate')}
            />
            <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="text-primary h-6 w-6"/>{t('aiTutorTipsTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isTipLoading && !aiTutorTip ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoadingSpinner size={16}/> {t('aiTutorTipLoading')}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{aiTutorTip || t('aiTutorTipStatic')}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={fetchTutorTip}
                  disabled={isRefreshButtonDisabled}
                >
                  {isTipLoading && <LoadingSpinner size={16} className="mr-2" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('refreshTipButton')}
                </Button>
              </CardContent>
            </Card>
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
                      <BarChartHorizontalBig className="h-4 w-4 text-primary/70" />
                    </TooltipTrigger>
                    <TooltipContent><p>{t('tooltipProficiency')}</p></TooltipContent>
                  </Tooltip>
                  <span>{t('proficiencyLabel')}: {userData.settings.proficiencyLevel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Flag className="h-4 w-4 text-primary/70" />
                    </TooltipTrigger>
                    <TooltipContent><p>{t('tooltipGoal')}</p></TooltipContent>
                  </Tooltip>
                  <span className="whitespace-pre-wrap">{t('currentGoalLabel')}: <span className="font-medium text-foreground">{userData.settings.goal || t('noGoalSet')}</span></span>
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


    