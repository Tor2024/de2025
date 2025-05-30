
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
import { generateListeningMaterial } from "@/ai/flows/generate-listening-material-flow";
import type { GenerateListeningMaterialInput, GenerateListeningMaterialOutput } from "@/ai/flows/generate-listening-material-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Headphones, Sparkles, Volume2, Ban, HelpCircle, Info, CheckCircle2, XCircle, Target, XCircle as ClearIcon, Archive } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, type TargetLanguage as AppTargetLanguage, type ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";


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
  archiveMistakeButton: "Archive this mistake",
  mistakeArchivedToastTitle: "Mistake Archived",
  mistakeArchivedToastDescription: "This mistake has been added to your error archive.",
  ttsUtteranceErrorTitle: "Speech Error",
  ttsUtteranceErrorDescription: "Could not play audio for the current text segment.",
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
  archiveMistakeButton: "Добавить ошибку в архив",
  mistakeArchivedToastTitle: "Ошибка добавлена в архив",
  mistakeArchivedToastDescription: "Эта ошибка была добавлена в ваш архив ошибок.",
  ttsUtteranceErrorTitle: "Ошибка синтеза речи",
  ttsUtteranceErrorDescription: "Не удалось воспроизвести аудио для текущего фрагмента текста.",
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

const selectPreferredVoice = (langCode: string, availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !availableVoices || !availableVoices.length) {
    console.warn('TTS: ListeningModuleClient - Voices not available or synthesis not supported.');
    return undefined;
  }

  console.log(`TTS: ListeningModuleClient - Selecting voice for lang "${langCode}". Available voices:`, availableVoices.map(v => ({name: v.name, lang: v.lang, default: v.default, localService: v.localService })));

  let targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(langCode));
  if (!targetLangVoices.length) {
    const baseLang = langCode.split('-')[0];
    targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(baseLang));
     if (targetLangVoices.length) {
      console.log(`TTS: ListeningModuleClient - No exact match for "${langCode}", using base lang "${baseLang}" voices.`);
    }
  }

  if (!targetLangVoices.length) {
    console.warn(`TTS: ListeningModuleClient - No voices found for lang "${langCode}" or base lang.`);
    return undefined;
  }

  const googleVoice = targetLangVoices.find(voice => voice.name.toLowerCase().includes('google'));
  if (googleVoice) {
    console.log('TTS: ListeningModuleClient - Selected Google voice:', googleVoice.name);
    return googleVoice;
  }

  const defaultVoice = targetLangVoices.find(voice => voice.default);
  if (defaultVoice) {
    console.log('TTS: ListeningModuleClient - Selected default voice:', defaultVoice.name);
    return defaultVoice;
  }

  const localServiceVoice = targetLangVoices.find(voice => voice.localService);
  if (localServiceVoice) {
    console.log('TTS: ListeningModuleClient - Selected local service voice:', localServiceVoice.name);
    return localServiceVoice;
  }
  
  if (targetLangVoices.length > 0) {
    console.log('TTS: ListeningModuleClient - Selected first available voice:', targetLangVoices[0].name);
    return targetLangVoices[0];
  }

  console.warn(`TTS: ListeningModuleClient - Could not select any voice for lang "${langCode}".`);
  return undefined;
};

