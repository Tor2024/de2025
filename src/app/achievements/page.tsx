"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function AchievementsPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-8 shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <Award className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Track your XP, streaks, and earned badges here. More gamification features are on the way!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
