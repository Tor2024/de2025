
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface ModuleLinkCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  startLearningButtonText: string;
  comingSoonButtonText: string;
}

export function ModuleLinkCard({ 
  title, 
  description, 
  href, 
  icon: Icon, 
  disabled = false,
  startLearningButtonText,
  comingSoonButtonText,
}: ModuleLinkCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <div className="bg-primary/10 p-3 rounded-full">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1 text-sm leading-tight">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button asChild variant={disabled ? "outline" : "default"} className="w-full" disabled={disabled}>
          <Link href={disabled ? "#" : href}>
            {disabled ? comingSoonButtonText : startLearningButtonText}
            {!disabled && <ArrowRight className="ml-2 h-4 w-4" />}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

