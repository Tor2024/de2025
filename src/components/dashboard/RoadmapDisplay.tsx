
"use client";

import * as React from "react";
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserData } from "@/contexts/UserDataContext";
import { BookMarked, ListChecks, Clock, Info, Square, CheckSquare } from "lucide-react";
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
  // Удалены TTS props
  markCompleteTooltip: string;
  markIncompleteTooltip: string;
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
  markCompleteTooltip,
  markIncompleteTooltip,
}: RoadmapDisplayProps) {
  const { userData, toggleLessonCompletion } = useUserData();
  const roadmap = userData.progress?.learningRoadmap;
  const completedLessonIds = userData.progress?.completedLessonIds || [];
  // const { toast } = useToast(); // Не используется без TTS

  // const t = useCallback((key: string, defaultText?: string): string => {
  //   // ... (логика перевода, если нужна для других частей этого компонента в будущем)
  //   return defaultText || key;
  // }, []);


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
                      {/* Кнопка TTS удалена */}
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
