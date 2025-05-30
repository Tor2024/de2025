
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserData } from "@/contexts/UserDataContext";
import { BookMarked, ListChecks, Clock, Info } from "lucide-react";
import type { Lesson } from "@/lib/types"; // Import the Lesson type

export function RoadmapDisplay() {
  const { userData } = useUserData();
  const roadmap = userData.progress?.learningRoadmap;

  if (!roadmap || !roadmap.lessons || roadmap.lessons.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>Learning Roadmap</CardTitle>
          <CardDescription>Your personalized learning plan is being prepared, not yet available, or is empty.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>If you've just completed onboarding, it might take a moment for the AI to generate your plan. Otherwise, please check your settings or try generating it again if an option is available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>Your Learning Roadmap</CardTitle>
        <CardDescription>Follow this structured plan to achieve your language goals. All instructions and descriptions are in your chosen interface language.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden"> {/* Added overflow-hidden for ScrollArea */}
        <ScrollArea className="h-[400px] rounded-md border p-1 bg-muted/30"> {/* Reduced padding for Accordion spacing */}
          {roadmap.introduction && (
            <div className="p-3 mb-4 bg-background rounded-md shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary/80" />Introduction</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.introduction}</p>
            </div>
          )}

          <Accordion type="multiple" className="w-full">
            {roadmap.lessons.map((lesson: Lesson, index: number) => (
              <AccordionItem value={`item-${index}`} key={index} className="bg-card mb-2 rounded-md border shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="p-4 text-base hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/15 text-primary font-semibold px-2.5 py-1 rounded-md text-sm">{lesson.level}</span>
                    <span className="font-medium text-left">{lesson.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{lesson.description}</p>
                  
                  {lesson.topics && lesson.topics.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-1.5 flex items-center"><ListChecks className="mr-2 h-4 w-4 text-primary/70"/>Topics to Cover:</h4>
                      <ul className="list-disc list-inside pl-1 space-y-1 text-sm">
                        {lesson.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="ml-2">{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lesson.estimatedDuration && (
                    <p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5"/>Estimated duration: {lesson.estimatedDuration}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {roadmap.conclusion && (
             <div className="p-3 mt-4 bg-background rounded-md shadow">
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary/80" />Conclusion</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.conclusion}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
