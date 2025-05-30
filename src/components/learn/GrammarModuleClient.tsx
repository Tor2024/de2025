
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
import { adaptiveGrammarExplanations, explainGrammarTaskError } from "@/ai/flows/adaptive-grammar-explanations"; 
import type { AdaptiveGrammarExplanationsInput, AdaptiveGrammarExplanationsOutput, PracticeTask, ExplainGrammarTaskErrorInput } from "@/ai/flows/adaptive-grammar-explanations";
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles, XCircle, Volume2, Ban, CheckCircle2 } from "lucide-react";
import { interfaceLanguageCodes } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const grammarSchema = z.object({
  grammarTopic: z.string().min(3, "Topic should be at least 3 characters"),
});

type GrammarFormData = z.infer<typeof grammarSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Adaptive Grammar Explanations",
  description: "Enter a grammar topic you want to understand better. Our AI tutor will provide a clear explanation and practice tasks tailored to your level and goals.",
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
  ttsPlayExplanation: "Play explanation",
  ttsStopExplanation: "Stop explanation",
  ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
  ttsNotSupportedTitle: "TTS Not Supported",
  ttsNotSupportedDescription: "Text-to-Speech is not supported by your browser.",
  ttsUtteranceErrorTitle: "Speech Error",
  ttsUtteranceErrorDescription: "Could not play audio for the current text segment.",
  checkAnswerButton: "Check Answer",
  yourAnswerLabel: "Your Answer:",
  feedbackCorrect: "Correct!",
  feedbackIncorrectPrefix: "Incorrect. Correct answer:",
  aiErrorAnalysisHeader: "AI Error Analysis:",
  loadingAiExplanation: "Loading AI explanation for your error...",
};

const baseRuTranslations: Record<string, string> = {
  title: "Адаптивные объяснения грамматики",
  description: "Введите грамматическую тему, которую вы хотите лучше понять. Наш AI-репетитор предоставит четкое объяснение и практические задания, адаптированные к вашему уровню и целям.",
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
  ttsPlayExplanation: "Озвучить объяснение",
  ttsStopExplanation: "Остановить озвучку",
  ttsExperimentalText: "Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
  ttsNotSupportedTitle: "TTS не поддерживается",
  ttsNotSupportedDescription: "Функция озвучивания текста не поддерживается вашим браузером.",
  ttsUtteranceErrorTitle: "Ошибка синтеза речи",
  ttsUtteranceErrorDescription: "Не удалось воспроизвести аудио для текущего фрагмента текста.",
  checkAnswerButton: "Проверить ответ",
  yourAnswerLabel: "Ваш ответ:",
  feedbackCorrect: "Правильно!",
  feedbackIncorrectPrefix: "Неправильно. Правильный ответ:",
  aiErrorAnalysisHeader: "Разбор ошибки ИИ:",
  loadingAiExplanation: "Загрузка объяснения ошибки от ИИ...",
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
          return (
            <Tooltip key={`${part}-${index}-${Math.random().toString(36).substring(2,9)}`}>
              <TooltipTrigger asChild>
                <span style={{ color: highlightConfig.color, fontWeight: 'bold', cursor: 'help' }}>
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{translateFn(highlightConfig.hintKey, highlightConfig.hintKey)}</p>
              </TooltipContent>
            </Tooltip>
          );
        }
        return part;
      })}
    </>
  );
};

