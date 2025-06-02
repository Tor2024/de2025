import React, { useState, useMemo } from 'react';
import { useUserData } from '@/contexts/UserDataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { UserLearnedWord } from '@/lib/types';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import type { RepetitionTask } from '@/ai/flows/generate-repetition-tasks-flow';

export default function RepetitionModuleClient() {
  const { userData, isLoading: isUserDataLoading, processWordRepetition } = useUserData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ correct: boolean }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');

  // --- AI-повторение ---
  const [aiTasks, setAiTasks] = useState<RepetitionTask[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Фильтруем слова, которые нужно повторить сегодня
  const wordsToReview = useMemo(() => {
    if (!userData.progress?.learnedWords) return [];
    const now = new Date();
    return userData.progress.learnedWords.filter(word => {
      if (!word.nextReviewDate) return false;
      return new Date(word.nextReviewDate) <= now;
    });
  }, [userData.progress?.learnedWords]);

  // Получить AI-задания
  const fetchAiTasks = async () => {
    if (!userData.settings || wordsToReview.length === 0) return;
    setIsAiLoading(true);
    setAiError('');
    setAiTasks(null);
    setCurrentIndex(0);
    setResults([]);
    try {
      const safeProficiencyLevel = (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2';
      const response = await fetch('/api/ai/generate-repetition-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          targetLanguage: userData.settings.targetLanguage,
          proficiencyLevel: safeProficiencyLevel,
          goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
          interests: Array.isArray(userData.settings.interests) ? userData.settings.interests : (userData.settings.interests ? [userData.settings.interests] : []),
          reviewItems: wordsToReview.map(w => w.word),
          count: Math.min(5, wordsToReview.length),
        }),
      });
      if (!response.ok) throw new Error('Ошибка генерации AI-заданий');
      const res = await response.json();
      setAiTasks(res.tasks);
    } catch (e) {
      setAiError('Ошибка генерации AI-заданий. Попробуйте позже.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Выбор источника заданий: AI или статические
  const tasks = aiTasks && aiTasks.length > 0 ? aiTasks : null;
  const task = tasks ? tasks[currentIndex] : null;

  const handleRepeat = () => {
    setCurrentIndex(0);
    setResults([]);
    setShowResult(false);
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4"><LoadingSpinner size={32} /><p className="ml-2">Загрузка...</p></div>;
  }
  if (!userData.settings) {
    return <div className="p-4">Пожалуйста, завершите онбординг.</div>;
  }

  if (wordsToReview.length === 0) {
    return <div style={{ maxWidth: 500, margin: '0 auto', padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Повторение слов</h2>
      <p style={{ fontSize: 18, marginBottom: 16 }}>На сегодня нет слов для повторения. Отличная работа!</p>
    </div>;
  }

  // Итоговый анализ
  if (showResult || currentIndex >= (tasks ? tasks.length : wordsToReview.length)) {
    const correctCount = results.filter(r => r.correct).length;
    const percent = Math.round((correctCount / (tasks ? tasks.length : wordsToReview.length)) * 100);
    const canGoNext = percent >= 70;
    const handleNextLesson = async () => {
      setIsNextLoading(true);
      setNextError('');
      try {
        if (!userData.settings || !userData.progress?.learningRoadmap?.lessons) throw new Error('Нет данных пользователя');
        const input = {
          interfaceLanguage: userData.settings.interfaceLanguage,
          currentLearningRoadmap: userData.progress.learningRoadmap,
          completedLessonIds: userData.progress.completedLessonIds || [],
          userGoal: Array.isArray(userData.settings.goal) ? (userData.settings.goal[0] || '') : (userData.settings.goal || ''),
          currentProficiencyLevel: (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2',
        };
        const rec = await getLessonRecommendation(input);
        if (rec.recommendedLessonId && userData.progress.learningRoadmap.lessons) {
          const lesson = userData.progress.learningRoadmap.lessons.find(l => l.id === rec.recommendedLessonId);
          if (lesson && lesson.topics && lesson.topics.length > 0) {
            window.location.href = `/learn/repetition?topic=${encodeURIComponent(lesson.topics[0])}&lessonId=${lesson.id}`;
            return;
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
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl mb-3">Повторение завершено</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {tasks ? tasks.length : wordsToReview.length}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
        ) : (
          <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
        )}
        <Button onClick={handleRepeat} className="px-6 py-2 text-base mr-3">Повторить</Button>
        {canGoNext && (
          <Button onClick={handleNextLesson} className="px-6 py-2 text-base" disabled={isNextLoading}>
            {isNextLoading ? 'Загрузка...' : 'Следующий урок'}
          </Button>
        )}
        {!canGoNext && (
          <div className="mt-4 text-muted-foreground text-sm">Чтобы перейти дальше, повторите тему.</div>
        )}
        {nextError && <div className="text-red-600 mt-4">{nextError}</div>}
      </div>
    );
  }

  // --- AI-задания на повторение ---
  if (tasks) {
    const task = tasks[currentIndex];
    const [userAnswer, setUserAnswer] = useState('');
    const [showExplanation, setShowExplanation] = useState(false);
    const [isAnswered, setIsAnswered] = useState(false);
    return (
      <div className="max-w-xl mx-auto p-8">
        <h2 className="text-2xl mb-3">Задание на повторение</h2>
        <div className="text-lg mb-4">Задание {currentIndex + 1} из {tasks.length}</div>
        <div className="text-lg mb-4 font-semibold">{task.instruction}</div>
        <div className="text-xl mb-4">{task.word}</div>
        {task.options && (
          <div className="mb-4 flex flex-col gap-2">
            {task.options.map((opt, idx) => (
              <Button key={idx} variant="outline" className="w-full text-base text-left" onClick={() => {
                const isCorrect = opt.trim().toLowerCase() === task.correctAnswer.trim().toLowerCase();
                setResults([...results, { correct: isCorrect }]);
                setShowExplanation(true);
                setIsAnswered(true);
              }} disabled={isAnswered}>{opt}</Button>
            ))}
          </div>
        )}
        {!task.options && (
          <input
            type="text"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Введите ответ"
            className="w-full p-2 text-base border rounded mb-4"
            disabled={isAnswered}
          />
        )}
        <div className="flex gap-4">
          {!isAnswered && (
            <Button onClick={() => {
              let isCorrect = false;
              if (!task.options) {
                isCorrect = userAnswer.trim().toLowerCase() === task.correctAnswer.trim().toLowerCase();
              }
              setResults([...results, { correct: isCorrect }]);
              setShowExplanation(true);
              setIsAnswered(true);
            }} disabled={!task.options && !userAnswer.trim()}>
              Проверить
            </Button>
          )}
          {isAnswered && (
            <Button onClick={() => {
              setCurrentIndex(currentIndex + 1);
              setUserAnswer('');
              setShowExplanation(false);
              setIsAnswered(false);
            }}>
              Следующее задание
            </Button>
          )}
        </div>
        {showExplanation && (
          <div className={`mt-6 text-lg ${results[results.length - 1]?.correct ? 'text-green-600' : 'text-red-600'}`}>
            {results[results.length - 1]?.correct ? '✅ Верно!' : '❌ Ошибка'}
            {task.explanation && <div className="mt-2 text-blue-700">Пояснение: {task.explanation}</div>}
            {!task.options && !results[results.length - 1]?.correct && (
              <div className="mt-2 text-gray-500"><b>Правильный ответ:</b> {task.correctAnswer}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Статические задания (старое поведение) ---
  const word = wordsToReview[currentIndex];
  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-2xl mb-3">Повторение слов</h2>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Слово {currentIndex + 1} из {wordsToReview.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl mb-4 font-semibold">{word.word}</div>
          <div className="text-gray-600 mb-4">Перевод: <span className="text-blue-600">{word.translation}</span></div>
          {word.exampleSentence && (
            <div className="text-base mb-4 text-gray-700">Пример: {word.exampleSentence}</div>
          )}
          <div className="flex gap-4">
            <Button
              onClick={() => {
                processWordRepetition(word, word.targetLanguage, true);
                setResults([...results, { correct: true }]);
                setCurrentIndex(currentIndex + 1);
              }}
              className="px-6 py-2 text-base"
            >
              Знал
            </Button>
            <Button
              onClick={() => {
                processWordRepetition(word, word.targetLanguage, false);
                setResults([...results, { correct: false }]);
                setCurrentIndex(currentIndex + 1);
              }}
              variant="outline"
              className="px-6 py-2 text-base"
            >
              Повторить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 