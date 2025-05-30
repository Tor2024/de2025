
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { adaptiveGrammarExplanations } from "@/ai/flows/adaptive-grammar-explanations";
import type { AdaptiveGrammarExplanationsInput, AdaptiveGrammarExplanationsOutput, InterfaceLanguage as AiInterfaceLanguage, ProficiencyLevel as AiProficiencyLevel } from "@/ai/flows/adaptive-grammar-explanations";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles } from "lucide-react";

const grammarSchema = z.object({
  grammarTopic: z.string().min(3, "Topic should be at least 3 characters"),
});

type GrammarFormData = z.infer<typeof grammarSchema>;

export function GrammarModuleClient() {
  const { userData } = useUserData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState<AdaptiveGrammarExplanationsOutput | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<GrammarFormData>({
    resolver: zodResolver(grammarSchema),
  });

  if (!userData.settings || !userData.progress) {
    return <p>Please complete onboarding first.</p>;
  }

  const onSubmit: SubmitHandler<GrammarFormData> = async (data) => {
    setIsLoading(true);
    setExplanationResult(null);
    try {
      const grammarInput: AdaptiveGrammarExplanationsInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AiInterfaceLanguage, // Pass code directly
        grammarTopic: data.grammarTopic,
        proficiencyLevel: userData.settings!.proficiencyLevel as AiProficiencyLevel, // Assuming direct match
        learningGoal: userData.settings!.goal,
        userPastErrors: userData.progress!.errorArchive.map(e => `${e.topic}: ${e.error}`).join('\n') || "No past errors recorded.",
      };
      
      const result = await adaptiveGrammarExplanations(grammarInput);
      setExplanationResult(result);
      toast({
        title: "Explanation Generated!",
        description: `Grammar explanation for "${data.grammarTopic}" is ready.`,
      });
    } catch (error) {
      console.error("Grammar explanation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate grammar explanation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            Adaptive Grammar Explanations
          </CardTitle>
          <CardDescription>Enter a grammar topic you want to understand better. Our AI tutor will provide a clear explanation and practice tasks tailored to your level and goals.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="grammarTopic">Grammar Topic</Label>
              <Input id="grammarTopic" placeholder="E.g., Dative Case, Modal Verbs, Subjunctive II" {...register("grammarTopic")} />
              {errors.grammarTopic && <p className="text-sm text-destructive">{errors.grammarTopic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <LoadingSpinner /> : "Get Explanation"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {explanationResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Explanation: {explanationResult.explanation.substring(0,50)}...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">Explanation:</h3>
            <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
              <p className="whitespace-pre-wrap">{explanationResult.explanation}</p>
            </ScrollArea>
            
            <h3 className="font-semibold text-lg mt-4">Practice Tasks:</h3>
            <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
              <ul className="list-disc pl-5 space-y-2 whitespace-pre-wrap">
                {explanationResult.practiceTasks.map((task, index) => (
                  <li key={index}>{task}</li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
