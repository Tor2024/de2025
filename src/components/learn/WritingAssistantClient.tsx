
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserData } from "@/contexts/UserDataContext";
import { aiPoweredWritingAssistance } from "@/ai/flows/ai-powered-writing-assistance";
import type { AIPoweredWritingAssistanceInput, AIPoweredWritingAssistanceOutput } from "@/ai/flows/ai-powered-writing-assistance";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Edit, CheckCircle } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage, germanWritingTaskTypes, type GermanWritingTaskType } from "@/lib/types";

const writingTaskTypeValues = germanWritingTaskTypes.map(t => t.value) as [string, ...string[]];

const writingSchema = z.object({
  writingPrompt: z.string().min(5, "Prompt should be at least 5 characters"),
  userText: z.string().min(10, "Your text should be at least 10 characters"),
  writingTaskType: z.enum(writingTaskTypeValues).optional(),
});

type WritingFormData = z.infer<typeof writingSchema>;

const baseEnTranslations = {
  title: "AI-Powered Writing Assistant",
  description: "Write on a given prompt and get AI-driven feedback on structure, grammar, and tone, along with corrections. Optionally, select a writing task type for more specific feedback.",
  writingPromptLabel: "Writing Prompt",
  writingPromptPlaceholder: "E.g., Describe your last holiday, Write a formal email asking for information...",
  userTextLabel: "Your Text",
  userTextPlaceholder: "Write your text in {language} here...",
  writingTaskTypeLabel: "Writing Task Type (Optional)",
  writingTaskTypePlaceholder: "Select task type (e.g., Formal Letter, Essay)",
  getFeedbackButton: "Get Feedback",
  toastSuccessTitle: "Feedback Received!",
  toastSuccessDescription: "Your writing has been reviewed.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to get writing assistance. Please try again.",
  resultsCardTitle: "Feedback & Corrections",
  feedbackSectionTitle: "Feedback:",
  correctedTextSectionTitle: "Corrected Text:",
  onboardingMissing: "Please complete onboarding first.",
  loading: "Loading...",
  informalLetterEmail: "Informal Letter/Email",
  formalLetterEmail: "Formal Letter/Email",
  complaintLetter: "Complaint Letter",
  announcementNotice: "Announcement/Notice",
  chatSmsNote: "Chat/SMS/Short Note",
  essayArgumentative: "Essay/Argumentative Text",
};

const baseRuTranslations = {
  title: "Помощник по письму с ИИ",
  description: "Напишите текст на заданную тему и получите от ИИ обратную связь по структуре, грамматике и тону, а также исправления. При желании выберите тип письменного задания для более точной обратной связи.",
  writingPromptLabel: "Тема для письма",
  writingPromptPlaceholder: "Напр., Опишите свой последний отпуск, Напишите официальное письмо с запросом информации...",
  userTextLabel: "Ваш текст",
  userTextPlaceholder: "Напишите свой текст на языке {language} здесь...",
  writingTaskTypeLabel: "Тип письменного задания (необязательно)",
  writingTaskTypePlaceholder: "Выберите тип задания (напр., Официальное письмо, Эссе)",
  getFeedbackButton: "Получить обратную связь",
  toastSuccessTitle: "Обратная связь получена!",
  toastSuccessDescription: "Ваш текст был проверен.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось получить помощь в написании. Пожалуйста, попробуйте снова.",
  resultsCardTitle: "Обратная связь и исправления",
  feedbackSectionTitle: "Обратная связь:",
  correctedTextSectionTitle: "Исправленный текст:",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
  loading: "Загрузка...",
  informalLetterEmail: "Неофициальное письмо/E-Mail",
  formalLetterEmail: "Официальное письмо/E-Mail",
  complaintLetter: "Жалоба",
  announcementNotice: "Объявление/Заметка",
  chatSmsNote: "Сообщение в чате/SMS",
  essayArgumentative: "Эссе/Аргументативный текст",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {
    en: baseEnTranslations,
    ru: baseRuTranslations,
  };
  interfaceLanguageCodes.forEach(code => {
    if (!translations[code]) { 
      translations[code] = { ...baseEnTranslations };
    }
  });
  return translations;
};

const componentTranslations = generateTranslations();

export function WritingAssistantClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [assistanceResult, setAssistanceResult] = useState<AIPoweredWritingAssistanceOutput | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<WritingFormData>({
    resolver: zodResolver(writingSchema),
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
    return <div className="flex h-full items-center justify-center"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p>{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<WritingFormData> = async (data) => {
    setIsLoading(true);
    setAssistanceResult(null);
    try {
      const writingInput: AIPoweredWritingAssistanceInput = {
        prompt: data.writingPrompt,
        text: data.userText,
        interfaceLanguage: userData.settings!.interfaceLanguage as InterfaceLanguage,
        writingTaskType: data.writingTaskType as GermanWritingTaskType | undefined,
      };
      
      const result = await aiPoweredWritingAssistance(writingInput);
      setAssistanceResult(result);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescription'),
      });
    } catch (error) {
      console.error("Writing assistance error:", error);
      toast({
        title: t('toastErrorTitle'),
        description: t('toastErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const translatedTaskTypes = germanWritingTaskTypes.map(taskType => ({
    value: taskType.value,
    label: t(taskType.labelKey, taskType.defaultLabel),
  }));


  return (
    <div className="space-y-6">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-accent/5 border border-accent/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
             <Edit className="h-8 w-8 text-accent animate-pulse" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="writingPrompt">{t('writingPromptLabel')}</Label>
              <Input id="writingPrompt" placeholder={t('writingPromptPlaceholder')} {...register("writingPrompt")} />
              {errors.writingPrompt && <p className="text-sm text-destructive">{errors.writingPrompt.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="writingTaskType">{t('writingTaskTypeLabel')}</Label>
              <Controller
                name="writingTaskType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="writingTaskType">
                      <SelectValue placeholder={t('writingTaskTypePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {translatedTaskTypes.map(taskType => (
                        <SelectItem key={taskType.value} value={taskType.value}>
                          {taskType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.writingTaskType && <p className="text-sm text-destructive">{errors.writingTaskType.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="userText">{t('userTextLabel')} ({userData.settings.targetLanguage})</Label>
              <Textarea id="userText" placeholder={t('userTextPlaceholder').replace('{language}', userData.settings.targetLanguage)} {...register("userText")} className="min-h-[150px]" />
              {errors.userText && <p className="text-sm text-destructive">{errors.userText.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <LoadingSpinner /> : t('getFeedbackButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {assistanceResult && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500"/>{t('resultsCardTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-lg">{t('feedbackSectionTitle')}</h3>
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                <p className="whitespace-pre-wrap">{assistanceResult.feedback}</p>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{t('correctedTextSectionTitle')}</CardTitle>
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