const selectPreferredVoice = (langCode: string, availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !availableVoices || !availableVoices.length) {
    console.warn('TTS: GrammarModuleClient - Voices not available or synthesis not supported.');
    return undefined;
  }

  console.log(`TTS: GrammarModuleClient - Selecting voice for lang "${langCode}". Available voices:`, availableVoices.map(v => ({name: v.name, lang: v.lang, default: v.default, localService: v.localService })));

  let targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(langCode));
  if (!targetLangVoices.length) {
    const baseLang = langCode.split('-')[0];
    targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(baseLang));
     if (targetLangVoices.length) {
      console.log(`TTS: GrammarModuleClient - No exact match for "${langCode}", using base lang "${baseLang}" voices.`);
    }
  }

  if (!targetLangVoices.length) {
    console.warn(`TTS: GrammarModuleClient - No voices found for lang "${langCode}" or base lang.`);
    return undefined;
  }

  const googleVoice = targetLangVoices.find(voice => voice.name.toLowerCase().includes('google'));
  if (googleVoice) {
    console.log('TTS: GrammarModuleClient - Selected Google voice:', googleVoice.name);
    return googleVoice;
  }
  
  const defaultVoice = targetLangVoices.find(voice => voice.default);
  if (defaultVoice) {
    console.log('TTS: GrammarModuleClient - Selected default voice:', defaultVoice.name);
    return defaultVoice;
  }

  const localServiceVoice = targetLangVoices.find(voice => voice.localService);
  if (localServiceVoice) {
    console.log('TTS: GrammarModuleClient - Selected local service voice:', localServiceVoice.name);
    return localServiceVoice;
  }
  
  if (targetLangVoices.length > 0) {
    console.log('TTS: GrammarModuleClient - Selected first available voice:', targetLangVoices[0].name);
    return targetLangVoices[0];
  }

  console.warn(`TTS: GrammarModuleClient - Could not select any voice for lang "${langCode}".`);
  return undefined;
};

