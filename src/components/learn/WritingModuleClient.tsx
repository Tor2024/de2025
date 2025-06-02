import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/contexts/UserDataContext';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import { aiPoweredWritingAssistance } from '@/ai/flows/ai-powered-writing-assistance';
import { useRouter, useSearchParams } from 'next/navigation';

interface WritingTask {
  prompt: string;
  answer: string;
  explanation: string;
}

const staticTasks: WritingTask[] = [
  {
    prompt: 'Напишите короткое письмо другу о своих планах на выходные.',
    answer: 'Привет! В эти выходные я собираюсь поехать на природу с друзьями. Мы будем жарить шашлыки и играть в настольные игры. А какие у тебя планы?',
    explanation: 'В письме должны быть: приветствие, описание планов, вопрос к другу.'
  },
  {
    prompt: 'Составьте официальный e-mail с просьбой предоставить информацию о курсах немецкого языка.',
    answer: 'Уважаемые господа! Я хотел бы узнать подробности о ваших курсах немецкого языка: расписание, стоимость и условия записи. Заранее благодарю за ответ. С уважением, Иван.',
    explanation: 'В официальном письме важно использовать вежливое обращение, четко сформулировать запрос и добавить подпись.'
  },
  {
    prompt: 'Опишите свой обычный день (5-6 предложений).',
    answer: 'Мой день начинается в 7 утра. Я завтракаю и иду на работу. Днем я встречаюсь с коллегами и решаю рабочие задачи. После работы я занимаюсь спортом или читаю книги. Вечером я ужинаю с семьёй и смотрю фильмы.',
    explanation: 'В ответе должны быть: начало дня, работа, досуг, вечер.'
  }
];

const lessonSections = ['theory', 'grammar', 'vocabulary', 'repetition', 'reading', 'listening', 'writing'];

function goToNextSection(
  currentSection: string,
  lessonId: string | null,
  topic: string | null,
  baseLevel: string | null,
  router: ReturnType<typeof useRouter>
) {
  const currentIndex = lessonSections.indexOf(currentSection);
  if (currentIndex < lessonSections.length - 1) {
    const nextSection = lessonSections[currentIndex + 1];
    let href = `/learn/${nextSection}?lessonId=${encodeURIComponent(lessonId || '')}`;
    if (topic) href += `&topic=${encodeURIComponent(topic)}`;
    if (baseLevel) href += `&baseLevel=${encodeURIComponent(baseLevel)}`;
    router.push(href);
  } else {
    router.push('/dashboard?completedLesson=' + (lessonId || ''));
  }
}

