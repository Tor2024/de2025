
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
import { Headphones, Sparkles, Volume2, Ban, HelpCircle, Info } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, type TargetLanguage as AppTargetLanguage, type ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";

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
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {
    en: baseEnTranslations,
    ru: baseRuTranslations,
  };
  interfaceLanguageCodes.forEach(code => {
    if (!translations[code]) {
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

  const playText = useCallback((scriptId: string, textToSpeak: string, langCode: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert("Text-to-Speech is not supported by your browser.");
      setCurrentlySpeakingScriptId(null);
      return;
    }

    if (window.speechSynthesis.speaking && currentlySpeakingScriptId === scriptId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingScriptId(null);
      return;
    }
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const trimmedTextToSpeak = textToSpeak.trim();
    if (!trimmedTextToSpeak) {
      setCurrentlySpeakingScriptId(null);
      return;
    }

    const sentences = trimmedTextToSpeak.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) sentences.push(trimmedTextToSpeak);

    utteranceQueueRef.current = sentences.map(sentence => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.lang = langCode;
      return utterance;
    });

    currentUtteranceIndexRef.current = 0;
    setCurrentlySpeakingScriptId(scriptId);
    speakNext();
  }, [currentlySpeakingScriptId, speakNext]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingScriptId(null);
  }, []);

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p>{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<ListeningFormData> = async (data) => {
    setIsAiLoading(true);
    setListeningResult(null);
    stopSpeech(); // Stop any ongoing speech
    setCurrentTopic(data.topic);
    try {
      const flowInput: GenerateListeningMaterialInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage,
        proficiencyLevel: userData.settings!.proficiencyLevel,
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

  return (
    <div className="space-y-6">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Headphones className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
           {typeof window !== 'undefined' && window.speechSynthesis && (
            <p className="text-xs text-muted-foreground mt-1 italic">{t('ttsExperimentalText')}</p>
          )}
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
              {isAiLoading ? <LoadingSpinner /> : t('getMaterialButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {listeningResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {t('resultsTitlePrefix')} {currentTopic}
              {listeningResult.title && <span className="block text-lg text-muted-foreground mt-1">({listeningResult.title})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listeningResult.scenario && (
              <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Info className="h-5 w-5 text-primary/80"/>{t('scenarioHeader')}</h3>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{listeningResult.scenario}</p>
              </div>
            )}
             {!listeningResult.scenario && (
                <p className="text-sm text-muted-foreground italic">{t('noScenario')}</p>
            )}


            <div>
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-lg">{t('scriptHeader')} ({userData.settings.targetLanguage})</h3>
                    {typeof window !== 'undefined' && window.speechSynthesis && (
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const scriptId = listeningResult.title || `script-${Date.now()}`;
                            if (currentlySpeakingScriptId === scriptId) {
                                stopSpeech();
                            } else {
                                playText(scriptId, listeningResult.script, userData.settings!.targetLanguage);
                            }
                        }}
                        className="shrink-0"
                        aria-label={currentlySpeakingScriptId === (listeningResult.title || `script-${Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}
                        >
                        {currentlySpeakingScriptId === (listeningResult.title || `script-${Date.now()}`) ? <Ban className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                        {currentlySpeakingScriptId === (listeningResult.title || `script-${Date.now()}`) ? t('ttsStopScript') : t('ttsPlayScript')}
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                    <p className="whitespace-pre-wrap text-base leading-relaxed">{listeningResult.script}</p>
                </ScrollArea>
            </div>
            
            {listeningResult.comprehensionQuestions && listeningResult.comprehensionQuestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mt-4 mb-1">{t('comprehensionQuestionsHeader')}</h3>
                <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                  <ul className="space-y-3">
                    {listeningResult.comprehensionQuestions.map((q, index) => (
                      <li key={index} className="text-sm p-2 rounded-md bg-card border">
                        <p className="font-medium mb-1 flex items-center"><HelpCircle className="h-4 w-4 mr-2 text-primary/80" />{q.question}</p>
                        {q.options && q.options.length > 0 && (
                          <ul className="list-disc pl-5 space-y-1 text-xs ml-4">
                            {q.options.map((opt, optIndex) => (
                              <li key={optIndex}>{opt}</li>
                            ))}
                          </ul>
                        )}
                        {q.answer && (
                           <p className="text-xs text-muted-foreground mt-1 ml-4"><em>{t('answerIndication')}: {q.answer}</em></p>
                        )}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
            {(!listeningResult.comprehensionQuestions || listeningResult.comprehensionQuestions.length === 0) && (
                <p className="text-sm text-muted-foreground italic mt-4">{t('noQuestions')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
