
"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { generateReadingMaterial } from "@/ai/flows/generate-reading-material-flow";
import type { GenerateReadingMaterialInput, GenerateReadingMaterialOutput } from "@/ai/flows/generate-reading-material-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BookOpen, HelpCircle, Sparkles, CheckCircle2, XCircle, Target, XCircle as ClearIcon, Archive } from "lucide-react"; // Volume2, Ban удалены
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { interfaceLanguageCodes, proficiencyLevels } from "@/lib/types";
// import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Не используется без TTS
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const readingSchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
  proficiencyLevel: z.enum(proficiencyLevels, {
    required_error: "Proficiency level is required",
  }),
});
type ReadingFormData = z.infer<typeof readingSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Reading Practice",
  description: "Enter a topic and select a proficiency level. Our AI will generate a text in your target language, along with optional comprehension questions.",
  topicLabel: "Topic for Reading",
  topicPlaceholder: "E.g., My Daily Routine, Space Exploration, German Food",
  proficiencyLevelLabel: "Proficiency Level for this task",
  proficiencyLevelPlaceholder: "Select proficiency level",
  getTextButton: "Get Reading Text",
  resultsTitlePrefix: "Reading Material on:",
  readingTextHeader: "Text",
  comprehensionQuestionsHeader: "Comprehension Questions",
  toastSuccessTitle: "Reading Material Generated!",
  toastSuccessDescriptionTemplate: "Text about \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate reading material. Please try again.",
  onboardingMissing: "Please complete onboarding first to set your languages and proficiency.",
  loading: "Loading...",
  noQuestions: "No comprehension questions were generated for this text.",
  answerIndication: "Answer indication",
  noTextGenerated: "The AI did not generate any text for this topic. Please try a different topic or try again.",
  checkAnswersButton: "Check Answers",
  tryAgainButton: "Try Again",
  clearResultsButton: "Clear Results",
  scoreMessagePart1: "You answered",
  scoreMessagePart2: "out of",
  scoreMessagePart3: "questions correctly.",
  scoreMessagePerfect: "Perfect! All {totalQuestions} questions correct.",
  scoreMessageNone: "No correct answers this time. Try again!",
  archiveMistakeButton: "Archive this mistake",
  mistakeArchivedToastTitle: "Mistake Archived",
  mistakeArchivedToastDescription: "This mistake has been added to your error archive.",
  // Ключи для TTS удалены, так как TTS откатывается
};

