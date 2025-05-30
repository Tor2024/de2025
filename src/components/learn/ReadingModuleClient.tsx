
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { generateReadingMaterial } from "@/ai/flows/generate-reading-material-flow";
import type { GenerateReadingMaterialInput, GenerateReadingMaterialOutput } from "@/ai/flows/generate-reading-material-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BookOpen, HelpCircle, Sparkles, Volume2, Ban, CheckCircle2, XCircle, Target, XCircle as ClearIcon, Archive } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { interfaceLanguageCodes } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";


const readingSchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});
type ReadingFormData = z.infer<typeof readingSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Reading Practice",
  description: "Enter a topic you'd like to read about. Our AI will generate a text in your target language, adapted to your proficiency level, along with optional comprehension questions.",
  topicLabel: "Topic for Reading",
  topicPlaceholder: "E.g., My Daily Routine, Space Exploration, German Food",
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
  ttsPlayText: "Play text",
  ttsStopText: "Stop speech",
  ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
  ttsNotSupportedTitle: "TTS Not Supported",
  ttsNotSupportedDescription: "Text-to-Speech is not supported by your browser.",
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
};

const baseRuTranslations: Record<string, string> = {
  title: "Практика чтения",
  description: "Введите тему, о которой вы хотели бы почитать. Наш ИИ сгенерирует текст на изучаемом вами языке, адаптированный к вашему уровню, а также опциональные вопросы на понимание.",
  topicLabel: "Тема для чтения",
  topicPlaceholder: "Напр., Мой распорядок дня, Освоение космоса, Немецкая кухня",
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
  ttsPlayText: "Озвучить текст",
  ttsStopText: "Остановить озвучку",
  ttsExperimentalText: "Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
  ttsNotSupportedTitle: "TTS не поддерживается",
  ttsNotSupportedDescription: "Функция озвучивания текста не поддерживается вашим браузером.",
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

export function ReadingModuleClient() {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [readingResult, setReadingResult] = useState<GenerateReadingMaterialOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const [currentlySpeakingTextId, setCurrentlySpeakingTextId] = useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isAnswersSubmitted, setIsAnswersSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [mistakeArchiveStatus, setMistakeArchiveStatus] = useState<Record<number, boolean>>({});


  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReadingFormData>({
    resolver: zodResolver(readingSchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };

  React.useEffect(() => {
    // Cleanup speechSynthesis on component unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakNext = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && currentUtteranceIndexRef.current < utteranceQueueRef.current.length) {
      const utterance = utteranceQueueRef.current[currentUtteranceIndexRef.current];
      utterance.onend = () => {
        currentUtteranceIndexRef.current++;
        speakNext();
      };
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setCurrentlySpeakingTextId(null); // Reset on error
      };
      window.speechSynthesis.speak(utterance);
    } else {
       // All main text segments are spoken
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const endCue = new SpeechSynthesisUtterance("Дзынь"); // "Дзынь" at the end
        endCue.lang = userData.settings!.interfaceLanguage as AppInterfaceLanguage;
        window.speechSynthesis.speak(endCue);
      }
      setCurrentlySpeakingTextId(null);
    }
  }, [userData.settings, setCurrentlySpeakingTextId]);

  const playText = useCallback((textId: string, textToSpeak: string | undefined, langCode: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        title: t('ttsNotSupportedTitle'),
        description: t('ttsNotSupportedDescription'),
        variant: 'destructive',
      });
      setCurrentlySpeakingTextId(null);
      return;
    }

    if (window.speechSynthesis.speaking && currentlySpeakingTextId === textId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingTextId(null);
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    const trimmedTextToSpeak = textToSpeak ? textToSpeak.trim() : "";
    if (!trimmedTextToSpeak) {
      setCurrentlySpeakingTextId(null);
      return; // Don't play if text is empty
    }

    const startCue = new SpeechSynthesisUtterance("Дзынь"); // "Дзынь" at the beginning
    startCue.lang = userData.settings!.interfaceLanguage as AppInterfaceLanguage;

    const sentences = trimmedTextToSpeak.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0 && trimmedTextToSpeak) sentences.push(trimmedTextToSpeak);

    utteranceQueueRef.current = [
        startCue,
        ...sentences.map(sentence => {
            const utterance = new SpeechSynthesisUtterance(sentence.trim());
            utterance.lang = langCode;
            return utterance;
        })
    ];
    
    currentUtteranceIndexRef.current = 0;
    setCurrentlySpeakingTextId(textId);
    speakNext();
  }, [currentlySpeakingTextId, speakNext, t, toast, userData.settings, setCurrentlySpeakingTextId]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingTextId(null);
  }, [setCurrentlySpeakingTextId]);


  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p>{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<ReadingFormData> = async (data) => {
    setIsAiLoading(true);
    setReadingResult(null);
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    setMistakeArchiveStatus({});
    stopSpeech();
    setCurrentTopic(data.topic);
    try {
      const flowInput: GenerateReadingMaterialInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage as AppTargetLanguage,
        proficiencyLevel: userData.settings!.proficiencyLevel as AppProficiencyLevel,
        topic: data.topic,
      };

      const result = await generateReadingMaterial(flowInput);
      setReadingResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.topic),
      });
      reset(); 
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
    stopSpeech();
  };

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
        correctAnswer: question.answer,
      });
      setMistakeArchiveStatus(prev => ({ ...prev, [questionIndex]: true }));
      toast({
        title: t('mistakeArchivedToastTitle'),
        description: t('mistakeArchivedToastDescription'),
      });
    }
  };

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
            {typeof window !== 'undefined' && window.speechSynthesis && (
              <span className="block text-xs text-muted-foreground mt-1 italic">{t('ttsExperimentalText')}</span>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                    <h3 className="font-semibold text-lg">{t('readingTextHeader')} ({userData.settings.targetLanguage})</h3>
                    {typeof window !== 'undefined' && window.speechSynthesis && (
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (!hasTextToRead || !readingResult.readingText) return;
                                const textId = readingResult.title || `text-${currentTopic.replace(/\s+/g, '-') || Date.now()}`;
                                if (currentlySpeakingTextId === textId) {
                                    stopSpeech();
                                } else {
                                    playText(textId, readingResult.readingText, userData.settings!.targetLanguage as AppTargetLanguage);
                                }
                            }}
                            className="shrink-0"
                            aria-label={currentlySpeakingTextId === (readingResult.title || `text-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? t('ttsStopText') : t('ttsPlayText')}
                            disabled={!hasTextToRead || isAiLoading}
                            >
                            {currentlySpeakingTextId === (readingResult.title || `text-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? <Ban className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                            {currentlySpeakingTextId === (readingResult.title || `text-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? t('ttsStopText') : t('ttsPlayText')}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{currentlySpeakingTextId === (readingResult.title || `text-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? t('ttsStopText') : t('ttsPlayText')}</p>
                        </TooltipContent>
                        </Tooltip>
                    )}
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
                              disabled={isAiLoading}
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
            {(!readingResult.comprehensionQuestions || readingResult.comprehensionQuestions.length === 0) && !isAiLoading && (
                <p className="text-sm text-muted-foreground italic mt-4">{t('noQuestions')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    