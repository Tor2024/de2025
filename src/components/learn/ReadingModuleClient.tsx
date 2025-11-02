import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserData } from '@/contexts/UserDataContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { GenerateReadingMaterialOutput } from '@/ai/flows/generate-reading-material-flow';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import { PlayAudioButton } from '@/components/ui/PlayAudioButton';

interface ResultItem {
  correct: boolean;
}

// parseTopicAndGetLink (локальная копия)
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

export default function ReadingModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdFromParams = searchParams.get('lessonId');
  const topicParam = searchParams.get('topic');
  const baseLevel = searchParams.get('baseLevel');
  const [isLoading, setIsLoading] = useState(false);
  const [material, setMaterial] = useState<GenerateReadingMaterialOutput | null>(null);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');
  const [topic, setTopic] = useState<string>("");

  // useEffect для автозагрузки темы — всегда на верхнем уровне
  useEffect(() => {
    if (topicParam && !material && !isLoading) {
      setTopic(topicParam);
      (async () => {
        setIsLoading(true);
        setError('');
        setMaterial(null);
        setCurrentQuestion(0);
        setUserAnswer('');
        setResults([]);
        setShowExplanation(false);
        setIsAnswered(false);
        try {
          if (!userData.settings) throw new Error('Нет настроек пользователя');
          const result = await fetch('/api/ai/generate-reading-material', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interfaceLanguage: userData.settings.interfaceLanguage,
              targetLanguage: userData.settings.targetLanguage,
              proficiencyLevel: (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2',
              topic: topicParam,
              goals: [],
              interests: [],
            }),
          });
          if (!result.ok) throw new Error('Ошибка генерации текста для чтения');
          const data: GenerateReadingMaterialOutput = await result.json();
          setMaterial(data);
        } catch (e) {
          setError('Ошибка генерации текста для чтения. Попробуйте другую тему.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [topicParam, material, isLoading, userData.settings]);

  // useEffect для автоматического перехода после успешного завершения
  useEffect(() => {
    if (material && material.comprehensionQuestions && currentQuestion >= material.comprehensionQuestions.length) {
      const correctCount = results.filter(r => r.correct).length;
      const percent = Math.round((correctCount / material.comprehensionQuestions.length) * 100);
      const canGoNext = percent >= 70;
      if (canGoNext) {
        goToNextSection('reading', lessonIdFromParams, topicParam || '', baseLevel, router);
      }
    }
  }, [material, currentQuestion, results, lessonIdFromParams, topicParam, baseLevel, router]);

  const handleGetMaterial = async () => {
    setIsLoading(true);
    setError('');
    setMaterial(null);
    setCurrentQuestion(0);
    setUserAnswer('');
    setResults([]);
    setShowExplanation(false);
    setIsAnswered(false);
    try {
      if (!userData.settings) throw new Error('Нет настроек пользователя');
      const response = await fetch('/api/ai/generate-reading-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          targetLanguage: userData.settings.targetLanguage,
          proficiencyLevel: (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2',
          topic: topic || topicParam || 'Повседневная ситуация',
          goals: [],
          interests: [],
        }),
      });
      if (!response.ok) throw new Error('Ошибка генерации текста для чтения');
      const result: GenerateReadingMaterialOutput = await response.json();
      setMaterial(result);
    } catch (e) {
      setError('Ошибка генерации текста для чтения. Попробуйте другую тему.');
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

  // Итоговый анализ
  if (material && material.comprehensionQuestions && currentQuestion >= material.comprehensionQuestions.length) {
    const correctCount = results.filter(r => r.correct).length;
    const percent = Math.round((correctCount / material.comprehensionQuestions.length) * 100);
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
            const { href } = parseTopicAndGetLink(lesson.topics[0], { lessonId: lesson.id, lessonLevel: lesson.level });
            if (href) {
              router.push(href);
              return;
            }
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
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Чтение завершено</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {material.comprehensionQuestions.length}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-lg mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
        ) : (
          <div className="text-red-600 text-lg mb-4">Рекомендуем повторить тему для лучшего результата.</div>
        )}
        <Button onClick={() => setMaterial(null)} className="mr-4 px-6 py-2">Пройти ещё раз</Button>
        {canGoNext && (
          <Button onClick={handleNextLesson} className="px-6 py-2" disabled={isNextLoading}>
            {isNextLoading ? 'Загрузка...' : 'Следующий урок'}
          </Button>
        )}
        {!canGoNext && (
          <div className="mt-4 text-gray-500 text-base">Чтобы перейти дальше, повторите тему.</div>
        )}
        {nextError && <div className="text-red-500 mt-4">{nextError}</div>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Чтение</h2>
      <p className="text-muted-foreground mb-6">Введите тему или ситуацию, по которой хотите получить текст для чтения и вопросы для понимания.</p>
      <div className="flex gap-3 mb-6">
        <Input
          value={topic || ''}
          onChange={e => setTopic(e.target.value)}
          placeholder="Например: Путешествия, Работа, Покупки..."
          className="flex-1"
        />
        <Button onClick={handleGetMaterial} disabled={isLoading || !topic.trim()} className="min-w-[140px]">
          {isLoading ? <LoadingSpinner size={16} /> : 'Получить текст'}
        </Button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {material && (
        <Card className="mb-6">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <CardTitle>{material.title || 'Текст для чтения'}</CardTitle>
              <PlayAudioButton
                text={material.readingText}
                lang={userData?.settings?.targetLanguage === 'German' ? 'de-DE' : userData?.settings?.targetLanguage === 'English' ? 'en-US' : userData?.settings?.targetLanguage === 'French' ? 'fr-FR' : userData?.settings?.targetLanguage === 'Spanish' ? 'es-ES' : userData?.settings?.targetLanguage === 'Italian' ? 'it-IT' : userData?.settings?.targetLanguage === 'Russian' ? 'ru-RU' : 'de-DE'}
                tooltipPlay="Прослушать"
                tooltipStop="Остановить"
                className="ml-3"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base mb-4 whitespace-pre-line">{material.readingText}</div>
          </CardContent>
        </Card>
      )}
      {material && material.comprehensionQuestions && material.comprehensionQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Вопрос {currentQuestion + 1} из {material.comprehensionQuestions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base mb-4">{material.comprehensionQuestions[currentQuestion].question}</div>
            {material.comprehensionQuestions[currentQuestion].options && material.comprehensionQuestions[currentQuestion].options.length > 0 ? (
              <div className="flex flex-col gap-2 mb-4">
                {material.comprehensionQuestions[currentQuestion].options.map((opt, idx) => (
                  <Button
                    key={idx}
                    variant={userAnswer === opt ? 'default' : 'outline'}
                    onClick={() => setUserAnswer(opt)}
                    disabled={isAnswered}
                    className="w-full"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            ) : null}
            <Input
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Ваш ответ..."
              disabled={isAnswered}
              className="mb-4"
            />
            {!isAnswered ? (
              <Button
                onClick={() => {
                  const hasAnswer = !!material.comprehensionQuestions![currentQuestion].answer;
                  let correct = false;
                  if (hasAnswer) {
                    correct = userAnswer.trim().toLowerCase() === (material.comprehensionQuestions![currentQuestion].answer || '').trim().toLowerCase();
                  } else {
                    correct = true;
                  }
                  setResults([...results, { correct }]);
                  setShowExplanation(true);
                  setIsAnswered(true);
                }}
                disabled={!userAnswer.trim()}
                className="w-full"
              >
                Проверить
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  setCurrentQuestion(currentQuestion + 1);
                  setUserAnswer('');
                  setShowExplanation(false);
                  setIsAnswered(false);
                }}
                className="w-full"
              >
                Следующий вопрос
              </Button>
            )}
            {showExplanation && (
              <div className={`mt-6 text-lg ${isAnswered && results[results.length - 1]?.correct ? 'text-green-600' : 'text-red-600'}`}>
                {results[results.length - 1]?.correct ? '✅ Правильно!' : '❌ Ошибка'}
                {material.comprehensionQuestions![currentQuestion].answer && (
                  <div className="mt-2 text-blue-600">Правильный ответ: {material.comprehensionQuestions![currentQuestion].answer}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
