"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones } from "lucide-react";

export default function ListeningPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-8 shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <Headphones className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">Listening Module</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Audio comprehension tasks, with and without subtitles, are coming soon to help you sharpen your listening skills!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
