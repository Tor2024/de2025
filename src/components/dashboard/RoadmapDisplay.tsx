
"use client";

import * as React from "react";
import { useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserData } from "@/contexts/UserDataContext";
import { BookMarked, ListChecks, Clock, Info, Square, CheckSquare, Volume2, Ban, User } from "lucide-react";
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


const LessonAccordionItem = ({ lesson, isCompleted, isCurrent, index, props }: { lesson: Lesson; isCompleted: boolean; isCurrent: boolean; index: number; props: RoadmapDisplayProps }) => {
    const { userData, toggleLessonCompletion } = useUserData();
    const { toast } = useToast();
    const lessonRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [currentlySpeakingTTSId, setCurrentlySpeakingTTSId] = React.useState<string | null>(null);
    const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
    const currentUtteranceIndexRef = React.useRef<number>(0);
    const voicesRef = React.useRef<SpeechSynthesisVoice[]>([]);
    const playTextInternalIdRef = React.useRef<number>(0);

    const currentLang = userData.settings?.interfaceLanguage || 'en';

    React.useEffect(() => {
        const updateVoices = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            voicesRef.current = window.speechSynthesis.getVoices();
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
        if (typeof window === 'undefined' || !window.speechSynthesis || !availableVoices || !availableVoices.length) return undefined;
        let targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(langCode));
        if (!targetLangVoices.length) {
            const baseLang = langCode.split('-')[0];
            targetLangVoices = availableVoices.filter(voice => voice.lang.startsWith(baseLang));
        }
        if (!targetLangVoices.length) return undefined;
        const googleVoice = targetLangVoices.find(voice => voice.name.toLowerCase().includes('google'));
        if (googleVoice) return googleVoice;
        const defaultVoice = targetLangVoices.find(voice => voice.default);
        if (defaultVoice) return defaultVoice;
        const localServiceVoice = targetLangVoices.find(voice => voice.localService);
        if (localServiceVoice) return localServiceVoice;
        return targetLangVoices[0];
    }, []);

    const sanitizeTextForTTS = useCallback((text: string | undefined): string => {
        if (!text) return "";
        let sanitizedText = text.replace(/(\*{1,2}|_{1,2})(.+?)\1/g, '$2').replace(/["«»„"']/g, '').replace(/`/g, '').replace(/^-\s+/gm, '').replace(/[()]/g, '').replace(/\s+-\s+/g, ', ').replace(/#+/g, '').replace(/\s\s+/g, ' ');
        return sanitizedText.trim();
    }, []);

    const speakNext = useCallback((currentPlayId: number) => {
        if (playTextInternalIdRef.current !== currentPlayId || typeof window === 'undefined' || !window.speechSynthesis) return;
        if (currentUtteranceIndexRef.current < utteranceQueueRef.current.length) {
            const utterance = utteranceQueueRef.current[currentUtteranceIndexRef.current];
            utterance.onend = () => {
            currentUtteranceIndexRef.current++;
            speakNext(currentPlayId);
            };
            utterance.onerror = (event) => {
            setCurrentlySpeakingTTSId(null);
            };
            window.speechSynthesis.speak(utterance);
        } else {
            setCurrentlySpeakingTTSId(null);
        }
    }, []);

    const playText = useCallback((textId: string, textToSpeak: string | undefined, langCode: string) => {
        playTextInternalIdRef.current += 1;
        const currentPlayId = playTextInternalIdRef.current;
        if (typeof window === 'undefined' || !window.speechSynthesis || !userData.settings) return;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        utteranceQueueRef.current = [];
        currentUtteranceIndexRef.current = 0;
        const fullText = textToSpeak || "";
        if (!fullText.trim()) {
            setCurrentlySpeakingTTSId(null);
            return;
        }
        const interfaceLangBcp47 = mapInterfaceLanguageToBcp47(userData.settings.interfaceLanguage);
        const startCueUtterance = new SpeechSynthesisUtterance("Пииип");
        startCueUtterance.lang = interfaceLangBcp47;
        const startCueVoice = selectPreferredVoice(interfaceLangBcp47, voicesRef.current || []);
        if (startCueVoice) startCueUtterance.voice = startCueVoice;
        utteranceQueueRef.current.push(startCueUtterance);
        const sanitizedText = sanitizeTextForTTS(fullText);
        const sentences = sanitizedText.match(/[^.!?\n]+[.!?\n]*|[^.!?\n]+$/g) || [];
        sentences.forEach(sentence => {
            if (sentence.trim()) {
                const utterance = new SpeechSynthesisUtterance(sentence.trim());
                utterance.lang = langCode;
                const voice = selectPreferredVoice(langCode, voicesRef.current || []);
                if (voice) utterance.voice = voice;
                utteranceQueueRef.current.push(utterance);
            }
        });
        const endCueUtterance = new SpeechSynthesisUtterance("Пииип");
        endCueUtterance.lang = interfaceLangBcp47;
        const endCueVoice = selectPreferredVoice(interfaceLangBcp47, voicesRef.current || []);
        if (endCueVoice) endCueUtterance.voice = endCueVoice;
        utteranceQueueRef.current.push(endCueUtterance);
        setCurrentlySpeakingTTSId(textId);
        speakNext(currentPlayId);
    }, [sanitizeTextForTTS, speakNext, selectPreferredVoice, userData.settings]);

    const stopSpeech = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        }
        setCurrentlySpeakingTTSId(null);
    }, []);

    const hasDescription = lesson.description && lesson.description.trim().length > 0;
    const isCurrentlySpeakingThis = currentlySpeakingTTSId === lesson.id;
    const isIndividual = lesson.id.startsWith('individual_');

    return (
        <AccordionItem
        value={`lesson-item-${index}`}
        key={`lesson-key-${index}`}
        ref={el => { lessonRefs.current[index] = el; }}
        className={cn(
            "bg-card mb-2 rounded-md border shadow-sm hover:shadow-md transition-shadow",
            isCompleted && "bg-green-500/10 border-green-500/30",
            isCurrent && !isCompleted && "border-primary ring-2 ring-primary/40",
            isIndividual && "border-accent/50"
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
                    const wasCompleting = !isCompleted;
                    toggleLessonCompletion(lesson.id);
                    toast({
                        title: wasCompleting ? props.lessonMarkedCompleteToastTitleKey : props.lessonMarkedIncompleteToastTitleKey,
                        description: wasCompleting ? props.lessonMarkedCompleteToastDescriptionKey.replace('{lessonTitle}', lesson.title) : props.lessonMarkedIncompleteToastDescriptionKey.replace('{lessonTitle}', lesson.title),
                    });
                    }}
                    aria-label={isCompleted ? props.markIncompleteTooltip : props.markCompleteTooltip}
                >
                    {isCompleted ? <CheckSquare className="h-5 w-5 text-green-600" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </span>
                </TooltipTrigger>
                <TooltipContent>
                <p>{isCompleted ? props.markIncompleteTooltip : props.markCompleteTooltip}</p>
                </TooltipContent>
            </Tooltip>
            {isIndividual && (
                <Tooltip>
                    <TooltipTrigger asChild><User className="h-5 w-5 text-accent" /></TooltipTrigger>
                    <TooltipContent><p>Индивидуальный урок</p></TooltipContent>
                </Tooltip>
            )}
            <span className={cn("bg-primary/15 text-primary font-semibold px-2.5 py-1 rounded-md text-sm", isCompleted && "line-through text-muted-foreground bg-muted/40", isIndividual && "bg-accent/15 text-accent")}>{lesson.level}</span>
            <span className={cn("font-medium text-left flex-1", isCompleted && "line-through text-muted-foreground")}>{lesson.title}</span>
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
                    aria-label={isCurrentlySpeakingThis ? props.ttsStopText : props.ttsPlayText}
                    className="ml-2 p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 shrink-0"
                    disabled={!hasDescription}
                    >
                    {isCurrentlySpeakingThis ? <Ban className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isCurrentlySpeakingThis ? props.ttsStopText : props.ttsPlayText}</p>
                </TooltipContent>
                </Tooltip>
            )}
            </div>
            {typeof window !== 'undefined' && window.speechSynthesis && hasDescription && (
            <p className="text-xs text-muted-foreground mb-2 italic">{props.ttsExperimentalText}</p>
            )}

            {lesson.topics && lesson.topics.length > 0 && (
            <div className="mb-3">
                <h4 className="font-semibold text-sm mb-1.5 flex items-center"><ListChecks className="mr-2 h-4 w-4 text-primary/70"/>{props.topicsToCoverText}</h4>
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
            <p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5"/>{props.estimatedDurationText} {lesson.estimatedDuration}</p>
            )}
        </AccordionContent>
        </AccordionItem>
    );
};

