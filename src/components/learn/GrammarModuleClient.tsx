
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
import type { AdaptiveGrammarExplanationsInput, AdaptiveGrammarExplanationsOutput } from "@/ai/flows/adaptive-grammar-explanations";
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles, XCircle } from "lucide-react";
import { interfaceLanguageCodes } from "@/lib/types";


const grammarSchema = z.object({
  grammarTopic: z.string().min(3, "Topic should be at least 3 characters"),
});

type GrammarFormData = z.infer<typeof grammarSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Adaptive Grammar Explanations",
  description: "Enter a grammar topic you want to understand better. Our AI tutor will provide a clear explanation and practice tasks tailored to your level and goals.",
  grammarTopicLabel: "Grammar Topic",
  grammarTopicPlaceholder: "E.g., Dative Case, Modal Verbs, Subjunctive II",
  getExplanationButton: "Get Explanation",
  resultsTitlePrefix: "Explanation for:",
  explanationHeader: "Explanation",
  practiceTasksHeader: "Practice Tasks",
  noPracticeTasks: "No practice tasks were generated for this topic.",
  toastSuccessTitle: "Explanation Generated!",
  toastSuccessDescriptionTemplate: "Grammar explanation for \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate grammar explanation. Please try again.",
  onboardingMissing: "Please complete onboarding first.",
  loading: "Loading...",
  clearResultsButton: "Clear Results",
};

const baseRuTranslations: Record<string, string> = {
  title: "Адаптивные объяснения грамматики",
  description: "Введите грамматическую тему, которую вы хотите лучше понять. Наш AI-репетитор предоставит четкое объяснение и практические задания, адаптированные к вашему уровню и целям.",
  grammarTopicLabel: "Грамматическая тема",
  grammarTopicPlaceholder: "Напр., Дательный падеж, Модальные глаголы, Сослагательное наклонение II",
  getExplanationButton: "Получить объяснение",
  resultsTitlePrefix: "Объяснение для:",
  explanationHeader: "Объяснение",
  practiceTasksHeader: "Практические задания",
  noPracticeTasks: "Для этой темы практические задания не были сгенерированы.",
  toastSuccessTitle: "Объяснение создано!",
  toastSuccessDescriptionTemplate: "Объяснение грамматики для темы \"{topic}\" готово.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать объяснение грамматики. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
  loading: "Загрузка...",
  clearResultsButton: "Очистить результаты",
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

const componentTranslations = generateTranslations();

export function GrammarModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState<AdaptiveGrammarExplanationsOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<GrammarFormData>({
    resolver: zodResolver(grammarSchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };


  if (isUserDataLoading) {
     return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }
  
  if (!userData.settings || !userData.progress) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<GrammarFormData> = async (data) => {
    setIsAiLoading(true);
    setExplanationResult(null);
    setCurrentTopic(data.grammarTopic);
    try {
      const grammarInput: AdaptiveGrammarExplanationsInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage,
        grammarTopic: data.grammarTopic,
        proficiencyLevel: userData.settings!.proficiencyLevel,
        learningGoal: userData.settings!.goal,
        userPastErrors: userData.progress!.errorArchive.map(e => `${e.topic}: ${e.error}`).join('\n') || "No past errors recorded.",
      };
      
      const result = await adaptiveGrammarExplanations(grammarInput);
      setExplanationResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.grammarTopic),
      });
      reset(); 
    } catch (error) {
      console.error("Grammar explanation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('toastErrorTitle'),
        description: `${t('toastErrorDescription')} ${errorMessage ? `(${errorMessage})` : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearResults = () => {
    setExplanationResult(null);
    setCurrentTopic("");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
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
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
              {t('getExplanationButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {explanationResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  {t('resultsTitlePrefix')} {currentTopic}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                <XCircle className="mr-2 h-4 w-4" />
                {t('clearResultsButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('explanationHeader')}</h3>
              <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{explanationResult.explanation}</p>
              </ScrollArea>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mt-4 mb-2">{t('practiceTasksHeader')}</h3>
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                {explanationResult.practiceTasks && explanationResult.practiceTasks.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {explanationResult.practiceTasks.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t('noPracticeTasks')}</p>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    