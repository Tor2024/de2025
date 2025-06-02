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
import { Mic, Sparkles, Lightbulb, MessageSquare, XCircle, HelpCircle, FileText, Volume2, Ban, MessageCircleQuestion } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, type TargetLanguage as AppTargetLanguage, type ProficiencyLevel as AppProficiencyLevel, mapInterfaceLanguageToBcp47, mapTargetLanguageToBcp47 } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';

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

interface SpeakingTask {
  prompt: string;
  answer: string;
  explanation: string;
}

const staticTasks: SpeakingTask[] = [
  {
    prompt: 'Расскажите о себе: как вас зовут, откуда вы, чем занимаетесь?',
    answer: 'Меня зовут Анна, я из Москвы, работаю инженером. В свободное время люблю читать и путешествовать.',
    explanation: 'В ответе должны быть: имя, город, профессия, хобби.'
  },
  {
    prompt: 'Опишите ситуацию: вы в ресторане и хотите заказать еду. Что вы скажете официанту?',
    answer: 'Здравствуйте! Я бы хотел заказать суп и салат. Можно также стакан воды, пожалуйста?',
    explanation: 'В ответе должны быть: приветствие, заказ блюда, вежливая форма.'
  },
  {
    prompt: 'Повторите вслух и запишите фразу: "Ich lerne Deutsch, потому что хочу путешествовать по Германии."',
    answer: 'Ich lerne Deutsch, потому что хочу путешествовать по Германии.',
    explanation: 'Проверьте произношение немецкой части и плавность перехода между языками.'
  }
];

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
        console.log(`TTS: SpeakingModuleClient - Voices loaded/changed for ${currentLang}:`, voicesRef.current.filter(v => v.lang.startsWith(mapInterfaceLanguageToBcp47(currentLang))).map(v => ({ name: v.name, lang: v.lang, default: v.default, localService: v.localService })));
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
    sanitizedText = sanitizedText.replace(/["«»„"“]/g, '');
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
          toast({ title: t('ttsUtteranceErrorTitle', 'Ошибка синтеза речи'), description: t('ttsUtteranceErrorDescription', 'Попробуйте ещё раз.'), variant: 'destructive' });
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
      toast({ title: t('ttsNotSupportedTitle', 'Синтез речи не поддерживается'), description: t('ttsNotSupportedDescription', 'Ваш браузер не поддерживает синтез речи.'), variant: "destructive" });
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
  }, [setCurrentlySpeakingTTSId]);

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
        toast({ title: t('onboardingMissing', 'Пожалуйста, завершите ввод данных для начала работы.'), variant: "destructive" });
         setIsAiLoading(false);
         return;
      }
      const flowInput: GenerateSpeakingTopicInput = {
        interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings.targetLanguage as AppTargetLanguage,
        proficiencyLevel: userData.settings.proficiencyLevel as AppProficiencyLevel,
        generalTopic: data.generalTopic || undefined,
        goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
        interests: Array.isArray(userData.settings.interests) ? userData.settings.interests : (userData.settings.interests ? [userData.settings.interests] : []),
      };
      const result = await generateSpeakingTopic(flowInput);
      setSpeakingResult(result);
      toast({
        title: t('toastSuccessTitle', 'Тема для устного задания сгенерирована!'),
        description: t('toastSuccessDescription', 'Проверьте детали ниже.'),
      });
      reset(); 
    } catch (error) {
      console.error("Speaking topic generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('toastErrorTitle', 'Ошибка при генерации задания'),
        description: `${t('toastErrorDescription', 'Попробуйте ещё раз.')}${errorMessage ? ` (${errorMessage})` : ''}`,
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

  const [currentTask, setCurrentTask] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ correct: boolean; explanation: string }[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const task = staticTasks[currentTask];

  const handleCheck = () => {
    // Примитивная проверка: если ответ не пустой, считаем выполненным
    const isCorrect = userAnswer.trim().length > 0;
    setResults([...results, { correct: isCorrect, explanation: task.explanation }]);
    setShowExplanation(true);
    setIsAnswered(true);
  };

  const handleNext = () => {
    setUserAnswer('');
    setShowExplanation(false);
    setIsAnswered(false);
    setCurrentTask(currentTask + 1);
  };

  const handleRepeat = () => {
    setCurrentTask(0);
    setUserAnswer('');
    setResults([]);
    setShowExplanation(false);
    setIsAnswered(false);
  };

  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');

  // Итоговый анализ
  if (currentTask >= staticTasks.length) {
    const correctCount = results.filter(r => r.correct).length;
    const percent = Math.round((correctCount / staticTasks.length) * 100);
    const canGoNext = percent >= 70;
    const handleNextLesson = async () => {
      setIsNextLoading(true);
      setNextError('');
      try {
        if (!userData.settings || !userData.progress?.learningRoadmap?.lessons) throw new Error('Нет данных пользователя');
        const input = {
          interfaceLanguage: userData.settings.interfaceLanguage,
          currentLearningRoadmap: userData.progress.learningRoadmap,
          completedLessonIds: userData.progress.completedLessonIds || [],
          userGoal: Array.isArray(userData.settings.goal) ? (userData.settings.goal[0] || '') : (userData.settings.goal || ''),
          currentProficiencyLevel: (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2',
        };
        const rec = await getLessonRecommendation(input);
        if (rec.recommendedLessonId && userData.progress.learningRoadmap.lessons) {
          const lesson = userData.progress.learningRoadmap.lessons.find(l => l.id === rec.recommendedLessonId);
          if (lesson && lesson.topics && lesson.topics.length > 0) {
            window.location.href = `/learn/speaking?topic=${encodeURIComponent(lesson.topics[0])}&lessonId=${lesson.id}`;
            return;
          }
        }
        setNextError('Не удалось определить следующий урок. Вернитесь на главную.');
      } catch (e) {
        setNextError('Ошибка перехода к следующему уроку.');
      } finally {
        setIsNextLoading(false);
      }
    };
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl mb-3">Устный тест завершён</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {staticTasks.length}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
        ) : (
          <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
        )}
        <Button onClick={handleRepeat} className="px-6 py-2 text-base mr-3">Пройти ещё раз</Button>
        {canGoNext && (
          <Button onClick={handleNextLesson} className="px-6 py-2 text-base" disabled={isNextLoading}>
            {isNextLoading ? 'Загрузка...' : 'Следующий урок'}
          </Button>
        )}
        {!canGoNext && (
          <div className="mt-4 text-muted-foreground text-sm">Чтобы перейти дальше, повторите тему.</div>
        )}
        {nextError && <div className="text-red-600 mt-4">{nextError}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Устное задание</h2>
      <div style={{ fontSize: 18, marginBottom: 16 }}>Задание {currentTask + 1} из {staticTasks.length}:</div>
      <div style={{ fontSize: 18, marginBottom: 16 }}>{task.prompt}</div>
      <textarea
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        placeholder="Введите кратко, что вы сказали/или отметьте выполнение..."
        rows={3}
        style={{ width: '100%', padding: 8, fontSize: 16, marginBottom: 16 }}
        disabled={isAnswered}
      />
            <div>
        {!isAnswered ? (
          <Button onClick={handleCheck} disabled={!userAnswer.trim()} style={{ marginRight: 12 }}>
            Выполнил
          </Button>
        ) : (
          <Button onClick={handleNext} style={{ marginRight: 12 }}>
            Следующее задание
          </Button>
        )}
        {showExplanation && (
          <div style={{ marginTop: 24, fontSize: 17, color: isAnswered && results[results.length - 1]?.correct ? 'green' : 'red' }}>
            {results[results.length - 1]?.correct ? '✅ Хорошо!' : '❌ Нужно доработать'}
            <div style={{ marginTop: 8, color: '#0070f3' }}>Пояснение: {task.explanation}</div>
            <div style={{ marginTop: 8, color: '#888' }}><b>Пример ответа:</b> {task.answer}</div>
                  </div>
                )}
            </div>
    </div>
  );
}