export function RoadmapDisplay(props: RoadmapDisplayProps) {
  const { userData } = useUserData();
  const roadmap = userData.progress?.learningRoadmap;
  const individualLessons = userData.progress?.individualLessons || [];
  const allLessons = [...(roadmap?.lessons || []), ...individualLessons];
  const completedLessonIds = userData.progress?.completedLessonIds || [];

  const currentLessonIndex = allLessons.findIndex(lesson => !completedLessonIds.includes(lesson.id)) ?? 0;
  
  if (!roadmap || allLessons.length === 0) {
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

  const standardLessons = roadmap.lessons || [];
  
  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>{props.titleText}</CardTitle>
        <CardDescription>{props.descriptionText}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full rounded-md border p-1 bg-muted/30">
          {roadmap.introduction && (
            <div className="p-3 mb-4 bg-background rounded-md shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary/80" />{props.introductionHeaderText}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.introduction}</p>
            </div>
          )}

          <Accordion type="multiple" className="w-full">
            {standardLessons.map((lesson: Lesson, index: number) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isCurrent = index === currentLessonIndex;
              return <LessonAccordionItem key={lesson.id} lesson={lesson} isCompleted={isCompleted} isCurrent={isCurrent} index={index} props={props} />;
            })}
          </Accordion>

          {individualLessons.length > 0 && (
            <div className="mt-6">
                 <h3 className="text-lg font-semibold mb-2 flex items-center p-3"><User className="mr-2 h-5 w-5 text-accent" />Индивидуальные уроки</h3>
                 <Accordion type="multiple" className="w-full">
                    {individualLessons.map((lesson: Lesson, index: number) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        // For individual lessons, 'isCurrent' logic might differ, here we just check if it's the first uncompleted one
                        const isCurrent = standardLessons.length + index === currentLessonIndex;
                        return <LessonAccordionItem key={lesson.id} lesson={lesson} isCompleted={isCompleted} isCurrent={isCurrent} index={standardLessons.length + index} props={props} />;
                    })}
                </Accordion>
            </div>
          )}

          {roadmap.conclusion && (
             <div className="p-3 mt-4 bg-background rounded-md shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary/80" />{props.conclusionHeaderText}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.conclusion}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
