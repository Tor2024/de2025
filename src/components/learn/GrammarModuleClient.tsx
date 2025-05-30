
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
import { adaptiveGrammarExplanations } from "@/ai/flows/adaptive-grammar-explanations";
import type { AdaptiveGrammarExplanationsInput, AdaptiveGrammarExplanationsOutput } from "@/ai/flows/adaptive-grammar-explanations";
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles, XCircle, Volume2, Ban } from "lucide-react";
import { interfaceLanguageCodes } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
            <Tooltip key={`${part}-${index}-${Math.random()}`}>
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


export function GrammarModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState<AdaptiveGrammarExplanationsOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  // TTS States
  const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);


  const { register, handleSubmit, formState: { errors }, reset } = useForm<GrammarFormData>({
    resolver: zodResolver(grammarSchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };

  // TTS Functions
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
  
  if (!userData.settings || !userData.progress) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<GrammarFormData> = async (data) => {
    setIsAiLoading(true);
    setExplanationResult(null);
    setCurrentTopic(data.grammarTopic);
    stopSpeech();
    try {
      const grammarInput: AdaptiveGrammarExplanationsInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage,
        grammarTopic: data.grammarTopic,
        proficiencyLevel: userData.settings!.proficiencyLevel,
        learningGoal: userData.settings!.goal,
        userPastErrors: userData.progress!.errorArchive.map(e => `Module: ${e.module}, Context: ${e.context || 'N/A'}, User attempt: ${e.userAttempt}, Correct: ${e.correctAnswer || 'N/A'}`).join('\n') || "No past errors recorded.",
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
    stopSpeech();
  };

  const explanationTTSId = `grammar-explanation-${currentTopic.replace(/\s+/g, '-')}`;
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
                            playText(explanationTTSId, explanationResult.explanation, userData.settings!.interfaceLanguage);
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
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                {explanationResult.practiceTasks && explanationResult.practiceTasks.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {explanationResult.practiceTasks.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
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
    

    
