
"use client";

import { useState, useEffect } from "react";
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
import type { InterfaceLanguage, TargetLanguage, UserSettings, LearningRoadmap, UserProgress, ProficiencyLevel } from "@/lib/types";
import { supportedLanguages, interfaceLanguageCodes, targetLanguageNames, proficiencyLevels, initialUserProgress } from "@/lib/types";
import { generatePersonalizedLearningRoadmap } from "@/ai/flows/ai-learning-roadmap";
import type { GeneratePersonalizedLearningRoadmapInput, GeneratePersonalizedLearningRoadmapOutput } from "@/ai/flows/ai-learning-roadmap";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { useRouter } from 'next/navigation';

// The proficiency level is now optional in the schema.
const onboardingSchema = z.object({
  userName: z.string().min(1, "Nickname is required"),
  interfaceLanguage: z.enum(interfaceLanguageCodes, { required_error: "Interface language is required" }),
  targetLanguage: z.enum(targetLanguageNames, { required_error: "Target language is required" }),
  proficiencyLevel: z.enum(proficiencyLevels).optional(),
  goal: z.string().min(10, "Goal should be at least 10 characters").max(200, "Goal should be at most 200 characters"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const baseEnTranslations: Record<string, string> = {
  step1Title: "Welcome to LinguaLab!",
  step2Title: "Your Learning Focus",
  step3Title: "Define Your Goal",
  nicknameLabel: "Your Nickname",
  nicknamePlaceholder: "E.g., Alex",
  interfaceLanguageLabel: "Interface Language",
  interfaceLanguagePlaceholder: "Select language",
  targetLanguageLabel: "Target Language",
  targetLanguagePlaceholder: "Select language to learn",
  proficiencyLevelLabel: "Your Current Proficiency Level (Optional)",
  proficiencyLevelPlaceholder: "Select your level",
  goalLabel: "Your Personal Goal",
  goalPlaceholder: "E.g., Pass B2 TELC exam, Speak fluently with colleagues...",
  previousButton: "Previous",
  nextButton: "Next",
  submitButton: "Generate My Plan & Start Learning!",
  generatingPlanButton: "Generating Plan...",
  generatingPlanMessage: "Your personalized learning plan is being generated. This may take a moment, please wait...",
  stepDescription: "Step {current} of {total}",
  setupCompleteTitle: "Setup Complete, {userName}!",
  setupCompleteDescription: "Your personalized learning roadmap has been generated. Happy learning!",
  errorTitle: "Error",
  errorDescription: "Failed to complete setup. Please try again.",
  fallbackLearnerName: "Learner",
  startLearningButton: "Start Learning!",
};

const baseRuTranslations: Record<string, string> = {
  step1Title: "Добро пожаловать в LinguaLab!",
  step2Title: "Ваш фокус обучения",
  step3Title: "Определите вашу цель",
  nicknameLabel: "Ваш псевдоним",
  nicknamePlaceholder: "Напр., Алекс",
  interfaceLanguageLabel: "Язык интерфейса",
  interfaceLanguagePlaceholder: "Выберите язык",
  targetLanguageLabel: "Изучаемый язык",
  targetLanguagePlaceholder: "Выберите язык для изучения",
  proficiencyLevelLabel: "Ваш текущий уровень (необязательно)",
  proficiencyLevelPlaceholder: "Выберите ваш уровень",
  goalLabel: "Ваша личная цель",
  goalPlaceholder: "Напр., Сдать экзамен B2 TELC, Свободно говорить с коллегами...",
  previousButton: "Назад",
  nextButton: "Далее",
  submitButton: "Создать мой план и начать обучение!",
  generatingPlanButton: "Генерация плана...",
  generatingPlanMessage: "Ваш персональный учебный план генерируется. Это может занять некоторое время, пожалуйста, подождите...",
  stepDescription: "Шаг {current} из {total}",
  setupCompleteTitle: "Настройка завершена, {userName}!",
  setupCompleteDescription: "Ваш персональный план обучения создан. Приятного обучения!",
  errorTitle: "Ошибка",
  errorDescription: "Не удалось завершить настройку. Пожалуйста, попробуйте снова.",
  fallbackLearnerName: "Ученик",
  startLearningButton: "Начать обучение!",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {};
  interfaceLanguageCodes.forEach(code => {
    if (code === 'ru') {
      translations[code] = { ...baseEnTranslations, ...baseRuTranslations };
    } else {
      translations[code] = { ...baseEnTranslations };
    }
  });
  return translations;
};

const pageTranslations = generateTranslations();


export function OnboardingFlow() {
  const { userData, setUserData } = useUserData(); 
  const { toast } = useToast();
  const [isLoadingAi, setIsLoadingAi] = useState(false); 
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const router = useRouter();
  
  const { register, handleSubmit, control, trigger, formState: { errors, isValid }, watch } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange", 
    defaultValues: {
      interfaceLanguage: 'ru', 
      userName: '',
      targetLanguage: 'German',
      proficiencyLevel: 'B1-B2',
      goal: 'свободное общение, письмо, чтение для жизни в германии и сдать экзамен уровня B2'
    },
  });
  
  const selectedInterfaceLanguage = watch("interfaceLanguage") as InterfaceLanguage;
  const currentTranslations = pageTranslations[selectedInterfaceLanguage as keyof typeof pageTranslations] || pageTranslations.en;

  const steps = [
    { id: 1, titleKey: "step1Title", fields: ["userName", "interfaceLanguage"] },
    { id: 2, titleKey: "step2Title", fields: ["targetLanguage", "proficiencyLevel"] },
    { id: 3, titleKey: "step3Title", fields: ["goal"] },
  ];

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
    setIsLoadingAi(true);
    try {
      const settingsData: UserSettings = {
        userName: data.userName,
        interfaceLanguage: data.interfaceLanguage,
        targetLanguage: data.targetLanguage!, // schema ensures it's defined
        goal: [data.goal],
        proficiencyLevel: data.proficiencyLevel, // Can be undefined
        interests: [],
      };

      const roadmapInput: GeneratePersonalizedLearningRoadmapInput = {
        interfaceLanguage: data.interfaceLanguage,
        targetLanguage: data.targetLanguage!, // schema ensures it's defined
        goals: [data.goal],
        interests: [],
        proficiencyLevel: data.proficiencyLevel, // Pass it to AI if provided
      };
      const roadmapOutput: GeneratePersonalizedLearningRoadmapOutput = 
        await generatePersonalizedLearningRoadmap(roadmapInput);
      
      setUserData(prev => {
        const existingProgress = prev.progress || initialUserProgress;
        
        const newProgressData: UserProgress = {
          ...existingProgress,
          learningRoadmap: roadmapOutput as LearningRoadmap,
          completedLessonIds: [], // Reset completed lessons for the new plan
        };
        // No need to call checkAndAwardBadges here as no XP/streak changes directly from plan generation
        return { 
          settings: settingsData, 
          progress: newProgressData 
        };
      });

      setIsPlanGenerated(true); // Set flag to show success screen

    } catch (error) {
      console.error("Onboarding error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: currentTranslations.errorTitle || baseEnTranslations.errorTitle,
        description: `${currentTranslations.errorDescription || baseEnTranslations.errorDescription} ${errorMessage ? `(${errorMessage})` : ''}`,
        variant: "destructive",
      });
      setIsLoadingAi(false); // Stop loading on error
    } finally {
      // Don't set isLoadingAi to false on success, to keep showing the final screen
    }
  };

  const stepTitle = currentTranslations[steps[currentStep].titleKey as keyof typeof currentTranslations] || `Step ${currentStep + 1} Title`;
  const stepDescriptionText = (currentTranslations.stepDescription || baseEnTranslations.stepDescription)
    .replace("{current}", (currentStep + 1).toString())
    .replace("{total}", steps.length.toString());

  const finalScreenTitle = (currentTranslations.setupCompleteTitle || baseEnTranslations.setupCompleteTitle)
    .replace('{userName}', watch("userName") || currentTranslations.fallbackLearnerName || baseEnTranslations.fallbackLearnerName);


  if (isPlanGenerated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
        <Card className="w-full max-w-lg shadow-2xl shadow-primary/10 text-center">
          <CardHeader>
            <div className="mx-auto bg-green-500/10 p-3 rounded-full w-fit mb-3">
              <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-center">
              {finalScreenTitle}
            </CardTitle>
            <CardDescription className="text-center">
              {currentTranslations.setupCompleteDescription || baseEnTranslations.setupCompleteDescription}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.replace('/dashboard')}>
              {currentTranslations.startLearningButton || baseEnTranslations.startLearningButton}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{stepTitle}</span>
          </CardTitle>
          <CardDescription className="text-center">
            {stepDescriptionText}
          </CardDescription>
           <div className="w-full bg-muted rounded-full h-1.5 mt-2">
             <div className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
           </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {steps[currentStep].fields.includes("userName") && (
              <div className="space-y-2">
                <Label htmlFor="userName">{currentTranslations.nicknameLabel}</Label>
                <Input id="userName" placeholder={currentTranslations.nicknamePlaceholder} {...register("userName")} />
                {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
              </div>
            )}
            {steps[currentStep].fields.includes("interfaceLanguage") && (
              <div className="space-y-2">
                <Label htmlFor="interfaceLanguage">{currentTranslations.interfaceLanguageLabel}</Label>
                <Controller
                  name="interfaceLanguage"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value} 
                    >
                      <SelectTrigger id="interfaceLanguage">
                        <SelectValue placeholder={currentTranslations.interfaceLanguagePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedLanguages.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.nativeName} ({lang.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.interfaceLanguage && <p className="text-sm text-destructive">{errors.interfaceLanguage.message}</p>}
              </div>
            )}
            {steps[currentStep].fields.includes("targetLanguage") && (
              <div className="space-y-2">
                <Label htmlFor="targetLanguage">{currentTranslations.targetLanguageLabel}</Label>
                <Controller name="targetLanguage" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="targetLanguage">
                        <SelectValue placeholder={currentTranslations.targetLanguagePlaceholder} />
                      </SelectTrigger>
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
            {steps[currentStep].fields.includes("proficiencyLevel") && (
              <div className="space-y-2">
                <Label htmlFor="proficiencyLevel">{currentTranslations.proficiencyLevelLabel}</Label>
                <Controller
                  name="proficiencyLevel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value} 
                    >
                      <SelectTrigger id="proficiencyLevel">
                        <SelectValue placeholder={currentTranslations.proficiencyLevelPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {proficiencyLevels.map(level => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.proficiencyLevel && <p className="text-sm text-destructive">{errors.proficiencyLevel.message}</p>}
              </div>
            )}
            {steps[currentStep].fields.includes("goal") && (
              <div className="space-y-2">
                <Label htmlFor="goal">{currentTranslations.goalLabel}</Label>
                <Textarea
                  id="goal"
                  placeholder={currentTranslations.goalPlaceholder}
                  {...register("goal")}
                  className="min-h-[100px]"
                  disabled={isLoadingAi && currentStep === steps.length - 1}
                />
                {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
              </div>
            )}
            {currentStep === steps.length - 1 && isLoadingAi && (
              <div className="mt-4 p-3 text-center bg-muted/50 rounded-md">
                <LoadingSpinner size={24} className="mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {currentTranslations.generatingPlanMessage || baseEnTranslations.generatingPlanMessage}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrev} disabled={isLoadingAi}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {currentTranslations.previousButton}
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext} disabled={isLoadingAi} className="ml-auto">
                {currentTranslations.nextButton} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="submit" disabled={isLoadingAi || !isValid} className="ml-auto w-full md:w-auto">
                {isLoadingAi ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    {currentTranslations.generatingPlanButton}
                  </>
                ) : (
                  currentTranslations.submitButton
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    