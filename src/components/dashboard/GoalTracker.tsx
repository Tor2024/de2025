
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useEffect, useState } from "react";

interface GoalTrackerProps {
  titlePrefix: string;
  targetLanguageDisplayName: string;
  goalText: string;
  progressLabelText: string;
  progressMessageTextTemplate: string;
  completedLessonsCount: number;
  totalLessonsCount: number;
}

export function GoalTracker({
  titlePrefix,
  targetLanguageDisplayName,
  goalText,
  progressLabelText,
  progressMessageTextTemplate,
  completedLessonsCount,
  totalLessonsCount,
}: GoalTrackerProps) {
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const calculatedProgress = totalLessonsCount > 0 
      ? (completedLessonsCount / totalLessonsCount) * 100 
      : 0;
    // To make it slightly more encouraging, we can add a small base if some lessons are completed
    // or ensure it doesn't stay at 0% if there's only 1 lesson and it's not complete.
    // For now, let's keep it direct.
    setProgressValue(calculatedProgress);
  }, [completedLessonsCount, totalLessonsCount]);

  const roundedProgress = Math.round(progressValue);

  return (
    <Card className="shadow-lg hover:shadow-accent/20 transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-accent"/>
          {titlePrefix} {targetLanguageDisplayName}
        </CardTitle>
        <CardDescription className="truncate text-ellipsis">{goalText}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{progressLabelText}</span>
          <span className="text-sm font-semibold text-accent">{roundedProgress}%</span>
        </div>
        <Progress 
          value={roundedProgress} 
          aria-label={`${progressLabelText}: ${roundedProgress}%`} 
          className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary/70"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {progressMessageTextTemplate.replace('{value}', roundedProgress.toString())}
        </p>
      </CardContent>
    </Card>
  );
}
