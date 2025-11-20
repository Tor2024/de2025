
"use client";

import { useState, useEffect } from "react";
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
import { generateWritingTask } from "@/ai/flows/generate-writing-task-flow";
import type { GenerateWritingTaskInput, GenerateWritingTaskOutput } from "@/ai/flows/generate-writing-task-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Edit, CheckCircle, Sparkles, XCircle, FileText, ListChecks, Lightbulb, PencilRuler } from "lucide-react";
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, germanWritingTaskTypes, type GermanWritingTaskType, proficiencyLevels as appProficiencyLevels, type ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { useRouter, useSearchParams } from 'next/navigation';
import { toggleLessonCompletion } from '@/lib/userDataUtils';
import { lessonTypes } from '@/config/lessonTypes';


const topicSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters long."),
});
type TopicFormData = z.infer<typeof topicSchema>;

const writingSchema = z.object({
  userText: z.string().min(10, "Your text should be at least 10 characters"),
});
type WritingFormData = z.infer<typeof writingSchema>;


const baseEnTranslations: Record<string, string> = {
    title: "AI Writing Assistant",
    description: "Get a unique writing task on your chosen topic, then receive AI-driven feedback on your text.",
    topicFormTitle: "1. Choose a Topic",
    topicFormDescription: "Enter a general theme, and the AI will create a specific writing task for you.",
    topicLabel: "General Theme",
    topicPlaceholder: "e.g., Travel, Hobbies, Work",
    generateTaskButton: "Generate Writing Task",
    
    taskTitle: "2. Your Writing Task",
    userTextLabel: "Your Text",
    userTextPlaceholder: "Write your text in {language} here...",
    getFeedbackButton: "Get Feedback",

    resultsCardTitle: "Feedback & Corrections",
    feedbackSectionTitle: "Feedback",
    yourOriginalTextSectionTitle: "Your Original Text",
    correctedTextSectionTitle: "Corrected Text (with highlights)",
    errorCategoriesHeader: "Identified Error Types",
    errorCategoryLabel: "Category",
    errorSpecificErrorLabel: "Specific Error",
    errorCommentLabel: "Comment",

    toastTaskSuccessTitle: "Task Generated!",
    toastTaskSuccessDescription: "Your writing task is ready.",
    toastTaskErrorTitle: "Task Generation Error",
    toastTaskErrorDescription: "Could not generate a task. Please try another topic.",
    
    toastFeedbackSuccessTitle: "Feedback Received!",
    toastFeedbackSuccessDescription: "Your writing has been reviewed.",
    toastFeedbackErrorTitle: "Feedback Error",
    toastFeedbackErrorDescription: "Failed to get writing assistance. Please try again.",

    onboardingMissing: "Please complete onboarding first.",
    loading: "Loading...",
    clearResultsButton: "Start New Task",
    nextLessonButton: "Complete & Go to Next Section",
};

