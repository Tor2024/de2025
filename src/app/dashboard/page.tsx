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
import type { GetLessonRecommendationInput, GetLessonRecommendationOutput } from '@/ai/flows/get-lesson-recommendation-flow';
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
    aiRecommendationTitle: "AI Recommendation: {lessonTitle}",
    aiRecommendationInfoTitle: "Lesson Recommendation",
    aiRecommendationNoLessonReasoning: "AI could not find a specific lesson to recommend right now.",
    aiRecommendationNavFailed: "(Could not auto-navigate, please find the lesson in your roadmap).",
    // New toast keys for RoadmapDisplay
    lessonMarkedCompleteToastTitle: "Lesson Complete!",
    lessonMarkedCompleteToastDescription: "Lesson '{lessonTitle}' marked as complete. +25 XP",
    lessonMarkedIncompleteToastTitle: "Lesson Status Updated",
    lessonMarkedIncompleteToastDescription: "Lesson '{lessonTitle}' marked as incomplete.",
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
    ttsExperimentalText: "Текст в речь (TTS) экспериментальный. Голос и поддержка языка зависят от вашего браузера/ОС.",
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
    aiRecommendationNavFailed: "(Автоматический переход не удался, пожалуйста, найдите урок в вашем плане).",
    // New toast keys for RoadmapDisplay
    lessonMarkedCompleteToastTitle: "Урок завершен!",
    lessonMarkedCompleteToastDescription: "Урок '{lessonTitle}' отмечен как пройденный. +25 XP",
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

