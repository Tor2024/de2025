
"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserData } from "@/contexts/UserDataContext";
import { generateVocabulary } from "@/ai/flows/generate-vocabulary-flow";
import type { GenerateVocabularyInput, GenerateVocabularyOutput, VocabularyWord } from "@/ai/flows/generate-vocabulary-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FileText, Sparkles, Languages, MessageSquareText, XCircle, Eye, EyeOff, ArrowLeft, ArrowRight, Repeat, CheckCircle2, Lightbulb, Archive, PartyPopper, RefreshCw, Info } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel, UserLearnedWord } from "@/lib/types";
import { interfaceLanguageCodes, learningStageIntervals, MAX_LEARNING_STAGE } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { enUS, ru as ruLocale } from 'date-fns/locale';
import { useSearchParams, useRouter } from 'next/navigation';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import { lessonTypes } from '@/config/lessonTypes';

const vocabularySchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});

type VocabularyFormData = z.infer<typeof vocabularySchema>;

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const baseEnTranslations: Record<string, string> = {
  title: "Vocabulary Builder",
  description: "Enter a topic and our AI will generate a list of relevant words. Then, practice them using multiple-choice flashcards.",
  topicLabel: "Topic for Vocabulary",
  topicPlaceholder: "E.g., Travel, Food, Business",
  getWordsButton: "Get Words",
  resultsTitlePrefix: "Practice for topic:",
  toastSuccessTitle: "Vocabulary List Generated!",
  toastSuccessDescriptionTemplate: "Word list for \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate vocabulary. Please try again.",
  onboardingMissing: "Please complete onboarding first.",
  loading: "Loading...",
  clearResultsButton: "New Topic",
  practiceAgainButton: "Practice This Set Again",
  nextSectionButton: "Next Section",
  // MC Practice
  mcPracticeTitle: "Practice Mode: Choose Correct Translation",
  mcPracticeWordLabel: "Word (in {targetLanguage}):",
  mcPracticeChooseLabel: "Choose the correct translation (in {interfaceLanguage}):",
  mcFeedbackCorrect: "Correct!",
  mcFeedbackIncorrect: "Not quite!",
  mcPracticeComplete: "Practice Complete!",
  mcPracticeScoreMessage: "Your Score: {correct} out of {total} correct.",
  archiveMistakeButton: "Archive this mistake",
  mistakeArchivedToastTitle: "Mistake Archived",
  mistakeArchivedToastDescription: "This mistake has been added to your error archive.",
  congratsMessage: "Congratulations! You can move to the next section.",
  recommendRepeatMessage: "We recommend repeating this topic for a better result.",
};

