
"use client";

import * as React from "react";
import { useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserData } from "@/contexts/UserDataContext";
import { BookMarked, ListChecks, Clock, Info, Square, CheckSquare, Volume2, Ban } from "lucide-react";
import type { Lesson, InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { mapInterfaceLanguageToBcp47, mapTargetLanguageToBcp47 } from "@/lib/types"; // For interface language TTS
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';

interface RoadmapDisplayProps {
  titleText: string;
  descriptionText: string;
  loadingTitleText: string;
  loadingDescriptionText: string;
  loadingContentText: string;
  introductionHeaderText: string;
  topicsToCoverText: string;
  estimatedDurationText: string;
  conclusionHeaderText: string;
  markCompleteTooltip: string;
  markIncompleteTooltip: string;
  ttsPlayText: string;
  ttsStopText: string;
  ttsExperimentalText: string;
  ttsNotSupportedTitle: string;
  ttsNotSupportedDescription: string;
  ttsUtteranceErrorTitle: string;
  ttsUtteranceErrorDescription: string;
  // New props for toast localization
  lessonMarkedCompleteToastTitleKey: string;
  lessonMarkedCompleteToastDescriptionKey: string;
  lessonMarkedIncompleteToastTitleKey: string;
  lessonMarkedIncompleteToastDescriptionKey: string;
}

// Helper function to parse topic line and generate link
// This function is also present in DashboardPage.tsx and should be kept in sync or moved to a shared util.
const keywordsToModules: {keywords: string[], path: string, needsLevel?: boolean, topicExtractor?: (line: string, keyword: string) => string}[] = [
    { keywords: ["лексика:", "словарный запас:", "vocabulary:"], path: "/learn/vocabulary" },
    { keywords: ["грамматика:", "grammar:"], path: "/learn/grammar" },
    { keywords: ["чтение:", "reading:"], path: "/learn/reading", needsLevel: true },
    { keywords: ["аудирование:", "listening:"], path: "/learn/listening" },
    { keywords: ["говорение:", "практика говорения:", "speaking:", "speech practice:"], path: "/learn/speaking" },
    { keywords: ["письмо:", "помощь в письме:", "writing:", "writing assistance:"], path: "/learn/writing", topicExtractor: (line, keyword) => line.substring(keyword.length).replace(/на тему/i, "").replace(/["':]/g, "").trim() },
    { keywords: ["практика слов:", "упражнения:", "word practice:", "exercises:"], path: "/learn/practice" },
  ];

const parseTopicAndGetLink = (topicLine: any, lessonContext?: { lessonId: string; lessonLevel: string }): { href: string | null; displayText: string } => {
  if (typeof topicLine !== 'string') {
    console.warn('parseTopicAndGetLink received a non-string topicLine:', topicLine);
    return { href: null, displayText: String(topicLine || '') };
  }

  let href: string | null = null;
  const displayText = topicLine; 

  const cleanAndEncodeTopic = (rawTopic: string): string => {
    // Remove text in parentheses, e.g., (Das deutsche Alphabet) or (das deutsche Alphabet)
    let cleaned = rawTopic.replace(/\s*\(.*?\)\s*$/, "").trim();
    // Remove common leading/trailing punctuation that might remain
    cleaned = cleaned.replace(/^["':\s]+|["':\s]+$/g, "").trim();
    return encodeURIComponent(cleaned);
  };
  
  const topicLineLower = topicLine.toLowerCase();

  for (const mod of keywordsToModules) {
    for (const keyword of mod.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (topicLineLower.startsWith(keywordLower)) {
        let theme = mod.topicExtractor 
          ? mod.topicExtractor(topicLine, keyword) // Pass original case keyword for specific extractors
          : topicLine.substring(keyword.length).trim(); // Use original case keyword length for substring

        theme = cleanAndEncodeTopic(theme);
        if (theme.length > 0) {
          href = `${mod.path}?topic=${theme}`;
          if (lessonContext) {
            href += `&lessonId=${encodeURIComponent(lessonContext.lessonId)}`;
            if (mod.needsLevel && lessonContext.lessonLevel) {
               // Extract only the CEFR code like A1, B2 from "Уровень A1" or "Level A1"
              const levelCode = lessonContext.lessonLevel.split(' ')[0]?.toUpperCase() || lessonContext.lessonLevel.toUpperCase();
              href += `&baseLevel=${encodeURIComponent(levelCode)}`;
            }
          }
        }
        break;
      }
    }
    if (href) break;
  }
  return { href, displayText };
};


export function RoadmapDisplay({
  titleText,
  descriptionText,
  loadingTitleText,
  loadingDescriptionText,
  loadingContentText,
  introductionHeaderText,
  topicsToCoverText,
  estimatedDurationText,
  conclusionHeaderText,
  markCompleteTooltip,
  markIncompleteTooltip,
  ttsPlayText,
  ttsStopText,
  ttsExperimentalText,
  ttsNotSupportedTitle,
  ttsNotSupportedDescription,
  ttsUtteranceErrorTitle,
  ttsUtteranceErrorDescription,
  lessonMarkedCompleteToastTitleKey,
  lessonMarkedCompleteToastDescriptionKey,
  lessonMarkedIncompleteToastTitleKey,
  lessonMarkedIncompleteToastDescriptionKey,
}: RoadmapDisplayProps) {
  const { userData, toggleLessonCompletion } = useUserData();
  const { toast } = useToast();
  const roadmap = userData.progress?.learningRoadmap;
  const completedLessonIds = userData.progress?.completedLessonIds || [];

  const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = React.useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);
  const voicesRef = React.useRef<SpeechSynthesisVoice[]>([]);
  const playTextInternalIdRef = React.useRef<number>(0);

  const currentLang = userData.settings?.interfaceLanguage || 'en';
  const t = useCallback((key: string, defaultText?: string, params?: Record<string, string>): string => {
    // This component receives translated texts as props, so this 't' is a placeholder
    // or could be used if we had a more complex structure for texts passed via props.
    // For now, we assume keys passed are already for direct use or need simple replacement.
    let text = defaultText || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(`{${paramKey}}`, params[paramKey]);
      });
    }
    return text;
  }, []);

  // Определяем индекс текущего (следующего незавершённого) урока
  const currentLessonIndex = roadmap?.lessons.findIndex(lesson => !completedLessonIds.includes(lesson.id)) ?? 0;
  const currentLessonId = roadmap?.lessons[currentLessonIndex]?.id;
  const lessonRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Автоматический скролл к текущему уроку при изменении
  useEffect(() => {
    if (lessonRefs.current[currentLessonIndex]) {
      lessonRefs.current[currentLessonIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLessonIndex]);

  React.useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        voicesRef.current = window.speechSynthesis.getVoices();
         console.log(`TTS: RoadmapDisplay - Voices loaded/changed for ${currentLang}:`, voicesRef.current.filter(v => v.lang.startsWith(mapInterfaceLanguageToBcp47(currentLang))).map(v => ({ name: v.name, lang: v.lang, default: v.default, localService: v.localService })));
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
      console.warn('TTS: RoadmapDisplay - Voices not available or synthesis not supported.');
      return undefined;
    }
     console.log(`TTS: RoadmapDisplay - Selecting voice for lang "${langCode}". Available voices:`, availableVoices.map(v => ({name: v.name, lang: v.lang, default: v.default, localService: v.localService })));

    let targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(langCode));
    if (!targetLangVoices.length) {
      const baseLang = langCode.split('-')[0];
      targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(baseLang));
      if (targetLangVoices.length) {
        console.log(`TTS: RoadmapDisplay - No exact match for "${langCode}", using base lang "${baseLang}" voices.`);
      }
    }

    if (!targetLangVoices.length) {
      console.warn(`TTS: RoadmapDisplay - No voices found for lang "${langCode}" or base lang.`);
      return undefined;
    }
    
    if (langCode.startsWith('de')) {
      const specificGermanVoice = targetLangVoices.find(voice =>
        voice.name.toLowerCase().includes('german') || voice.name.toLowerCase().includes('deutsch')
      );
      if (specificGermanVoice) {
        console.log(`TTS: RoadmapDisplay - Selected specific German voice: ${specificGermanVoice.name}`);
        return specificGermanVoice;
      }
    }

    const googleVoice = targetLangVoices.find(voice => voice.name.toLowerCase().includes('google'));
    if (googleVoice) {
      console.log('TTS: RoadmapDisplay - Selected Google voice:', googleVoice.name);
      return googleVoice;
    }

    const defaultVoice = targetLangVoices.find(voice => voice.default);
    if (defaultVoice) {
      console.log('TTS: RoadmapDisplay - Selected default voice:', defaultVoice.name);
      return defaultVoice;
    }
    
    const localServiceVoice = targetLangVoices.find(voice => voice.localService);
    if (localServiceVoice) {
      console.log('TTS: RoadmapDisplay - Selected local service voice:', localServiceVoice.name);
      return localServiceVoice;
    }
    
    if (targetLangVoices.length > 0) {
      console.log('TTS: RoadmapDisplay - Selected first available voice:', targetLangVoices[0].name);
      return targetLangVoices[0];
    }
    
    console.warn(`TTS: RoadmapDisplay - Could not select any voice for lang "${langCode}".`);
    return undefined;
  }, []);


  const sanitizeTextForTTS = useCallback((text: string | undefined): string => {
    if (!text) return "";
    let sanitizedText = text;
    sanitizedText = sanitizedText.replace(/(\*{1,2}|_{1,2})(.+?)\1/g, '$2');
    sanitizedText = sanitizedText.replace(/["«»„""]/g, '');
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
          console.info('TTS: RoadmapDisplay - Speech synthesis interrupted by user or new call.');
        } else {
          console.error('TTS: RoadmapDisplay - SpeechSynthesisUtterance.onerror - Error type:', event.error);
          toast({ title: t(ttsUtteranceErrorTitle, 'Ошибка синтеза речи'), description: t(ttsUtteranceErrorDescription, 'Попробуйте ещё раз.'), variant: 'destructive' });
        }
        setCurrentlySpeakingTTSId(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlySpeakingTTSId(null);
    }
  }, [setCurrentlySpeakingTTSId, toast, t, ttsUtteranceErrorTitle, ttsUtteranceErrorDescription]);


  const playText = useCallback((textId: string, textToSpeak: string | undefined, langCode: string) => {
    playTextInternalIdRef.current += 1;
    const currentPlayId = playTextInternalIdRef.current;

    if (typeof window === 'undefined' || !window.speechSynthesis || !userData.settings) {
      toast({ title: t(ttsNotSupportedTitle, 'Синтез речи не поддерживается'), description: t(ttsNotSupportedDescription, 'Ваш браузер не поддерживает синтез речи.'), variant: "destructive" });
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
    
    // Add "Пииип" at the beginning
    const startCueUtterance = new SpeechSynthesisUtterance("Пииип");
    startCueUtterance.lang = interfaceLangBcp47; // Interface language for "Пииип"
    const startCueVoice = selectPreferredVoice(interfaceLangBcp47, voicesRef.current || []);
    if (startCueVoice) startCueUtterance.voice = startCueVoice;
    startCueUtterance.rate = 0.95;
    startCueUtterance.pitch = 1.1;
    utteranceQueueRef.current.push(startCueUtterance);
    
    const sanitizedText = sanitizeTextForTTS(fullText);
    const sentences = sanitizedText.match(/[^.!?\n]+[.!?\n]*|[^.!?\n]+$/g) || [];
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
    
    // Add "Пииип" at the end
    const endCueUtterance = new SpeechSynthesisUtterance("Пииип");
    endCueUtterance.lang = interfaceLangBcp47; // Interface language for "Пииип"
    const endCueVoice = selectPreferredVoice(interfaceLangBcp47, voicesRef.current || []);
    if (endCueVoice) endCueUtterance.voice = endCueVoice;
    endCueUtterance.rate = 0.95;
    endCueUtterance.pitch = 1.1;
    utteranceQueueRef.current.push(endCueUtterance);

    setCurrentlySpeakingTTSId(textId);
    speakNext(currentPlayId);
  }, [sanitizeTextForTTS, speakNext, toast, t, selectPreferredVoice, userData.settings, ttsNotSupportedTitle, ttsNotSupportedDescription]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingTTSId(null);
  }, []);

  if (!roadmap || !roadmap.lessons || roadmap.lessons.length === 0) {
    // Skeleton Loader для roadmap и уроков
    return (
      <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col">
        <CardHeader>
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="mb-4">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>{titleText}</CardTitle>
        <CardDescription>{descriptionText}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full rounded-md border p-1 bg-muted/30">
          {roadmap.introduction && (
            <div className="p-3 mb-4 bg-background rounded-md shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary/80" />{introductionHeaderText}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.introduction}</p>
            </div>
          )}

          <Accordion type="multiple" className="w-full">
            {roadmap.lessons.map((lesson: Lesson, index: number) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isCurrent = index === currentLessonIndex;
              const hasDescription = lesson.description && lesson.description.trim().length > 0;
              const isCurrentlySpeakingThis = currentlySpeakingTTSId === lesson.id;
              const ttsPlayButtonId = `tts-lesson-${lesson.id || index}`;


              return (
                <AccordionItem
                  value={`lesson-item-${index}`}
                  key={`lesson-key-${index}`}
                  ref={el => { lessonRefs.current[index] = el; }}
                  className={cn(
                    "bg-card mb-2 rounded-md border shadow-sm hover:shadow-md transition-shadow",
                    isCompleted && "bg-green-500/10 border-green-500/30",
                    isCurrent && !isCompleted && "border-primary ring-2 ring-primary/40"
                  )}
                >
                  <AccordionTrigger className="p-4 text-base hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="h-7 w-7 shrink-0 flex items-center justify-center cursor-pointer" 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              const wasCompleting = !completedLessonIds.includes(lesson.id);
                              toggleLessonCompletion(lesson.id);
                              if (wasCompleting) {
                                toast({
                                  title: t(lessonMarkedCompleteToastTitleKey, 'Урок завершён!'),
                                  description: t(lessonMarkedCompleteToastDescriptionKey, '+25 XP за выполнение урока.'),
                                });
                              } else {
                                toast({
                                  title: t(lessonMarkedIncompleteToastTitleKey, 'Статус урока изменён'),
                                  description: t(lessonMarkedIncompleteToastDescriptionKey, 'Урок отмечен как не завершён.'),
                                });
                              }
                            }}
                            aria-label={isCompleted ? markIncompleteTooltip : markCompleteTooltip}
                          >
                            {isCompleted ? <CheckSquare className="h-5 w-5 text-green-600" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isCompleted ? markIncompleteTooltip : markCompleteTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className={cn(
                        "bg-primary/15 text-primary font-semibold px-2.5 py-1 rounded-md text-sm",
                        isCompleted && "line-through text-muted-foreground bg-muted/40"
                      )}>{lesson.level}</span>
                      <span className={cn(
                        "font-medium text-left flex-1",
                        isCompleted && "line-through text-muted-foreground"
                      )}>{lesson.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap flex-1">{lesson.description}</p>
                      {typeof window !== 'undefined' && window.speechSynthesis && hasDescription && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                if (isCurrentlySpeakingThis) {
                                  stopSpeech();
                                } else {
                                  const langCode = userData.settings?.interfaceLanguage ? mapInterfaceLanguageToBcp47(userData.settings.interfaceLanguage) : 'en-US';
                                  playText(lesson.id, lesson.description, langCode);
                                }
                              }}
                              aria-label={isCurrentlySpeakingThis ? ttsStopText : ttsPlayText}
                              className="ml-2 p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 shrink-0"
                              disabled={!hasDescription}
                            >
                              {isCurrentlySpeakingThis ? <Ban className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isCurrentlySpeakingThis ? ttsStopText : ttsPlayText}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                     {typeof window !== 'undefined' && window.speechSynthesis && hasDescription && (
                        <p className="text-xs text-muted-foreground mb-2 italic">{ttsExperimentalText}</p>
                    )}

                    {lesson.topics && lesson.topics.length > 0 && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm mb-1.5 flex items-center"><ListChecks className="mr-2 h-4 w-4 text-primary/70"/>{topicsToCoverText}</h4>
                        <ul className="list-disc list-inside pl-1 space-y-1 text-sm">
                          {lesson.topics.map((topic, topicIndex) => {
                            const { href, displayText } = parseTopicAndGetLink(topic, { lessonId: lesson.id, lessonLevel: lesson.level});
                            return (
                              <li key={topicIndex} className="ml-2 whitespace-pre-wrap">
                                {href ? (
                                  <Link href={href} className="text-primary hover:underline hover:text-accent transition-colors">
                                    {displayText}
                                  </Link>
                                ) : (
                                  displayText
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {lesson.estimatedDuration && (
                      <p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5"/>{estimatedDurationText} {lesson.estimatedDuration}</p>
                    )}

                    {isCurrent && !isCompleted && (
                      <Button
                        className="mt-4"
                        onClick={() => {
                          toggleLessonCompletion(lesson.id);
                          setTimeout(() => {
                            if (lessonRefs.current[currentLessonIndex + 1]) {
                              lessonRefs.current[currentLessonIndex + 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }, 300);
                        }}
                      >
                        Перейти к следующему уроку
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {roadmap.conclusion && (
             <div className="p-3 mt-4 bg-background rounded-md shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary/80" />{conclusionHeaderText}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.conclusion}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