const baseRuTranslations: Record<string, string> = {
  title: "Практика чтения",
  description: "Введите тему и выберите уровень сложности. Наш ИИ сгенерирует текст на изучаемом вами языке, а также опциональные вопросы на понимание.",
  topicLabel: "Тема для чтения",
  topicPlaceholder: "Напр., Мой распорядок дня, Освоение космоса, Немецкая кухня",
  proficiencyLevelLabel: "Уровень для этого задания",
  proficiencyLevelPlaceholder: "Выберите уровень",
  getTextButton: "Получить текст",
  resultsTitlePrefix: "Материал для чтения по теме:",
  readingTextHeader: "Текст",
  comprehensionQuestionsHeader: "Вопросы на понимание",
  toastSuccessTitle: "Материал для чтения создан!",
  toastSuccessDescriptionTemplate: "Текст по теме \"{topic}\" готов.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать материал для чтения. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг, чтобы установить языки и уровень.",
  loading: "Загрузка...",
  noQuestions: "Для этого текста не было сгенерировано вопросов на понимание.",
  answerIndication: "Указание на ответ",
  noTextGenerated: "ИИ не сгенерировал текст для этой темы. Пожалуйста, попробуйте другую тему или повторите попытку.",
  checkAnswersButton: "Проверить ответы",
  tryAgainButton: "Попробовать снова",
  clearResultsButton: "Очистить результаты",
  scoreMessagePart1: "Вы ответили правильно на",
  scoreMessagePart2: "из",
  scoreMessagePart3: "вопросов.",
  scoreMessagePerfect: "Отлично! Все {totalQuestions} вопросов правильно.",
  scoreMessageNone: "В этот раз нет правильных ответов. Попробуйте снова!",
  archiveMistakeButton: "Добавить ошибку в архив",
  mistakeArchivedToastTitle: "Ошибка добавлена в архив",
  mistakeArchivedToastDescription: "Эта ошибка была добавлена в ваш архив ошибок.",
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

// Логика Google Cloud TTS удалена
// const mapTargetLanguageToBcp47 = (targetLanguage: AppTargetLanguage): string => {
//   // ...
// };

export function ReadingModuleClient() {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [readingResult, setReadingResult] = useState<GenerateReadingMaterialOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  // Состояния и логика для TTS удалены
  // const [isTtsLoading, setIsTtsLoading] = useState(false);
  // const [audioSrc, setAudioSrc] = useState<string | null>(null);
  // const [isPlayingTts, setIsPlayingTts] = useState(false);
  // const audioRef = useRef<HTMLAudioElement>(null);


  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isAnswersSubmitted, setIsAnswersSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [mistakeArchiveStatus, setMistakeArchiveStatus] = useState<Record<number, boolean>>({});

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<ReadingFormData>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      topic: "",
      proficiencyLevel: userData.settings?.proficiencyLevel || proficiencyLevels[0],
    },
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

  const onSubmit: SubmitHandler<ReadingFormData> = async (data) => {
    setIsAiLoading(true);
    setReadingResult(null);
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    setMistakeArchiveStatus({});
    // stopSpeech(); // Удален вызов TTS
    // setIsTtsLoading(false); // Удалены состояния TTS
    // setAudioSrc(null);
    // setIsPlayingTts(false);
    setCurrentTopic(data.topic);
    try {
      const flowInput: GenerateReadingMaterialInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage as AppTargetLanguage,
        proficiencyLevel: data.proficiencyLevel as AppProficiencyLevel,
        topic: data.topic,
      };

      const result = await generateReadingMaterial(flowInput);
      setReadingResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.topic),
      });
    } catch (error) {
      console.error("Reading material generation error:", error);
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
    setReadingResult(null);
    setCurrentTopic("");
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    setMistakeArchiveStatus({});
    // stopSpeech(); // Удален вызов TTS
    // setIsTtsLoading(false);
    // setAudioSrc(null);
    // setIsPlayingTts(false);
    reset({
      topic: "",
      proficiencyLevel: userData.settings?.proficiencyLevel || proficiencyLevels[0],
    });
  };

  // handlePlayTts удалена

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleCheckAnswers = () => {
    if (!readingResult || !readingResult.comprehensionQuestions) return;
    let correctCount = 0;
    readingResult.comprehensionQuestions.forEach((q, index) => {
      if (q.answer && selectedAnswers[index] === q.answer) {
        correctCount++;
      }
    });
    setCorrectAnswersCount(correctCount);
    setIsAnswersSubmitted(true);
  };

  const handleTryAgain = () => {
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    setMistakeArchiveStatus({});
  };

  const handleArchiveMistake = (questionIndex: number) => {
    if (!readingResult || !readingResult.comprehensionQuestions || !userData.settings) return;
    const question = readingResult.comprehensionQuestions[questionIndex];
    const userAnswer = selectedAnswers[questionIndex];

    if (question && userAnswer && question.answer !== userAnswer) {
      addErrorToArchive({
        module: "Reading Practice",
        context: question.question,
        userAttempt: userAnswer,
        correctAnswer: question.answer || "N/A",
      });
      setMistakeArchiveStatus(prev => ({ ...prev, [questionIndex]: true }));
      toast({
        title: t('mistakeArchivedToastTitle'),
        description: t('mistakeArchivedToastDescription'),
      });
    }
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const hasTextToRead = readingResult && readingResult.readingText && readingResult.readingText.trim().length > 0;
  const hasQuestions = readingResult && readingResult.comprehensionQuestions && readingResult.comprehensionQuestions.length > 0;
  const totalQuestions = readingResult?.comprehensionQuestions?.length || 0;

  const getScoreMessage = () => {
    if (!isAnswersSubmitted || !hasQuestions) return null;
    if (correctAnswersCount === totalQuestions && totalQuestions > 0) {
      return t('scoreMessagePerfect').replace('{totalQuestions}', totalQuestions.toString());
    }
    if (correctAnswersCount === 0 && totalQuestions > 0) {
      return t('scoreMessageNone');
    }
    if (totalQuestions > 0) {
      return `${t('scoreMessagePart1')} ${correctAnswersCount} ${t('scoreMessagePart2')} ${totalQuestions} ${t('scoreMessagePart3')}`;
    }
    return null;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
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
              <Label htmlFor="topic">{t('topicLabel')}</Label>
              <Input id="topic" placeholder={t('topicPlaceholder')} {...register("topic")} />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="proficiencyLevel">{t('proficiencyLevelLabel')}</Label>
              <Controller
                name="proficiencyLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="proficiencyLevel">
                      <SelectValue placeholder={t('proficiencyLevelPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {proficiencyLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.proficiencyLevel && <p className="text-sm text-destructive">{errors.proficiencyLevel.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
              {t('getTextButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isAiLoading && !readingResult && (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      )}

      {readingResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {t('resultsTitlePrefix')} {currentTopic}
                {readingResult.title && <span className="block text-lg text-muted-foreground mt-1">({readingResult.title})</span>}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                <ClearIcon className="mr-2 h-4 w-4" />
                {t('clearResultsButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-lg">{t('readingTextHeader')} ({userData.settings!.targetLanguage})</h3>
                    {/* Кнопка TTS удалена */}
                </div>
                {hasTextToRead ? (
                <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                    <p className="whitespace-pre-wrap text-base leading-relaxed">{readingResult.readingText}</p>
                </ScrollArea>
                ) : (
                <div className="h-[250px] rounded-md border p-3 bg-muted/30 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground italic">{t('noTextGenerated')}</p>
                </div>
                )}
            </div>

            {hasQuestions && (
              <div>
                <h3 className="font-semibold text-lg mt-4 mb-1">{t('comprehensionQuestionsHeader')}</h3>
                <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                  <ul className="space-y-3">
                    {readingResult.comprehensionQuestions!.map((q, index) => {
                       const userAnswer = selectedAnswers[index];
                       const isCorrect = q.answer && userAnswer === q.answer;
                       const hasSubmitted = isAnswersSubmitted;

                      return (
                        <li key={index} className="text-sm p-3 rounded-md bg-card border">
                          <p className="font-medium mb-2 flex items-center"><HelpCircle className="h-4 w-4 mr-2 text-primary/80" />{q.question}</p>
                          {q.options && q.options.length > 0 ? (
                             <RadioGroup
                              value={userAnswer}
                              onValueChange={(value) => handleAnswerChange(index, value)}
                              disabled={hasSubmitted}
                              className="ml-4 space-y-1"
                            >
                              {q.options.map((opt, optIndex) => {
                                const isSelected = userAnswer === opt;
                                const isActualCorrectAnswer = q.answer === opt;
                                let labelClassName = "text-sm";
                                if (hasSubmitted && isSelected && isCorrect) {
                                  labelClassName = "text-sm font-semibold text-green-600 dark:text-green-400";
                                } else if (hasSubmitted && isSelected && !isCorrect) {
                                  labelClassName = "text-sm font-semibold text-red-600 dark:text-red-400";
                                } else if (hasSubmitted && !isSelected && isActualCorrectAnswer) {
                                  labelClassName = "text-sm font-semibold text-green-700 dark:text-green-500";
                                }


                                return (
                                  <div key={optIndex} className="flex items-center space-x-2">
                                    <RadioGroupItem value={opt} id={`q${index}-opt${optIndex}`} />
                                    <Label htmlFor={`q${index}-opt${optIndex}`} className={labelClassName}>
                                      {opt}
                                    </Label>
                                    {hasSubmitted && isSelected && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                    {hasSubmitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                                    {hasSubmitted && !isSelected && isActualCorrectAnswer && <Target className="h-4 w-4 text-green-700 opacity-70" />}
                                  </div>
                                );
                              })}
                            </RadioGroup>
                          ) : (
                             q.answer && hasSubmitted && (
                               <p className="text-xs text-muted-foreground mt-1 ml-4"><em>{t('answerIndication')}: {q.answer}</em></p>
                            )
                          )}
                          {q.answer && !q.options && !hasSubmitted && (
                              <p className="text-xs text-muted-foreground mt-1 ml-4 italic">Open question - input field coming soon.</p>
                          )}
                           {hasSubmitted && !isCorrect && q.answer && !mistakeArchiveStatus[index] && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={() => handleArchiveMistake(index)}
                              disabled={isAiLoading || mistakeArchiveStatus[index]}
                            >
                              <Archive className="mr-1.5 h-3.5 w-3.5" />
                              {t('archiveMistakeButton')}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
                {hasQuestions && (
                  <div className="mt-4">
                    {!isAnswersSubmitted ? (
                      <Button onClick={handleCheckAnswers} disabled={Object.keys(selectedAnswers).length === 0 || isAiLoading}>
                        {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
                        {t('checkAnswersButton')}
                      </Button>
                    ) : (
                      <Button onClick={handleTryAgain} variant="outline" disabled={isAiLoading}>
                        {t('tryAgainButton')}
                      </Button>
                    )}
                     {isAnswersSubmitted && (
                      <p className="text-sm mt-2 text-muted-foreground">{getScoreMessage()}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {readingResult && (!readingResult.comprehensionQuestions || readingResult.comprehensionQuestions.length === 0) && !isAiLoading && (
                <p className="text-sm text-muted-foreground italic mt-4 p-3 bg-muted/30 rounded-md">{t('noQuestions')}</p>
            )}
          </CardContent>
        </Card>
      )}
      {/* <audio ref={audioRef} onEnded={() => setIsPlayingTts(false)} />  TTS audio tag удален */}
    </div>
  );
}
