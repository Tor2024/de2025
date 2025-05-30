
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
import type { InterfaceLanguage as AppInterfaceLanguage } from "@/lib/types"; // Renamed to avoid conflict
import { interfaceLanguageCodes, proficiencyLevels as appProficiencyLevels } from "@/lib/types";


const grammarSchema = z.object({
  grammarTopic: z.string().min(3, "Topic should be at least 3 characters"),
});

type GrammarFormData = z.infer<typeof grammarSchema>;

const baseEnTranslations = {
  title: "Adaptive Grammar Explanations",
  description: "Enter a grammar topic you want to understand better. Our AI tutor will provide a clear explanation and practice tasks tailored to your level and goals.",
  grammarTopicLabel: "Grammar Topic",
  grammarTopicPlaceholder: "E.g., Dative Case, Modal Verbs, Subjunctive II",
  getExplanationButton: "Get Explanation",
  resultsTitlePrefix: "Explanation for:",
  explanationHeader: "Explanation",
  practiceTasksHeader: "Practice Tasks",
  toastSuccessTitle: "Explanation Generated!",
  toastSuccessDescriptionTemplate: "Grammar explanation for \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate grammar explanation. Please try again.",
  onboardingMissing: "Please complete onboarding first.",
};

const baseRuTranslations = {
  title: "Адаптивные объяснения грамматики",
  description: "Введите грамматическую тему, которую вы хотите лучше понять. Наш AI-репетитор предоставит четкое объяснение и практические задания, адаптированные к вашему уровню и целям.",
  grammarTopicLabel: "Грамматическая тема",
  grammarTopicPlaceholder: "Напр., Дательный падеж, Модальные глаголы, Сослагательное наклонение II",
  getExplanationButton: "Получить объяснение",
  resultsTitlePrefix: "Объяснение для:",
  explanationHeader: "Объяснение",
  practiceTasksHeader: "Практические задания",
  toastSuccessTitle: "Объяснение создано!",
  toastSuccessDescriptionTemplate: "Объяснение грамматики для темы \"{topic}\" готово.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать объяснение грамматики. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {
    en: baseEnTranslations,
    ru: baseRuTranslations,
  };
  interfaceLanguageCodes.forEach(code => {
    if (code !== 'en' && code !== 'ru') { // Ensure only 'en' and 'ru' are explicitly set if others fallback
      translations[code] = { ...baseEnTranslations }; // Fallback to English for other languages
    }
  });
  return translations;
};

const componentTranslations = generateTranslations();

export function GrammarModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState<AdaptiveGrammarExplanationsOutput | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<GrammarFormData>({
    resolver: zodResolver(grammarSchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = componentTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key];
    }
    return defaultText || key;
  };


  if (isUserDataLoading && !userData.settings) {
     return <div className="flex h-full items-center justify-center"><LoadingSpinner size={32} /><p className="ml-2">{t('loading', 'Loading...')}</p></div>;
  }
  
  if (!userData.settings || !userData.progress) {
    return <p>{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<GrammarFormData> = async (data) => {
    setIsLoading(true);
    setExplanationResult(null);
    try {
      const grammarInput: AdaptiveGrammarExplanationsInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AiInterfaceLanguage,
        grammarTopic: data.grammarTopic,
        proficiencyLevel: userData.settings!.proficiencyLevel as AiProficiencyLevel,
        learningGoal: userData.settings!.goal,
        userPastErrors: userData.progress!.errorArchive.map(e => `${e.topic}: ${e.error}`).join('\n') || "No past errors recorded.",
      };
      
      const result = await adaptiveGrammarExplanations(grammarInput);
      if (!result) {
        throw new Error("AI failed to generate grammar explanation. Output was null.");
      }
      setExplanationResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.grammarTopic),
      });
      reset(); // Clear form on success
    } catch (error) {
      console.error("Grammar explanation error:", error);
      toast({
        title: t('toastErrorTitle'),
        description: t('toastErrorDescription'),
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
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="grammarTopic">{t('grammarTopicLabel')}</Label>
              <Input id="grammarTopic" placeholder={t('grammarTopicPlaceholder')} {...register("grammarTopic")} />
              {errors.grammarTopic && <p className="text-sm text-destructive">{errors.grammarTopic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <LoadingSpinner /> : t('getExplanationButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {explanationResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('resultsTitlePrefix')} {explanationResult.explanation.substring(0,50)}...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">{t('explanationHeader')}</h3>
            <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
              <p className="whitespace-pre-wrap">{explanationResult.explanation}</p>
            </ScrollArea>
            
            <h3 className="font-semibold text-lg mt-4">{t('practiceTasksHeader')}</h3>
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
