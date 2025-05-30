"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat } from "lucide-react";

export default function WordPracticePage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-8 shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <Repeat className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">Word Practice Module</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Reinforce your vocabulary with spaced repetition (SRS), word games, and mini-challenges. This feature is planned for a future update!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
