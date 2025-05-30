
"use client";

import * as React from "react";
import { useCallback } from "react"; // Ensure useCallback is imported
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserData } from "@/contexts/UserDataContext";
import { BookMarked, ListChecks, Clock, Info, Volume2, Ban, Square, CheckSquare } from "lucide-react";
import type { Lesson, InterfaceLanguage as AppInterfaceLanguage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


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
  ttsPlayText: string;
  ttsStopText: string;
  ttsExperimentalText: string;
  ttsNotSupportedTitle: string;
  ttsNotSupportedDescription: string;
  markCompleteTooltip: string;
  markIncompleteTooltip: string;
  ttsUtteranceErrorTitle: string;
  ttsUtteranceErrorDescription: string;
}

const selectPreferredVoice = (langCode: string, availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
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
};

const sanitizeTextForTTS = (text: string | undefined): string => {
  if (!text) return "";
  let sanitizedText = text;
  sanitizedText = sanitizedText.replace(/(\*{1,2}|_{1,2})(.+?)\1/g, '$2'); // Remove Markdown bold/italic
  sanitizedText = sanitizedText.replace(/[()]/g, ''); // Remove parentheses
  sanitizedText = sanitizedText.replace(/["«»„“]/g, ''); // Remove various quotes
  sanitizedText = sanitizedText.replace(/'/g, ''); // Remove single quotes/apostrophes
  sanitizedText = sanitizedText.replace(/`/g, ''); // Remove backticks
  sanitizedText = sanitizedText.replace(/^-\s+/gm, ''); // Remove list item hyphens
  sanitizedText = sanitizedText.replace(/\s\s+/g, ' '); // Normalize spaces
  return sanitizedText.trim();
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
  ttsPlayText,
  ttsStopText,
  ttsExperimentalText,
  ttsNotSupportedTitle,
  ttsNotSupportedDescription,
  markCompleteTooltip,
  markIncompleteTooltip,
  ttsUtteranceErrorTitle,
  ttsUtteranceErrorDescription,
}: RoadmapDisplayProps) {
  const { userData, toggleLessonCompletion } = useUserData();
  const roadmap = userData.progress?.learningRoadmap;
  const interfaceLanguage = userData.settings?.interfaceLanguage || 'en';
  const completedLessonIds = userData.progress?.completedLessonIds || [];
  const { toast } = useToast();

  const [currentlySpeakingLessonId, setCurrentlySpeakingLessonId] = React.useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);
  const voicesRef = React.useRef<SpeechSynthesisVoice[]>([]);
  

  const t = useCallback((key: string, defaultText?: string): string => {
    // Simplified t function for brevity, assuming props handle translations
    if (key === 'ttsUtteranceErrorTitle') return ttsUtteranceErrorTitle;
    if (key === 'ttsUtteranceErrorDescription') return ttsUtteranceErrorDescription;
    if (key === 'ttsNotSupportedTitle') return ttsNotSupportedTitle;
    if (key === 'ttsNotSupportedDescription') return ttsNotSupportedDescription;
    return defaultText || key;
  }, [ttsUtteranceErrorTitle, ttsUtteranceErrorDescription, ttsNotSupportedTitle, ttsNotSupportedDescription]);


  React.useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        voicesRef.current = window.speechSynthesis.getVoices();
         console.log('TTS: RoadmapDisplay - Voices updated:', voicesRef.current.map(v => ({name: v.name, lang: v.lang})));
      }
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      updateVoices(); // Initial load
      window.speechSynthesis.onvoiceschanged = updateVoices; // Event listener
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

  const speakNext = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && currentUtteranceIndexRef.current < utteranceQueueRef.current.length) {
      const utterance = utteranceQueueRef.current[currentUtteranceIndexRef.current];
      utterance.onend = () => {
        currentUtteranceIndexRef.current++;
        speakNext();
      };
      utterance.onerror = (event) => {
        if (event.error === "interrupted") {
          console.info('TTS: RoadmapDisplay - SpeechSynthesisUtterance playback was interrupted.', event);
        } else {
          console.error('TTS: RoadmapDisplay - SpeechSynthesisUtterance.onerror - Error type:', event.error, event);
          toast({
            title: t('ttsUtteranceErrorTitle'),
            description: t('ttsUtteranceErrorDescription'),
            variant: 'destructive',
          });
        }
        setCurrentlySpeakingLessonId(null); 
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // All text segments are spoken
      if (utteranceQueueRef.current.length > 0 && utteranceQueueRef.current[0].text === "Дзынь") { // Check if start cue was played
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
      setCurrentlySpeakingLessonId(null);
    }
  }, [userData.settings, t, toast, setCurrentlySpeakingLessonId, utteranceQueueRef, currentUtteranceIndexRef]); 

  const playText = React.useCallback((lessonId: string, textToSpeak: string | undefined, langCode: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        title: t('ttsNotSupportedTitle'),
        description: t('ttsNotSupportedDescription'),
        variant: 'destructive',
      });
      setCurrentlySpeakingLessonId(null);
      return;
    }

    if (window.speechSynthesis.speaking && currentlySpeakingLessonId === lessonId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingLessonId(null);
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    const textToActuallySpeak = sanitizeTextForTTS(textToSpeak);
    if (!textToActuallySpeak) {
      setCurrentlySpeakingLessonId(null);
      return; 
    }
    
    utteranceQueueRef.current = [];
    
    // Start Cue
    const startCueUtterance = new SpeechSynthesisUtterance("Дзынь");
    if(userData.settings){
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
    setCurrentlySpeakingLessonId(lessonId);
    speakNext();

  }, [currentlySpeakingLessonId, speakNext, t, toast, userData.settings, setCurrentlySpeakingLessonId, utteranceQueueRef, currentUtteranceIndexRef]);

  const stopSpeech = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingLessonId(null);
  }, [setCurrentlySpeakingLessonId]);


  if (!roadmap || !roadmap.lessons || roadmap.lessons.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>{loadingTitleText}</CardTitle>
          <CardDescription>{loadingDescriptionText}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p>{loadingContentText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>{titleText}</CardTitle>
        <CardDescription>{descriptionText}</CardDescription>
         {typeof window !== 'undefined' && window.speechSynthesis && ttsExperimentalText && <p className="text-xs text-muted-foreground mt-1 italic">{ttsExperimentalText}</p>}
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
              const lessonSpeechId = lesson.id || `lesson-speech-${index}`;
              const hasDescription = !!(lesson.description && lesson.description.trim().length > 0);
              const isCompleted = completedLessonIds.includes(lesson.id);

              return (
                <AccordionItem
                  value={`lesson-item-${index}`}
                  key={`lesson-key-${index}`}
                  className={cn(
                    "bg-card mb-2 rounded-md border shadow-sm hover:shadow-md transition-shadow",
                    isCompleted && "bg-green-500/10 border-green-500/30"
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
                              toggleLessonCompletion(lesson.id);
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
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 if (!hasDescription || !lesson.description) return; 
                                 if (currentlySpeakingLessonId === lessonSpeechId) {
                                   stopSpeech();
                                 } else {
                                   playText(lessonSpeechId, lesson.description, interfaceLanguage as AppInterfaceLanguage);
                                 }
                               }}
                               className="ml-2 shrink-0"
                               aria-label={currentlySpeakingLessonId === lessonSpeechId ? ttsStopText : ttsPlayText}
                               disabled={!hasDescription}
                             >
                               {currentlySpeakingLessonId === lessonSpeechId ? <Ban className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                               {currentlySpeakingLessonId === lessonSpeechId ? ttsStopText : ttsPlayText}
                             </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                             <p>{currentlySpeakingLessonId === lessonSpeechId ? ttsStopText : ttsPlayText}</p>
                           </TooltipContent>
                         </Tooltip>
                      )}
                    </div>

                    {lesson.topics && lesson.topics.length > 0 && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm mb-1.5 flex items-center"><ListChecks className="mr-2 h-4 w-4 text-primary/70"/>{topicsToCoverText}</h4>
                        <ul className="list-disc list-inside pl-1 space-y-1 text-sm">
                          {lesson.topics.map((topic, topicIndex) => (
                            <li key={topicIndex} className="ml-2 whitespace-pre-wrap">{topic}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lesson.estimatedDuration && (
                      <p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5"/>{estimatedDurationText} {lesson.estimatedDuration}</p>
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