const sanitizeTextForTTS = (text: string | undefined): string => {
  if (!text) return "";
  let sanitizedText = text;
  // 1. Remove Markdown emphasis (*italic*, **bold**, _italic_, __bold__)
  sanitizedText = sanitizedText.replace(/(\*{1,2}|_{1,2})(.+?)\1/g, '$2');
  // 2. Remove various types of quotes
  sanitizedText = sanitizedText.replace(/["«»„“]/g, '');
  // 3. Remove apostrophes/single quotes
  sanitizedText = sanitizedText.replace(/'/g, '');
  // 4. Remove backticks (Markdown code)
  sanitizedText = sanitizedText.replace(/`/g, '');
  // 5. Remove hyphens used as list item markers at the beginning of a line
  sanitizedText = sanitizedText.replace(/^-\s+/gm, '');
  // 6. Remove parentheses
  sanitizedText = sanitizedText.replace(/[()]/g, '');
  // 7. Replace hyphens used as separators (e.g., "word - word") with a comma and a space
  sanitizedText = sanitizedText.replace(/\s+-\s+/g, ', '); 
  // 8. Normalize multiple spaces to a single space
  sanitizedText = sanitizedText.replace(/\s\s+/g, ' ');
  return sanitizedText.trim();
};

export function GrammarModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState<AdaptiveGrammarExplanationsOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);
  const voicesRef = React.useRef<SpeechSynthesisVoice[]>([]);

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

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        voicesRef.current = window.speechSynthesis.getVoices();
         console.log('TTS: GrammarModuleClient - Voices updated:', voicesRef.current.map(v => ({name: v.name, lang: v.lang})));
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
          console.info('TTS: GrammarModuleClient - SpeechSynthesisUtterance playback was interrupted.', event);
        } else {
          console.error('TTS: GrammarModuleClient - SpeechSynthesisUtterance.onerror - Error type:', event.error, event);
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
      if (utteranceQueueRef.current.length > 0 && utteranceQueueRef.current[0].text === "Пииип") {
        const lastUtteranceText = utteranceQueueRef.current[utteranceQueueRef.current.length -1]?.text;
        if (lastUtteranceText !== "Пииип" || utteranceQueueRef.current.length > 1) {
          const endCueUtterance = new SpeechSynthesisUtterance("Пииип");
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
  }, [userData.settings, t, toast]);

  const playText = useCallback((textId: string, textToSpeak: string | undefined, langCode: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        title: t('ttsNotSupportedTitle'),
        description: t('ttsNotSupportedDescription'),
        variant: 'destructive',
      });
      setCurrentlySpeakingTTSId(null);
      return;
    }

    if (window.speechSynthesis.speaking && currentlySpeakingTTSId === textId) {
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
    
    const startCueUtterance = new SpeechSynthesisUtterance("Пииип");
    if(userData.settings) {
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
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utteranceQueueRef.current.push(utterance);
    });
    
    currentUtteranceIndexRef.current = 0;
    setCurrentlySpeakingTTSId(textId);
    speakNext();
  }, [currentlySpeakingTTSId, speakNext, t, toast, userData.settings]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingTTSId(null);
  }, []);


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
    stopSpeech();
    try {
      if (!userData.settings || !userData.progress) { 
        toast({ title: t('onboardingMissing'), variant: "destructive" });
        setIsAiLoading(false);
        return;
      }
      const grammarInput: AdaptiveGrammarExplanationsInput = {
        interfaceLanguage: userData.settings.interfaceLanguage,
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
    stopSpeech();
  };

  const handleTaskAnswerChange = (taskId: string, answer: string) => {
    setTaskAnswers(prev => ({ ...prev, [taskId]: answer }));
    // Reset feedback if user changes answer after submission
    if (taskFeedback[taskId]?.submitted) {
      setTaskFeedback(prev => ({ ...prev, [taskId]: { submitted: false, isCorrect: false } }));
      setTaskErrorExplanations(prev => ({ ...prev, [taskId]: null }));
      setIsFetchingExplanation(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleCheckTaskAnswer = async (taskId: string, task: PracticeTask) => {
    const userAnswer = taskAnswers[taskId]?.trim().toLowerCase() || "";
    const actualCorrectAnswer = task.correctAnswer.trim().toLowerCase();
    const isCorrect = userAnswer === actualCorrectAnswer;
    setTaskFeedback(prev => ({ ...prev, [taskId]: { submitted: true, isCorrect } }));

    if (!isCorrect && userData.settings) {
      setIsFetchingExplanation(prev => ({ ...prev, [taskId]: true }));
      try {
        const errorInput: ExplainGrammarTaskErrorInput = {
          interfaceLanguage: userData.settings.interfaceLanguage,
          grammarTopic: currentTopic,
          taskDescription: task.taskDescription,
          userAttempt: taskAnswers[taskId] || "",
          correctAnswer: task.correctAnswer,
        };
        const errorExplanationResult = await explainGrammarTaskError(errorInput);
        setTaskErrorExplanations(prev => ({ ...prev, [taskId]: errorExplanationResult.explanation }));
      } catch (error) {
        console.error("AI error explanation failed:", error);
        setTaskErrorExplanations(prev => ({ ...prev, [taskId]: "Failed to load AI explanation for this error." }));
        // Optionally, show a toast for this specific error
      } finally {
        setIsFetchingExplanation(prev => ({ ...prev, [taskId]: false }));
      }
    }
  };

  const explanationTTSId = `grammar-explanation-${currentTopic.replace(/\s+/g, '-') || Date.now()}`;
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
            {typeof window !== 'undefined' && window.speechSynthesis && (
              <span className="block text-xs text-muted-foreground mt-1 italic">{t('ttsExperimentalText')}</span>
            )}
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
                {typeof window !== 'undefined' && window.speechSynthesis && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!hasExplanationText || !explanationResult?.explanation) return;
                          if (currentlySpeakingTTSId === explanationTTSId) {
                            stopSpeech();
                          } else {
                            playText(explanationTTSId, explanationResult.explanation, userData.settings!.interfaceLanguage as AppInterfaceLanguage);
                          }
                        }}
                        className="shrink-0"
                        aria-label={currentlySpeakingTTSId === explanationTTSId ? t('ttsStopExplanation') : t('ttsPlayExplanation')}
                        disabled={!hasExplanationText || isAiLoading}
                      >
                        {currentlySpeakingTTSId === explanationTTSId ? <Ban className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                        {currentlySpeakingTTSId === explanationTTSId ? t('ttsStopExplanation') : t('ttsPlayExplanation')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{currentlySpeakingTTSId === explanationTTSId ? t('ttsStopExplanation') : t('ttsPlayExplanation')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
