import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useUserData } from '@/contexts/UserDataContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Volume2, XCircle } from 'lucide-react';
import type { GenerateListeningMaterialOutput } from '@/ai/flows/generate-listening-material-flow';
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
  { keywords: ["практика слов:", "упражнения:", "word practice:", "exercises:"], path: "/learn/practice" },
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

// Добавляю утилиту для сопоставления языков TTS
const mapTargetLanguageToBcp47: Record<string, string> = {
  German: 'de-DE',
  English: 'en-US',
  French: 'fr-FR',
  Spanish: 'es-ES',
  Italian: 'it-IT',
  Russian: 'ru-RU',
  // Добавьте другие языки по необходимости
};

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

export default function ListeningModuleClient() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdFromParams = searchParams.get('lessonId');
  const topicParam = searchParams.get('topic');
  const baseLevel = searchParams.get('baseLevel');
  const [isLoading, setIsLoading] = useState(false);
  const [material, setMaterial] = useState<GenerateListeningMaterialOutput | null>(null);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');
  const [topicInput, setTopicInput] = useState<string>("");

  // useEffect для автозагрузки темы из topicParam
  useEffect(() => {
    if (topicParam && !material && !isLoading) {
      setTopicInput(topicParam);
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
          const safeProficiencyLevel = (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2';
          const response = await fetch('/api/ai/generate-listening-material', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interfaceLanguage: userData.settings.interfaceLanguage,
              targetLanguage: userData.settings.targetLanguage,
              proficiencyLevel: safeProficiencyLevel,
              topic: topicInput || topicParam || 'Повседневная ситуация',
              goals: [],
              interests: [],
            }),
          });
          if (!response.ok) throw new Error('Ошибка генерации аудиоматериала');
          const result: GenerateListeningMaterialOutput = await response.json();
          setMaterial(result);
        } catch (e) {
          setError('Ошибка генерации аудиоматериала. Попробуйте другую тему.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [topicParam, material, isLoading, userData.settings]);

  // TTS (Text-to-Speech)
  const playScript = useCallback(() => {
    if (!material?.script) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Получаем BCP-47 код для TTS
      const ttsLang = userData?.settings?.targetLanguage && mapTargetLanguageToBcp47[userData.settings.targetLanguage] ? mapTargetLanguageToBcp47[userData.settings.targetLanguage] : 'de-DE';
      const utterance = new window.SpeechSynthesisUtterance(material.script);
      utterance.lang = ttsLang;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [material, userData]);

  const stopScript = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

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
      const safeProficiencyLevel = (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2';
      const response = await fetch('/api/ai/generate-listening-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceLanguage: userData.settings.interfaceLanguage,
          targetLanguage: userData.settings.targetLanguage,
          proficiencyLevel: safeProficiencyLevel,
          topic: topicInput || topicParam || 'Повседневная ситуация',
          goals: [],
          interests: [],
        }),
      });
      if (!response.ok) throw new Error('Ошибка генерации аудиоматериала');
      const result: GenerateListeningMaterialOutput = await response.json();
      setMaterial(result);
    } catch (e) {
      setError('Ошибка генерации аудиоматериала. Попробуйте другую тему.');
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect для автоматического перехода к следующему разделу
  useEffect(() => {
    if (
      material &&
      material.comprehensionQuestions &&
      currentQuestion >= (material.comprehensionQuestions?.length || 0)
    ) {
      const correctCount = results.filter(r => r.correct).length;
      const totalQuestions = material.comprehensionQuestions?.length || 1;
      const percent = Math.round((correctCount / totalQuestions) * 100);
      const canGoNext = percent >= 70;
      if (canGoNext) {
        goToNextSection('listening', lessonIdFromParams, topicParam || '', baseLevel, router);
      }
    }
  }, [material, currentQuestion, results, lessonIdFromParams, topicParam, baseLevel, router]);

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
        const safeProficiencyLevel = (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2';
        const input = {
          interfaceLanguage: userData.settings.interfaceLanguage,
          currentLearningRoadmap: userData.progress.learningRoadmap,
          completedLessonIds: userData.progress.completedLessonIds || [],
          userGoal: Array.isArray(userData.settings.goal) ? (userData.settings.goal[0] || '') : (userData.settings.goal || ''),
          currentProficiencyLevel: safeProficiencyLevel,
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
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl mb-3">Аудирование завершено</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {material.comprehensionQuestions.length}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
        ) : (
          <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
        )}
        <Button onClick={() => setMaterial(null)} className="px-6 py-2 text-base mr-3">Пройти ещё раз</Button>
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
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Аудирование</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>Введите тему или ситуацию, по которой хотите получить аудиоматериал и вопросы для понимания.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Input
          value={topicInput || ''}
          onChange={e => setTopicInput(e.target.value)}
          placeholder="Например: В магазине, На вокзале, Заказ еды..."
          style={{ flex: 1 }}
        />
        <Button onClick={handleGetMaterial} disabled={isLoading || !topicInput.trim()}>
          {isLoading ? <LoadingSpinner size={16} /> : 'Получить аудиоматериал'}
        </Button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {material && (
        <Card className="mb-6">
        <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <CardTitle style={{ marginBottom: 0 }}>{material.title || 'Скрипт для аудирования'}</CardTitle>
              <PlayAudioButton
                text={material.script}
                lang={userData?.settings?.targetLanguage && mapTargetLanguageToBcp47[userData.settings.targetLanguage] ? mapTargetLanguageToBcp47[userData.settings.targetLanguage] : 'de-DE'}
                tooltipPlay="Прослушать"
                tooltipStop="Остановить"
                className="ml-3"
              />
            </div>
            {material.scenario && <CardDescription>{material.scenario}</CardDescription>}
        </CardHeader>
          <CardContent>
            <div style={{ fontSize: 18, marginBottom: 16, whiteSpace: 'pre-line' }}>{material.script}</div>
          </CardContent>
      </Card>
      )}
      {material && material.comprehensionQuestions && material.comprehensionQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Вопрос {currentQuestion + 1} из {material.comprehensionQuestions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: 18, marginBottom: 16 }}>{material.comprehensionQuestions[currentQuestion].question}</div>
            {material.comprehensionQuestions[currentQuestion].options ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {material.comprehensionQuestions[currentQuestion].options!.map((opt, idx) => {
                  // Улучшенная проверка правильного варианта
                  const rawAnswer = (material.comprehensionQuestions![currentQuestion].answer || '').trim();
                  let isCorrect = false;
                  // 1. Сравнение по индексу (если answer — число или строка-номер)
                  if (rawAnswer === String(idx + 1) || rawAnswer === String(idx)) {
                    isCorrect = true;
                  }
                  // 2. Сравнение по тексту (без учёта регистра и пробелов)
                  const normOpt = opt.trim().toLowerCase();
                  const normAnswer = rawAnswer.trim().toLowerCase();
                  if (normOpt === normAnswer) {
                    isCorrect = true;
                  }
                  // 3. Если answer — список через запятую
                  const answerList = rawAnswer.split(',').map(a => a.trim().toLowerCase());
                  if (answerList.includes(normOpt)) {
                    isCorrect = true;
                  }
                  return (
                    <Button
                      key={idx}
                      variant={userAnswer === opt ? 'default' : 'outline'}
                      onClick={() => setUserAnswer(opt)}
                      disabled={isAnswered}
                      style={isAnswered && isCorrect ? { borderColor: '#0070f3', background: '#e6f0fa' } : {}}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <Input
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Ваш ответ..."
                disabled={isAnswered}
                style={{ marginBottom: 16 }}
              />
            )}
            {!isAnswered ? (
              <Button
                onClick={() => {
                  let correct = false;
                  const rawAnswer = (material.comprehensionQuestions![currentQuestion].answer || '').trim();
                  if (material.comprehensionQuestions![currentQuestion].options) {
                    // 1. Сравнение по индексу
                    const idx = material.comprehensionQuestions![currentQuestion].options!.findIndex(opt => opt === userAnswer);
                    if (rawAnswer === String(idx + 1) || rawAnswer === String(idx)) {
                      correct = true;
                    }
                    // 2. Сравнение по тексту
                    const normUser = userAnswer.trim().toLowerCase();
                    const normAnswer = rawAnswer.trim().toLowerCase();
                    if (normUser === normAnswer) {
                      correct = true;
                    }
                    // 3. Сравнение по списку
                    const answerList = rawAnswer.split(',').map(a => a.trim().toLowerCase());
                    if (answerList.includes(normUser)) {
                      correct = true;
                    }
                  } else {
                    // Текстовый ответ: поддержка синонимов через запятую
                    const user = userAnswer.trim().toLowerCase();
                    const answerList = rawAnswer.split(',').map(a => a.trim().toLowerCase());
                    correct = answerList.some(a => a === user);
                  }
                  setResults([...results, { correct }]);
                  setShowExplanation(true);
                  setIsAnswered(true);
                }}
                disabled={!userAnswer.trim()}
              >
                Проверить
              </Button>
            ) :
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  onClick={() => {
                    setCurrentQuestion(currentQuestion + 1);
                    setUserAnswer('');
                    setShowExplanation(false);
                    setIsAnswered(false);
                  }}
                >
                  Следующий вопрос
                </Button>
                {!results[results.length - 1]?.correct && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAnswered(false);
                      setShowExplanation(false);
                      setUserAnswer('');
                    }}
                  >
                    Попробовать ещё раз
                  </Button>
                )}
                {!results[results.length - 1]?.correct && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowExplanation(true);
                    }}
                  >
                    Показать ответ
                  </Button>
                )}
              </div>
            }
            {showExplanation && (
              <div style={{ marginTop: 24, fontSize: 18, color: isAnswered && results[results.length - 1]?.correct ? 'green' : 'red' }}>
                {results[results.length - 1]?.correct ? '✅ Правильно!' : '❌ Ошибка'}
                {material.comprehensionQuestions && material.comprehensionQuestions[currentQuestion].answer && (
                  <div style={{ marginTop: 8, color: '#0070f3' }}>
                    Правильный ответ: {material.comprehensionQuestions[currentQuestion].answer}
                  </div>
                )}
                {material.comprehensionQuestions && material.comprehensionQuestions[currentQuestion].options &&
                  !material.comprehensionQuestions[currentQuestion].options.some(opt => {
                    const normOpt = opt.trim().toLowerCase();
                    const normAnswer = (material.comprehensionQuestions[currentQuestion].answer || '').trim().toLowerCase();
                    return normOpt === normAnswer;
                  }) && (
                  <div style={{ marginTop: 8, color: 'red' }}>
                    <b>Внимание:</b> Проверьте правильный ответ в настройках генерации. Raw answer: {material.comprehensionQuestions[currentQuestion].answer}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
