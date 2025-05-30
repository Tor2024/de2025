"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function VocabularyPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-8 shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">Vocabulary Module</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This module is under construction. Soon you'll be able to expand your word bank with thematic sets, image support, pronunciation guides, word games, and more!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
