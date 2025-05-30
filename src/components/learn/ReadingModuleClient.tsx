
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
import { generateReadingMaterial } from "@/ai/flows/generate-reading-material-flow";
import type { GenerateReadingMaterialInput, GenerateReadingMaterialOutput } from "@/ai/flows/generate-reading-material-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BookOpen, HelpCircle, Sparkles } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { interfaceLanguageCodes } from "@/lib/types";

const readingSchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});
type ReadingFormData = z.infer<typeof readingSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Reading Practice",
  description: "Enter a topic you'd like to read about. Our AI will generate a text in your target language, adapted to your proficiency level, along with optional comprehension questions.",
  topicLabel: "Topic for Reading",
  topicPlaceholder: "E.g., My Daily Routine, Space Exploration, German Food",
  getTextButton: "Get Reading Text",
  resultsTitlePrefix: "Reading Material on:",
  readingTextHeader: "Text",
  comprehensionQuestionsHeader: "Comprehension Questions",
  toastSuccessTitle: "Reading Material Generated!",
  toastSuccessDescriptionTemplate: "Text about \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate reading material. Please try again.",
  onboardingMissing: "Please complete onboarding first to set your languages and proficiency.",
  loading: "Loading...",
  noQuestions: "No comprehension questions were generated for this text.",
};

const baseRuTranslations: Record<string, string> = {
  title: "Практика чтения",
  description: "Введите тему, о которой вы хотели бы почитать. Наш ИИ сгенерирует текст на изучаемом вами языке, адаптированный к вашему уровню, а также опциональные вопросы на понимание.",
  topicLabel: "Тема для чтения",
  topicPlaceholder: "Напр., Мой распорядок дня, Освоение космоса, Немецкая кухня",
  getTextButton: "Получить текст",
  resultsTitlePrefix: "Материал для чтения по теме:",
  readingTextHeader: "Текст",
  comprehensionQuestionsHeader: "Вопросы на понимание",
  toastSuccessTitle: "Материал для чтения создан!",
  toastSuccessDescriptionTemplate: "Текст по теме \"{topic}\" готов.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать материал для чтения. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг, чтобы установить языки и уровень.",
  loading: "Загрузка...",
  noQuestions: "Для этого текста не было сгенерировано вопросов на понимание.",
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

export function ReadingModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [readingResult, setReadingResult] = useState<GenerateReadingMaterialOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReadingFormData>({
    resolver: zodResolver(readingSchema),
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

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p>{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<ReadingFormData> = async (data) => {
    setIsAiLoading(true);
    setReadingResult(null);
    setCurrentTopic(data.topic); 
    try {
      const flowInput: GenerateReadingMaterialInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage,
        proficiencyLevel: userData.settings!.proficiencyLevel,
        topic: data.topic,
      };
      
      const result = await generateReadingMaterial(flowInput);
      setReadingResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.topic),
      });
      reset();
    } catch (error) {
      console.error("Reading material generation error:", error);
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

  return (
    <div className="space-y-6">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="topic">{t('topicLabel')}</Label>
              <Input id="topic" placeholder={t('topicPlaceholder')} {...register("topic")} />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading ? <LoadingSpinner /> : t('getTextButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {readingResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Sparkles className="h-6 w-6 text-primary" />
              {t('resultsTitlePrefix')} {currentTopic}
              {readingResult.title && <span className="block text-lg text-muted-foreground mt-1">({readingResult.title})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">{t('readingTextHeader')} ({userData.settings.targetLanguage})</h3>
            <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
              <p className="whitespace-pre-wrap text-base leading-relaxed">{readingResult.readingText}</p>
            </ScrollArea>
            
            {readingResult.comprehensionQuestions && readingResult.comprehensionQuestions.length > 0 && (
              <>
                <h3 className="font-semibold text-lg mt-4">{t('comprehensionQuestionsHeader')}</h3>
                <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                  <ul className="space-y-3">
                    {readingResult.comprehensionQuestions.map((q, index) => (
                      <li key={index} className="text-sm p-2 rounded-md bg-card border">
                        <p className="font-medium mb-1 flex items-center"><HelpCircle className="h-4 w-4 mr-2 text-primary/80" />{q.question}</p>
                        {q.options && q.options.length > 0 && (
                          <ul className="list-disc pl-5 space-y-1 text-xs ml-4">
                            {q.options.map((opt, optIndex) => (
                              <li key={optIndex}>{opt}</li>
                            ))}
                          </ul>
                        )}
                        {q.answer && (
                           <p className="text-xs text-muted-foreground mt-1 ml-4"><em>{t('answerIndication', 'Answer indication')}: {q.answer}</em></p>
                        )}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </>
            )}
            {(!readingResult.comprehensionQuestions || readingResult.comprehensionQuestions.length === 0) && (
                <p className="text-sm text-muted-foreground italic mt-4">{t('noQuestions')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    