import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import { Button } from '@/components/ui/button';
import type { PracticeTask, AdaptiveGrammarExplanationsOutput } from '@/ai/flows/adaptive-grammar-explanations';
import type { ExplainGrammarTaskErrorOutput } from '@/ai/flows/explain-grammar-task-error-flow';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { lessonTypes } from '@/config/lessonTypes';


// parseTopicAndGetLink (упрощённая версия, как в Dashboard)
const keywordsToModules = [
  { keywords: ["лексика:", "словарный запас:", "vocabulary:"], path: "/learn/vocabulary" },
  { keywords: ["грамматика:", "grammar:"], path: "/learn/grammar" },
  { keywords: ["чтение:", "reading:"], path: "/learn/reading", needsLevel: true },
  { keywords: ["аудирование:", "listening:"], path: "/learn/listening" },
  { keywords: ["письмо:", "помощь в письме:", "writing:", "writing assistance:"], path: "/learn/writing" },
  { keywords: ["практика слов:", "упражнения:", "word practice:"], path: "/learn/practice" },
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

// Компонент для отображения и озвучивания объяснения грамматики
function GrammarExplanation({ explanation }: { explanation: string }) {
  const displayText = explanation
    .replace(/\s*##TARGET_LANG_START##\s*/gi, "")
    .replace(/\s*##TARGET_LANG_END##\s*/gi, "");

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: displayText.replace(/\n/g, '<br />') }} />
  );
}

interface GrammarModuleClientProps {
  lessonId?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  grammarTopic?: string;
}

// Универсальный массив разделов
const lessonSections = ['grammar', 'vocabulary', 'practice', 'reading', 'listening', 'writing'];

function goToNextSection(
  currentSection: string,
  lessonId: string | null,
  topic: string | null,
  baseLevel: string | null,
  router: ReturnType<typeof useRouter>
) {
  const currentIndex = lessonSections.indexOf(currentSection);
    // Найти следующий существующий раздел
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
  // Если ничего не найдено — на дашборд
  router.push('/dashboard?completedLesson=' + (lessonId || ''));
}

