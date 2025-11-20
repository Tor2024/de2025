
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useUserData } from '@/contexts/UserDataContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { PhoneticsTask } from '@/ai/flows/generate-phonetics-tasks-flow';
import { PlayAudioButton } from '@/components/ui/PlayAudioButton';
import { mapTargetLanguageToBcp47, type TargetLanguage as AppTargetLanguage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, RefreshCw, ArrowRight, BrainCircuit, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function PhoneticsModuleClient() {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive, recordPracticeSetCompletion } = useUserData();
  const { toast } = useToast();
  const router = useRouter();

  const [aiTasks, setAiTasks] = useState<PhoneticsTask[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });

  const fetchAiTasks = useCallback(async () => {
    if (!userData.settings) return;
    setIsAiLoading(true);
    setAiError('');
    setAiTasks(null);
    setCurrentIndex(0);
    setUserAnswer('');
    setIsAnswered(false);
    setShowResults(false);
    setFinalScore({ correct: 0, total: 0 });

    try {
      const safeProficiencyLevel = (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2';
      const response = await fetch('/api/ai/generate-phonetics-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          targetLanguage: userData.settings.targetLanguage,
          proficiencyLevel: safeProficiencyLevel,
          goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
          interests: Array.isArray(userData.settings.interests) ? userData.settings.interests : (userData.settings.interests ? [userData.settings.interests] : []),
          count: 5,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка генерации AI-заданий');
      }
      const res = await response.json();
      if (!res.tasks || res.tasks.length === 0) {
        throw new Error('ИИ не сгенерировал фонетические задания.');
      }
      setAiTasks(res.tasks);
      setFinalScore({ correct: 0, total: res.tasks.length });

    } catch (e: any) {
      setAiError(e.message || 'Ошибка генерации заданий. Попробуйте снова.');
      toast({
        title: "Ошибка генерации",
        description: e.message || 'Не удалось сгенерировать задания.',
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [userData.settings, toast]);
  
  useEffect(() => {
    if(!aiTasks && !isAiLoading && !aiError) {
       fetchAiTasks();
    }
  }, [aiTasks, isAiLoading, aiError, fetchAiTasks]);
  

  const currentTask = aiTasks?.[currentIndex];

  const handleCheck = () => {
    if (!currentTask) return;

    let isAnswerCorrect = false;
    if (currentTask.type === 'repeat') {
      isAnswerCorrect = true; // For "repeat" tasks, we just mark as completed
    } else {
      isAnswerCorrect = userAnswer.trim().toLowerCase() === currentTask.correctAnswer.trim().toLowerCase();
    }
    
    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);

    if (isAnswerCorrect) {
      setFinalScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else if (currentTask.type !== 'repeat') {
        addErrorToArchive({
            module: "Phonetics",
            context: currentTask.instruction,
            userAttempt: userAnswer,
            correctAnswer: currentTask.correctAnswer,
        });
    }
  };

  const handleNext = () => {
    if (currentIndex < (aiTasks?.length || 0) - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      setShowResults(true);
      if(aiTasks?.length) recordPracticeSetCompletion();
    }
  };

  const handleRestart = () => {
    setShowResults(false);
    fetchAiTasks();
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4"><LoadingSpinner size={32} /><p className="ml-2">Загрузка модуля фонетики...</p></div>;
  }
  
  if (isAiLoading && !aiTasks) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <LoadingSpinner size={32} />
        <p className="ml-2 mt-2 text-muted-foreground">Генерация фонетических упражнений...</p>
      </div>
    );
  }

  if (aiError) {
     return (
        <div className="max-w-xl mx-auto p-8 text-center flex flex-col items-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-3">Ошибка загрузки</h2>
            <p className="text-lg text-muted-foreground mb-6">{aiError}</p>
            <Button onClick={fetchAiTasks}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Попробовать снова
            </Button>
        </div>
     );
  }

  if (showResults) {
    const percent = finalScore.total > 0 ? Math.round((finalScore.correct / finalScore.total) * 100) : 0;
    
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
         <PartyPopper className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">Практика по фонетике завершена!</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{finalScore.correct} из {finalScore.total}</b> ({percent}%)</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Button onClick={handleRestart}>
                <RefreshCw className="mr-2 h-4 w-4"/>
                Повторить еще раз
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
                На главную
            </Button>
        </div>
      </div>
    );
  }
  
  if (!currentTask) {
    return (
        <div className="flex h-full items-center justify-center p-4">
            <p className="text-muted-foreground">Нет доступных заданий. Попробуйте обновить страницу.</p>
        </div>
    );
  }

  const targetLang = userData.settings?.targetLanguage || 'English';
  const audioLangCode = mapTargetLanguageToBcp47(targetLang as AppTargetLanguage);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BrainCircuit className="h-7 w-7 text-primary" />
            Фонетика
          </CardTitle>
          <CardDescription>Задание {currentIndex + 1} из {aiTasks?.length || 0}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="font-semibold text-lg">{currentTask.instruction}</p>
            
            {currentTask.audioText && (
                <div className="flex items-center justify-center p-4 bg-muted/50 rounded-md">
                    <p className="text-xl font-bold mr-4">{currentTask.audioText}</p>
                    <PlayAudioButton text={currentTask.audioText} lang={audioLangCode} />
                </div>
            )}
            
            {currentTask.options && currentTask.options.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                    {currentTask.options.map((opt, idx) => (
                         <Button
                            key={idx}
                            variant="outline"
                            className={cn(
                                "h-auto py-3 justify-start text-left whitespace-normal transition-colors duration-200",
                                isAnswered && opt.trim().toLowerCase() === currentTask.correctAnswer.trim().toLowerCase() && "bg-green-500/20 border-green-500 text-green-700",
                                isAnswered && userAnswer === opt && opt.trim().toLowerCase() !== currentTask.correctAnswer.trim().toLowerCase() && "bg-red-500/20 border-red-500 text-red-700",
                                !isAnswered && userAnswer === opt && "bg-primary/10 border-primary"
                            )}
                            onClick={() => setUserAnswer(opt)}
                            disabled={isAnswered}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
            )}
            
            {currentTask.type === 'repeat' && !isAnswered && (
                <p className="text-sm text-muted-foreground italic">Прослушайте аудио и повторите вслух. Затем нажмите "Выполнено".</p>
            )}

            {isAnswered && (
                <Card className={cn("p-4", isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}>
                    <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle2 className="h-6 w-6 text-green-600"/> : <XCircle className="h-6 w-6 text-red-600"/>}
                        <p className={cn("text-lg font-semibold", isCorrect ? "text-green-700" : "text-red-700")}>
                           {isCorrect ? (currentTask.type === 'repeat' ? 'Отлично!' : 'Верно!') : 'Ошибка'}
                        </p>
                    </div>
                    {!isCorrect && (
                        <p className="mt-2 text-muted-foreground">
                            Правильный ответ: <span className="font-bold text-primary">{currentTask.correctAnswer}</span>
                        </p>
                    )}
                    {currentTask.explanation && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                            {currentTask.explanation}
                        </p>
                    )}
                </Card>
            )}
        </CardContent>
        <CardFooter className="flex justify-end">
            {!isAnswered ? (
                <Button onClick={handleCheck} disabled={!userAnswer && currentTask.type !== 'repeat'}>
                    {currentTask.type === 'repeat' ? 'Выполнено' : 'Проверить'}
                </Button>
            ) : (
                <Button onClick={handleNext}>
                    {currentIndex === (aiTasks?.length || 0) - 1 ? "Завершить" : "Следующее"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
