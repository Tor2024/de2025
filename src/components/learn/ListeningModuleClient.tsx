
"use client";

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
import { generateListeningMaterial } from "@/ai/flows/generate-listening-material-flow";
import type { GenerateListeningMaterialInput, GenerateListeningMaterialOutput } from "@/ai/flows/generate-listening-material-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Headphones, Sparkles, Volume2, Ban, HelpCircle, Info, CheckCircle2, XCircle, Target, XCircle as ClearIcon } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, type TargetLanguage as AppTargetLanguage, type ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


const listeningSchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});
type ListeningFormData = z.infer<typeof listeningSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Listening Practice",
  description: "Enter a topic. Our AI will generate a short script (dialogue or monologue) in your target language, adapted to your proficiency level, along with optional comprehension questions. You can listen to the script using Text-to-Speech.",
  topicLabel: "Topic for Listening Material",
  topicPlaceholder: "E.g., Weekend plans, Ordering at a cafe, A news report",
  getMaterialButton: "Get Listening Material",
  resultsTitlePrefix: "Listening Material on:",
  scenarioHeader: "Scenario",
  scriptHeader: "Script",
  comprehensionQuestionsHeader: "Comprehension Questions",
  toastSuccessTitle: "Listening Material Generated!",
  toastSuccessDescriptionTemplate: "Listening material about \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate listening material. Please try again.",
  onboardingMissing: "Please complete onboarding first to set your languages and proficiency.",
  loading: "Loading...",
  noScenario: "No scenario description provided.",
  noQuestions: "No comprehension questions were generated for this script.",
  answerIndication: "Answer indication",
  ttsPlayScript: "Play script",
  ttsStopScript: "Stop script",
  ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
  ttsNotSupportedTitle: "TTS Not Supported",
  ttsNotSupportedDescription: "Text-to-Speech is not supported by your browser.",
  noScriptGenerated: "The AI did not generate a script for this topic. Please try a different topic or try again.",
  checkAnswersButton: "Check Answers",
  tryAgainButton: "Try Again",
  clearResultsButton: "Clear Results",
  scoreMessagePart1: "You answered",
  scoreMessagePart2: "out of",
  scoreMessagePart3: "questions correctly.",
  scoreMessagePerfect: "Perfect! All {totalQuestions} questions correct.",
  scoreMessageNone: "No correct answers this time. Try again!",
};

