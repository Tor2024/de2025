
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
import { generateSpeakingTopic } from "@/ai/flows/generate-speaking-topic-flow";
import type { GenerateSpeakingTopicInput, GenerateSpeakingTopicOutput } from "@/ai/flows/generate-speaking-topic-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mic, Sparkles, Lightbulb, MessageSquare, XCircle, HelpCircle, FileText, Volume2, Ban } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, type TargetLanguage as AppTargetLanguage, type ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
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
  ttsPlayScript: "Play script",
  ttsStopScript: "Stop script",
  ttsExperimentalText: "Text-to-Speech (TTS) is experimental. Voice and language support depend on your browser/OS.",
  ttsNotSupportedTitle: "TTS Not Supported",
  ttsNotSupportedDescription: "Text-to-Speech is not supported by your browser.",
  toastSuccessTitle: "Speaking Topic Generated!",
  toastSuccessDescription: "Your speaking topic is ready.",
  toastErrorTitle: "Error Generating Topic",
  toastErrorDescription: "Failed to generate a speaking topic. Please try again.",
  onboardingMissing: "Please complete onboarding first to set your languages and proficiency.",
  loading: "Loading...",
  clearResultsButton: "Clear Results",
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
  ttsPlayScript: "Озвучить текст",
  ttsStopScript: "Остановить озвучку",
  ttsExperimentalText: "Функция озвучивания текста (TTS) экспериментальная. Голос и поддержка языков зависят от вашего браузера/ОС.",
  ttsNotSupportedTitle: "TTS не поддерживается",
  ttsNotSupportedDescription: "Функция озвучивания текста не поддерживается вашим браузером.",
  toastSuccessTitle: "Тема для говорения сгенерирована!",
  toastSuccessDescription: "Ваша тема для говорения готова.",
  toastErrorTitle: "Ошибка генерации темы",
  toastErrorDescription: "Не удалось сгенерировать тему для говорения. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг, чтобы установить языки и уровень.",
  loading: "Загрузка...",
  clearResultsButton: "Очистить результаты",
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
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SpeakingFormData>({
    resolver: zodResolver(speakingSchema),
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
        setCurrentlySpeakingTTSId(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlySpeakingTTSId(null);
    }
  }, []);

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

    const trimmedTextToSpeak = textToSpeak ? textToSpeak.trim() : "";
    if (!trimmedTextToSpeak) {
      setCurrentlySpeakingTTSId(null);
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
    setCurrentlySpeakingTTSId(textId);
    speakNext();
  }, [currentlySpeakingTTSId, speakNext, t, toast]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
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
      const flowInput: GenerateSpeakingTopicInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage as AppTargetLanguage,
        proficiencyLevel: userData.settings!.proficiencyLevel as AppProficiencyLevel,
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
  };

  const hasPracticeScript = speakingResult && speakingResult.practiceScript && speakingResult.practiceScript.trim().length > 0;
  const practiceScriptTTSId = `practice-script-${(speakingResult?.speakingTopic || "default").substring(0,20).replace(/\s/g, '-')}`;


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
              <span className="block text-xs text-muted-foreground mt-1 italic">{t('ttsExperimentalText')}</span>
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
                        <ul className="list-disc pl-5 space-y-1 text-sm">
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
              <div className="flex justify-between items-center mt-4 mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/80" />
                  {t('practiceScriptHeader')} ({userData.settings!.targetLanguage})
                </h3>
                {typeof window !== 'undefined' && window.speechSynthesis && hasPracticeScript && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          playText(practiceScriptTTSId, speakingResult.practiceScript, userData.settings!.targetLanguage as AppTargetLanguage);
                        }}
                        className="shrink-0"
                        aria-label={currentlySpeakingTTSId === practiceScriptTTSId ? t('ttsStopScript') : t('ttsPlayScript')}
                        disabled={!hasPracticeScript || isAiLoading}
                      >
                        {currentlySpeakingTTSId === practiceScriptTTSId ? <Ban className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                        {currentlySpeakingTTSId === practiceScriptTTSId ? t('ttsStopScript') : t('ttsPlayScript')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{currentlySpeakingTTSId === practiceScriptTTSId ? t('ttsStopScript') : t('ttsPlayScript')}</p>
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
            
            <div>
              <h3 className="font-semibold text-lg mt-4 mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary/80" />
                {t('tipsHeader')}
              </h3>
              <ScrollArea className="h-auto max-h-[100px] rounded-md border p-3 bg-muted/30">
                {(speakingResult.tips && speakingResult.tips.length > 0) ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
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


    