export default function GrammarModuleClient({ lessonId, lessonTitle, lessonDescription, grammarTopic }: GrammarModuleClientProps) {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive } = useUserData();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Используем `lessonId` из пропсов, если он есть, иначе из URL
  const currentLessonId = lessonId || searchParams.get('lessonId');
  const topic = grammarTopic || searchParams.get('topic');
  const baseLevel = searchParams.get('baseLevel');
  
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [tasks, setTasks] = useState<PracticeTask[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  // State for each task: { isSubmitted, isCorrect, errorExplanation }
  const [taskStates, setTaskStates] = useState<Record<number, { isSubmitted: boolean; isCorrect?: boolean; errorExplanation?: string; isExplanationLoading?: boolean; }>>({});

  const currentTask = tasks[currentTaskIndex];
  const currentTaskState = taskStates[currentTaskIndex] || { isSubmitted: false };
  
  const getPastErrorsAsString = useCallback(() => {
    if (!userData.progress?.errorArchive || userData.progress.errorArchive.length === 0) {
        return "No past errors recorded.";
    }
    return userData.progress.errorArchive
        .slice(-10) // Take last 10 errors to keep prompt concise
        .map(e => `Module: ${e.module}, Context: ${e.context || 'N/A'}, User attempt: ${e.userAttempt}, Correct: ${e.correctAnswer || 'N/A'}`)
        .join('\n');
  }, [userData.progress?.errorArchive]);


  const fetchTasksCallback = useCallback(async () => {
    if (!userData.settings || tasks.length > 0) return;

    setIsAiLoading(true);
    setAiError('');
    try {
      const pastErrors = getPastErrorsAsString();
      const response = await fetch('/api/ai/adaptive-grammar-explanations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          grammarTopic: topic || lessonTitle || 'General Grammar',
          proficiencyLevel: userData.settings.proficiencyLevel || 'A1-A2',
          goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : [userData.settings.goal],
          interests: userData.settings.interests || [],
          userPastErrors: pastErrors,
        }),
      });
      if (!response.ok) throw new Error('Ошибка генерации грамматических заданий');
      const aiResult: AdaptiveGrammarExplanationsOutput = await response.json();
      setTasks(aiResult.practiceTasks);
      setExplanation(aiResult.explanation);
      setCurrentTaskIndex(0);
      setUserAnswer('');
      setTaskStates({});
    } catch (e: any) {
      setAiError(e.message || 'Ошибка генерации заданий. Попробуйте обновить страницу или выбрать другую тему.');
    } finally {
      setIsAiLoading(false);
    }
  }, [userData.settings, tasks.length, getPastErrorsAsString, topic, lessonTitle]);

  // Получаем задания через ИИ при инициализации
  useEffect(() => {
    if (!isUserDataLoading && userData.settings) {
      fetchTasksCallback();
    }
  }, [isUserDataLoading, userData.settings, fetchTasksCallback]);

  const handleCheck = () => {
    if (!currentTask) return;

    const isLetterTask = /встав(ьте|ить) букву|укажи(те|ть) букву|впиши(те|ть) букву/i.test(currentTask.taskDescription);
    const isCorrect = isLetterTask
      ? userAnswer.trim() === currentTask.correctAnswer.trim()
      : userAnswer.trim().toLowerCase() === currentTask.correctAnswer.trim().toLowerCase();

    setTaskStates(prev => ({ ...prev, [currentTaskIndex]: { ...prev[currentTaskIndex], isSubmitted: true, isCorrect } }));
    
    if (!isCorrect) {
        addErrorToArchive({
            module: "Grammar",
            context: `Topic: ${topic || lessonTitle}. Task: ${currentTask.taskDescription}`,
            userAttempt: userAnswer,
            correctAnswer: currentTask.correctAnswer,
        });
    }
  };
  
  const handleGetErrorExplanation = async () => {
    if (!currentTask || !userData.settings) return;
    setTaskStates(prev => ({ ...prev, [currentTaskIndex]: { ...prev[currentTaskIndex], isExplanationLoading: true } }));
    
    try {
      const response = await fetch('/api/ai/explain-grammar-task-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          grammarTopic: topic || lessonTitle || 'General Grammar',
          taskDescription: currentTask.taskDescription,
          userAttempt: userAnswer,
          correctAnswer: currentTask.correctAnswer,
        }),
      });
      if (!response.ok) throw new Error('Ошибка получения объяснения от ИИ');
      const res: ExplainGrammarTaskErrorOutput = await response.json();
      setTaskStates(prev => ({ ...prev, [currentTaskIndex]: { ...prev[currentTaskIndex], errorExplanation: res.explanation, isExplanationLoading: false } }));
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить объяснение ошибки.', variant: 'destructive' });
      setTaskStates(prev => ({ ...prev, [currentTaskIndex]: { ...prev[currentTaskIndex], isExplanationLoading: false } }));
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setUserAnswer('');
    }
  };

  const handleRepeat = () => {
    setCurrentTaskIndex(0);
    setUserAnswer('');
    setTaskStates({});
  };

  const isCompleted = currentTaskIndex >= tasks.length;
  
  if (isCompleted && tasks.length > 0) {
    const correctCount = Object.values(taskStates).filter(s => s.isCorrect).length;
    const percent = Math.round((correctCount / tasks.length) * 100);
    const canGoNext = percent >= 70;

    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl mb-3">{lessonTitle || 'Грамматический тест завершён'}</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {tasks.length}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
        ) : (
          <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
        )}
        <div className="flex justify-center gap-4">
            <Button onClick={handleRepeat} variant="outline" className="px-6 py-2 text-base">Пройти ещё раз</Button>
            {canGoNext && (
                <Button onClick={() => goToNextSection('grammar', currentLessonId, topic, baseLevel, router)} className="px-6 py-2 text-base">
                    Перейти к следующему разделу
                </Button>
            )}
        </div>
      </div>
    );
  }

  if (isUserDataLoading || isAiLoading) {
    return <div className="flex h-full items-center justify-center p-4"><LoadingSpinner size={32} /><p className="ml-2">Загрузка заданий...</p></div>;
  }
  if (aiError) {
    return <div className="text-red-500 text-center p-4">{aiError}</div>;
  }
  if (!tasks.length) {
    return <div className="text-center p-4">Нет заданий для этой темы.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{lessonTitle || 'Грамматическое задание'}</CardTitle>
          <CardDescription>{lessonDescription || 'Объяснение темы и практические задания.'}</CardDescription>
        </CardHeader>
        {explanation && (
          <CardContent>
            <Card className="bg-muted/30">
              <CardHeader>
                  <h3 className="font-semibold flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Объяснение темы</h3>
              </CardHeader>
              <CardContent>
                <GrammarExplanation explanation={explanation} />
              </CardContent>
            </Card>
          </CardContent>
        )}
      </Card>
      
      {currentTask && (
        <Card>
            <CardHeader>
                <CardTitle>Вопрос {currentTaskIndex + 1} из {tasks.length}</CardTitle>
                <CardDescription>{currentTask.taskDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    placeholder="Введите ваш ответ..."
                    rows={2}
                    disabled={currentTaskState.isSubmitted}
                    className="text-base"
                />
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                 {!currentTaskState.isSubmitted ? (
                    <Button onClick={handleCheck} disabled={!userAnswer.trim()}>Проверить</Button>
                ) : (
                    <Button onClick={handleNext}>Следующий вопрос</Button>
                )}
                
                {currentTaskState.isSubmitted && (
                    <Card className={cn("w-full p-4", currentTaskState.isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}>
                        <div className="flex items-center gap-2">
                           {currentTaskState.isCorrect ? <CheckCircle className="h-6 w-6 text-green-600"/> : <XCircle className="h-6 w-6 text-red-600"/>}
                           <p className={cn("text-lg font-semibold", currentTaskState.isCorrect ? "text-green-700" : "text-red-700")}>
                             {currentTaskState.isCorrect ? 'Правильно!' : 'Ошибка'}
                           </p>
                        </div>
                        {!currentTaskState.isCorrect && (
                            <div className="mt-2 pl-8 space-y-3">
                                <p className="text-muted-foreground">Правильный ответ: <span className="font-bold text-primary">{currentTask.correctAnswer}</span></p>
                                
                                {!currentTaskState.errorExplanation && !currentTaskState.isExplanationLoading && (
                                    <Button onClick={handleGetErrorExplanation} size="sm" variant="outline">
                                        Показать объяснение ошибки
                                    </Button>
                                )}
                                {currentTaskState.isExplanationLoading && <LoadingSpinner size={16} />}
                                {currentTaskState.errorExplanation && (
                                    <div className="p-3 bg-background/50 rounded-md border text-sm">
                                        <h4 className="font-semibold mb-1">Объяснение:</h4>
                                        <p className="whitespace-pre-wrap">{currentTaskState.errorExplanation}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )}
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
