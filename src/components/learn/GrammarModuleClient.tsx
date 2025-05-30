
"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react"; // Добавлен useRef
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { adaptiveGrammarExplanations, type AdaptiveGrammarExplanationsInput, type AdaptiveGrammarExplanationsOutput, type PracticeTask } from "@/ai/flows/adaptive-grammar-explanations";
import { explainGrammarTaskError, type ExplainGrammarTaskErrorInput } from "@/ai/flows/explain-grammar-task-error-flow";
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles, XCircle, CheckCircle2 } from "lucide-react"; // Volume2, Ban удалены
import { interfaceLanguageCodes } from "@/lib/types";
// import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Не используется без TTS
import { cn } from "@/lib/utils";

const grammarSchema = z.object({
  grammarTopic: z.string().min(3, "Topic should be at least 3 characters"),
});

type GrammarFormData = z.infer<typeof grammarSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Adaptive Grammar Explanations",
  description: "Enter a grammar topic you want to understand better. Our AI tutor will provide a clear explanation and practice tasks tailored to your level and goals.", // TTS part removed
  grammarTopicLabel: "Grammar Topic",
  grammarTopicPlaceholder: "E.g., Dative Case, Modal Verbs, Subjunctive II",
  getExplanationButton: "Get Explanation",
  resultsTitlePrefix: "Explanation for:",
  explanationHeader: "Explanation",
  practiceTasksHeader: "Practice Tasks",
  noPracticeTasks: "No practice tasks were generated for this topic.",
  toastSuccessTitle: "Explanation Generated!",
  toastSuccessDescriptionTemplate: "Grammar explanation for \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate grammar explanation. Please try again.",
  onboardingMissing: "Please complete onboarding first.",
  loading: "Loading...",
  clearResultsButton: "Clear Results",
  hintDer: "Masculine Nominative",
  hintDie: "Feminine/Plural Nominative/Accusative",
  hintDas: "Neuter Nominative/Accusative",
  checkAnswerButton: "Check Answer",
  yourAnswerLabel: "Your Answer:",
  feedbackCorrect: "Correct!",
  feedbackIncorrectPrefix: "Incorrect. Correct answer:",
  aiErrorAnalysisHeader: "AI Error Analysis:",
  loadingAiExplanation: "Loading AI explanation for your error...",
  // Ключи для TTS удалены
};

