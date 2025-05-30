
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
import type { InterfaceLanguage, TargetLanguage, UserSettings, LearningRoadmap, UserProgress } from "@/lib/types";
import { supportedLanguages, interfaceLanguageCodes, targetLanguageNames, initialUserProgress } from "@/lib/types";
import { generatePersonalizedLearningRoadmap } from "@/ai/flows/ai-learning-roadmap";
import type { GeneratePersonalizedLearningRoadmapInput, GeneratePersonalizedLearningRoadmapOutput } from "@/ai/flows/ai-learning-roadmap";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Zod schema: proficiencyLevel removed from direct user input validation
const onboardingSchema = z.object({
  userName: z.string().min(1, "Nickname is required"),
  interfaceLanguage: z.enum(interfaceLanguageCodes, { required_error: "Interface language is required" }),
  targetLanguage: z.enum(targetLanguageNames, { required_error: "Target language is required" }),
  goal: z.string().min(10, "Goal should be at least 10 characters").max(200, "Goal should be at most 200 characters"),
});

type OnboardingFormData = Omit<z.infer<typeof onboardingSchema>, 'proficiencyLevel'>;


const translations: Record<string, Record<string, string>> = {
  en: {
    step1Title: "Welcome to LinguaLab!",
    step2Title: "Your Learning Focus",
    step3Title: "Define Your Goal",
    nicknameLabel: "Your Nickname",
    nicknamePlaceholder: "E.g., Alex",
    interfaceLanguageLabel: "Interface Language",
    interfaceLanguagePlaceholder: "Select language",
    targetLanguageLabel: "Target Language",
    targetLanguagePlaceholder: "Select language to learn",
    goalLabel: "Your Personal Goal",
    goalPlaceholder: "E.g., Pass B2 TELC exam, Speak fluently with colleagues...",
    previousButton: "Previous",
    nextButton: "Next",
    submitButton: "Generate My Plan & Start Learning!",
    stepDescription: "Step {current} of {total}",
    setupCompleteTitle: "Setup Complete!",
    setupCompleteDescription: "Your personalized learning roadmap has been generated.",
    errorTitle: "Error",
    errorDescription: "Failed to complete setup. Please try again.",
  },
  ru: {
    step1Title: "Добро пожаловать в LinguaLab!",
    step2Title: "Ваш фокус обучения",
    step3Title: "Определите вашу цель",
    nicknameLabel: "Ваш псевдоним",
    nicknamePlaceholder: "Напр., Алекс",
    interfaceLanguageLabel: "Язык интерфейса",
    interfaceLanguagePlaceholder: "Выберите язык",
    targetLanguageLabel: "Изучаемый язык",
    targetLanguagePlaceholder: "Выберите язык для изучения",
    goalLabel: "Ваша личная цель",
    goalPlaceholder: "Напр., Сдать экзамен B2 TELC, Свободно говорить с коллегами...",
    previousButton: "Назад",
    nextButton: "Далее",
    submitButton: "Создать мой план и начать обучение!",
    stepDescription: "Шаг {current} из {total}",
    setupCompleteTitle: "Настройка завершена!",
    setupCompleteDescription: "Ваш персональный план обучения был создан.",
    errorTitle: "Ошибка",
    errorDescription: "Не удалось завершить настройку. Пожалуйста, попробуйте снова.",
  },
  de: {
    step1Title: "Willkommen bei LinguaLab!",
    step2Title: "Dein Lernfokus",
    step3Title: "Definiere dein Ziel",
    nicknameLabel: "Dein Spitzname",
    nicknamePlaceholder: "Z.B. Alex",
    interfaceLanguageLabel: "Oberflächensprache",
    interfaceLanguagePlaceholder: "Sprache auswählen",
    targetLanguageLabel: "Zielsprache",
    targetLanguagePlaceholder: "Zu lernende Sprache auswählen",
    goalLabel: "Dein persönliches Ziel",
    goalPlaceholder: "Z.B. B2 TELC Prüfung bestehen, Fließend mit Kollegen sprechen...",
    previousButton: "Zurück",
    nextButton: "Weiter",
    submitButton: "Meinen Plan erstellen & Lernen starten!",
    stepDescription: "Schritt {current} von {total}",
    setupCompleteTitle: "Einrichtung abgeschlossen!",
    setupCompleteDescription: "Dein persönlicher Lernplan wurde erstellt.",
    errorTitle: "Fehler",
    errorDescription: "Einrichtung konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
   },
  es: {
    step1Title: "¡Bienvenido a LinguaLab!",
    step2Title: "Tu enfoque de aprendizaje",
    step3Title: "Define tu objetivo",
    nicknameLabel: "Tu apodo",
    nicknamePlaceholder: "Ej. Alex",
    interfaceLanguageLabel: "Idioma de la interfaz",
    interfaceLanguagePlaceholder: "Selecciona el idioma",
    targetLanguageLabel: "Idioma de destino",
    targetLanguagePlaceholder: "Selecciona el idioma a aprender",
    goalLabel: "Tu objetivo personal",
    goalPlaceholder: "Ej. Aprobar el examen B2 TELC, Hablar con fluidez con colegas...",
    previousButton: "Anterior",
    nextButton: "Siguiente",
    submitButton: "¡Generar mi plan y empezar a aprender!",
    stepDescription: "Paso {current} de {total}",
    setupCompleteTitle: "¡Configuración completada!",
    setupCompleteDescription: "Se ha generado tu plan de aprendizaje personalizado.",
    errorTitle: "Error",
    errorDescription: "No se pudo completar la configuración. Por favor, inténtalo de nuevo.",
   },
  fr: {
    step1Title: "Bienvenue chez LinguaLab !",
    step2Title: "Votre objectif d'apprentissage",
    step3Title: "Définissez votre objectif",
    nicknameLabel: "Votre pseudo",
    nicknamePlaceholder: "Ex. Alex",
    interfaceLanguageLabel: "Langue de l'interface",
    interfaceLanguagePlaceholder: "Sélectionner la langue",
    targetLanguageLabel: "Langue cible",
    targetLanguagePlaceholder: "Sélectionner la langue à apprendre",
    goalLabel: "Votre objectif personnel",
    goalPlaceholder: "Ex. Réussir l'examen B2 TELC, Parler couramment avec des collègues...",
    previousButton: "Précédent",
    nextButton: "Suivant",
    submitButton: "Générer mon plan et commencer à apprendre !",
    stepDescription: "Étape {current} sur {total}",
    setupCompleteTitle: "Configuration terminée !",
    setupCompleteDescription: "Votre plan d'apprentissage personnalisé a été généré.",
    errorTitle: "Erreur",
    errorDescription: "Impossible de terminer la configuration. Veuillez réessayer.",
   },
};