const keywordsToModules: {keywords: string[], path: string, needsLevel?: boolean, topicExtractor?: (line: string, keyword: string) => string}[] = [
    { keywords: ["лексика:", "словарный запас:", "vocabulary:"], path: "/learn/vocabulary" },
    { keywords: ["грамматика:", "grammar:"], path: "/learn/grammar" },
    { keywords: ["чтение:", "reading:"], path: "/learn/reading", needsLevel: true },
    { keywords: ["аудирование:", "listening:"], path: "/learn/listening" },
    { keywords: ["говорение:", "практика говорения:", "speaking:", "speech practice:"], path: "/learn/speaking" },
    { keywords: ["письмо:", "помощь в письме:", "writing:", "writing assistance:"], path: "/learn/writing", topicExtractor: (line, keyword) => line.substring(keyword.length).replace(/на тему/i, "").replace(/["':]/g, "").trim() },
    { keywords: ["практика слов:", "упражнения:", "word practice:", "exercises:"], path: "/learn/practice" },
  ];

const parseTopicAndGetLink = (topicLine: string, lessonContext?: { lessonId: string; lessonLevel: string }): { href: string | null; displayText: string } => {
  let href: string | null = null;
  const displayText = topicLine; 

  const cleanAndEncodeTopic = (rawTopic: string): string => {
    let cleaned = rawTopic.replace(/\s*\(.*?\)\s*$/, "").trim();
    cleaned = cleaned.replace(/^["':\s]+|["':\s]+$/g, "").trim();
    return encodeURIComponent(cleaned);
  };
  
  const topicLineLower = topicLine.toLowerCase();

  for (const mod of keywordsToModules) {
    for (const keyword of mod.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (topicLineLower.startsWith(keywordLower)) {
        let theme = mod.topicExtractor 
          ? mod.topicExtractor(topicLine, keyword) 
          : topicLine.substring(keyword.length).trim();

        theme = cleanAndEncodeTopic(theme);
        if (theme.length > 0) {
          href = `${mod.path}?topic=${theme}`;
          if (lessonContext) {
            href += `&lessonId=${encodeURIComponent(lessonContext.lessonId)}`;
            if (mod.needsLevel && lessonContext.lessonLevel) {
              const levelCode = lessonContext.lessonLevel.split(' ')[0]?.toUpperCase() || lessonContext.lessonLevel.toUpperCase();
              href += `&baseLevel=${encodeURIComponent(levelCode)}`;
            }
          }
        }
        break;
      }
    }
    if (href) break;
  }
  console.log(`parseTopicAndGetLink for "${topicLine}" with lessonLevel "${lessonContext?.lessonLevel}" -> href: "${href}"`);
  return { href, displayText };
};


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

  const fetchTutorTip = useCallback(async () => {
    if (!userData.settings) {
        console.warn("fetchTutorTip: User settings not available.");
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
        learningGoal: (Array.isArray(userData.settings.goal) ? userData.settings.goal[0] : userData.settings.goal) || "",
      });
      setAiTutorTip(response.tip);
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = null;
      }
      setTipCooldownEndTime(null); 
    } catch (error) {
      console.error("Failed to generate tutor tip:", error);
      setAiTutorTip(t('aiTutorTipStatic')); 
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('aiTutorTipErrorTitle', 'Ошибка генерации подсказки'),
        description: `${t('aiTutorTipErrorDescription', 'Попробуйте ещё раз.')}${errorMessage ? ` (${errorMessage})` : ''}`,
        variant: "destructive",
      });
      const cooldownDuration = 120 * 1000; 
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
    userData.settings?.interfaceLanguage,
    userData.settings?.targetLanguage,
    userData.settings?.proficiencyLevel,
    userData.settings?.goal,
    t, 
    toast
  ]);

  useEffect(() => {
     if (!isUserDataLoading && userData.settings && (tipCooldownEndTime === null || Date.now() >= tipCooldownEndTime)) {
       fetchTutorTip();
     }
  }, [
      isUserDataLoading,
      userData.settings?.interfaceLanguage, 
      userData.settings?.targetLanguage,
      userData.settings?.proficiencyLevel,
      userData.settings?.goal,
      tipCooldownEndTime,
      // fetchTutorTip should not be in dependencies if it itself depends on these, to avoid loop
      // it's memoized by useCallback, so its reference changes only when its own deps change
  ]);

  useEffect(() => {
    if (userData.settings === null && !isUserDataLoading) {
      router.replace('/');
    }
  }, [userData, isUserDataLoading, router]); 

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const handleRecommendLessonClick = async () => {
    if (!userData.settings || !userData.progress?.learningRoadmap?.lessons || userData.progress.learningRoadmap.lessons.length === 0) {
        toast({
            title: t('recommendLessonErrorTitle', 'Ошибка рекомендации'),
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
                .slice(-5) 
                .map((err: ErrorRecord) => `Module: ${err.module}, Context: ${err.context || 'N/A'}, User attempt: ${err.userAttempt}, Correct: ${err.correctAnswer || 'N/A'}`)
                .join('; ');
        }

        const input: GetLessonRecommendationInput = {
            interfaceLanguage: userData.settings.interfaceLanguage,
            currentLearningRoadmap: userData.progress.learningRoadmap,
            completedLessonIds: userData.progress.completedLessonIds || [],
            userGoal: (Array.isArray(userData.settings.goal) ? userData.settings.goal[0] : userData.settings.goal) || "",
            currentProficiencyLevel: userData.settings.proficiencyLevel || 'A1-A2',
        };
        const recommendation = await getLessonRecommendation(input);
        setLastRecommendation(recommendation);

        if (recommendation.recommendedLessonId && userData.progress.learningRoadmap?.lessons) {
            const lesson = userData.progress.learningRoadmap.lessons.find(l => l.id === recommendation.recommendedLessonId);
            const lessonTitle = lesson ? lesson.title : "a recommended lesson";
            
            if (lesson && lesson.topics && lesson.topics.length > 0) {
                const firstTopicString = lesson.topics[0];
                const { href } = parseTopicAndGetLink(firstTopicString, { lessonId: lesson.id, lessonLevel: lesson.level });


                if (href) {
                    toast({
                        title: t('aiRecommendationTitle', 'Рекомендован следующий урок'),
                        description: recommendation.reasoning || '',
                    });
                    router.push(href);
                } else {
                    toast({
                        title: t('aiRecommendationTitle', 'Рекомендован следующий урок'),
                        description: (recommendation.reasoning || '') + ' ' + t('aiRecommendationNavFailed', 'Не удалось перейти к уроку.'),
                    });
                    if (roadmapDisplayRef.current) {
                        roadmapDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            } else {
                 toast({ 
                    title: t('aiRecommendationTitle', 'Рекомендован следующий урок'),
                    description: (recommendation.reasoning || '') + (lesson ? ' (В этом уроке пока нет тем.)' : ''),
                });
                 if (roadmapDisplayRef.current) {
                    roadmapDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        } else { 
            toast({
                title: t('aiRecommendationInfoTitle', 'Рекомендация'),
                description: recommendation.reasoning || t('aiRecommendationNoLessonReasoning', 'Нет подходящего урока для рекомендации.'),
                variant: "default",
            });
             if (roadmapDisplayRef.current) {
                roadmapDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

    } catch (error) {
        console.error("Failed to get lesson recommendation:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
            title: t('recommendLessonErrorTitle', 'Ошибка рекомендации'),
            description: `${t('recommendLessonErrorDescription', 'Не удалось получить рекомендацию.')}${errorMessage ? ` (${errorMessage})` : ''}`,
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
          <p className="ml-4">{currentLang === 'ru' ? baseRuTranslations.loadingUserData : baseEnTranslations.loadingUserData}</p>
        </div>
      </AppShell>
    );
  }

  if (userData.settings === null) { 
    return (
       <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">{currentLang === 'ru' ? baseRuTranslations.redirecting : baseEnTranslations.redirecting}</p>
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
  const isRefreshButtonDisabled = isTipLoading || (tipCooldownEndTime !== null && Date.now() < tipCooldownEndTime);

  const completedLessons = userData.progress.completedLessonIds?.length || 0;
  const totalLessons = userData.progress.learningRoadmap?.lessons?.length || 0;

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">

        <Button
          onClick={handleRecommendLessonClick}
          disabled={isRecommendationLoading || !userData.progress?.learningRoadmap?.lessons || userData.progress.learningRoadmap.lessons.length === 0}
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