const baseRuTranslations: Record<string, string> = {
  title: "Адаптивные объяснения грамматики",
  description: "Введите грамматическую тему, которую вы хотите лучше понять. Наш AI-репетитор предоставит четкое объяснение и практические задания, адаптированные к вашему уровню и целям.", // TTS part removed
  grammarTopicLabel: "Грамматическая тема",
  grammarTopicPlaceholder: "Напр., Дательный падеж, Модальные глаголы, Сослагательное наклонение II",
  getExplanationButton: "Получить объяснение",
  resultsTitlePrefix: "Объяснение для:",
  explanationHeader: "Объяснение",
  practiceTasksHeader: "Практические задания",
  noPracticeTasks: "Для этой темы практические задания не были сгенерированы.",
  toastSuccessTitle: "Объяснение создано!",
  toastSuccessDescriptionTemplate: "Объяснение грамматики для темы \"{topic}\" готово.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать объяснение грамматики. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
  loading: "Загрузка...",
  clearResultsButton: "Очистить результаты",
  hintDer: "Мужской род, им. падеж",
  hintDie: "Женский род/Мн. число, им./вин. падеж",
  hintDas: "Средний род, им./вин. падеж",
  checkAnswerButton: "Проверить ответ",
  yourAnswerLabel: "Ваш ответ:",
  feedbackCorrect: "Правильно!",
  feedbackIncorrectPrefix: "Неправильно. Правильный ответ:",
  aiErrorAnalysisHeader: "Разбор ошибки ИИ:",
  loadingAiExplanation: "Загрузка объяснения ошибки от ИИ...",
  // Ключи для TTS удалены
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

const germanArticleHighlights: Record<string, { color: string; hintKey: string }> = {
  'der': { color: 'blue', hintKey: 'hintDer' },
  'die': { color: 'red', hintKey: 'hintDie' },
  'das': { color: 'green', hintKey: 'hintDas' },
};

const HighlightedTextRenderer: React.FC<{ text: string; highlights: Record<string, { color: string; hintKey: string }>; translateFn: (key: string, defaultText?: string) => string }> = ({ text, highlights, translateFn }) => {
  // (Код этого компонента остается без изменений)
  if (!text) return <>{text}</>;

  const highlightKeys = Object.keys(highlights);
  if (highlightKeys.length === 0) return <>{text}</>;

  const regex = new RegExp(`\\b(${highlightKeys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const lowerPart = part.toLowerCase();
        const highlightConfig = highlights[lowerPart];

        if (highlightConfig) {
          // Temporarily removing Tooltip for stability
          // return (
          //   <Tooltip key={`${part}-${index}-${Math.random().toString(36).substring(2,9)}`}>
          //     <TooltipTrigger asChild>
                return (
                  <span key={`${part}-${index}-${Math.random().toString(36).substring(2,9)}`} style={{ color: highlightConfig.color, fontWeight: 'bold', cursor: 'help' }}>
                    {part}
                  </span>
                );
          //     </TooltipTrigger>
          //     <TooltipContent>
          //       <p>{translateFn(highlightConfig.hintKey, highlightConfig.hintKey)}</p>
          //     </TooltipContent>
          //   </Tooltip>
          // );
        }
        return part;
      })}
    </>
  );
};


export function GrammarModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState<AdaptiveGrammarExplanationsOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  // Состояния и логика для TTS удалены
  // const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = useState<string | null>(null);
  // const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  // const currentUtteranceIndexRef = React.useRef<number>(0);
  // const voicesRef = React.useRef<SpeechSynthesisVoice[]>([]);

  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});
  const [taskFeedback, setTaskFeedback] = useState<Record<string, { isCorrect: boolean; submitted: boolean }>>({});
  const [taskErrorExplanations, setTaskErrorExplanations] = useState<Record<string, string | null>>({});
  const [isFetchingExplanation, setIsFetchingExplanation] = useState<Record<string, boolean>>({});


  const { register, handleSubmit, formState: { errors }, reset } = useForm<GrammarFormData>({
    resolver: zodResolver(grammarSchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = useCallback((key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = componentTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key]; 
    }
    return defaultText || key; 
  }, [currentLang]);

  // useEffect для TTS удален

  if (isUserDataLoading) {
     return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings || !userData.progress) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<GrammarFormData> = async (data) => {
    setIsAiLoading(true);
    setExplanationResult(null);
    setCurrentTopic(data.grammarTopic);
    setTaskAnswers({});
    setTaskFeedback({});
    setTaskErrorExplanations({});
    setIsFetchingExplanation({});
    // stopSpeech(); // Удален вызов TTS
    try {
      if (!userData.settings || !userData.progress) { 
        toast({ title: t('onboardingMissing'), variant: "destructive" });
        setIsAiLoading(false);
        return;
      }
      const grammarInput: AdaptiveGrammarExplanationsInput = {
        interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
        grammarTopic: data.grammarTopic,
        proficiencyLevel: userData.settings.proficiencyLevel as AppProficiencyLevel,
        learningGoal: userData.settings.goal,
        userPastErrors: userData.progress.errorArchive.map(e => `Module: ${e.module}, Context: ${e.context || 'N/A'}, User attempt: ${e.userAttempt}, Correct: ${e.correctAnswer || 'N/A'}`).join('\n') || "No past errors recorded.",
      };

      const result = await adaptiveGrammarExplanations(grammarInput);
      setExplanationResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.grammarTopic),
      });
      reset();
    } catch (error) {
      console.error("Grammar explanation error:", error);
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

  const handleClearResults = () => {
    setExplanationResult(null);
    setCurrentTopic("");
    setTaskAnswers({});
    setTaskFeedback({});
    setTaskErrorExplanations({});
    setIsFetchingExplanation({});
    // stopSpeech(); // Удален вызов TTS
  };

  const handleTaskAnswerChange = (taskId: string, answer: string) => {
    setTaskAnswers(prev => ({ ...prev, [taskId]: answer }));
    if (taskFeedback[taskId]?.submitted) {
      setTaskFeedback(prev => ({ ...prev, [taskId]: { submitted: false, isCorrect: false } }));
      setTaskErrorExplanations(prev => ({ ...prev, [taskId]: null }));
      setIsFetchingExplanation(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleCheckTaskAnswer = async (taskId: string, task: PracticeTask) => {
    const userAnswer = (taskAnswers[taskId] || "").trim().toLowerCase();
    const actualCorrectAnswer = task.correctAnswer.trim().toLowerCase();
    const isCorrect = userAnswer === actualCorrectAnswer;
    setTaskFeedback(prev => ({ ...prev, [taskId]: { submitted: true, isCorrect } }));

    if (!isCorrect && userData.settings) {
      setIsFetchingExplanation(prev => ({ ...prev, [taskId]: true }));
      try {
        const errorInput: ExplainGrammarTaskErrorInput = {
          interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
          grammarTopic: currentTopic,
          taskDescription: task.taskDescription,
          userAttempt: taskAnswers[taskId] || "",
          correctAnswer: task.correctAnswer,
        };
        const errorExplanationResult = await explainGrammarTaskError(errorInput);
        setTaskErrorExplanations(prev => ({ ...prev, [taskId]: errorExplanationResult.explanation }));
      } catch (error) {
        console.error("AI error explanation failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setTaskErrorExplanations(prev => ({ ...prev, [taskId]: `Failed to load AI explanation for this error. ${errorMessage}` }));
        toast({
            title: "AI Explanation Error",
            description: `Could not fetch explanation for task error. ${errorMessage}`,
            variant: "destructive"
        });
      } finally {
        setIsFetchingExplanation(prev => ({ ...prev, [taskId]: false }));
      }
    }
  };

  const hasExplanationText = !!(explanationResult && explanationResult.explanation && explanationResult.explanation.trim().length > 0);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description')}
            {/* TTS Experimental text удален */}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="grammarTopic">{t('grammarTopicLabel')}</Label>
              <Input id="grammarTopic" placeholder={t('grammarTopicPlaceholder')} {...register("grammarTopic")} />
              {errors.grammarTopic && <p className="text-sm text-destructive">{errors.grammarTopic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
              {t('getExplanationButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isAiLoading && !explanationResult && (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      )}

      {explanationResult && (
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
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{t('explanationHeader')}</h3>
                {/* Кнопка TTS удалена */}
              </div>
              <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                   <HighlightedTextRenderer text={explanationResult.explanation} highlights={germanArticleHighlights} translateFn={t} />
                </p>
              </ScrollArea>
            </div>

            <div>
              <h3 className="font-semibold text-lg mt-4 mb-2">{t('practiceTasksHeader')}</h3>
              <ScrollArea className="h-[350px] rounded-md border p-3 bg-muted/30">
                {explanationResult.practiceTasks && explanationResult.practiceTasks.length > 0 ? (
                  <div className="space-y-4">
                    {explanationResult.practiceTasks.map((task, index) => (
                      <div key={task.id || index} className="p-3 rounded-md bg-card border border-border/70 shadow-sm">
                        <p className="text-sm font-medium mb-1.5">{task.taskDescription}</p>
                        {task.type === 'fill-in-the-blank' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                id={`task-${task.id}-answer`}
                                placeholder={t('yourAnswerLabel')}
                                value={taskAnswers[task.id] || ""}
                                onChange={(e) => handleTaskAnswerChange(task.id, e.target.value)}
                                disabled={taskFeedback[task.id]?.submitted}
                                className={cn(
                                  taskFeedback[task.id]?.submitted &&
                                  (taskFeedback[task.id]?.isCorrect 
                                    ? 'border-green-500 focus-visible:ring-green-500 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                    : 'border-red-500 focus-visible:ring-red-500 bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400')
                                )}
                              />
                              {!taskFeedback[task.id]?.submitted && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCheckTaskAnswer(task.id, task)}
                                  disabled={!(taskAnswers[task.id]?.trim())}
                                >
                                  {t('checkAnswerButton')}
                                </Button>
                              )}
                            </div>
                            {taskFeedback[task.id]?.submitted && (
                              <div className={cn(
                                "text-sm flex items-center gap-1",
                                taskFeedback[task.id]?.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              )}>
                                {taskFeedback[task.id]?.isCorrect ? <CheckCircle2 className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}
                                {taskFeedback[task.id]?.isCorrect ? t('feedbackCorrect') : `${t('feedbackIncorrectPrefix')} ${task.correctAnswer}`}
                              </div>
                            )}
                            {isFetchingExplanation[task.id] && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                    <LoadingSpinner size={16}/> {t('loadingAiExplanation')}
                                </div>
                            )}
                            {taskErrorExplanations[task.id] && !isFetchingExplanation[task.id] && (
                                <div className="mt-2 p-2 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 rounded-r-md">
                                    <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">{t('aiErrorAnalysisHeader')}</h4>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-200 whitespace-pre-wrap">{taskErrorExplanations[task.id]}</p>
                                </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t('noPracticeTasks')}</p>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
