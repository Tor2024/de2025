"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { aiPoweredWritingAssistance } from "@/ai/flows/ai-powered-writing-assistance";
import type { AIPoweredWritingAssistanceInput, AIPoweredWritingAssistanceOutput } from "@/ai/flows/ai-powered-writing-assistance";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Edit, CheckCircle } from "lucide-react";

const writingSchema = z.object({
  writingPrompt: z.string().min(5, "Prompt should be at least 5 characters"),
  userText: z.string().min(10, "Your text should be at least 10 characters"),
});

type WritingFormData = z.infer<typeof writingSchema>;

export function WritingAssistantClient() {
  const { userData } = useUserData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [assistanceResult, setAssistanceResult] = useState<AIPoweredWritingAssistanceOutput | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<WritingFormData>({
    resolver: zodResolver(writingSchema),
  });

  if (!userData.settings) {
    return <p>Please complete onboarding first.</p>;
  }

  const onSubmit: SubmitHandler<WritingFormData> = async (data) => {
    setIsLoading(true);
    setAssistanceResult(null);
    try {
      const writingInput: AIPoweredWritingAssistanceInput = {
        prompt: data.writingPrompt,
        text: data.userText,
        interfaceLanguage: userData.settings!.interfaceLanguage === 'ru' ? 'Russian' : 'English',
      };
      
      const result = await aiPoweredWritingAssistance(writingInput);
      setAssistanceResult(result);
      toast({
        title: "Feedback Received!",
        description: "Your writing has been reviewed.",
      });
    } catch (error) {
      console.error("Writing assistance error:", error);
      toast({
        title: "Error",
        description: "Failed to get writing assistance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-accent/5 border border-accent/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
             <Edit className="h-8 w-8 text-accent animate-pulse" />
            AI-Powered Writing Assistant
          </CardTitle>
          <CardDescription>Write on a given prompt and get AI-driven feedback on structure, grammar, and tone, along with corrections.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="writingPrompt">Writing Prompt</Label>
              <Input id="writingPrompt" placeholder="E.g., Describe your last holiday, Write a formal email asking for information..." {...register("writingPrompt")} />
              {errors.writingPrompt && <p className="text-sm text-destructive">{errors.writingPrompt.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="userText">Your Text ({userData.settings.targetLanguage})</Label>
              <Textarea id="userText" placeholder={`Write your text in ${userData.settings.targetLanguage} here...`} {...register("userText")} className="min-h-[150px]" />
              {errors.userText && <p className="text-sm text-destructive">{errors.userText.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <LoadingSpinner /> : "Get Feedback"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {assistanceResult && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500"/>Feedback & Corrections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-lg">Feedback:</h3>
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                <p className="whitespace-pre-wrap">{assistanceResult.feedback}</p>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Corrected Text:</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                <p className="whitespace-pre-wrap">{assistanceResult.correctedText}</p>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
