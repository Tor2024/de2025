
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUserData } from "@/contexts/UserDataContext";
import type { InterfaceLanguage, ProficiencyLevel, TargetLanguage, UserSettings } from "@/lib/types";
import { supportedLanguages, interfaceLanguageCodes, targetLanguageNames } from "@/lib/types";
import { generatePersonalizedLearningRoadmap } from "@/ai/flows/ai-learning-roadmap";
import type { GeneratePersonalizedLearningRoadmapInput } from "@/ai/flows/ai-learning-roadmap";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, ArrowRight } from "lucide-react";

const onboardingSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  interfaceLanguage: z.enum(interfaceLanguageCodes, { required_error: "Interface language is required" }),
  targetLanguage: z.enum(targetLanguageNames, { required_error: "Target language is required" }),
  proficiencyLevel: z.enum(["A1-A2", "B1-B2", "C1-C2"], { required_error: "Proficiency level is required" }),
  goal: z.string().min(10, "Goal should be at least 10 characters").max(200, "Goal should be at most 200 characters"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const steps = [
  { id: 1, title: "Welcome to LinguaVerse!", fields: ["userName", "interfaceLanguage"] },
  { id: 2, title: "Your Learning Focus", fields: ["targetLanguage", "proficiencyLevel"] },
  { id: 3, title: "Define Your Goal", fields: ["goal"] },
];

export function OnboardingFlow() {
  const { updateSettings, setLearningRoadmap } = useUserData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const { register, handleSubmit, control, trigger, formState: { errors, isValid } } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange", // Validate on change for better UX
  });

  const handleNext = async () => {
    const currentFields = steps[currentStep].fields as Array<keyof OnboardingFormData>;
    const isValidStep = await trigger(currentFields);
    if (isValidStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
    setIsLoading(true);
    try {
      const userSettings: UserSettings = {
        userName: data.userName,
        interfaceLanguage: data.interfaceLanguage, // Already a code
        targetLanguage: data.targetLanguage, // Already a name
        proficiencyLevel: data.proficiencyLevel as ProficiencyLevel,
        goal: data.goal,
      };
      updateSettings(userSettings);

      const roadmapInput: GeneratePersonalizedLearningRoadmapInput = {
        interfaceLanguage: data.interfaceLanguage, // Pass the code
        targetLanguage: data.targetLanguage, // Pass the name
        proficiencyLevel: data.proficiencyLevel as "A1-A2" | "B1-B2" | "C1-C2",
        personalGoal: data.goal,
      };
      const roadmapOutput = await generatePersonalizedLearningRoadmap(roadmapInput);
      setLearningRoadmap({ rawContent: roadmapOutput.roadmap });
      
      toast({
        title: "Setup Complete!",
        description: "Your personalized learning roadmap has been generated.",
      });
      // The parent page (src/app/page.tsx) will detect settings change and redirect.
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStepContent = () => {
    const stepConfig = steps[currentStep];
    return (
      <>
        {stepConfig.fields.includes("userName") && (
          <div className="space-y-2">
            <Label htmlFor="userName">What should we call you?</Label>
            <Input id="userName" placeholder="E.g., Alex" {...register("userName")} />
            {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
          </div>
        )}
        {stepConfig.fields.includes("interfaceLanguage") && (
          <div className="space-y-2">
            <Label htmlFor="interfaceLanguage">Interface Language</Label>
            <Controller name="interfaceLanguage" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="interfaceLanguage"><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.interfaceLanguage && <p className="text-sm text-destructive">{errors.interfaceLanguage.message}</p>}
          </div>
        )}
        {stepConfig.fields.includes("targetLanguage") && (
          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language</Label>
             <Controller name="targetLanguage" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="targetLanguage"><SelectValue placeholder="Select language to learn" /></SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map(lang => (
                      <SelectItem key={lang.name} value={lang.name}>
                        {lang.nativeName} ({lang.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            {errors.targetLanguage && <p className="text-sm text-destructive">{errors.targetLanguage.message}</p>}
          </div>
        )}
        {stepConfig.fields.includes("proficiencyLevel") && (
          <div className="space-y-2">
            <Label htmlFor="proficiencyLevel">Proficiency Level</Label>
            <Controller name="proficiencyLevel" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="proficiencyLevel"><SelectValue placeholder="Select proficiency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1-A2">A1-A2 (Beginner)</SelectItem>
                  <SelectItem value="B1-B2">B1-B2 (Intermediate)</SelectItem>
                  <SelectItem value="C1-C2">C1-C2 (Advanced)</SelectItem>
                </SelectContent>
              </Select>
            )} />
            {errors.proficiencyLevel && <p className="text-sm text-destructive">{errors.proficiencyLevel.message}</p>}
          </div>
        )}
        {stepConfig.fields.includes("goal") && (
          <div className="space-y-2">
            <Label htmlFor="goal">Your Personal Goal</Label>
            <Textarea id="goal" placeholder="E.g., Pass B2 TELC exam, Speak fluently with colleagues..." {...register("goal")} className="min-h-[100px]" />
            {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
          </div>
        )}
      </>
    )
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{steps[currentStep].title}</span>
          </CardTitle>
          <CardDescription className="text-center">
            Step {currentStep + 1} of {steps.length}
          </CardDescription>
           <div className="w-full bg-muted rounded-full h-1.5 mt-2">
             <div className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
           </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {renderStepContent()}
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrev} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext} disabled={isLoading} className="ml-auto">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="submit" disabled={isLoading || !isValid} className="ml-auto w-full md:w-auto">
                {isLoading ? <LoadingSpinner /> : "Generate My Plan & Start Learning!"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