const baseRuTranslations: Record<string, string> = {
  title: "Практика аудирования",
  description: "Введите тему. Наш ИИ сгенерирует короткий сценарий (диалог или монолог) на изучаемом вами языке, адаптированный к вашему уровню, а также опциональные вопросы на понимание. Вы можете прослушать сценарий с помощью функции Text-to-Speech.",
  topicLabel: "Тема для аудирования",
  topicPlaceholder: "Напр., Планы на выходные, Заказ в кафе, Новостной репортаж",
  getMaterialButton: "Получить материал",
  resultsTitlePrefix: "Материал для аудирования по теме:",
  scenarioHeader: "Сценарий",
  scriptHeader: "Скрипт",
  comprehensionQuestionsHeader: "Вопросы на понимание",
  toastSuccessTitle: "Материал для аудирования создан!",
  toastSuccessDescriptionTemplate: "Материал по теме \"{topic}\" готов.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать материал для аудирования. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг, чтобы установить языки и уровень.",
  loading: "Загрузка...",
  noScenario: "Описание сценария не предоставлено.",
  noQuestions: "Для этого скрипта не было сгенерировано вопросов на понимание.",
  answerIndication: "Указание на ответ",
  ttsPlayScript: "Озвучить скрипт",
  ttsStopScript: "Остановить озвучку",
  ttsExperimentalText: "Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
  ttsNotSupportedTitle: "TTS не поддерживается",
  ttsNotSupportedDescription: "Функция озвучивания текста не поддерживается вашим браузером.",
  noScriptGenerated: "ИИ не сгенерировал скрипт для этой темы. Пожалуйста, попробуйте другую тему или повторите попытку.",
  checkAnswersButton: "Проверить ответы",
  tryAgainButton: "Попробовать снова",
  clearResultsButton: "Очистить результаты",
  scoreMessagePart1: "Вы ответили правильно на",
  scoreMessagePart2: "из",
  scoreMessagePart3: "вопросов.",
  scoreMessagePerfect: "Отлично! Все {totalQuestions} вопросов правильно.",
  scoreMessageNone: "В этот раз нет правильных ответов. Попробуйте снова!",
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

export function ListeningModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [listeningResult, setListeningResult] = useState<GenerateListeningMaterialOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const [currentlySpeakingScriptId, setCurrentlySpeakingScriptId] = useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isAnswersSubmitted, setIsAnswersSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ListeningFormData>({
    resolver: zodResolver(listeningSchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };

  useEffect(() => {
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
        setCurrentlySpeakingScriptId(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlySpeakingScriptId(null);
    }
  }, []);

  const playText = useCallback((scriptId: string, textToSpeak: string | undefined, langCode: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        title: t('ttsNotSupportedTitle'),
        description: t('ttsNotSupportedDescription'),
        variant: 'destructive',
      });
      setCurrentlySpeakingScriptId(null);
      return;
    }

    if (window.speechSynthesis.speaking && currentlySpeakingScriptId === scriptId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingScriptId(null);
      return;
    }
    
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const trimmedTextToSpeak = textToSpeak ? textToSpeak.trim() : "";
    if (!trimmedTextToSpeak) {
      setCurrentlySpeakingScriptId(null);
      return;
    }

    const sentences = trimmedTextToSpeak.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0 && trimmedTextToSpeak) sentences.push(trimmedTextToSpeak);

    utteranceQueueRef.current = sentences.map(sentence => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.lang = langCode;
      return utterance;
    });

    currentUtteranceIndexRef.current = 0;
    setCurrentlySpeakingScriptId(scriptId);
    speakNext();
  }, [currentlySpeakingScriptId, speakNext, t, toast]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingScriptId(null);
  }, []);

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<ListeningFormData> = async (data) => {
    setIsAiLoading(true);
    setListeningResult(null);
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    stopSpeech(); 
    setCurrentTopic(data.topic);
    try {
      const flowInput: GenerateListeningMaterialInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage as AppTargetLanguage,
        proficiencyLevel: userData.settings!.proficiencyLevel as AppProficiencyLevel,
        topic: data.topic,
      };

      const result = await generateListeningMaterial(flowInput);
      setListeningResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.topic),
      });
      reset(); 
    } catch (error) {
      console.error("Listening material generation error:", error);
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
    setListeningResult(null);
    setCurrentTopic("");
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    stopSpeech();
  };
  
  const handleAnswerChange = (questionIndex: number, value: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleCheckAnswers = () => {
    if (!listeningResult || !listeningResult.comprehensionQuestions) return;
    let correctCount = 0;
    listeningResult.comprehensionQuestions.forEach((q, index) => {
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
  };

  const hasScriptText = listeningResult && listeningResult.script && listeningResult.script.trim().length > 0;
  const hasQuestions = listeningResult && listeningResult.comprehensionQuestions && listeningResult.comprehensionQuestions.length > 0;
  const totalQuestions = listeningResult?.comprehensionQuestions?.length || 0;

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
            <Headphones className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}
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
              {t('getMaterialButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {listeningResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {t('resultsTitlePrefix')} {currentTopic}
                {listeningResult.title && <span className="block text-lg text-muted-foreground mt-1">({listeningResult.title})</span>}
              </CardTitle>
               <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                <ClearIcon className="mr-2 h-4 w-4" />
                {t('clearResultsButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {listeningResult.scenario && (
              <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Info className="h-5 w-5 text-primary/80"/>{t('scenarioHeader')}</h3>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{listeningResult.scenario}</p>
              </div>
            )}
             {!listeningResult.scenario && !isAiLoading && (
                <p className="text-sm text-muted-foreground italic">{t('noScenario')}</p>
            )}


            <div>
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-lg">{t('scriptHeader')} ({userData.settings.targetLanguage})</h3>
                    {typeof window !== 'undefined' && window.speechSynthesis && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (!hasScriptText || !listeningResult.script) return; 
                                const scriptId = listeningResult.title || `script-${Date.now()}`;
                                if (currentlySpeakingScriptId === scriptId) {
                                    stopSpeech();
                                } else {
                                    playText(scriptId, listeningResult.script, userData.settings!.targetLanguage as AppTargetLanguage);
                                }
                            }}
                            className="shrink-0"
                            aria-label={currentlySpeakingScriptId === (listeningResult.title || `script-${Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}
                            disabled={!hasScriptText || isAiLoading}
                            >
                            {currentlySpeakingScriptId === (listeningResult.title || `script-${Date.now()}`) ? <Ban className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                            {currentlySpeakingScriptId === (listeningResult.title || `script-${Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{currentlySpeakingScriptId === (listeningResult.title || `script-${Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                </div>
                {hasScriptText ? (
                    <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                        <p className="whitespace-pre-wrap text-base leading-relaxed">{listeningResult.script}</p>
                    </ScrollArea>
                ) : (
                  <div className="h-[250px] rounded-md border p-3 bg-muted/30 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground italic">{t('noScriptGenerated')}</p>
                  </div>
                )}
            </div>
            
            {hasQuestions && (
              <div>
                <h3 className="font-semibold text-lg mt-4 mb-1">{t('comprehensionQuestionsHeader')}</h3>
                <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                  <ul className="space-y-3">
                    {listeningResult.comprehensionQuestions!.map((q, index) => {
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
                                  labelClassName = "text-sm font-semibold text-green-600";
                                } else if (hasSubmitted && isSelected && !isCorrect) {
                                  labelClassName = "text-sm font-semibold text-red-600";
                                } else if (hasSubmitted && !isSelected && isActualCorrectAnswer) {
                                  labelClassName = "text-sm text-green-700"; 
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
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
                {hasQuestions && (
                  <div className="mt-4">
                    {!isAnswersSubmitted ? (
                      <Button onClick={handleCheckAnswers} disabled={Object.keys(selectedAnswers).length === 0 || isAiLoading}>
                        {t('checkAnswersButton')}
                      </Button>
                    ) : (
                      <Button onClick={handleTryAgain} variant="outline">
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
            {(!listeningResult.comprehensionQuestions || listeningResult.comprehensionQuestions.length === 0) && !isAiLoading && (
                <p className="text-sm text-muted-foreground italic mt-4">{t('noQuestions')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    
