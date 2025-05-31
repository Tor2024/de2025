
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
import { BookOpen, HelpCircle, Sparkles, CheckCircle2, XCircle, Target, XCircle as ClearIcon, Archive, Volume2, Ban } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { interfaceLanguageCodes, proficiencyLevels, mapInterfaceLanguageToBcp47, mapTargetLanguageToBcp47 } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  description: "Enter a topic and select a proficiency level. Our AI will generate a text in your target language, along with optional comprehension questions. Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
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
  ttsPlayText: "Play text",
  ttsStopText: "Stop speech",
  ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
  ttsNotSupportedTitle: "TTS Not Supported",
  ttsNotSupportedDescription: "Text-to-Speech is not supported by your browser.",
  ttsUtteranceErrorTitle: "Speech Error",
  ttsUtteranceErrorDescription: "Could not play audio for the current text segment.",
};

const baseRuTranslations: Record<string, string> = {
  title: "Практика чтения",
  description: "Введите тему и выберите уровень сложности. Наш ИИ сгенерирует текст на изучаемом вами языке, а также опциональные вопросы на понимание. Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
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
  ttsPlayText: "Озвучить текст",
  ttsStopText: "Остановить озвучку",
  ttsExperimentalText: "Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
  ttsNotSupportedTitle: "TTS не поддерживается",
  ttsNotSupportedDescription: "Функция озвучивания текста не поддерживается вашим браузером.",
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

export function ReadingModuleClient() {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [readingResult, setReadingResult] = useState<GenerateReadingMaterialOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = useState<string | null>(null);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = useRef<number>(0);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const playTextInternalIdRef = React.useRef<number>(0);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isAnswersSubmitted, setIsAnswersSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [mistakeArchiveStatus, setMistakeArchiveStatus] = useState<Record<number, boolean>>({});


  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm<ReadingFormData>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      topic: "",
      proficiencyLevel: userData.settings?.proficiencyLevel || proficiencyLevels[0],
    },
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = useCallback((key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  }, [currentLang]);

  // TTS Logic
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        voicesRef.current = window.speechSynthesis.getVoices();
        console.log(`TTS: ReadingModuleClient - Voices loaded/changed for ${currentLang}:`, voicesRef.current.filter(v => v.lang.startsWith(mapInterfaceLanguageToBcp47(currentLang))).map(v => ({ name: v.name, lang: v.lang, default: v.default, localService: v.localService })));
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
      setCurrentlySpeakingTTSId(null);
    };
  }, [currentLang]);

  const selectPreferredVoice = useCallback((langCode: string, availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !availableVoices || !availableVoices.length) {
      console.warn('TTS: ReadingModuleClient - Voices not available or synthesis not supported.');
      return undefined;
    }
    console.log(`TTS: ReadingModuleClient - Selecting voice for lang "${langCode}". Available voices:`, availableVoices.map(v => ({name: v.name, lang: v.lang, default: v.default, localService: v.localService })));

    let targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(langCode));
    if (!targetLangVoices.length) {
      const baseLang = langCode.split('-')[0];
      targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(baseLang));
      if (targetLangVoices.length) {
        console.log(`TTS: ReadingModuleClient - No exact match for "${langCode}", using base lang "${baseLang}" voices.`);
      }
    }

    if (!targetLangVoices.length) {
      console.warn(`TTS: ReadingModuleClient - No voices found for lang "${langCode}" or base lang.`);
      return undefined;
    }
    
    if (langCode.startsWith('de')) {
      const specificGermanVoice = targetLangVoices.find(voice =>
        voice.name.toLowerCase().includes('german') || voice.name.toLowerCase().includes('deutsch')
      );
      if (specificGermanVoice) {
        console.log(`TTS: ReadingModuleClient - Selected specific German voice: ${specificGermanVoice.name}`);
        return specificGermanVoice;
      }
    }
    
    const googleVoice = targetLangVoices.find(voice => voice.name.toLowerCase().includes('google'));
    if (googleVoice) {
      console.log('TTS: ReadingModuleClient - Selected Google voice:', googleVoice.name);
      return googleVoice;
    }

    const defaultVoice = targetLangVoices.find(voice => voice.default);
    if (defaultVoice) {
      console.log('TTS: ReadingModuleClient - Selected default voice:', defaultVoice.name);
      return defaultVoice;
    }
    
    const localServiceVoice = targetLangVoices.find(voice => voice.localService);
    if (localServiceVoice) {
      console.log('TTS: ReadingModuleClient - Selected local service voice:', localServiceVoice.name);
      return localServiceVoice;
    }
    
    if (targetLangVoices.length > 0) {
      console.log('TTS: ReadingModuleClient - Selected first available voice:', targetLangVoices[0].name);
      return targetLangVoices[0];
    }
    
    console.warn(`TTS: ReadingModuleClient - Could not select any voice for lang "${langCode}".`);
    return undefined;
  }, []);

  const sanitizeTextForTTS = useCallback((text: string | undefined): string => {
    if (!text) return "";
    let sanitizedText = text;
    sanitizedText = sanitizedText.replace(/(\*{1,2}|_{1,2})(.+?)\1/g, '$2');
    sanitizedText = sanitizedText.replace(/["«»„“]/g, '');
    sanitizedText = sanitizedText.replace(/'/g, '');
    sanitizedText = sanitizedText.replace(/`/g, '');
    sanitizedText = sanitizedText.replace(/^-\s+/gm, '');
    sanitizedText = sanitizedText.replace(/[()]/g, '');
    sanitizedText = sanitizedText.replace(/\s+-\s+/g, ', '); 
    sanitizedText = sanitizedText.replace(/#+/g, '');
    sanitizedText = sanitizedText.replace(/\s\s+/g, ' ');
    return sanitizedText.trim();
  }, []);

  const speakNext = useCallback((currentPlayId: number) => {
     if (playTextInternalIdRef.current !== currentPlayId) {
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        setCurrentlySpeakingTTSId(null);
        return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis && currentUtteranceIndexRef.current < utteranceQueueRef.current.length) {
      const utterance = utteranceQueueRef.current[currentUtteranceIndexRef.current];
      utterance.onend = () => {
        currentUtteranceIndexRef.current++;
        speakNext(currentPlayId);
      };
      utterance.onerror = (event) => {
        if (event.error === "interrupted") {
          console.info('TTS: ReadingModuleClient - Speech synthesis interrupted by user or new call.');
        } else {
          console.error('TTS: ReadingModuleClient - SpeechSynthesisUtterance.onerror - Error type:', event.error);
          toast({ title: t('ttsUtteranceErrorTitle'), description: t('ttsUtteranceErrorDescription'), variant: 'destructive' });
        }
        setCurrentlySpeakingTTSId(null);
      };
      console.log(`TTS: ReadingModuleClient - Speaking segment: "${utterance.text.substring(0,30)}...", Lang: ${utterance.lang}, Voice: ${utterance.voice ? utterance.voice.name : 'Default'}`);
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlySpeakingTTSId(null);
    }
  }, [setCurrentlySpeakingTTSId, toast, t, ttsUtteranceErrorTitle, ttsUtteranceErrorDescription]);

  const playText = useCallback((textId: string, textToSpeak: string | undefined, langCode: string) => {
    playTextInternalIdRef.current += 1;
    const currentPlayId = playTextInternalIdRef.current;

    if (typeof window === 'undefined' || !window.speechSynthesis || !userData.settings) {
      toast({ title: t('ttsNotSupportedTitle'), description: t('ttsNotSupportedDescription'), variant: "destructive" });
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    utteranceQueueRef.current = [];
    currentUtteranceIndexRef.current = 0;

    const fullText = textToSpeak || "";
    if (!fullText.trim()) {
      setCurrentlySpeakingTTSId(null);
      return;
    }
    
    const interfaceLangBcp47 = mapInterfaceLanguageToBcp47(userData.settings.interfaceLanguage);
    const startSignalUtterance = new SpeechSynthesisUtterance("Пииип");
    startSignalUtterance.lang = interfaceLangBcp47;
    const startVoice = selectPreferredVoice(interfaceLangBcp47, voicesRef.current || []);
    if (startVoice) startSignalUtterance.voice = startVoice;
    startSignalUtterance.rate = 0.95;
    startSignalUtterance.pitch = 1.1;
    utteranceQueueRef.current.push(startSignalUtterance);

    const sanitizedText = sanitizeTextForTTS(fullText);
    const sentences = sanitizedText.match(/[^.!?\n]+[.!?\n]*|[^.!?\n]+$/g) || [sanitizedText];
    sentences.forEach(sentenceText => {
      if (sentenceText.trim()) {
        const utterance = new SpeechSynthesisUtterance(sentenceText.trim());
        utterance.lang = langCode; 
        const voice = selectPreferredVoice(langCode, voicesRef.current || []);
        if (voice) utterance.voice = voice;
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        utteranceQueueRef.current.push(utterance);
      }
    });
    
    const endSignalUtterance = new SpeechSynthesisUtterance("Пииип");
    endSignalUtterance.lang = interfaceLangBcp47;
    const endVoice = selectPreferredVoice(interfaceLangBcp47, voicesRef.current || []);
    if (endVoice) endSignalUtterance.voice = endVoice;
    endSignalUtterance.rate = 0.95;
    endSignalUtterance.pitch = 1.1;
    utteranceQueueRef.current.push(endSignalUtterance);
    
    setCurrentlySpeakingTTSId(textId);
    speakNext(currentPlayId);
  }, [sanitizeTextForTTS, speakNext, toast, t, selectPreferredVoice, userData.settings, ttsNotSupportedTitle, ttsNotSupportedDescription]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingTTSId(null);
  }, [setCurrentlySpeakingTTSId]);
  // End TTS Logic


  const fetchReadingMaterial = useCallback(async (formData: ReadingFormData) => {
    if (!userData.settings) {
      toast({ title: t('onboardingMissing'), variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setReadingResult(null);
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    setMistakeArchiveStatus({});
    stopSpeech(); 
    setCurrentTopic(formData.topic);
    try {
      const flowInput: GenerateReadingMaterialInput = {
        interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings.targetLanguage as AppTargetLanguage,
        proficiencyLevel: formData.proficiencyLevel as AppProficiencyLevel,
        topic: formData.topic,
      };
      const result = await generateReadingMaterial(flowInput);
      setReadingResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', formData.topic),
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
  }, [userData.settings, toast, t, stopSpeech]);

  const onSubmit: SubmitHandler<ReadingFormData> = async (data) => {
    await fetchReadingMaterial(data);
    // Не сбрасываем форму здесь, чтобы пользователь мог легко изменить только тему или уровень
  };
  
  useEffect(() => {
    // Initialize form with user's default proficiency or first available if not set
    if (userData.settings) {
      setValue('proficiencyLevel', userData.settings.proficiencyLevel);
    }
  }, [userData.settings, setValue]);


  const handleClearResults = () => {
    setReadingResult(null);
    setCurrentTopic("");
    setSelectedAnswers({});
    setIsAnswersSubmitted(false);
    setCorrectAnswersCount(0);
    setMistakeArchiveStatus({});
    stopSpeech();
    reset({ 
        topic: "", 
        proficiencyLevel: userData.settings?.proficiencyLevel || proficiencyLevels[0] 
    });
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
  const ttsPlayButtonId = `tts-reading-${readingResult?.title?.replace(/\s+/g, '-') || currentTopic.replace(/\s+/g, '-') || 'text'}`;
  const isCurrentlySpeakingThisText = currentlySpeakingTTSId === ttsPlayButtonId;


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
              {readingResult && (
                <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                  <ClearIcon className="mr-2 h-4 w-4" />
                  {t('clearResultsButton')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-lg">{t('readingTextHeader')} ({userData.settings!.targetLanguage})</h3>
                    {typeof window !== 'undefined' && window.speechSynthesis && hasTextToRead && (
                       <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                if (isCurrentlySpeakingThisText) {
                                  stopSpeech();
                                } else {
                                  if (userData.settings?.targetLanguage) {
                                     const langCode = mapTargetLanguageToBcp47(userData.settings.targetLanguage);
                                     playText(ttsPlayButtonId, readingResult.readingText, langCode);
                                  }
                                }
                              }}
                              aria-label={isCurrentlySpeakingThisText ? t('ttsStopText') : t('ttsPlayText')}
                              className="ml-2 p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                              disabled={!hasTextToRead}
                            >
                              {isCurrentlySpeakingThisText ? <Ban className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isCurrentlySpeakingThisText ? t('ttsStopText') : t('ttsPlayText')}</p>
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
                 <div className="p-3 bg-muted/30 rounded-md mt-4">
                    <p className="text-sm text-muted-foreground italic">{t('noQuestions')}</p>
                 </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
