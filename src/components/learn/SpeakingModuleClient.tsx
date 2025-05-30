
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { generateSpeakingTopic } from "@/ai/flows/generate-speaking-topic-flow";
import type { GenerateSpeakingTopicInput, GenerateSpeakingTopicOutput } from "@/ai/flows/generate-speaking-topic-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mic, Sparkles, Lightbulb, MessageSquare, XCircle, HelpCircle, FileText, Volume2, Ban, MessageCircleQuestion } from "lucide-react"; // Added MessageCircleQuestion
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, type TargetLanguage as AppTargetLanguage, type ProficiencyLevel as AppProficiencyLevel, mapInterfaceLanguageToBcp47, mapTargetLanguageToBcp47 } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const speakingSchema = z.object({
  generalTopic: z.string().min(3).optional().or(z.literal('')),
});

type SpeakingFormData = z.infer<typeof speakingSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Speaking Practice",
  description: "Get an AI-generated topic to practice your speaking skills. You can optionally provide a general theme to guide the suggestion.",
  generalTopicLabel: "General Theme (Optional)",
  generalTopicPlaceholder: "E.g., Travel, Hobbies, Work, Daily Life",
  getTopicButton: "Get Speaking Topic",
  resultsTitlePrefix: "Speaking Topic Suggestion",
  speakingTopicHeader: "Your Topic",
  guidingQuestionsHeader: "Guiding Questions",
  noGuidingQuestions: "No specific guiding questions were generated for this topic.",
  tipsHeader: "Quick Tips",
  noTipsGenerated: "No specific tips were generated for this topic.",
  practiceScriptHeader: "Practice Script",
  noPracticeScript: "No practice script was generated for this topic.",
  followUpQuestionsHeader: "Follow-up Questions",
  noFollowUpQuestions: "No specific follow-up questions were generated for this topic.",
  toastSuccessTitle: "Speaking Topic Generated!",
  toastSuccessDescription: "Your speaking topic is ready.",
  toastErrorTitle: "Error Generating Topic",
  toastErrorDescription: "Failed to generate a speaking topic. Please try again.",
  onboardingMissing: "Please complete onboarding first to set your languages and proficiency.",
  loading: "Loading...",
  clearResultsButton: "Clear Results",
  ttsPlayScript: "Play script",
  ttsStopScript: "Stop script",
  ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
  ttsNotSupportedTitle: "TTS Not Supported",
  ttsNotSupportedDescription: "Text-to-Speech is not supported by your browser.",
  ttsUtteranceErrorTitle: "Speech Error",
  ttsUtteranceErrorDescription: "Could not play audio for the current text segment.",
};