export default function WritingModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const [currentTask, setCurrentTask] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ correct: boolean; explanation: string; aiFeedback?: string; aiCorrection?: string; aiErrors?: any[] }[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiCorrection, setAiCorrection] = useState<string | null>(null);
  const [aiErrors, setAiErrors] = useState<any[] | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdFromParams = searchParams.get('lessonId');
  const topic = searchParams.get('topic');
  const baseLevel = searchParams.get('baseLevel');

  const task = staticTasks[currentTask];

  const handleCheck = () => {
    // Примитивная проверка: ответ считается верным, если содержит хотя бы 5 слов из эталона
    const answerWords = task.answer.toLowerCase().split(/\W+/).filter(Boolean);
    const userWords = userAnswer.toLowerCase().split(/\W+/).filter(Boolean);
    const matchCount = answerWords.filter(w => userWords.includes(w)).length;
    const isCorrect = matchCount >= 5;
    setResults([...results, { correct: isCorrect, explanation: task.explanation }]);
    setShowExplanation(true);
    setIsAnswered(true);
  };

  const handleAiCheck = async () => {
    setIsAiLoading(true);
    setAiFeedback(null);
    setAiCorrection(null);
    setAiErrors(null);
    try {
      if (!userData.settings) throw new Error('Нет данных пользователя');
      const input = {
        prompt: task.prompt,
        text: userAnswer,
        interfaceLanguage: userData.settings.interfaceLanguage,
        proficiencyLevel: (userData.settings.proficiencyLevel || 'A1-A2'),
        goals: Array.isArray(userData.settings.goal) ? userData.settings.goal : (userData.settings.goal ? [userData.settings.goal] : []),
        interests: Array.isArray(userData.settings.interests) ? userData.settings.interests : (userData.settings.interests ? [userData.settings.interests] : []),
      };
      const result = await aiPoweredWritingAssistance(input);
      setAiFeedback(result.feedback);
      setAiCorrection(result.markedCorrectedText);
      setAiErrors(result.errorCategories || []);
      setResults([...results, { correct: true, explanation: task.explanation, aiFeedback: result.feedback, aiCorrection: result.markedCorrectedText, aiErrors: result.errorCategories }]);
      setShowExplanation(true);
      setIsAnswered(true);
    } catch (e) {
      setAiFeedback('Ошибка ИИ-проверки.');
      setAiCorrection(null);
      setAiErrors(null);
      setShowExplanation(true);
      setIsAnswered(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNext = () => {
    setUserAnswer('');
    setShowExplanation(false);
    setIsAnswered(false);
    setAiFeedback(null);
    setAiCorrection(null);
    setAiErrors(null);
    setCurrentTask(currentTask + 1);
  };

  const handleRepeat = () => {
    setCurrentTask(0);
    setUserAnswer('');
    setResults([]);
    setShowExplanation(false);
    setIsAnswered(false);
    setAiFeedback(null);
    setAiCorrection(null);
    setAiErrors(null);
  };

  // Итоговый анализ
  if (currentTask >= staticTasks.length) {
    const correctCount = results.filter(r => r.correct).length;
    const percent = Math.round((correctCount / staticTasks.length) * 100);
    const canGoNext = percent >= 70;

    useEffect(() => {
      if (canGoNext) {
        goToNextSection('writing', lessonIdFromParams, topic, baseLevel, router);
      }
    }, [canGoNext, lessonIdFromParams, topic, baseLevel, router]);

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
            goToNextSection('writing', lesson.id, lesson.topics[0], null, router);
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
        <h2 className="text-2xl mb-3">Письменный тест завершён</h2>
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
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Письменное задание</h2>
      <div style={{ fontSize: 18, marginBottom: 16 }}>Задание {currentTask + 1} из {staticTasks.length}:</div>
      <div style={{ fontSize: 18, marginBottom: 16 }}>{task.prompt}</div>
      <textarea
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        placeholder="Введите ваш ответ..."
        rows={5}
        style={{ width: '100%', padding: 8, fontSize: 16, marginBottom: 16 }}
        disabled={isAnswered}
      />
      <div>
        {!isAnswered ? (
          <>
            <Button onClick={handleCheck} disabled={!userAnswer.trim()} style={{ marginRight: 12 }}>
              Проверить (статически)
            </Button>
            <Button onClick={handleAiCheck} disabled={!userAnswer.trim() || isAiLoading} style={{ marginRight: 12 }}>
              {isAiLoading ? 'Проверка ИИ...' : 'Проверить с помощью ИИ'}
            </Button>
          </>
        ) : (
          <Button onClick={handleNext} style={{ marginRight: 12 }}>
            Следующее задание
          </Button>
        )}
        {showExplanation && (
          <div style={{ marginTop: 24, fontSize: 17, color: isAnswered && results[results.length - 1]?.correct ? 'green' : 'red' }}>
            {results[results.length - 1]?.correct ? '✅ Хорошо!' : '❌ Нужно доработать'}
            <div style={{ marginTop: 8, color: '#0070f3' }}>Пояснение: {task.explanation}</div>
            <div style={{ marginTop: 8, color: '#888' }}><b>Пример ответа:</b> {task.answer}</div>
            {aiFeedback && (
              <div style={{ marginTop: 16, color: '#222', background: '#f6f6f6', borderRadius: 8, padding: 12 }}>
                <b>Обратная связь ИИ:</b>
                <div style={{ marginTop: 8 }}>{aiFeedback}</div>
                {aiCorrection && (
                  <div style={{ marginTop: 8 }}>
                    <b>Исправленный текст:</b>
                    <div style={{ marginTop: 4, background: '#fff', border: '1px solid #eee', borderRadius: 4, padding: 8 }} dangerouslySetInnerHTML={{ __html: aiCorrection }} />
                  </div>
                )}
                {aiErrors && aiErrors.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <b>Категории ошибок:</b>
                    <ul style={{ marginTop: 4 }}>
                      {aiErrors.map((err, idx) => (
                        <li key={idx} style={{ fontSize: 14, marginBottom: 4 }}>
                          <b>{err.category}:</b> {err.specificError} {err.comment && <span>({err.comment})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 