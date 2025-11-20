"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useUserData } from "@/contexts/UserDataContext";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Lightbulb, Sparkles } from "lucide-react";
import type { GenerateIndividualLessonInput } from "@/ai/flows/generate-individual-lesson-flow";
import type { ProficiencyLevel } from "@/lib/types";

const createLessonSchema = z.object({
  topicTitle: z.string().min(5, "Название темы должно содержать не менее 5 символов."),
  topicDescription: z.string().min(15, "Описание должно содержать не менее 15 символов.").max(300, "Описание не должно превышать 300 символов."),
});

type CreateLessonFormData = z.infer<typeof createLessonSchema>;

export function CreateIndividualLesson() {
  const { userData, addIndividualLesson } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateLessonFormData>({
    resolver: zodResolver(createLessonSchema),
  });

  const onSubmit: SubmitHandler<CreateLessonFormData> = async (data) => {
    if (!userData.settings) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, завершите первоначальную настройку.",
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const input: GenerateIndividualLessonInput = {
        ...data,
        interfaceLanguage: userData.settings.interfaceLanguage,
        targetLanguage: userData.settings.targetLanguage,
        proficiencyLevel: userData.settings.proficiencyLevel || 'A1-A2' as ProficiencyLevel,
      };

      const response = await fetch('/api/ai/generate-individual-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Не удалось сгенерировать урок.");
      }

      const newLesson = await response.json();
      addIndividualLesson(newLesson);

      toast({
        title: "Урок создан!",
        description: `Ваш индивидуальный урок "${newLesson.title}" был успешно добавлен.`,
      });
      reset();
    } catch (error) {
      console.error("Failed to generate individual lesson:", error);
      toast({
        title: "Ошибка генерации",
        description: (error as Error).message || "Произошла неизвестная ошибка. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-accent/20 transition-shadow duration-300">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-accent" />
            Создать свой урок
          </CardTitle>
          <CardDescription>
            Опишите тему, которую вы хотите изучить, и ИИ создаст для вас персональный урок.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topicTitle">Название урока</Label>
            <Input
              id="topicTitle"
              placeholder="Напр., Собеседование на немецком"
              {...register("topicTitle")}
              disabled={isAiLoading}
            />
            {errors.topicTitle && <p className="text-sm text-destructive">{errors.topicTitle.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="topicDescription">Что вы хотите изучить?</Label>
            <Textarea
              id="topicDescription"
              placeholder="Напр., Основные вопросы и ответы, лексика для рассказа о себе, полезные фразы..."
              {...register("topicDescription")}
              disabled={isAiLoading}
              className="min-h-[80px]"
            />
            {errors.topicDescription && <p className="text-sm text-destructive">{errors.topicDescription.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isAiLoading} className="w-full">
            {isAiLoading ? (
              <>
                <LoadingSpinner size={16} className="mr-2" />
                Генерация урока...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Сгенерировать урок
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