export function OnboardingFlow() {
  const { setUserData } = useUserData(); // Get setUserData directly
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // Local loading state for submit button
  const [currentStep, setCurrentStep] = useState(0);
  const [uiLang, setUiLang] = useState<keyof typeof translations>('en');

  const { register, handleSubmit, control, trigger, formState: { errors, isValid }, watch } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange", 
  });

  const selectedInterfaceLanguage = watch("interfaceLanguage") as keyof typeof translations | undefined;

  useEffect(() => {
    if (selectedInterfaceLanguage && translations[selectedInterfaceLanguage] && selectedInterfaceLanguage !== uiLang) {
      setUiLang(selectedInterfaceLanguage);
    } else if (selectedInterfaceLanguage && !translations[selectedInterfaceLanguage] && uiLang !== 'en') {
      setUiLang('en');
    }
  }, [selectedInterfaceLanguage, uiLang]);

  const currentTranslations = translations[uiLang] || translations.en;


  const steps = [
    { id: 1, titleKey: "step1Title", fields: ["userName", "interfaceLanguage"] },
    { id: 2, titleKey: "step2Title", fields: ["targetLanguage"] },
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
    setIsLoading(true);
    try {
      // Prepare the settings part
      const settingsData: UserSettings = {
        userName: data.userName,
        interfaceLanguage: data.interfaceLanguage as InterfaceLanguage,
        targetLanguage: data.targetLanguage as TargetLanguage,
        proficiencyLevel: 'A1-A2', // Default starting proficiency level
        goal: data.goal,
      };

      // Generate roadmap (ASYNC)
      const roadmapInput: GeneratePersonalizedLearningRoadmapInput = {
        interfaceLanguage: data.interfaceLanguage as InterfaceLanguage,
        targetLanguage: data.targetLanguage as TargetLanguage,
        proficiencyLevel: 'A1-A2', // Pass default/starting proficiency
        personalGoal: data.goal,
      };
      const roadmapOutput: GeneratePersonalizedLearningRoadmapOutput = 
        await generatePersonalizedLearningRoadmap(roadmapInput);
      
      // Update context with both settings and roadmap AT ONCE
      setUserData(prev => {
          // Ensure we start with a clean slate for progress for a new user,
          // but overlay with prev.progress in case this is somehow a re-onboarding
          // or if initialUserProgress had other important defaults.
          const newProgress: UserProgress = {
              ...initialUserProgress, // Start with defined initial progress structure
              ...prev.progress,       // Overlay any existing progress values from prev state
              learningRoadmap: roadmapOutput as LearningRoadmap, // Add the new roadmap
          };
          return {
              settings: settingsData,
              progress: newProgress,
          };
      });

      toast({
        title: currentTranslations.setupCompleteTitle || "Setup Complete!",
        description: currentTranslations.setupCompleteDescription || "Your personalized learning roadmap has been generated.",
      });
      // Redirect is handled by page.tsx based on userData.settings being populated
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: currentTranslations.errorTitle || "Error",
        description: currentTranslations.errorDescription || "Failed to complete setup. Please try again.",
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
            <Label htmlFor="userName">{currentTranslations.nicknameLabel}</Label>
            <Input id="userName" placeholder={currentTranslations.nicknamePlaceholder} {...register("userName")} />
            {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
          </div>
        )}
        {stepConfig.fields.includes("interfaceLanguage") && (
          <div className="space-y-2">
            <Label htmlFor="interfaceLanguage">{currentTranslations.interfaceLanguageLabel}</Label>
            <Controller
              name="interfaceLanguage"
              control={control}
              defaultValue={uiLang as InterfaceLanguage}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  value={field.value || uiLang}
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
        {stepConfig.fields.includes("targetLanguage") && (
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
        {stepConfig.fields.includes("goal") && (
          <div className="space-y-2">
            <Label htmlFor="goal">{currentTranslations.goalLabel}</Label>
            <Textarea
              id="goal"
              placeholder={currentTranslations.goalPlaceholder}
              {...register("goal")}
              className="min-h-[100px]"
            />
            {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
          </div>
        )}
      </>
    )
  };

  const stepTitle = currentTranslations[steps[currentStep].titleKey] || `Step ${currentStep + 1} Title`;
  const stepDescription = (currentTranslations.stepDescription)
    .replace("{current}", (currentStep + 1).toString())
    .replace("{total}", steps.length.toString());

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{stepTitle}</span>
          </CardTitle>
          <CardDescription className="text-center">
            {stepDescription}
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
                <ArrowLeft className="mr-2 h-4 w-4" /> {currentTranslations.previousButton}
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext} disabled={isLoading} className="ml-auto">
                {currentTranslations.nextButton} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="submit" disabled={isLoading || !isValid} className="ml-auto w-full md:w-auto">
                {isLoading ? <LoadingSpinner /> : (currentTranslations.submitButton)}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
