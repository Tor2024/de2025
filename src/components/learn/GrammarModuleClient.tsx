import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import { Button } from '@/components/ui/button';
import type { NextRouter } from 'next/router';
import type { PracticeTask, AdaptiveGrammarExplanationsOutput } from '@/ai/flows/adaptive-grammar-explanations';
import type { ExplainGrammarTaskErrorOutput } from '@/ai/flows/explain-grammar-task-error-flow';

interface GrammarModuleClientProps {
  lessonId?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  grammarTopic?: string; // Можно передавать тему урока
}

// parseTopicAndGetLink (упрощённая версия, как в Dashboard)
const keywordsToModules = [
  { keywords: ["лексика:", "словарный запас:", "vocabulary:"], path: "/learn/vocabulary" },
  { keywords: ["грамматика:", "grammar:"], path: "/learn/grammar" },
  { keywords: ["чтение:", "reading:"], path: "/learn/reading", needsLevel: true },
  { keywords: ["аудирование:", "listening:"], path: "/learn/listening" },
  { keywords: ["говорение:", "практика говорения:", "speaking:", "speech practice:"], path: "/learn/speaking" },
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
  // Добавляем три пробела до и после каждого немецкого фрагмента
  let spacedExplanation = explanation.replace(/(#+\s*TARGET_LANG_START\s*#+)([\s\S]*?)(#+\s*TARGET_LANG_END\s*#+)/gi, (match, start, de, end) => {
    // Убираем пробелы в начале и конце немецкого фрагмента
    const trimmedDe = de.replace(/^\s+|\s+$/g, '');
    return `   ${start}${trimmedDe}${end}   `;
  });
  // Добавляем пробел между ##TARGET_LANG_END## и знаками пунктуации, если его нет
  spacedExplanation = spacedExplanation.replace(/(#+\s*TARGET_LANG_END\s*#+)([.,!?:;…])/g, '$1 $2');
  // Добавляем пробел между знаками пунктуации и ##TARGET_LANG_START##, если его нет
  spacedExplanation = spacedExplanation.replace(/([.,!?:;…])(#+\s*TARGET_LANG_START\s*#+)/g, '$1 $2');
  // Усиленное удаление меток и любых пробелов/невидимых символов вокруг них для отображения
  const displayText = spacedExplanation
    .replace(/\s*##TARGET_LANG_START##\s*/gi, "")
    .replace(/\s*##TARGET_LANG_END##\s*/gi, "");
  // Для отладки
  console.log('explanation:', explanation);
  console.log('displayText:', displayText);

  // Функция для TTS с автоматическим переключением языков
  function playExplanationWithTTS() {
    // Озвучивание отключено по требованию пользователя
    return;
  }

  return (
    <div>
      <div style={{ whiteSpace: "pre-line", marginBottom: 12 }}>{displayText}</div>
    </div>
  );
}

// Универсальный массив разделов
const lessonSections = ['grammar', 'vocabulary', 'repetition', 'reading', 'listening', 'writing'];

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

export default function GrammarModuleClient({ lessonId, lessonTitle, lessonDescription, grammarTopic }: GrammarModuleClientProps) {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdFromParams = searchParams.get('lessonId');
  const topic = searchParams.get('topic');
  const baseLevel = searchParams.get('baseLevel');
  const [currentTask, setCurrentTask] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ correct: boolean; explanation: string }[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');
  const [tasks, setTasks] = useState<PracticeTask[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [errorExplanation, setErrorExplanation] = useState<string>('');
  const [isErrorExplanationLoading, setIsErrorExplanationLoading] = useState(false);
  const [errorExplanationError, setErrorExplanationError] = useState('');

  // Получаем задания через ИИ при инициализации
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userData.settings) return;
      setIsAiLoading(true);
      setAiError('');
      try {
        const response = await fetch('/api/ai/adaptive-grammar-explanations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interfaceLanguage: userData.settings.interfaceLanguage,
            grammarTopic: grammarTopic || lessonTitle || 'Грамматика',
            proficiencyLevel: userData.settings.proficiencyLevel || 'A1-A2',
            goals: [],
            interests: [],
            userPastErrors: '',
          }),
        });
        if (!response.ok) throw new Error('Ошибка генерации заданий');
        const aiResult: AdaptiveGrammarExplanationsOutput = await response.json();
        setTasks(aiResult.practiceTasks);
        setExplanation(aiResult.explanation);
        setCurrentTask(0);
        setUserAnswer('');
        setResults([]);
        setShowExplanation(false);
        setIsAnswered(false);
      } catch (e) {
        setAiError('Ошибка генерации заданий. Попробуйте обновить страницу или выбрать другую тему.');
      } finally {
        setIsAiLoading(false);
      }
    };
    if (!isUserDataLoading && userData.settings) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.settings, grammarTopic, lessonTitle]);

  const task = tasks[currentTask];

  const handleCheck = () => {
    if (!task) return;
    // Проверка: если задание на букву, то сравниваем только букву
    const isLetterTask = /встав(ьте|ить) букву|укажи(те|ть) букву|впиши(те|ть) букву/i.test(task.taskDescription);
    let isCorrect = false;
    if (isLetterTask) {
      isCorrect = userAnswer.trim() === task.correctAnswer.trim();
    } else {
      isCorrect = userAnswer.trim().toLowerCase() === task.correctAnswer.trim().toLowerCase();
    }
    setResults([...results, { correct: isCorrect, explanation: '' }]);
    setShowExplanation(true);
    setIsAnswered(true);
    setErrorExplanation('');
    setErrorExplanationError('');
  };

  const handleGetErrorExplanation = async () => {
    if (!task) return;
    setIsErrorExplanationLoading(true);
    setErrorExplanation('');
    setErrorExplanationError('');
    try {
      const response = await fetch('/api/ai/explain-grammar-task-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings?.interfaceLanguage || 'ru',
          grammarTopic: grammarTopic || lessonTitle || 'Грамматика',
          taskDescription: task.taskDescription,
          userAttempt: userAnswer,
          correctAnswer: task.correctAnswer,
        }),
      });
      if (!response.ok) throw new Error('Ошибка получения объяснения');
      const res: ExplainGrammarTaskErrorOutput = await response.json();
      setErrorExplanation(res.explanation);
    } catch (e) {
      setErrorExplanationError('Ошибка получения объяснения. Попробуйте позже.');
    } finally {
      setIsErrorExplanationLoading(false);
    }
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

  useEffect(() => {
    if (!isAiLoading && tasks.length > 0 && currentTask >= tasks.length) {
      const correctCount = results.filter(r => r.correct).length;
      const percent = Math.round((correctCount / tasks.length) * 100);
      const canGoNext = percent >= 70;
      if (canGoNext) {
        goToNextSection('grammar', lessonIdFromParams, topic, baseLevel, router);
      }
    }
  }, [isAiLoading, tasks.length, currentTask, results, lessonIdFromParams, topic, baseLevel, router]);

  // Итоговый анализ
  if (!isAiLoading && tasks.length > 0 && currentTask >= tasks.length) {
    const correctCount = results.filter(r => r.correct).length;
    const percent = Math.round((correctCount / tasks.length) * 100);
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
          currentProficiencyLevel: userData.settings.proficiencyLevel || 'A1-A2',
        };
        const rec = await getLessonRecommendation(input);
        if (rec.recommendedLessonId && userData.progress.learningRoadmap.lessons) {
          const lesson = userData.progress.learningRoadmap.lessons.find(l => l.id === rec.recommendedLessonId);
          if (lesson && lesson.topics && lesson.topics.length > 0) {
            router.push(`/learn/grammar?topic=${encodeURIComponent(lesson.topics[0])}&lessonId=${lesson.id}`);
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
        <h2 className="text-2xl mb-3">{lessonTitle || 'Грамматический тест завершён'}</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {tasks.length}</b> ({percent}%)</p>
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

  if (isUserDataLoading || isAiLoading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Загрузка заданий...</div>;
  }
  if (aiError) {
    return <div style={{ color: 'red', textAlign: 'center', padding: 32 }}>{aiError}</div>;
  }
  if (!tasks.length) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Нет заданий для этой темы.</div>;
  }
  
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>{lessonTitle || 'Грамматическое задание'}</h2>
      <div style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: 16 }}>
        <span>{lessonDescription || 'Описание задания или тема урока.'}</span>
      </div>
      {explanation && (
        <div style={{ background: '#f6f6f6', borderRadius: 8, padding: 16, marginBottom: 24, color: '#333', fontSize: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <b>Объяснение темы:</b>
          </div>
          <GrammarExplanation explanation={explanation} />
        </div>
      )}
      <div style={{ fontSize: 18, marginBottom: 16 }}>Вопрос {currentTask + 1} из {tasks.length}:</div>
      <div style={{ fontSize: 18, marginBottom: 16 }}>
        {task.taskDescription.toLowerCase().includes('____')
          ? <b>Заполните пропуск в предложении:</b>
          : <b>Ответьте на задание:</b>
        }
        <br />
        {task.taskDescription}
      </div>
      <textarea
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        placeholder="Введите ваш ответ..."
        rows={2}
        style={{ width: '100%', padding: 8, fontSize: 16, marginBottom: 16 }}
        disabled={isAnswered}
      />
      <div>
        {!isAnswered ? (
          <Button onClick={handleCheck} disabled={!userAnswer.trim()} style={{ marginRight: 12 }}>
            Проверить
          </Button>
        ) : (
          <Button onClick={handleNext} style={{ marginRight: 12 }}>
            Следующий вопрос
          </Button>
        )}
        {showExplanation && (
          <div
            style={{
              marginTop: 24,
              fontSize: 17,
              color: isAnswered && results[results.length - 1]?.correct ? 'green' : 'red',
              background: isAnswered && results[results.length - 1]?.correct ? '#e6fbe6' : '#ffeaea',
              borderRadius: 10,
              padding: '18px 18px 12px 18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'block',
              minHeight: 60,
              position: 'relative',
              animation: 'fadeInResult 0.5s',
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            <span style={{ fontSize: 32, verticalAlign: 'middle', marginRight: 10 }}>
              {results[results.length - 1]?.correct ? '✅' : '❌'}
            </span>
            <span style={{ fontWeight: 600, fontSize: 20 }}>
              {results[results.length - 1]?.correct ? 'Правильно!' : 'Ошибка'}
            </span>
            {/* Показываем правильный ответ всегда при ошибке */}
            {!results[results.length - 1]?.correct && (
              <div style={{ marginTop: 12, color: '#0070f3', fontWeight: 700, fontSize: 18 }}>
                <b>Правильный ответ:</b> <span style={{ color: '#0070f3', fontWeight: 700 }}>{task.correctAnswer}</span>
              </div>
            )}
            {/* Объяснение ошибки, если есть */}
            {!results[results.length - 1]?.correct && (
              <div style={{ marginTop: 16 }}>
                {/* Кнопка исчезает после получения объяснения */}
                {!errorExplanation && !isErrorExplanationLoading && (
                  <Button onClick={handleGetErrorExplanation} disabled={isErrorExplanationLoading} style={{ marginBottom: 8 }}>
                    {isErrorExplanationLoading ? 'Загрузка объяснения...' : 'Показать объяснение ошибки'}
                  </Button>
                )}
                {errorExplanation && (
                  <div style={{ background: '#f6f6f6', borderRadius: 8, padding: 16, marginTop: 8, color: '#333', fontSize: 16, textAlign: 'left' }}>
                    <b style={{ color: '#d32f2f' }}>Объяснение ошибки:</b>
                    <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{errorExplanation}</div>
                  </div>
                )}
                {errorExplanationError && (
                  <div style={{ color: 'red', marginTop: 8 }}>{errorExplanationError}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
