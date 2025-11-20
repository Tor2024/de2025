import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUserData } from '../../contexts/UserDataContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Input } from '../ui/input';
import { useToast } from "@/hooks/use-toast";
import type { UserLearnedWord } from '../../lib/types';
import type { NewWordsTask } from '../../ai/flows/generate-new-words-tasks-flow';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, BrainCircuit, PartyPopper, RefreshCw, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewWordsModuleClient() {
  const { userData, isLoading: isUserDataLoading, processWordRepetition, recordPracticeSetCompletion } = useUserData();
  const { toast } = useToast();
  const router = useRouter();

  const [aiTasks, setAiTasks] = useState<NewWordsTask[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });

  const newWords = useMemo(() => {
    if (!userData.progress?.learnedWords) return [];
    return userData.progress.learnedWords.filter(word => word.learningStage === 0);
  }, [userData.progress?.learnedWords]);

  const fetchAiTasks = useCallback(async () => {
    if (!userData.settings || newWords.length === 0) return;
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
      const response = await fetch('/api/ai/generate-new-words-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          targetLanguage: userData.settings.targetLanguage,
          proficiencyLevel: safeProficiencyLevel,
          goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
          interests: Array.isArray(userData.settings.interests) ? userData.settings.interests : (userData.settings.interests ? [userData.settings.interests] : []),
          newWords: newWords.map(w => w.word),
          count: Math.min(5, newWords.length),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка генерации AI-упражнений');
      }
      const res = await response.json();
      if (!res.tasks || res.tasks.length === 0) {
        throw new Error('ИИ не сгенерировал упражнения.');
      }
      setAiTasks(res.tasks);
      setFinalScore({ correct: 0, total: res.tasks.length });
    } catch (e: any) {
      setAiError(e.message || 'Ошибка генерации AI-упражнений. Попробуйте позже.');
      toast({
        title: "Ошибка генерации",
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [userData.settings, newWords, toast]);

  useEffect(() => {
    if (newWords.length > 0 && !aiTasks && !isAiLoading && !aiError) {
      fetchAiTasks();
    }
  }, [newWords, aiTasks, isAiLoading, aiError, fetchAiTasks]);

  const currentTask = aiTasks?.[currentIndex];

  const handleCheck = () => {
    if (!currentTask) return;
    const isAnswerCorrect = userAnswer.trim().toLowerCase() === currentTask.correctAnswer.trim().toLowerCase();
    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);

    if (isAnswerCorrect) {
      setFinalScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    }
    
    const originalWord = newWords.find(nw => nw.word.toLowerCase() === currentTask.word.toLowerCase());
    if (originalWord && userData.settings) {
      processWordRepetition(originalWord, userData.settings.targetLanguage, isAnswerCorrect);
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
      if (aiTasks?.length) recordPracticeSetCompletion();
    }
  };

  const handleRestart = () => {
    setShowResults(false);
    fetchAiTasks();
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4"><LoadingSpinner size={32} /><p className="ml-2">Загрузка...</p></div>;
  }
  if (!userData.settings) {
    return <div className="p-4">Пожалуйста, завершите онбординг.</div>;
  }

  if (newWords.length === 0) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>Изучение новых слов</h2>
        <p style={{ fontSize: 18, marginBottom: 16 }}>Нет новых слов для изучения. Добавьте новые слова через модуль "Лексика" или начните новый урок!</p>
      </div>
    );
  }

  if (isAiLoading && !aiTasks) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <LoadingSpinner size={32} />
        <p className="ml-2 mt-2 text-muted-foreground">Генерация упражнений для новых слов...</p>
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
    const canGoNext = percent >= 70;
    
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <PartyPopper className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">Изучение новых слов завершено!</h2>
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

  if (!currentTask) {
    return (
        <div className="flex h-full items-center justify-center p-4">
            <p className="text-muted-foreground">Нет доступных заданий. Попробуйте обновить страницу.</p>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BrainCircuit className="h-7 w-7 text-primary" />
            Изучение новых слов
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