const baseRuTranslations: Record<string, string> = {
    title: "Помощник по письму с ИИ",
    description: "Получите уникальное письменное задание по выбранной теме, а затем получите от ИИ обратную связь по вашему тексту.",
    topicFormTitle: "1. Выберите тему",
    topicFormDescription: "Введите общую тему, и ИИ создаст для вас конкретное письменное задание.",
    topicLabel: "Общая тема",
    topicPlaceholder: "Напр., Путешествия, Хобби, Работа",
    generateTaskButton: "Сгенерировать задание",

    taskTitle: "2. Ваше письменное задание",
    userTextLabel: "Ваш текст",
    userTextPlaceholder: "Напишите свой текст на языке {language} здесь...",
    getFeedbackButton: "Получить обратную связь",

    resultsCardTitle: "Обратная связь и исправления",
    feedbackSectionTitle: "Обратная связь",
    yourOriginalTextSectionTitle: "Ваш исходный текст",
    correctedTextSectionTitle: "Исправленный текст (с выделениями)",
    errorCategoriesHeader: "Выявленные типы ошибок",
    errorCategoryLabel: "Категория",
    errorSpecificErrorLabel: "Конкретная ошибка",
    errorCommentLabel: "Комментарий",
    
    toastTaskSuccessTitle: "Задание сгенерировано!",
    toastTaskSuccessDescription: "Ваше письменное задание готово.",
    toastTaskErrorTitle: "Ошибка генерации задания",
    toastTaskErrorDescription: "Не удалось создать задание. Попробуйте другую тему.",

    toastFeedbackSuccessTitle: "Обратная связь получена!",
    toastFeedbackSuccessDescription: "Ваш текст был проверен.",
    toastFeedbackErrorTitle: "Ошибка обратной связи",
    toastFeedbackErrorDescription: "Не удалось получить помощь в написании. Пожалуйста, попробуйте снова.",

    onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
    loading: "Загрузка...",
    clearResultsButton: "Начать новое задание",
    nextLessonButton: "Завершить и перейти к следующему разделу",
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

const lessonSections = ['grammar', 'vocabulary', 'repetition', 'reading', 'listening', 'writing', 'practice'];

function goToNextSection(
  currentSection: string,
  lessonId: string | null,
  topic: string | null,
  baseLevel: string | null,
  router: ReturnType<typeof useRouter>
) {
  const currentIndex = lessonSections.indexOf(currentSection);
  for (let i = currentIndex + 1; i < lessonSections.length; i++) {
    const nextSection = lessonSections[i];
    if ((lessonTypes as Record<string, any>)[nextSection]) {
      let href = `/learn/${nextSection}?lessonId=${encodeURIComponent(lessonId || '')}`;
      if (topic) href += `&topic=${encodeURIComponent(topic)}`;
      if (baseLevel) href += `&baseLevel=${encodeURIComponent(baseLevel)}`;
      router.push(href);
      return;
    }
  }
  router.push('/dashboard?completedLesson=' + (lessonId || ''));
}


export default function WritingModuleClient() {
  const { userData, isLoading: isUserDataLoading, setUserData } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<GenerateWritingTaskOutput | null>(null);
  const [assistanceResult, setAssistanceResult] = useState<AIPoweredWritingAssistanceOutput | null>(null);
  const [submittedUserText, setSubmittedUserText] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicForm = useForm<TopicFormData>({ resolver: zodResolver(topicSchema) });
  const writingForm = useForm<WritingFormData>({ resolver: zodResolver(writingSchema) });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };
  
  const topicFromParams = searchParams.get('topic');

  useEffect(() => {
    if (topicFromParams && !generatedTask && !isAiLoading) { 
      topicForm.setValue('topic', decodeURIComponent(topicFromParams));
      handleGenerateTask({ topic: decodeURIComponent(topicFromParams) });
    }
  }, [topicFromParams, generatedTask, isAiLoading]);

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }
  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const handleGenerateTask: SubmitHandler<TopicFormData> = async (data) => {
    setIsAiLoading(true);
    setGeneratedTask(null);
    setAssistanceResult(null);
    setSubmittedUserText(null);
    writingForm.reset();

    try {
      const taskInput: GenerateWritingTaskInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage as AppTargetLanguage,
        proficiencyLevel: (userData.settings!.proficiencyLevel || 'A1-A2') as AppProficiencyLevel,
        topic: data.topic,
        goals: Array.isArray(userData.settings!.goal) ? userData.settings!.goal : [userData.settings!.goal],
        interests: userData.settings!.interests || [],
      };
      const result = await generateWritingTask(taskInput);
      setGeneratedTask(result);
      toast({
        title: t('toastTaskSuccessTitle'),
        description: t('toastTaskSuccessDescription'),
      });
    } catch (error) {
      console.error("Writing task generation error:", error);
      toast({
        title: t('toastTaskErrorTitle'),
        description: t('toastTaskErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetFeedback: SubmitHandler<WritingFormData> = async (data) => {
    if (!generatedTask) return;
    setIsAiLoading(true);
    setAssistanceResult(null);
    setSubmittedUserText(data.userText); 

    try {
      const assistanceInput: AIPoweredWritingAssistanceInput = {
        prompt: generatedTask.writingPrompt,
        text: data.userText,
        interfaceLanguage: userData.settings!.interfaceLanguage as AppInterfaceLanguage,
        writingTaskType: generatedTask.taskType as GermanWritingTaskType | undefined,
        proficiencyLevel: (userData.settings!.proficiencyLevel || 'A1-A2') as AppProficiencyLevel,
        goals: Array.isArray(userData.settings!.goal) ? userData.settings!.goal : [userData.settings!.goal],
        interests: userData.settings!.interests || [],
      };
      
      const result = await aiPoweredWritingAssistance(assistanceInput);
      setAssistanceResult(result);
      toast({
        title: t('toastFeedbackSuccessTitle'),
        description: t('toastFeedbackSuccessDescription'),
      });
    } catch (error) {
      console.error("Writing assistance error:", error);
      toast({
        title: t('toastFeedbackErrorTitle'),
        description: t('toastFeedbackErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearAll = () => {
    setGeneratedTask(null);
    setAssistanceResult(null);
    setSubmittedUserText(null);
    topicForm.reset();
    writingForm.reset();
  };
  
  const handleCompleteAndNext = () => {
    const lessonId = searchParams.get('lessonId');
    if (lessonId && setUserData) {
      toggleLessonCompletion(setUserData, lessonId);
    }
    const topic = searchParams.get('topic');
    const baseLevel = searchParams.get('baseLevel');
    goToNextSection('writing', lessonId, topic, baseLevel, router);
  };


  if (assistanceResult) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              {t('resultsCardTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feedback & Errors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/>{t('feedbackSectionTitle')}</h3>
                <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{assistanceResult.feedback}</p>
                </ScrollArea>
              </div>
              {assistanceResult.errorCategories && assistanceResult.errorCategories.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-orange-500" />{t('errorCategoriesHeader')}</h3>
                  <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                    <ul className="space-y-3">
                      {assistanceResult.errorCategories.map((errCat, index) => (
                        <li key={index} className="text-sm p-2 rounded-md bg-card border border-border/50">
                          <p><strong>{t('errorCategoryLabel')}:</strong> {errCat.category}</p>
                          <p><strong>{t('errorSpecificErrorLabel')}:</strong> {errCat.specificError}</p>
                          {errCat.comment && <p><em>{t('errorCommentLabel')}: {errCat.comment}</em></p>}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
             {/* Original and Corrected Text */}
            {submittedUserText && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-blue-500" />{t('yourOriginalTextSectionTitle')}</h3>
                <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{submittedUserText}</p>
                </ScrollArea>
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500"/>{t('correctedTextSectionTitle')}</h3>
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                <div className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: assistanceResult.markedCorrectedText }} />
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleClearAll} variant="outline">{t('clearResultsButton')}</Button>
            <Button onClick={handleCompleteAndNext}>{t('nextLessonButton')}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Edit className="h-8 w-8 text-primary animate-pulse" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        
        {!generatedTask ? (
          <form onSubmit={topicForm.handleSubmit(handleGenerateTask)}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><PencilRuler className="h-6 w-6 text-accent" />{t('topicFormTitle')}</CardTitle>
              <CardDescription>{t('topicFormDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="topic">{t('topicLabel')}</Label>
                <Input id="topic" placeholder={t('topicPlaceholder')} {...topicForm.register("topic")} />
                {topicForm.formState.errors.topic && <p className="text-sm text-destructive">{topicForm.formState.errors.topic.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isAiLoading}>
                {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
                {t('generateTaskButton')}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={writingForm.handleSubmit(handleGetFeedback)}>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Lightbulb className="h-6 w-6 text-accent" />{t('taskTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-md border">
                    <p className="font-semibold">{generatedTask.writingPrompt}</p>
                    {generatedTask.taskType && (
                        <p className="text-sm text-muted-foreground mt-1">({t('writingTaskTypeLabel')}: {generatedTask.taskType})</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="userText">{t('userTextLabel').replace('{language}', userData.settings.targetLanguage)}</Label>
                    <Textarea id="userText" placeholder={t('userTextPlaceholder').replace('{language}', userData.settings.targetLanguage)} {...writingForm.register("userText")} className="min-h-[200px]" />
                    {writingForm.formState.errors.userText && <p className="text-sm text-destructive">{writingForm.formState.errors.userText.message}</p>}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={handleClearAll}>{t('clearResultsButton', 'Cancel')}</Button>
                <Button type="submit" disabled={isAiLoading}>
                    {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
                    {t('getFeedbackButton')}
                </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
