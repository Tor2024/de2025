import React, { useState } from 'react';
import { adaptiveGrammarExplanations } from '@/ai/flows/adaptive-grammar-explanations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/contexts/UserDataContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { PracticeTask } from '@/ai/flows/adaptive-grammar-explanations';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';

export default function TheoryModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theory, setTheory] = useState<{ explanation: string; practiceTasks: PracticeTask[] } | null>(null);
  const [error, setError] = useState('');
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');

  const handleGetTheory = async () => {
    setIsLoading(true);
    setError('');
    setTheory(null);
    try {
      if (!userData.settings) throw new Error('Нет настроек пользователя');
      const result = await adaptiveGrammarExplanations({
        interfaceLanguage: userData.settings.interfaceLanguage,
        grammarTopic: topic || 'Согласование времен',
        proficiencyLevel: userData.settings.proficiencyLevel,
        goals: [],
        interests: [],
        userPastErrors: '',
      });
      setTheory(result);
    } catch (e) {
      setError('Ошибка генерации теории. Попробуйте другую тему.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4"><LoadingSpinner size={32} /><p className="ml-2">Загрузка...</p></div>;
  }
  if (!userData.settings) {
    return <div className="p-4">Пожалуйста, завершите онбординг.</div>;
  }

  if (theory && !isLoading && !error) {
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
          currentProficiencyLevel: userData.settings.proficiencyLevel,
        };
        const rec = await getLessonRecommendation(input);
        if (rec.recommendedLessonId && userData.progress.learningRoadmap.lessons) {
          const lesson = userData.progress.learningRoadmap.lessons.find(l => l.id === rec.recommendedLessonId);
          if (lesson && lesson.topics && lesson.topics.length > 0) {
            window.location.href = `/learn/theory?topic=${encodeURIComponent(lesson.topics[0])}&lessonId=${lesson.id}`;
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
        <h2 className="text-2xl mb-3">Теория изучена!</h2>
        <p className="text-lg mb-4">Поздравляем! Вы ознакомились с теоретическим материалом.</p>
        <Button onClick={handleNextLesson} className="px-6 py-2 text-base" disabled={isNextLoading}>
          {isNextLoading ? 'Загрузка...' : 'Следующий урок'}
        </Button>
        {nextError && <div className="text-red-600 mt-4">{nextError}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Теория</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>Введите грамматическую тему, по которой хотите получить объяснение и примеры.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Например: Порядок слов, Согласование времен, Модальные глаголы..."
          style={{ flex: 1 }}
        />
        <Button onClick={handleGetTheory} disabled={isLoading || !topic.trim()}>
          {isLoading ? <LoadingSpinner size={16} /> : 'Получить объяснение'}
        </Button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {theory && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Объяснение</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: 18, marginBottom: 16, whiteSpace: 'pre-line' }}>{theory.explanation}</div>
            {theory.practiceTasks && theory.practiceTasks.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Примеры/Мини-задания:</div>
                <ol style={{ fontSize: 16, whiteSpace: 'pre-line', paddingLeft: 20 }}>
                  {theory.practiceTasks.map((task, idx) => (
                    <li key={task.id} style={{ marginBottom: 10 }}>
                      <div><b>Задание:</b> {task.taskDescription}</div>
                      <div style={{ color: '#0070f3', marginTop: 2 }}><b>Ответ:</b> {task.correctAnswer}</div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {theory && (
        <Button onClick={() => setTheory(null)} style={{ padding: '8px 24px', fontSize: 16 }}>Следующий шаг</Button>
      )}
    </div>
  );
} 