const baseRuTranslations: Record<string, string> = {
  title: "Конструктор словарного запаса",
  description: "Введите тему, и наш ИИ сгенерирует список слов. Затем практикуйте их с помощью карточек с множественным выбором.",
  topicLabel: "Тема для словарного запаса",
  topicPlaceholder: "Напр., Путешествия, Еда, Бизнес",
  getWordsButton: "Получить слова",
  resultsTitlePrefix: "Практика по теме:",
  toastSuccessTitle: "Список слов создан!",
  toastSuccessDescriptionTemplate: "Список слов для темы \"{topic}\" готов.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать список слов. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
  loading: "Загрузка...",
  clearResultsButton: "Новая тема",
  practiceAgainButton: "Повторить этот набор",
  nextSectionButton: "Следующий раздел",
  // MC Practice
  mcPracticeTitle: "Режим практики: Выберите правильный перевод",
  mcPracticeWordLabel: "Слово (на {targetLanguage}):",
  mcPracticeChooseLabel: "Выберите правильный перевод (на {interfaceLanguage}):",
  mcFeedbackCorrect: "Правильно!",
  mcFeedbackIncorrect: "Не совсем!",
  mcPracticeComplete: "Практика завершена!",
  mcPracticeScoreMessage: "Ваш результат: {correct} из {total} правильно.",
  archiveMistakeButton: "Добавить ошибку в архив",
  mistakeArchivedToastTitle: "Ошибка добавлена в архив",
  mistakeArchivedToastDescription: "Эта ошибка была добавлена в ваш архив ошибок.",
  congratsMessage: "Поздравляем! Вы можете перейти к следующему разделу.",
  recommendRepeatMessage: "Рекомендуем повторить тему для лучшего результата.",
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

const componentTranslations = generateTranslations();

const lessonSections = ['grammar', 'vocabulary', 'practice', 'reading', 'listening', 'writing'];

function goToNextSection(
  currentSection: string,
  lessonId: string | null,
  topic: string | null,
  baseLevel: string | null,
  router: ReturnType<typeof useRouter>
) {
  const currentIndex = lessonSections.indexOf(currentSection);
    // Найти следующий существующий раздел
  for (let i = currentIndex + 1; i < lessonSections.length; i++) {
    const nextSection = lessonSections[i];
    if ((lessonTypes as Record<string, any>)[nextSection]) {
      let href = `/learn/${nextSection}?lessonId=${encodeURIComponent(lessonId || '')}`;
      if (topic) href += `&topic=${encodeURIComponent(topic)}`;
      if (baseLevel) href += `&baseLevel=${encodeURIComponent(baseLevel)}`;
      router.push(href);
      return;
    }
  }
  // Если ничего не найдено — на дашборд
  router.push('/dashboard?completedLesson=' + (lessonId || ''));
}

export default function VocabularyModuleClient() {
  const router = useRouter();
  const { userData, isLoading: isUserDataLoading, addErrorToArchive, processWordRepetition, recordPracticeSetCompletion } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [vocabularyResult, setVocabularyResult] = useState<GenerateVocabularyOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  // Multiple Choice Practice States
  const [currentMcPracticeIndex, setCurrentMcPracticeIndex] = useState(0);
  const [mcPracticeOptions, setMcPracticeOptions] = useState<VocabularyWord[]>([]);
  const [selectedMcOption, setSelectedMcOption] = useState<VocabularyWord | null>(null);
  const [isMcPracticeSubmitted, setIsMcPracticeSubmitted] = useState(false);
  const [mcPracticeFeedback, setMcPracticeFeedback] = useState("");
  const [mcPracticeScore, setMcPracticeScore] = useState({ correct: 0, total: 0 });
  const [isCurrentMcPracticeMistakeArchived, setIsCurrentMcPracticeMistakeArchived] = useState(false);

  const searchParams = useSearchParams();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VocabularyFormData>({
    resolver: zodResolver(vocabularySchema),
  });

  const currentLang = isUserDataLoading || !userData.settings ? 'en' : userData.settings.interfaceLanguage;
  const t = useCallback((key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  }, [currentLang]);

  const getPastErrorsAsString = useCallback(() => {
    if (!userData.progress?.errorArchive || userData.progress.errorArchive.length === 0) {
        return "No past errors recorded.";
    }
    return userData.progress.errorArchive
        .slice(-10) 
        .map(e => `Module: ${e.module}, Context: ${e.context || 'N/A'}, User attempt: ${e.userAttempt}, Correct: ${e.correctAnswer || 'N/A'}`)
        .join('\n');
  }, [userData.progress?.errorArchive]);


  const fetchVocabularyList = useCallback(async (formData: VocabularyFormData) => {
    if (!userData.settings) {
      toast({ title: t('onboardingMissing'), variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setVocabularyResult(null); 
    setCurrentTopic(formData.topic);
    
    // Reset Multiple Choice Practice
    setCurrentMcPracticeIndex(0);
    setMcPracticeOptions([]);
    setSelectedMcOption(null);
    setIsMcPracticeSubmitted(false);
    setMcPracticeFeedback("");
    setMcPracticeScore({ correct: 0, total: 0 });
    setIsCurrentMcPracticeMistakeArchived(false);

    try {
      const safeProficiencyLevel = (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2';
      const pastErrors = getPastErrorsAsString();
      const flowInput: GenerateVocabularyInput = {
        interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings.targetLanguage as AppTargetLanguage,
        proficiencyLevel: safeProficiencyLevel,
        topic: formData.topic,
        goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
        interests: userData.settings.interests || [],
        userPastErrors: pastErrors,
      };

      const result = await generateVocabulary(flowInput);
      setVocabularyResult(result);
      if (result && result.words && result.words.length > 0) {
        setMcPracticeScore(prev => ({ ...prev, total: result.words.length }));
      } else {
        setMcPracticeScore({ correct: 0, total: 0 });
      }
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', formData.topic),
      });
    } catch (error) {
      console.error("Vocabulary generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('toastErrorTitle'),
        description: `${t('toastErrorDescription')} ${errorMessage ? `(${errorMessage})` : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [userData.settings, toast, t, getPastErrorsAsString]);

  const onSubmit: SubmitHandler<VocabularyFormData> = async (data) => {
    await fetchVocabularyList(data);
    reset();
  };

  useEffect(() => {
    const initialTopic = searchParams.get('topic');
    if (initialTopic && !vocabularyResult && !isAiLoading) { 
      setValue('topic', initialTopic);
      fetchVocabularyList({ topic: initialTopic });
    }
  }, [searchParams, setValue, fetchVocabularyList, vocabularyResult, isAiLoading]);

  const handleClearResults = () => {
    setVocabularyResult(null);
    setCurrentTopic("");
    setCurrentMcPracticeIndex(0);
    setMcPracticeOptions([]);
    setSelectedMcOption(null);
    setIsMcPracticeSubmitted(false);
    setMcPracticeFeedback("");
    setMcPracticeScore({ correct: 0, total: 0 });
    setIsCurrentMcPracticeMistakeArchived(false);
    reset();
  };

  const currentMcPracticeWord = vocabularyResult?.words[currentMcPracticeIndex];

  const setupMcPracticeExercise = useCallback((index: number) => {
    const wordsForMc = vocabularyResult?.words;
    if (!wordsForMc || wordsForMc.length === 0 || index < 0 || index >= wordsForMc.length) {
      setMcPracticeOptions([]);
      return;
    }
    const correctWord = wordsForMc[index];
    const distractors = wordsForMc
      .filter(word => word.word.toLowerCase() !== correctWord.word.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = shuffleArray([correctWord, ...distractors]);
    setMcPracticeOptions(options.slice(0, Math.min(4, wordsForMc.length))); 
    setSelectedMcOption(null);
    setMcPracticeFeedback("");
    setIsMcPracticeSubmitted(false);
    setIsCurrentMcPracticeMistakeArchived(false);
  }, [vocabularyResult]);

  useEffect(() => {
    if (vocabularyResult && vocabularyResult.words.length > 0 && currentMcPracticeIndex < vocabularyResult.words.length) {
      setupMcPracticeExercise(currentMcPracticeIndex);
    }
  }, [currentMcPracticeIndex, vocabularyResult, setupMcPracticeExercise]);

  const handleMcOptionSelect = (option: VocabularyWord) => {
    if (isMcPracticeSubmitted) return;
    setSelectedMcOption(option);
  };

  const handleCheckMcPracticeAnswer = () => {
    if (!currentMcPracticeWord || !selectedMcOption) return;
    const isCorrect = selectedMcOption.translation.trim().toLowerCase() === currentMcPracticeWord.translation.trim().toLowerCase();

    if (isCorrect) {
      setMcPracticeFeedback(t('mcFeedbackCorrect'));
      setMcPracticeScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setMcPracticeFeedback(t('mcFeedbackIncorrect'));
    }

    if (userData.settings) {
        processWordRepetition(currentMcPracticeWord, userData.settings.targetLanguage as AppTargetLanguage, isCorrect);
    }
    
    setIsMcPracticeSubmitted(true);
    setIsCurrentMcPracticeMistakeArchived(false);
  };

  const handleNextMcPracticeExercise = () => {
    if (vocabularyResult && currentMcPracticeIndex < vocabularyResult.words.length - 1) {
      setCurrentMcPracticeIndex(prev => prev + 1);
    } else {
      setMcPracticeFeedback(t('mcPracticeComplete'));
      if (vocabularyResult?.words.length) recordPracticeSetCompletion();
    }
  };

  const handleRestartMcPractice = () => {
    setCurrentMcPracticeIndex(0);
    setMcPracticeScore(prev => ({ ...prev, correct: 0 }));
    if (vocabularyResult && vocabularyResult.words.length > 0) {
        setupMcPracticeExercise(0);
    } else {
        setMcPracticeOptions([]);
    }
    setSelectedMcOption(null);
    setMcPracticeFeedback("");
    setIsMcPracticeSubmitted(false);
    setIsCurrentMcPracticeMistakeArchived(false);
  };

  const handleArchiveMcPracticeMistake = () => {
    if (!currentMcPracticeWord || !selectedMcOption || !userData.settings) return;
    addErrorToArchive({
      module: "Vocabulary Practice",
      context: currentMcPracticeWord.word,
      userAttempt: selectedMcOption.translation,
      correctAnswer: currentMcPracticeWord.translation,
    });
    setIsCurrentMcPracticeMistakeArchived(true);
    toast({
      title: t('mistakeArchivedToastTitle'),
      description: t('mistakeArchivedToastDescription'),
    });
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const mcScorePercentage = mcPracticeScore.total > 0 ? (mcPracticeScore.correct / mcPracticeScore.total) * 100 : 0;
  const lessonIdFromParams = searchParams.get('lessonId');

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-center">{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="topic">{t('topicLabel')}</Label>
              <Input id="topic" placeholder={t('topicPlaceholder')} {...register('topic')} />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isAiLoading}>
              {isAiLoading ? <LoadingSpinner size={16} className="mr-2" /> : null}
              {t('getWordsButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isAiLoading && !vocabularyResult && (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      )}

      {vocabularyResult && currentTopic && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {t('resultsTitlePrefix')} {currentTopic}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                <XCircle className="mr-2 h-4 w-4" />
                {t('clearResultsButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             {/* Multiple Choice Practice Mode Section */}
              {vocabularyResult.words.length > 0 && (
                <div className="w-full">
                  {currentMcPracticeWord && !mcPracticeFeedback.startsWith(t('mcPracticeComplete')) ? (
                    <div className="w-full space-y-4">
                      <p className="text-sm text-muted-foreground">Вопрос {currentMcPracticeIndex + 1} из {vocabularyResult.words.length}</p>
                      <p className="text-lg">
                        <span className="font-semibold">{t('mcPracticeWordLabel').replace('{targetLanguage}', userData.settings!.targetLanguage)}</span>
                      </p>
                      <p className="text-3xl font-bold text-center py-4 text-primary bg-muted/30 rounded-md">{currentMcPracticeWord.word}</p>

                      <p className="text-sm text-muted-foreground">{t('mcPracticeChooseLabel').replace('{interfaceLanguage}', userData.settings!.interfaceLanguage)}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mcPracticeOptions.map((option, idx) => {
                          const isSelected = selectedMcOption?.translation === option.translation;
                          const isActualCorrectAnswer = currentMcPracticeWord.translation.trim().toLowerCase() === option.translation.trim().toLowerCase();

                          return (
                            <Button
                              key={`${option.word}-${idx}`}
                              variant="outline"
                              className={cn(
                                "h-auto py-3 justify-start text-left whitespace-normal transition-all duration-300",
                                isMcPracticeSubmitted && isActualCorrectAnswer && "bg-green-500/20 border-green-500 text-green-700 hover:bg-green-500/30",
                                isMcPracticeSubmitted && isSelected && !isActualCorrectAnswer && "bg-red-500/20 border-red-500 text-red-700 hover:bg-red-500/30",
                                isMcPracticeSubmitted && !isSelected && !isActualCorrectAnswer && "border-border opacity-60",
                                !isMcPracticeSubmitted && isSelected && "bg-primary/20 border-primary"
                              )}
                              onClick={() => handleMcOptionSelect(option)}
                              disabled={isMcPracticeSubmitted}
                            >
                              {option.translation}
                            </Button>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        {!isMcPracticeSubmitted ? (
                          <Button onClick={handleCheckMcPracticeAnswer} disabled={!selectedMcOption}>{t('practiceCheckMcButton', 'Проверить ответ')}</Button>
                        ) : (
                          <Button onClick={handleNextMcPracticeExercise}>{t('practiceNextMcButton', 'Следующий вопрос')}</Button>
                        )}
                        {isMcPracticeSubmitted && mcPracticeFeedback !== t('mcFeedbackCorrect') && !isCurrentMcPracticeMistakeArchived && (
                          <Button variant="outline" size="sm" onClick={handleArchiveMcPracticeMistake}>
                            <Archive className="mr-1.5 h-3.5 w-3.5" />
                            {t('archiveMistakeButton')}
                          </Button>
                        )}
                      </div>

                      {mcPracticeFeedback && !mcPracticeFeedback.startsWith(t('mcPracticeComplete')) && (
                        <p className={cn(
                          "text-sm mt-2 flex items-center gap-1",
                          mcPracticeFeedback === t('mcFeedbackCorrect') ? 'text-green-600' : 'text-red-600'
                        )}>
                          {mcPracticeFeedback === t('mcFeedbackCorrect') ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {mcPracticeFeedback}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-4 flex flex-col items-center gap-3">
                      <PartyPopper className="h-12 w-12 text-primary" />
                      <h3 className="text-2xl font-semibold mt-2">{t('mcPracticeComplete')}</h3>
                      <p className="text-lg text-muted-foreground">{t('mcPracticeScoreMessage').replace('{correct}', mcPracticeScore.correct.toString()).replace('{total}', mcPracticeScore.total.toString())}</p>
                      
                       {mcScorePercentage >= 70 ? (
                        <p className="text-green-600 text-center">{t('congratsMessage')}</p>
                      ) : (
                        <p className="text-amber-600 text-center">{t('recommendRepeatMessage')}</p>
                      )}

                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleRestartMcPractice}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t('practiceAgainButton')}
                        </Button>
                         <Button onClick={() => goToNextSection('vocabulary', lessonIdFromParams, currentTopic, userData.settings?.proficiencyLevel || '', router)} disabled={mcScorePercentage < 70}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          {t('nextSectionButton')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
