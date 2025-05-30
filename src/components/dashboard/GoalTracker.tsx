"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserData } from "@/contexts/UserDataContext";
import { Target } from "lucide-react";
import { useEffect, useState } from "react";

export function GoalTracker() {
  const { userData } = useUserData();
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    // Simulate progress loading or calculation
    // In a real app, this would come from moduleCompletion or other metrics
    const timer = setTimeout(() => setProgressValue(Math.random() * 30 + 5), 500); // Random progress between 5-35%
    return () => clearTimeout(timer);
  }, []);

  const goal = userData.settings?.goal || "No goal set.";
  const targetLanguage = userData.settings?.targetLanguage || "";

  return (
    <Card className="shadow-lg hover:shadow-accent/20 transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="text-accent"/>Your Goal: {targetLanguage}</CardTitle>
        <CardDescription className="truncate text-ellipsis">{goal}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-semibold text-accent">{Math.round(progressValue)}%</span>
        </div>
        <Progress value={progressValue} aria-label={`Progress towards goal: ${Math.round(progressValue)}%`} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary/70"/>
        <p className="text-xs text-muted-foreground mt-2">
          You're {Math.round(progressValue)}% closer to achieving your goal! Keep it up!
        </p>
      </CardContent>
    </Card>
  );
}
