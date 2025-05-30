"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { BookMarked } from "lucide-react";

export function RoadmapDisplay() {
  const { userData } = useUserData();
  const roadmap = userData.progress?.learningRoadmap;

  if (!roadmap || !roadmap.rawContent) {
    return (
      <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>Learning Roadmap</CardTitle>
          <CardDescription>Your personalized learning plan is being prepared or not yet available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>If you've just completed onboarding, it might take a moment to appear. Otherwise, check your settings or try generating it again.</p>
        </CardContent>
      </Card>
    );
  }

  // Simple display of raw content, assuming it might be markdown-like.
  // For a real app, parse markdown or use a dedicated renderer.
  const roadmapLines = roadmap.rawContent.split('\n').map((line, index) => (
    <p key={index} className="mb-1">{line || <br />}</p> // render empty line as br for spacing
  ));

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/>Your Learning Roadmap</CardTitle>
        <CardDescription>Follow this plan to achieve your language goals.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/30 whitespace-pre-wrap">
          {roadmapLines}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
