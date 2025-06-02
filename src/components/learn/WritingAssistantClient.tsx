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
import type { AIPoweredWritingAssistanceInput, AIPoweredWritingAssistanceOutput, ErrorCategory } from "@/ai/flows/ai-powered-writing-assistance";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Edit, CheckCircle, Sparkles, XCircle, FileText, ListChecks } from "lucide-react"; 
import { interfaceLanguageCodes, type InterfaceLanguage as AppInterfaceLanguage, germanWritingTaskTypes, type GermanWritingTaskType, proficiencyLevels as appProficiencyLevels, type ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { useRouter, useSearchParams } from 'next/navigation';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';

const writingTaskTypeValues = germanWritingTaskTypes.map(t => t.value) as [string, ...string[]];

const writingSchema = z.object({
  writingPrompt: z.string().min(5, "Prompt should be at least 5 characters"),
  userText: z.string().min(10, "Your text should be at least 10 characters"),
  writingTaskType: z.enum(writingTaskTypeValues).optional(),
});

type WritingFormData = z.infer<typeof writingSchema>;

const baseEnTranslations: Record<string, string> = {
  title: "AI-Powered Writing Assistant",
  description: "Write on a given prompt and get AI-driven feedback on structure, grammar, and tone, along with corrections. Optionally, select a writing task type for more specific feedback. Feedback will be tailored to your proficiency level.",
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
  feedbackSectionTitle: "Feedback",
  yourOriginalTextSectionTitle: "Your Original Text",
  correctedTextSectionTitle: "Corrected Text (with highlights)",
  errorCategoriesHeader: "Identified Error Types",
  errorCategoryLabel: "Category",
  errorSpecificErrorLabel: "Specific Error",
  errorCommentLabel: "Comment",
  onboardingMissing: "Please complete onboarding first.",
  loading: "Loading...",
  informalLetterEmail: "Informal Letter/Email",
  formalLetterEmail: "Formal Letter/Email",
  complaintLetter: "Complaint Letter",
  announcementNotice: "Announcement/Notice",
  chatSmsNote: "Chat/SMS/Short Note",
  essayArgumentative: "Essay/Argumentative Text",
  clearResultsButton: "Clear Results",
};

const baseRuTranslations: Record<string, string> = {
  title: "Помощник по письму с ИИ",
  description: "Напишите текст на заданную тему и получите от ИИ обратную связь по структуре, грамматике и тону, а также исправления. При желании выберите тип письменного задания для более точной обратной связи. Обратная связь будет адаптирована к вашему уровню владения языком.",
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
  feedbackSectionTitle: "Обратная связь",
  yourOriginalTextSectionTitle: "Ваш исходный текст",
  correctedTextSectionTitle: "Исправленный текст (с выделениями)",
  errorCategoriesHeader: "Выявленные типы ошибок",
  errorCategoryLabel: "Категория",
  errorSpecificErrorLabel: "Конкретная ошибка",
  errorCommentLabel: "Комментарий",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг.",
  loading: "Загрузка...",
  informalLetterEmail: "Неофициальное письмо/E-Mail",
  formalLetterEmail: "Официальное письмо/E-Mail",
  complaintLetter: "Жалоба",
  announcementNotice: "Объявление/Заметка",
  chatSmsNote: "Сообщение в чате/SMS",
  essayArgumentative: "Эссе/Аргументативный текст",
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

// parseTopicAndGetLink (локальная копия)
const keywordsToModules = [
  { keywords: ["лексика:", "словарный запас:", "vocabulary:"], path: "/learn/vocabulary" },
  { keywords: ["грамматика:", "grammar:"], path: "/learn/grammar" },
  { keywords: ["чтение:", "reading:"], path: "/learn/reading", needsLevel: true },
  { keywords: ["аудирование:", "listening:"], path: "/learn/listening" },
  { keywords: ["говорение:", "практика говорения:", "speaking:", "speech practice:"], path: "/learn/speaking" },
  { keywords: ["письмо:", "помощь в письме:", "writing:", "writing assistance:"], path: "/learn/writing" },
  { keywords: ["практика слов:", "упражнения:", "word practice:", "exercises:"], path: "/learn/practice" },
];
function parseTopicAndGetLink(
  topicLine: string,
  lessonContext?: { lessonId: string; lessonLevel: string }
): { href: string | null } {
  let href: string | null = null;
  const cleanAndEncodeTopic = (rawTopic: string): string => {
    let cleaned = rawTopic.replace(/\s*\(.*?\)\s*$/, "").trim();
    cleaned = cleaned.replace(/^\"':\s+|\"':\s+$/g, "").trim();
    return encodeURIComponent(cleaned);
  };
  const topicLineLower = topicLine.toLowerCase();
  for (const mod of keywordsToModules) {
    for (const keyword of mod.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (topicLineLower.startsWith(keywordLower)) {
        let theme = topicLine.substring(keyword.length).trim();
        theme = cleanAndEncodeTopic(theme);
        if (theme.length > 0) {
          href = `${mod.path}?topic=${theme}`;
          if (lessonContext) {
            href += `&lessonId=${encodeURIComponent(lessonContext.lessonId)}`;
            if (mod.needsLevel && lessonContext.lessonLevel) {
              const levelCode = lessonContext.lessonLevel.split(' ')[0]?.toUpperCase() || lessonContext.lessonLevel.toUpperCase();
              href += `&baseLevel=${encodeURIComponent(levelCode)}`;
            }
          }
        }
        break;
      }
    }
    if (href) break;
  }
  return { href };
}

export function WritingAssistantClient() {
  const { userData, isLoading: isUserDataLoading, toggleLessonCompletion } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [assistanceResult, setAssistanceResult] = useState<AIPoweredWritingAssistanceOutput | null>(null);
  const [submittedUserText, setSubmittedUserText] = useState<string | null>(null);
  const router = useRouter();
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');
  const searchParams = useSearchParams();

  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm<WritingFormData>({
    resolver: zodResolver(writingSchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };

  useEffect(() => {
    // Reset form with default proficiency from user settings when user data is loaded
    if (userData.settings) {
        // We don't need to reset the proficiency here as it's part of general user settings,
        // not a per-task setting in this module's form.
    }
  }, [userData.settings, reset]);

  // Автоматически подставлять тему из query-параметра topic
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setValue('writingPrompt', topicParam);
    }
  }, [searchParams, setValue]);

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<WritingFormData> = async (data) => {
    setIsAiLoading(true);
    setAssistanceResult(null);
    setSubmittedUserText(data.userText); 
    try {
      if (!userData.settings) {
        toast({ title: t('onboardingMissing', 'Пожалуйста, завершите ввод данных для начала работы.'), variant: "destructive" });
        setIsAiLoading(false);
        return;
      }
      const writingInput: AIPoweredWritingAssistanceInput = {
        prompt: data.writingPrompt,
        text: data.userText,
        interfaceLanguage: userData.settings.interfaceLanguage as AppInterfaceLanguage,
        writingTaskType: data.writingTaskType as GermanWritingTaskType | undefined,
        proficiencyLevel: (userData.settings.proficiencyLevel || 'A1-A2') as AppProficiencyLevel,
        goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
        interests: Array.isArray(userData.settings.interests) ? userData.settings.interests : (userData.settings.interests ? [userData.settings.interests] : []),
      };
      
      const result = await aiPoweredWritingAssistance(writingInput);
      setAssistanceResult(result);
      toast({
        title: t('toastSuccessTitle', 'Проверка завершена!'),
        description: t('toastSuccessDescription', 'Получите обратную связь ниже.'),
      });
    } catch (error) {
      console.error("Writing assistance error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('toastErrorTitle', 'Ошибка при проверке текста'),
        description: `${t('toastErrorDescription', 'Попробуйте ещё раз.')}${errorMessage ? ` (${errorMessage})` : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearResults = () => {
    setAssistanceResult(null);
    setSubmittedUserText(null);
    reset(); // Reset the form fields
  };
  
  const translatedTaskTypes = germanWritingTaskTypes.map(taskType => ({
    value: taskType.value,
    label: t(taskType.labelKey, taskType.defaultLabel),
  }));

  // Финальный экран — если есть результат и пользователь завершил задание
  if (assistanceResult && submittedUserText) {
    const handleNextLesson = async () => {
      setIsNextLoading(true);
      setNextError('');
      try {
        if (!userData.settings || !userData.progress?.learningRoadmap?.lessons) throw new Error('Нет данных пользователя');
        const lessonIdFromParams = searchParams.get('lessonId');
        if (lessonIdFromParams && typeof toggleLessonCompletion === 'function') {
          toggleLessonCompletion(lessonIdFromParams);
        }
        const completedLessonIds = userData.progress.completedLessonIds
          ? [...userData.progress.completedLessonIds, lessonIdFromParams].filter((id): id is string => typeof id === 'string' && !!id)
          : lessonIdFromParams && typeof lessonIdFromParams === 'string' ? [lessonIdFromParams] : [];
        const input = {
          interfaceLanguage: userData.settings.interfaceLanguage,
          currentLearningRoadmap: userData.progress.learningRoadmap,
          completedLessonIds,
          userGoal: (Array.isArray(userData.settings.goal) ? userData.settings.goal[0] : userData.settings.goal) || "",
          currentProficiencyLevel: userData.settings.proficiencyLevel || 'A1-A2',
        };
        const rec = await getLessonRecommendation(input);
        if (rec.recommendedLessonId && userData.progress.learningRoadmap.lessons) {
          const lesson = userData.progress.learningRoadmap.lessons.find(l => l.id === rec.recommendedLessonId);
          if (lesson && lesson.topics && lesson.topics.length > 0) {
            const { href } = parseTopicAndGetLink(lesson.topics[0], { lessonId: lesson.id, lessonLevel: lesson.level });
            if (href) {
              router.push(href);
              return;
            }
          }
        }
        setNextError('Не удалось определить следующий урок. Вернитесь на главную.');
      } catch (e) {
        setNextError('Ошибка перехода к следующему уроку.');
      } finally {
        setIsNextLoading(false);
      }
    };

    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {t('resultsCardTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500"/>{t('feedbackSectionTitle')}</h3>
                <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{assistanceResult.feedback}</p>
                </ScrollArea>
              </div>

              {assistanceResult.errorCategories && assistanceResult.errorCategories.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-orange-500" />
                    {t('errorCategoriesHeader')}
                  </h3>
                  <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                    <ul className="space-y-3">
                      {assistanceResult.errorCategories.map((errCat, index) => (
                        <li key={index} className="text-sm p-2 rounded-md bg-card border border-border/50">
                          <p><strong>{t('errorCategoryLabel', 'Category')}:</strong> {errCat.category}</p>
                          <p><strong>{t('errorSpecificErrorLabel', 'Error')}:</strong> {errCat.specificError}</p>
                          {errCat.comment && <p><em>{t('errorCommentLabel', 'Comment')}: {errCat.comment}</em></p>}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
            
            {submittedUserText && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  {t('yourOriginalTextSectionTitle')}
                </h3>
                <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{submittedUserText}</p>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500"/>{t('correctedTextSectionTitle')}</h3>
              <ScrollArea className="h-[250px] rounded-md border p-3 bg-muted/30">
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: assistanceResult.markedCorrectedText }} 
                />
              </ScrollArea>
            </div>
            <div style={{ marginTop: 24 }}>
              <Button onClick={handleClearResults} style={{ marginRight: 12 }}>{t('clearResultsButton')}</Button>
              <Button onClick={handleNextLesson} disabled={isNextLoading}>
                {isNextLoading ? 'Загрузка...' : 'Следующий урок'}
              </Button>
            </div>
            {nextError && <div style={{ color: 'red', marginTop: 16 }}>{nextError}</div>}
          </CardContent>
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
                  <Select onValueChange={field.onChange} value={field.value || ''}> 
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
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
              {t('getFeedbackButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

