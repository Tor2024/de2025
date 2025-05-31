"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserData } from "@/contexts/UserDataContext";
import { generateFillInTheBlankExercises } from "@/ai/flows/generate-fill-in-the-blank-flow";
import type { GenerateFillInTheBlankInput, GenerateFillInTheBlankOutput } from "@/ai/flows/generate-fill-in-the-blank-flow";
import type { FillBlankExercise as ExerciseType } from "@/ai/flows/generate-fill-in-the-blank-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Repeat, Sparkles, CheckCircle2, XCircle, Lightbulb, XCircle as ClearIcon, Archive, PartyPopper, ArrowRight, RefreshCw } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, type TargetLanguage as AppTargetLanguage, type ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const exerciseFormSchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters").optional().or(z.literal('')),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Word Practice: Fill in the Blanks",
  description: "Generate fill-in-the-blank exercises to practice your vocabulary in context. Optionally, provide a topic to focus the exercises.",
  topicLabel: "Topic (Optional)",
  topicPlaceholder: "E.g., Travel, Food, Daily Routines",
  generateExercisesButton: "Generate Exercises",
  resultsTitlePrefix: "Exercises on:",
  noTopicProvided: "General Exercises",
  exerciseLabel: "Exercise",
  sentenceWithBlankLabel: "Sentence:",
  yourAnswerLabel: "Your Answer:",
  yourAnswerPlaceholder: "Type the missing word",
  checkAnswerButton: "Check Answer",
  correctAnswerLabel: "Correct Answer:",
  showHintButton: "Show Hint (Missing Word)",
  hideHintButton: "Hide Hint",
  feedbackCorrect: "Correct!",
  feedbackIncorrect: "Not quite. Try again or see the hint/answer.",
  noExercisesGenerated: "No exercises were generated for this topic. Please try a different one or try again.",
  toastSuccessTitle: "Exercises Generated!",
  toastSuccessDescriptionTemplate: "Fill-in-the-blank exercises for \"{topic}\" are ready.",
  toastErrorTitle: "Error Generating Exercises",
  toastErrorDescription: "Failed to generate exercises. Please try again.",
  onboardingMissing: "Please complete onboarding first.",
  loading: "Loading...",
  clearResultsButton: "Clear Exercises",
  nextExerciseButton: "Next Exercise",
  viewResultsButton: "View Results",
  allExercisesCompleted: "All exercises completed! Well done.",
  scoreMessage: "You got {correct} out of {total} correct.",
  archiveMistakeButton: "Archive this mistake",
  mistakeArchivedToastTitle: "Mistake Archived",
  mistakeArchivedToastDescription: "This mistake has been added to your error archive.",
  nextPartButton: "Next Set",
  repeatLessonPartButton: "Repeat This Set",
};

