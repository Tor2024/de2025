
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUserData } from '@/contexts/UserDataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { UserLearnedWord } from '@/lib/types';
import type { RepetitionTask } from '@/ai/flows/generate-repetition-tasks-flow';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, BrainCircuit, PartyPopper, RefreshCw, ArrowRight } from 'lucide-react';

export default function RepetitionModuleClient() {
  const { userData, isLoading: isUserDataLoading, processWordRepetition, recordPracticeSetCompletion } = useUserData();
  const { toast } = useToast();
  const router = useRouter();

  // State for AI-generated tasks
  const [aiTasks, setAiTasks] = useState<RepetitionTask[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // State for current task progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // State for overall results
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });

  // Filter words that are due for review today
  const wordsToReview = useMemo(() => {
    if (!userData.progress?.learnedWords) return [];
    const now = new Date();
    // Set time to the beginning of the day to include all words scheduled for today
    now.setHours(0, 0, 0, 0); 
    return userData.progress.learnedWords.filter(word => {
      if (!word.nextReviewDate) return false;
      try {
        const reviewDate = new Date(word.nextReviewDate);
        return !isNaN(reviewDate.getTime()) && reviewDate <= now;
      } catch (e) {
        return false;
      }
    });
  }, [userData.progress?.learnedWords]);

  // Fetch AI tasks when component mounts or when words to review change
  const fetchAiTasks = useCallback(async () => {
    if (!userData.settings || wordsToReview.length === 0) return;
    
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
      const response = await fetch('/api/ai/generate-repetition-tasks/route.ts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          targetLanguage: userData.settings.targetLanguage,
          proficiencyLevel: safeProficiencyLevel,
          goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
          interests: Array.isArray(userData.settings.interests) ? userData.settings.interests : (userData.settings.interests ? [userData.settings.interests] : []),
          reviewItems: wordsToReview.map(w => w.word),
          count: Math.min(10, wordsToReview.length), // Request up to 10 tasks
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка генерации AI-заданий');
      }
      const res = await response.json();
      if (!res.tasks || res.tasks.length === 0) {
        throw new Error('ИИ не сгенерировал задания для повторения.');
      }
      setAiTasks(res.tasks);
      setFinalScore({ correct: 0, total: res.tasks.length });

    } catch (e: any) {
      setAiError(e.message || 'Ошибка генерации AI-заданий. Попробуйте позже.');
      toast({
        title: "Ошибка генерации",
        description: e.message || 'Не удалось сгенерировать задания. Попробуйте обновить страницу.',
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [userData.settings, wordsToReview, toast]);
  
  useEffect(() => {
    // Automatically fetch tasks if there are words to review and tasks haven't been fetched yet.
    if(wordsToReview.length > 0 && !aiTasks && !isAiLoading && !aiError) {
      fetchAiTasks();
    }
  }, [wordsToReview, aiTasks, isAiLoading, aiError, fetchAiTasks]);


  const currentTask = aiTasks?.[currentIndex];

  const handleCheck = () => {
    if (!currentTask) return;

    const isAnswerCorrect = userAnswer.trim().toLowerCase() === currentTask.correctAnswer.trim().toLowerCase();
    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);

    // Update score
    if (isAnswerCorrect) {
      setFinalScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    }
    
    // Find the original word from `learnedWords` to update its SRS stats
    const originalWord = userData.progress.learnedWords.find(lw => lw.word.toLowerCase() === currentTask.word.toLowerCase());
    if (originalWord) {
      processWordRepetition(originalWord, originalWord.targetLanguage, isAnswerCorrect);
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
      if((aiTasks?.length || 0) > 0) recordPracticeSetCompletion();
    }
  };

  const handleRestart = () => {
    setShowResults(false);
    fetchAiTasks(); // Refetch tasks to get a new set
  };
  
  // --- Render Logic ---

  if (isUserDataLoading || (wordsToReview.length > 0 && isAiLoading)) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <LoadingSpinner size={32} />
        <p className="ml-2 mt-2 text-muted-foreground">Загрузка заданий на повторение...</p>
      </div>
    );
  }

  if (wordsToReview.length === 0 && !isAiLoading) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center flex flex-col items-center">
        <PartyPopper className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-3">Повторение не требуется</h2>
        <p className="text-lg text-muted-foreground">На сегодня нет слов для повторения. Отличная работа!</p>
         <Button onClick={() => router.push('/dashboard')} className="mt-6">
            Вернуться на главную
        </Button>
      </div>
    );
  }

  if (aiError && !isAiLoading) {
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
    const canGoNext = percent >= 70;
    
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Повторение завершено!</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{finalScore.correct} из {finalScore.total}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-xl mb-4">Отлично! Слова усвоены.</div>
        ) : (
          <div className="text-red-600 text-xl mb-4">Некоторые слова требуют дополнительного внимания.</div>
        )}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Button onClick={handleRestart}>
                <RefreshCw className="mr-2 h-4 w-4"/>
                Повторить еще раз
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowRight className="mr-2 h-4 w-4"/>
                На главную
            </Button>
        </div>
      </div>
    );
  }
  
  if (!currentTask && !isAiLoading) {
     return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground">Нет доступных заданий. Возможно, ИИ не смог их сгенерировать.</p>
      </div>
    );
  }
  
  if (!currentTask) {
    // This will show a loading state while tasks are being fetched for the first time
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <LoadingSpinner size={32} />
        <p className="ml-2 mt-2 text-muted-foreground">Генерация упражнений...</p>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BrainCircuit className="h-7 w-7 text-primary" />
            Повторение
          </CardTitle>
          <CardDescription>Задание {currentIndex + 1} из {aiTasks?.length || 0}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="font-semibold text-lg">{currentTask.instruction}</p>
            
            {currentTask.type === 'fill_in_blank' && (
                 <p className="text-xl p-4 bg-muted/50 rounded-md whitespace-pre-wrap">{currentTask.word}</p>
            )}
             {currentTask.type !== 'fill_in_blank' && (
                 <p className="text-3xl font-bold text-center py-6 text-primary">{currentTask.word}</p>
            )}

            {currentTask.options && currentTask.options.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentTask.options.map((opt, idx) => {
                        const isSelected = userAnswer === opt;
                        const isCorrectOption = opt.trim().toLowerCase() === currentTask.correctAnswer.trim().toLowerCase();

                        return (
                            <Button
                                key={idx}
                                variant="outline"
                                className={cn(
                                    "h-auto py-3 justify-start text-left whitespace-normal transition-all duration-300",
                                    isAnswered && isCorrectOption && "bg-green-500/20 border-green-500 text-green-700 hover:bg-green-500/30",
                                    isAnswered && isSelected && !isCorrectOption && "bg-red-500/20 border-red-500 text-red-700 hover:bg-red-500/30",
                                    isSelected && !isAnswered && "bg-primary/10 border-primary"
                                )}
                                onClick={() => setUserAnswer(opt)}
                                disabled={isAnswered}
                            >
                                {opt}
                            </Button>
                        );
                    })}
                </div>
            ) : (
                <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Введите ваш ответ..."
                    disabled={isAnswered}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isAnswered && userAnswer.trim()) handleCheck(); }}
                    className={cn(
                        "text-lg",
                        isAnswered && (isCorrect ? "border-green-500 bg-green-100/50" : "border-red-500 bg-red-100/50")
                    )}
                />
            )}

            {isAnswered && (
                <Card className={cn("p-4", isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}>
                    <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle2 className="h-6 w-6 text-green-600"/> : <XCircle className="h-6 w-6 text-red-600"/>}
                        <p className={cn("text-lg font-semibold", isCorrect ? "text-green-700" : "text-red-700")}>
                            {isCorrect ? 'Верно!' : 'Ошибка'}
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
                <Button onClick={handleCheck} disabled={!userAnswer.trim()}>Проверить</Button>
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
