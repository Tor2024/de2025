
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
}

export function GoalTracker({
  titlePrefix,
  targetLanguageDisplayName,
  goalText,
  progressLabelText,
  progressMessageTextTemplate,
}: GoalTrackerProps) {
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    // Simulate progress loading or calculation
    const timer = setTimeout(() => setProgressValue(Math.random() * 30 + 5), 500); // Random progress between 5-35%
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="shadow-lg hover:shadow-accent/20 transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-accent"/> {/* Ensured icon uses accent color */}
          {titlePrefix} {targetLanguageDisplayName}
        </CardTitle>
        <CardDescription className="truncate text-ellipsis">{goalText}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{progressLabelText}</span>
          <span className="text-sm font-semibold text-accent">{Math.round(progressValue)}%</span> {/* Made percentage more prominent */}
        </div>
        <Progress 
          value={progressValue} 
          aria-label={`${progressLabelText}: ${Math.round(progressValue)}%`} 
          className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary/70" /* Added gradient and height */
        />
        <p className="text-xs text-muted-foreground mt-2">
          {progressMessageTextTemplate.replace('{value}', Math.round(progressValue).toString())}
        </p>
      </CardContent>
    </Card>
  );
}
