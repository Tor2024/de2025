"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function ReadingPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-8 shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">Reading Module</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Adapted texts with interactive translation, comprehension, and vocabulary questions will be available here soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