const sanitizeTextForTTS = (text: string | undefined): string => {
  if (!text) return "";
  let sanitizedText = text;
  sanitizedText = sanitizedText.replace(/(\*{1,2}|_{1,2})(.+?)\1/g, '$2');
  sanitizedText = sanitizedText.replace(/[()]/g, ''); // Remove parentheses
  sanitizedText = sanitizedText.replace(/["«»„“]/g, ''); 
  sanitizedText = sanitizedText.replace(/'/g, ''); 
  sanitizedText = sanitizedText.replace(/`/g, ''); 
  sanitizedText = sanitizedText.replace(/^-\s+/gm, ''); 
  sanitizedText = sanitizedText.replace(/\s\s+/g, ' '); 
  return sanitizedText.trim();
};

export function ListeningModuleClient() {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [listeningResult, setListeningResult] = useState<GenerateListeningMaterialOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);
  const voicesRef = React.useRef<SpeechSynthesisVoice[]>([]);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isAnswersSubmitted, setIsAnswersSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [mistakeArchiveStatus, setMistakeArchiveStatus] = useState<Record<number, boolean>>({});

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ListeningFormData>({
    resolver: zodResolver(listeningSchema),
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

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        voicesRef.current = window.speechSynthesis.getVoices();
         console.log('TTS: ListeningModuleClient - Voices updated:', voicesRef.current.map(v => ({name: v.name, lang: v.lang})));
      }
    };
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
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
        if (event.error === "interrupted") {
          console.info('TTS: ListeningModuleClient - SpeechSynthesisUtterance playback was interrupted.', event);
        } else {
          console.error('TTS: ListeningModuleClient - SpeechSynthesisUtterance.onerror - Error type:', event.error, event);
          toast({
            title: t('ttsUtteranceErrorTitle'),
            description: t('ttsUtteranceErrorDescription'),
            variant: 'destructive',
          });
        }
        setCurrentlySpeakingTTSId(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (utteranceQueueRef.current.length > 0 && utteranceQueueRef.current[0].text === "Дзынь") {
        const lastUtteranceText = utteranceQueueRef.current[utteranceQueueRef.current.length -1]?.text;
        if (lastUtteranceText !== "Дзынь" || utteranceQueueRef.current.length > 1) {
          const endCueUtterance = new SpeechSynthesisUtterance("Дзынь");
          if (userData.settings) {
            endCueUtterance.lang = userData.settings.interfaceLanguage as AppInterfaceLanguage;
            const voice = selectPreferredVoice(userData.settings.interfaceLanguage, voicesRef.current || []);
            if (voice) endCueUtterance.voice = voice;
          }
           if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.speak(endCueUtterance);
           }
        }
      }
      setCurrentlySpeakingTTSId(null);
    }
  }, [userData.settings, t, toast, setCurrentlySpeakingTTSId, utteranceQueueRef, currentUtteranceIndexRef]); 

  const playText = useCallback((scriptId: string, textToSpeak: string | undefined, langCode: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        title: t('ttsNotSupportedTitle'),
        description: t('ttsNotSupportedDescription'),
        variant: 'destructive',
      });
      setCurrentlySpeakingTTSId(null);
      return;
    }

    if (window.speechSynthesis.speaking && currentlySpeakingTTSId === scriptId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingTTSId(null);
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const textToActuallySpeak = sanitizeTextForTTS(textToSpeak);
    if (!textToActuallySpeak) {
      setCurrentlySpeakingTTSId(null);
      return;
    }

    utteranceQueueRef.current = [];

    const startCueUtterance = new SpeechSynthesisUtterance("Дзынь");
    if (userData.settings) {
      startCueUtterance.lang = userData.settings.interfaceLanguage as AppInterfaceLanguage;
      const startVoice = selectPreferredVoice(userData.settings.interfaceLanguage, voicesRef.current || []);
      if (startVoice) startCueUtterance.voice = startVoice;
    }
    utteranceQueueRef.current.push(startCueUtterance);

    const sentences = textToActuallySpeak.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0 && textToActuallySpeak) sentences.push(textToActuallySpeak);

    const selectedVoice = selectPreferredVoice(langCode, voicesRef.current || []);

    sentences.forEach(sentence => {
        const utterance = new SpeechSynthesisUtterance(sentence.trim());
        utterance.lang = langCode;
        if(selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utteranceQueueRef.current.push(utterance);
    });
    
    currentUtteranceIndexRef.current = 0;
    setCurrentlySpeakingTTSId(scriptId);
    speakNext();
  }, [currentlySpeakingTTSId, speakNext, t, toast, userData.settings, setCurrentlySpeakingTTSId, utteranceQueueRef, currentUtteranceIndexRef]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingTTSId(null);
  }, [setCurrentlySpeakingTTSId]);

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
    setMistakeArchiveStatus({});
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
    setMistakeArchiveStatus({});
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
    setMistakeArchiveStatus({});
  };

  const handleArchiveMistake = (questionIndex: number) => {
    if (!listeningResult || !listeningResult.comprehensionQuestions || !userData.settings) return;
    const question = listeningResult.comprehensionQuestions[questionIndex];
    const userAnswer = selectedAnswers[questionIndex];

    if (question && userAnswer && question.answer !== userAnswer) {
      addErrorToArchive({
        module: "Listening Practice",
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


  const hasScriptText = !!(listeningResult && listeningResult.script && listeningResult.script.trim().length > 0);
  const hasQuestions = !!(listeningResult && listeningResult.comprehensionQuestions && listeningResult.comprehensionQuestions.length > 0);
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

      {isAiLoading && !listeningResult && (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      )}

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
                 <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-md">{t('noScenario')}</p>
            )}


            <div>
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-lg">{t('scriptHeader')} ({userData.settings.targetLanguage})</h3>
                    {typeof window !== 'undefined' && window.speechSynthesis && hasScriptText && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (!hasScriptText || !listeningResult.script) return;
                                const scriptId = listeningResult.title || `script-${currentTopic.replace(/\s+/g, '-') || Date.now()}`;
                                if (currentlySpeakingTTSId === scriptId) {
                                    stopSpeech();
                                } else {
                                    playText(scriptId, listeningResult.script, userData.settings!.targetLanguage as AppTargetLanguage);
                                }
                            }}
                            className="shrink-0"
                            aria-label={currentlySpeakingTTSId === (listeningResult.title || `script-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}
                            disabled={!hasScriptText || isAiLoading}
                            >
                            {currentlySpeakingTTSId === (listeningResult.title || `script-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? <Ban className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                            {currentlySpeakingTTSId === (listeningResult.title || `script-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{currentlySpeakingTTSId === (listeningResult.title || `script-${currentTopic.replace(/\s+/g, '-') || Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}</p>
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
            {listeningResult && (!listeningResult.comprehensionQuestions || listeningResult.comprehensionQuestions.length === 0) && !isAiLoading && (
                <p className="text-sm text-muted-foreground italic mt-4 p-3 bg-muted/30 rounded-md">{t('noQuestions')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
