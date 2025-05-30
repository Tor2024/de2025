
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserData } from "@/contexts/UserDataContext";
import { BookMarked, ListChecks, Clock, Info, Volume2, Ban } from "lucide-react";
import type { Lesson, InterfaceLanguage as AppInterfaceLanguage } from "@/lib/types";
import { Button } from "@/components/ui/button";

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
}

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
}: RoadmapDisplayProps) {
  const { userData } = useUserData();
  const roadmap = userData.progress?.learningRoadmap;
  const interfaceLanguage = userData.settings?.interfaceLanguage || 'en';

  const [currentlySpeakingLessonId, setCurrentlySpeakingLessonId] = React.useState<string | null>(null);
  const utteranceQueueRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = React.useRef<number>(0);

  React.useEffect(() => {
    // Cleanup speechSynthesis on component unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
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
        console.error('SpeechSynthesisUtterance.onerror', event);
        setCurrentlySpeakingLessonId(null); // Stop on error
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlySpeakingLessonId(null); // Finished queue or TTS not available
    }
  }, []);

  const playText = React.useCallback((lessonId: string, textToSpeak: string, langCode: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert("Text-to-Speech is not supported by your browser.");
      setCurrentlySpeakingLessonId(null);
      return;
    }

    if (window.speechSynthesis.speaking && currentlySpeakingLessonId === lessonId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingLessonId(null);
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Stop any other speech
    }


    const trimmedTextToSpeak = textToSpeak ? textToSpeak.trim() : "";
    if (!trimmedTextToSpeak) {
        setCurrentlySpeakingLessonId(null);
        return; // Do not proceed if text is empty
    }

    // Basic sentence splitting. More robust splitting might be needed for complex texts.
    const sentences = trimmedTextToSpeak.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0 && trimmedTextToSpeak) { // If splitting results in no sentences (e.g. text without standard delimiters)
        sentences.push(trimmedTextToSpeak); // Speak the whole trimmed text
    }

    utteranceQueueRef.current = sentences.map(sentence => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      // Map app language codes to BCP 47 if necessary, or use directly if they match
      utterance.lang = langCode; 
      return utterance;
    });

    currentUtteranceIndexRef.current = 0;
    setCurrentlySpeakingLessonId(lessonId);
    speakNext();
  }, [currentlySpeakingLessonId, speakNext]);

  const stopSpeech = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingLessonId(null);
  }, []);


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
        <ScrollArea className="h-[calc(100vh-20rem)] md:h-[400px] rounded-md border p-1 bg-muted/30">
          {roadmap.introduction && (
            <div className="p-3 mb-4 bg-background rounded-md shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary/80" />{introductionHeaderText}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.introduction}</p>
            </div>
          )}

          <Accordion type="multiple" className="w-full">
            {roadmap.lessons.map((lesson: Lesson, index: number) => (
              <AccordionItem 
                value={`lesson-item-${index}`} 
                key={`lesson-key-${index}`}    
                className="bg-card mb-2 rounded-md border shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="p-4 text-base hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <span className="bg-primary/15 text-primary font-semibold px-2.5 py-1 rounded-md text-sm">{lesson.level}</span>
                    <span className="font-medium text-left flex-1">{lesson.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap flex-1">{lesson.description}</p>
                    {typeof window !== 'undefined' && window.speechSynthesis && (
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const speechId = lesson.id || `speech-id-${index}`;
                          if (currentlySpeakingLessonId === speechId) {
                            stopSpeech();
                          } else {
                            playText(speechId, lesson.description, interfaceLanguage);
                          }
                        }}
                        className="ml-2 shrink-0"
                        aria-label={currentlySpeakingLessonId === (lesson.id || `speech-id-${index}`) ? ttsStopText : ttsPlayText}
                      >
                        {currentlySpeakingLessonId === (lesson.id || `speech-id-${index}`) ? <Ban className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
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
            ))}
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

    