const baseRuTranslations: Record<string, string> = {
  title: "Практика слов: Заполните пропуски",
  description: "Сгенерируйте упражнения на заполнение пропусков для практики словарного запаса в контексте. По желанию, укажите тему, чтобы сфокусировать упражнения.",
  topicLabel: "Тема (необязательно)",
  topicPlaceholder: "Напр., Путешествия, Еда, Повседневные дела",
  generateExercisesButton: "Сгенерировать упражнения",
  resultsTitlePrefix: "Упражнения по теме:",
  noTopicProvided: "Общие упражнения",
  exerciseLabel: "Упражнение",
  sentenceWithBlankLabel: "Предложение:",
  yourAnswerLabel: "Ваш ответ:",
  yourAnswerPlaceholder: "Введите пропущенное слово",
  checkAnswerButton: "Проверить ответ",
  correctAnswerLabel: "Правильный ответ:",
  showHintButton: "Показать подсказку (пропущенное слово)",
  hideHintButton: "Скрыть подсказку",
  feedbackCorrect: "Правильно!",
  feedbackIncorrect: "Не совсем. Попробуйте снова или посмотрите подсказку/ответ.",
  noExercisesGenerated: "Для этой темы упражнения не были сгенерированы. Пожалуйста, попробуйте другую или повторите попытку.",
  toastSuccessTitle: "Упражнения сгенерированы!",
  toastSuccessDescriptionTemplate: "Упражнения на заполнение пропусков по теме \"{topic}\" готовы.",
  toastErrorTitle: "Ошибка генерации упражнений",
  toastErrorDescription: "Не удалось сгенерировать упражнения. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
  loading: "Загрузка...",
  clearResultsButton: "Очистить упражнения",
  nextExerciseButton: "Следующее упражнение",
  viewResultsButton: "Показать результаты",
  allExercisesCompleted: "Все упражнения выполнены! Молодец.",
  scoreMessage: "Вы правильно ответили на {correct} из {total}.",
  archiveMistakeButton: "Добавить ошибку в архив",
  mistakeArchivedToastTitle: "Ошибка добавлена в архив",
  mistakeArchivedToastDescription: "Эта ошибка была добавлена в ваш архив ошибок.",
  nextPartButton: "Следующий набор",
  repeatLessonPartButton: "Повторить этот набор",
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

interface ExerciseState {
  userAnswer: string;
  isSubmitted: boolean;
  isCorrect?: boolean;
  showHint: boolean;
  isMistakeArchived: boolean;
}

export function WordPracticeClient() {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive, recordPracticeSetCompletion } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [exerciseResult, setExerciseResult] = useState<GenerateFillInTheBlankOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<Record<number, ExerciseState>>({});
  const [showOverallResults, setShowOverallResults] = useState(false);


  const { register, handleSubmit, formState: { errors }, reset: resetTopicForm } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
  });

  const currentLang = isUserDataLoading || !userData.settings ? 'en' : userData.settings.interfaceLanguage;
  const t = useCallback((key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  }, [currentLang]);

  const currentExercise = exerciseResult?.exercises?.[currentExerciseIndex];
  const currentExerciseState = exerciseStates[currentExerciseIndex] || { userAnswer: "", isSubmitted: false, showHint: false, isMistakeArchived: false };

  const onSubmitTopic: SubmitHandler<ExerciseFormData> = async (data) => {
    setIsAiLoading(true);
    setExerciseResult(null);
    setCurrentTopic(data.topic || "");
    setCurrentExerciseIndex(0);
    setExerciseStates({});
    setShowOverallResults(false);
    

    try {
      if (!userData.settings) {
        toast({ title: t('onboardingMissing'), variant: "destructive" });
        setIsAiLoading(false);
        return;
      }
      const flowInput: GenerateFillInTheBlankInput = {
        interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings.targetLanguage as AppTargetLanguage,
        proficiencyLevel: userData.settings.proficiencyLevel as AppProficiencyLevel,
        topic: data.topic || undefined,
        count: 5, 
      };
      const result = await generateFillInTheBlankExercises(flowInput);
      setExerciseResult(result);
      if (result.exercises && result.exercises.length > 0) {
        const initialStates: Record<number, ExerciseState> = {};
        result.exercises.forEach((_, index) => {
          initialStates[index] = { userAnswer: "", isSubmitted: false, showHint: false, isMistakeArchived: false };
        });
        setExerciseStates(initialStates);
      }
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.topic || t('noTopicProvided')),
      });
      resetTopicForm();
    } catch (error) {
      console.error("Exercise generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('toastErrorTitle'),
        description: `${t('toastErrorDescription')} ${errorMessage ? `(${errorMessage})` : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExerciseStates(prev => ({
      ...prev,
      [currentExerciseIndex]: { ...(prev[currentExerciseIndex] || { userAnswer: "", isSubmitted: false, showHint: false, isMistakeArchived: false }), userAnswer: e.target.value, isCorrect: undefined, isMistakeArchived: false }
    }));
  };

  const handleCheckAnswer = () => {
    if (!currentExercise) return;
    const isCorrect = currentExerciseState.userAnswer.trim().toLowerCase() === currentExercise.correctAnswer.trim().toLowerCase();
    setExerciseStates(prev => ({
      ...prev,
      [currentExerciseIndex]: { ...(prev[currentExerciseIndex]), isSubmitted: true, isCorrect, showHint: false } 
    }));
  };

  const handleToggleHint = () => {
     setExerciseStates(prev => ({
      ...prev,
      [currentExerciseIndex]: { ...(prev[currentExerciseIndex]), showHint: !currentExerciseState.showHint }
    }));
  };

  const handleArchiveMistake = () => {
    if (!currentExercise || !userData.settings || !currentExerciseState) return;
    addErrorToArchive({
      module: "Word Practice",
      context: currentExercise.sentenceWithBlank,
      userAttempt: currentExerciseState.userAnswer,
      correctAnswer: currentExercise.correctAnswer,
    });
    setExerciseStates(prev => ({
      ...prev,
      [currentExerciseIndex]: { ...(prev[currentExerciseIndex]), isMistakeArchived: true }
    }));
    toast({
      title: t('mistakeArchivedToastTitle'),
      description: t('mistakeArchivedToastDescription'),
    });
  };

  const handleNextExercise = () => {
    if (exerciseResult && currentExerciseIndex < exerciseResult.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setShowOverallResults(true);
      recordPracticeSetCompletion(); 
    }
  };
  
  const handleClearResults = () => {
    setExerciseResult(null);
    setCurrentTopic("");
    setCurrentExerciseIndex(0);
    setExerciseStates({});
    setShowOverallResults(false);
    resetTopicForm();
  };

  const handleRestartCurrentSet = () => {
    setCurrentExerciseIndex(0);
    const resetStates: Record<number, ExerciseState> = {};
    if (exerciseResult?.exercises) {
      exerciseResult.exercises.forEach((_, index) => {
        resetStates[index] = { userAnswer: "", isSubmitted: false, showHint: false, isMistakeArchived: false, isCorrect: undefined };
      });
    }
    setExerciseStates(resetStates);
    setShowOverallResults(false);
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }
  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const totalExercises = exerciseResult?.exercises?.length || 0;
  const correctCount = Object.values(exerciseStates).filter(state => state.isCorrect).length;
  const scorePercentage = totalExercises > 0 ? (correctCount / totalExercises) * 100 : 0;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Repeat className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-center">{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmitTopic)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="topic">{t('topicLabel')}</Label>
              <Input id="topic" placeholder={t('topicPlaceholder')} {...register("topic")} />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
              {t('generateExercisesButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isAiLoading && !exerciseResult && (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      )}

      {exerciseResult && exerciseResult.exercises && exerciseResult.exercises.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {t('resultsTitlePrefix')} {currentTopic || t('noTopicProvided')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                <ClearIcon className="mr-2 h-4 w-4" />
                {t('clearResultsButton')}
              </Button>
            </div>
             {!showOverallResults && (
                <CardDescription>
                    {t('exerciseLabel')} {currentExerciseIndex + 1} / {totalExercises}
                </CardDescription>
             )}
          </CardHeader>
          <CardContent className="space-y-4">
            {showOverallResults ? (
                 <div className="text-center p-4 flex flex-col items-center gap-3">
                    <PartyPopper className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">{t('allExercisesCompleted')}</h3>
                    <p className="text-lg text-muted-foreground">
                        {t('scoreMessage').replace('{correct}', correctCount.toString()).replace('{total}', totalExercises.toString())}
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      {scorePercentage <= 70 && (
                        <Button onClick={handleRestartCurrentSet} variant="default" className="w-full sm:w-auto">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t('repeatLessonPartButton')}
                        </Button>
                      )}
                      <Button 
                        onClick={handleClearResults} // This effectively generates a new set
                        variant={scorePercentage > 70 ? "default" : "outline"} 
                        className="w-full sm:w-auto"
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        {t('nextPartButton')} 
                      </Button>
                       {scorePercentage > 70 && (
                         <Button onClick={handleRestartCurrentSet} variant="outline" className="w-full sm:w-auto">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t('repeatLessonPartButton')}
                        </Button>
                      )}
                    </div>
                </div>
            ) : currentExercise ? (
              <div className="p-4 rounded-md border bg-muted/30 shadow-sm">
                <p className="text-sm font-semibold text-muted-foreground mb-1">{t('sentenceWithBlankLabel')}</p>
                <p className="text-lg mb-3 whitespace-pre-wrap">{currentExercise.sentenceWithBlank}</p>
                
                <div className="space-y-1">
                  <Label htmlFor={`answer-${currentExerciseIndex}`}>{t('yourAnswerLabel')}</Label>
                  <Input 
                    id={`answer-${currentExerciseIndex}`} 
                    placeholder={t('yourAnswerPlaceholder')} 
                    value={currentExerciseState.userAnswer}
                    onChange={handleAnswerChange}
                    disabled={currentExerciseState.isSubmitted}
                    className={cn(
                        "transition-colors duration-300 ease-in-out",
                        currentExerciseState.isSubmitted && 
                        (currentExerciseState.isCorrect ? 
                            'border-green-500 focus-visible:ring-green-500 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 
                            'border-red-500 focus-visible:ring-red-500 bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )
                    )}
                  />
                </div>

                {currentExerciseState.isSubmitted && (
                  <div className={cn(
                      "mt-2 text-sm flex items-center gap-1",
                      currentExerciseState.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {currentExerciseState.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {currentExerciseState.isCorrect ? t('feedbackCorrect') : t('feedbackIncorrect')}
                  </div>
                )}
                
                {currentExerciseState.isSubmitted && !currentExerciseState.isCorrect && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t('correctAnswerLabel')} <span className="font-semibold text-primary">{currentExercise.correctAnswer}</span>
                    </p>
                     {currentExerciseState.isSubmitted && !currentExerciseState.isCorrect && !currentExerciseState.isMistakeArchived && (
                        <Button variant="outline" size="sm" onClick={handleArchiveMistake} className="text-xs mt-1">
                            <Archive className="mr-1.5 h-3.5 w-3.5" />
                            {t('archiveMistakeButton')}
                        </Button>
                    )}
                  </div>
                )}

                {!currentExerciseState.isSubmitted && (
                    <Button onClick={handleToggleHint} variant="link" size="sm" className="p-0 h-auto mt-2 text-xs">
                        <Lightbulb className="h-3 w-3 mr-1"/>
                        {currentExerciseState.showHint ? t('hideHintButton') : t('showHintButton')}
                    </Button>
                )}
                {currentExerciseState.showHint && !currentExerciseState.isSubmitted && (
                     <p className="text-sm mt-1 text-muted-foreground bg-background p-2 rounded-md shadow-sm">
                        {t('correctAnswerLabel')} <span className="font-semibold text-primary">{currentExercise.blankWord}</span>
                    </p>
                )}

              </div>
            ) : null}
          </CardContent>
          {!showOverallResults && currentExercise && (
            <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-4">
                {!currentExerciseState.isSubmitted ? (
                     <Button onClick={handleCheckAnswer} disabled={!currentExerciseState.userAnswer.trim() || isAiLoading}>
                        {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
                        {t('checkAnswerButton')}
                    </Button>
                ) : (
                    <Button onClick={handleNextExercise}>
                        {currentExerciseIndex < totalExercises -1 ? t('nextExerciseButton') : t('viewResultsButton')}
                    </Button>
                )}
            </CardFooter>
          )}
        </Card>
      )}
      {exerciseResult && (!exerciseResult.exercises || exerciseResult.exercises.length === 0) && !isAiLoading && (
        <Card className="shadow-lg">
            <CardContent className="p-6 text-center text-muted-foreground">
                {t('noExercisesGenerated')}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

  