const baseRuTranslations: Record<string, string> = {
  title: "Практика говорения",
  description: "Получите тему для практики разговорных навыков, сгенерированную ИИ. Вы можете по желанию указать общую тематику для более точного предложения.",
  generalTopicLabel: "Общая тематика (необязательно)",
  generalTopicPlaceholder: "Напр., Путешествия, Хобби, Работа, Повседневная жизнь",
  getTopicButton: "Получить тему для говорения",
  resultsTitlePrefix: "Предложение темы для говорения",
  speakingTopicHeader: "Ваша тема",
  guidingQuestionsHeader: "Наводящие вопросы",
  noGuidingQuestions: "Для этой темы не было сгенерировано наводящих вопросов.",
  tipsHeader: "Краткие советы",
  noTipsGenerated: "Для этой темы не было сгенерировано конкретных советов.",
  practiceScriptHeader: "Текст для практики",
  noPracticeScript: "Для этой темы не было сгенерировано текста для практики.",
  followUpQuestionsHeader: "Вопросы для продолжения:",
  noFollowUpQuestions: "Для этой темы не было сгенерировано вопросов для продолжения.",
  toastSuccessTitle: "Тема для говорения сгенерирована!",
  toastSuccessDescription: "Ваша тема для говорения готова.",
  toastErrorTitle: "Ошибка генерации темы",
  toastErrorDescription: "Не удалось сгенерировать тему для говорения. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг, чтобы установить языки и уровень.",
  loading: "Загрузка...",
  clearResultsButton: "Очистить результаты",
  ttsPlayScript: "Озвучить текст",
  ttsStopScript: "Остановить озвучку",
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

export function SpeakingModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<GenerateSpeakingTopicOutput | null>(null);

  const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = useState<string | null>(null);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = useRef<number>(0);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const playTextInternalIdRef = React.useRef<number>(0);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SpeakingFormData>({
    resolver: zodResolver(speakingSchema),
    defaultValues: {
        generalTopic: "",
    }
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = useCallback((key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  }, [currentLang]);

 useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        voicesRef.current = window.speechSynthesis.getVoices();
        console.log('TTS: SpeakingModuleClient - Voices loaded/changed:', voicesRef.current.map(v => ({ name: v.name, lang: v.lang, default: v.default, localService: v.localService })));
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
  }, []);

  const selectPreferredVoice = useCallback((langCode: string, availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !availableVoices || !availableVoices.length) {
      console.warn('TTS: SpeakingModuleClient - Voices not available or synthesis not supported.');
      return undefined;
    }
    console.log(`TTS: SpeakingModuleClient - Selecting voice for lang "${langCode}". Available voices:`, availableVoices.map(v => ({name: v.name, lang: v.lang, default: v.default, localService: v.localService })));

    let targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(langCode));
    if (!targetLangVoices.length) {
      const baseLang = langCode.split('-')[0];
      targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(baseLang));
      if (targetLangVoices.length) {
        console.log(`TTS: SpeakingModuleClient - No exact match for "${langCode}", using base lang "${baseLang}" voices.`);
      }
    }

    if (!targetLangVoices.length) {
      console.warn(`TTS: SpeakingModuleClient - No voices found for lang "${langCode}" or base lang.`);
      return undefined;
    }
    
    if (langCode.startsWith('de')) {
      const specificGermanVoice = targetLangVoices.find(voice =>
        voice.name.toLowerCase().includes('german') || voice.name.toLowerCase().includes('deutsch')
      );
      if (specificGermanVoice) {
        console.log(`TTS: SpeakingModuleClient - Selected specific German voice: ${specificGermanVoice.name}`);
        return specificGermanVoice;
      }
    }
    
    const googleVoice = targetLangVoices.find(voice => voice.name.toLowerCase().includes('google'));
    if (googleVoice) {
      console.log('TTS: SpeakingModuleClient - Selected Google voice:', googleVoice.name);
      return googleVoice;
    }

    const defaultVoice = targetLangVoices.find(voice => voice.default);
    if (defaultVoice) {
      console.log('TTS: SpeakingModuleClient - Selected default voice:', defaultVoice.name);
      return defaultVoice;
    }
    
    const localServiceVoice = targetLangVoices.find(voice => voice.localService);
    if (localServiceVoice) {
      console.log('TTS: SpeakingModuleClient - Selected local service voice:', localServiceVoice.name);
      return localServiceVoice;
    }
    
    if (targetLangVoices.length > 0) {
      console.log('TTS: SpeakingModuleClient - Selected first available voice:', targetLangVoices[0].name);
      return targetLangVoices[0];
    }
    
    console.warn(`TTS: SpeakingModuleClient - Could not select any voice for lang "${langCode}".`);
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
          console.info('TTS: SpeakingModuleClient - Speech synthesis interrupted by user or new call.');
        } else {
          console.error('TTS: SpeakingModuleClient - SpeechSynthesisUtterance.onerror - Error type:', event.error);
          toast({ title: t('ttsUtteranceErrorTitle'), description: t('ttsUtteranceErrorDescription'), variant: 'destructive' });
        }
        setCurrentlySpeakingTTSId(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlySpeakingTTSId(null);
    }
  }, [setCurrentlySpeakingTTSId, toast, t]);

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

    const sanitizedText = sanitizeTextForTTS(textToSpeak);
    if (!sanitizedText) {
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

    const sentences = sanitizedText.match(/[^.!?\n]+[.!?\n]*|[^.!?\n]+$/g) || [sanitizedText];
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        const utterance = new SpeechSynthesisUtterance(sentence.trim());
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
  }, [sanitizeTextForTTS, speakNext, toast, t, selectPreferredVoice, userData.settings]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingTTSId(null);
  }, []);

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }
  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<SpeakingFormData> = async (data) => {
    setIsAiLoading(true);
    setSpeakingResult(null);
    stopSpeech();
    try {
      if (!userData.settings) {
         toast({ title: t('onboardingMissing'), variant: "destructive" });
         setIsAiLoading(false);
         return;
      }
      const flowInput: GenerateSpeakingTopicInput = {
        interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings.targetLanguage as AppTargetLanguage,
        proficiencyLevel: userData.settings.proficiencyLevel as AppProficiencyLevel,
        generalTopic: data.generalTopic || undefined,
      };
      const result = await generateSpeakingTopic(flowInput);
      setSpeakingResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescription'),
      });
      reset(); 
    } catch (error) {
      console.error("Speaking topic generation error:", error);
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
    setSpeakingResult(null);
    stopSpeech();
    reset();
  };

  const hasPracticeScript = !!(speakingResult && speakingResult.practiceScript && speakingResult.practiceScript.trim().length > 0);
  const practiceScriptTTSId = `tts-speaking-${speakingResult?.speakingTopic?.substring(0,10).replace(/\s+/g, '-') || 'practiceScript'}`;
  const isCurrentlySpeakingThisScript = currentlySpeakingTTSId === practiceScriptTTSId;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mic className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description')}
             {typeof window !== 'undefined' && window.speechSynthesis && (
                <span className="block mt-1 text-xs italic">{t('ttsExperimentalText')}</span>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="generalTopic">{t('generalTopicLabel')}</Label>
              <Input id="generalTopic" placeholder={t('generalTopicPlaceholder')} {...register("generalTopic")} />
              {errors.generalTopic && <p className="text-sm text-destructive">{errors.generalTopic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
              {t('getTopicButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isAiLoading && !speakingResult && (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      )}

      {speakingResult && (
        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {t('resultsTitlePrefix')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                <XCircle className="mr-2 h-4 w-4" />
                {t('clearResultsButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary/80" />
                {t('speakingTopicHeader')}
              </h3>
              <ScrollArea className="h-auto max-h-[100px] rounded-md border p-3 bg-muted/30">
                <p className="whitespace-pre-wrap text-base leading-relaxed">{speakingResult.speakingTopic}</p>
              </ScrollArea>
            </div>

            <div>
                <h3 className="font-semibold text-lg mt-4 mb-2 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary/80" />
                    {t('guidingQuestionsHeader')}
                </h3>
                 <ScrollArea className="h-auto max-h-[100px] rounded-md border p-3 bg-muted/30">
                    {(speakingResult.guidingQuestions && speakingResult.guidingQuestions.length > 0) ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm whitespace-pre-wrap">
                        {speakingResult.guidingQuestions.map((question, index) => (
                            <li key={index}>{question}</li>
                        ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[50px] text-muted-foreground italic">
                            {t('noGuidingQuestions')}
                        </div>
                    )}
                </ScrollArea>
            </div>
            
            <div>
                <h3 className="font-semibold text-lg mt-4 mb-2 flex items-center gap-2">
                    <MessageCircleQuestion className="h-5 w-5 text-primary/80" /> {/* New Icon */}
                    {t('followUpQuestionsHeader')}
                </h3>
                 <ScrollArea className="h-auto max-h-[100px] rounded-md border p-3 bg-muted/30">
                    {(speakingResult.followUpQuestions && speakingResult.followUpQuestions.length > 0) ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm whitespace-pre-wrap">
                        {speakingResult.followUpQuestions.map((question, index) => (
                            <li key={index}>{question}</li>
                        ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[50px] text-muted-foreground italic">
                            {t('noFollowUpQuestions')}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {speakingResult.practiceScript && (
              <div>
                <div className="flex justify-between items-center mt-4 mb-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary/80" />
                    {t('practiceScriptHeader')} ({userData.settings!.targetLanguage})
                  </h3>
                   {typeof window !== 'undefined' && window.speechSynthesis && hasPracticeScript && (
                       <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                if (isCurrentlySpeakingThisScript) {
                                  stopSpeech();
                                } else {
                                  if(userData.settings?.targetLanguage){
                                      const langCode = mapTargetLanguageToBcp47(userData.settings.targetLanguage);
                                      playText(practiceScriptTTSId, speakingResult.practiceScript, langCode);
                                  }
                                }
                              }}
                              aria-label={isCurrentlySpeakingThisScript ? t('ttsStopScript') : t('ttsPlayScript')}
                              className="ml-2 p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                              disabled={!hasPracticeScript}
                            >
                              {isCurrentlySpeakingThisScript ? <Ban className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isCurrentlySpeakingThisScript ? t('ttsStopScript') : t('ttsPlayScript')}</p>
                          </TooltipContent>
                        </Tooltip>
                    )}
                </div>
                <ScrollArea className="h-auto max-h-[150px] rounded-md border p-3 bg-muted/30">
                   {hasPracticeScript ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{speakingResult.practiceScript}</p>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[50px] text-muted-foreground italic">
                          {t('noPracticeScript')}
                      </div>
                    )}
                </ScrollArea>
              </div>
            )}
             {!speakingResult.practiceScript && (
                 <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary/80" />
                        {t('practiceScriptHeader')}
                    </h3>
                    <ScrollArea className="h-auto max-h-[150px] rounded-md border p-3 bg-muted/30">
                      <div className="flex items-center justify-center h-full min-h-[50px] text-muted-foreground italic">
                          {t('noPracticeScript')}
                      </div>
                    </ScrollArea>
                 </div>
            )}

            <div>
              <h3 className="font-semibold text-lg mt-4 mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary/80" />
                {t('tipsHeader')}
              </h3>
              <ScrollArea className="h-auto max-h-[100px] rounded-md border p-3 bg-muted/30">
                {(speakingResult.tips && speakingResult.tips.length > 0) ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm whitespace-pre-wrap">
                    {speakingResult.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[50px] text-muted-foreground italic">
                    {t('noTipsGenerated')}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

