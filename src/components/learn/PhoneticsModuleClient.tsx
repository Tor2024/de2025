import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/contexts/UserDataContext';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import type { PhoneticsTask } from '@/ai/flows/generate-phonetics-tasks-flow';

const staticTasks: PhoneticsTask[] = [
  {
    type: 'repeat',
    instruction: 'Прослушайте и повторите фразу вслух:',
    audioText: 'Guten Morgen! Wie geht es Ihnen?',
    correctAnswer: 'Guten Morgen! Wie geht es Ihnen?',
    explanation: 'Обратите внимание на произношение буквы "g" и интонацию вопроса.'
  },
  {
    type: 'choose_pronunciation',
    instruction: 'Выберите правильное произношение слова "ch" в слове "ich":',
    options: ['как в русском "ш"', 'как в русском "х"', 'как мягкое "хь"'],
    correctAnswer: 'как мягкое "хь"',
    explanation: 'В немецком "ich" произносится как мягкое "хь".'
  },
  {
    type: 'identify_word',
    instruction: 'Прослушайте фразу и отметьте, что вы услышали:',
    audioText: 'Ich möchte einen Kaffee, bitte.',
    options: ['Ich möchte einen Tee, bitte.', 'Ich möchte einen Kaffee, bitte.', 'Ich möchte Wasser, bitte.'],
    correctAnswer: 'Ich möchte einen Kaffee, bitte.',
    explanation: 'Проверьте, правильно ли вы различили все слова и окончания.'
  }
];

export default function PhoneticsModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const [currentTask, setCurrentTask] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ correct: boolean; explanation: string }[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');

  // --- AI-фонетика ---
  const [aiTasks, setAiTasks] = useState<PhoneticsTask[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Получить AI-задания
  const fetchAiTasks = async () => {
    if (!userData.settings) return;
    setIsAiLoading(true);
    setAiError('');
    setAiTasks(null);
    setCurrentTask(0);
    setUserAnswer('');
    setResults([]);
    setShowExplanation(false);
    setIsAnswered(false);
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
  const tasks = aiTasks && aiTasks.length > 0 ? aiTasks : staticTasks;
  const task = tasks[currentTask];

  const handleCheck = () => {
    let isCorrect = false;
    if (aiTasks && aiTasks.length > 0) {
      // AI-задания: сравниваем с correctAnswer (без учёта регистра и пробелов)
      if (task.type === 'choose_pronunciation' || task.type === 'identify_word' || task.type === 'match_transcription') {
        isCorrect = userAnswer.trim().toLowerCase() === task.correctAnswer.trim().toLowerCase();
      } else if (task.type === 'repeat') {
        // Для "повтори" — просто отмечаем как выполнено
        isCorrect = true;
      }
    } else {
      // Статические задания (старое поведение)
      if (currentTask === 1) {
        isCorrect = userAnswer.trim() === task.correctAnswer;
      } else {
        isCorrect = true;
      }
    }
    setResults([...results, { correct: isCorrect, explanation: task.explanation || task.explanation || '' }]);
    setShowExplanation(true);
    setIsAnswered(true);
  };

  const handleNext = () => {
    setUserAnswer('');
    setShowExplanation(false);
    setIsAnswered(false);
    setCurrentTask(currentTask + 1);
  };

  const handleRepeat = () => {
    setCurrentTask(0);
    setUserAnswer('');
    setResults([]);
    setShowExplanation(false);
    setIsAnswered(false);
  };

  // Итоговый анализ
  if (currentTask >= staticTasks.length) {
    const correctCount = results.filter(r => r.correct).length;
    const percent = Math.round((correctCount / staticTasks.length) * 100);
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
            window.location.href = `/learn/phonetics?topic=${encodeURIComponent(lesson.topics[0])}&lessonId=${lesson.id}`;
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
        <h2 className="text-2xl mb-3">Фонетический тест завершён</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {staticTasks.length}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
        ) : (
          <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
        )}
        <Button onClick={handleRepeat} className="px-6 py-2 text-base mr-3">Пройти ещё раз</Button>
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

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Фонетическое задание</h2>
      <div style={{ fontSize: 18, marginBottom: 16 }}>Задание {currentTask + 1} из {staticTasks.length}:</div>
      <div style={{ fontSize: 18, marginBottom: 16 }}><b>{task.instruction}</b></div>
      <div style={{ fontSize: 20, marginBottom: 16 }}>{task.audioText}</div>
      {currentTask === 1 ? (
        <input
          type="text"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          placeholder="Введите номер варианта (1, 2 или 3)"
          style={{ width: '100%', padding: 8, fontSize: 16, marginBottom: 16 }}
          disabled={isAnswered}
        />
      ) : null}
      <div>
        {!isAnswered ? (
          <Button onClick={handleCheck} disabled={currentTask === 1 && !userAnswer.trim()} style={{ marginRight: 12 }}>
            Выполнил
          </Button>
        ) : (
          <Button onClick={handleNext} style={{ marginRight: 12 }}>
            Следующее задание
          </Button>
        )}
        {showExplanation && (
          <div style={{ marginTop: 24, fontSize: 17, color: isAnswered && results[results.length - 1]?.correct ? 'green' : 'red' }}>
            {results[results.length - 1]?.correct ? '✅ Хорошо!' : '❌ Ошибка'}
            <div style={{ marginTop: 8, color: '#0070f3' }}>Пояснение: {task.explanation}</div>
            {task.correctAnswer && currentTask === 1 && (
              <div style={{ marginTop: 8, color: '#888' }}><b>Правильный ответ:</b> {task.correctAnswer}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 