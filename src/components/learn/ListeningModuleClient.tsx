import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useUserData } from '@/contexts/UserDataContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Volume2, XCircle, RefreshCw } from 'lucide-react';
import type { GenerateListeningMaterialOutput } from '@/ai/flows/generate-listening-material-flow';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import { MultiVoiceAudioPlayer } from '@/components/ui/MultiVoiceAudioPlayer';
import type { TargetLanguage as AppTargetLanguage } from '@/lib/types';
import { lessonTypes } from '@/config/lessonTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const lessonSections = ['grammar', 'vocabulary', 'repetition', 'reading', 'listening', 'writing', 'practice'];

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

const InteractiveText = ({ text, vocabulary }: { text: string; vocabulary: { word: string; translation: string; }[] }) => {
  const vocabMap = useMemo(() => {
    const map = new Map<string, string>();
    if (vocabulary) {
      for (const item of vocabulary) {
        map.set(item.word.toLowerCase(), item.translation);
      }
    }
    return map;
  }, [vocabulary]);

  const words = text.split(/(\s+|[.,!?;:"])/);

  return (
    <div className="text-base mb-4 whitespace-pre-line leading-relaxed">
      <TooltipProvider>
        {words.map((word, index) => {
          const cleanWord = word.replace(/[.,!?;:"]/, '').toLowerCase();
          const translation = vocabMap.get(cleanWord);
          if (translation) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <span className="underline decoration-dotted cursor-pointer decoration-primary">{word}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{translation}</span>
                </TooltipContent>
              </Tooltip>
            );
          }
          return <span key={index}>{word}</span>;
        })}
      </TooltipProvider>
    </div>
  );
};


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

  const getPastErrorsAsString = useCallback(() => {
    if (!userData.progress?.errorArchive || userData.progress.errorArchive.length === 0) {
        return "No past errors recorded.";
    }
    return userData.progress.errorArchive
        .slice(-10) // Take last 10 errors to keep prompt concise
        .map(e => `Module: ${e.module}, Context: ${e.context || 'N/A'}, User attempt: ${e.userAttempt}, Correct: ${e.correctAnswer || 'N/A'}`)
        .join('\n');
  }, [userData.progress?.errorArchive]);

  const handleGetMaterial = useCallback(async () => {
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
      const pastErrors = getPastErrorsAsString();
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
          userPastErrors: pastErrors,
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
  }, [userData.settings, topicInput, topicParam, getPastErrorsAsString]);

  // useEffect для автозагрузки темы из topicParam
  useEffect(() => {
    if (topicParam && !material && !isLoading) {
      setTopicInput(topicParam);
      handleGetMaterial();
    }
  }, [topicParam, material, isLoading, handleGetMaterial]);

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

    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl mb-3">Аудирование завершено</h2>
        <p className="text-lg mb-4">Ваш результат: <b>{correctCount} из {material.comprehensionQuestions.length}</b> ({percent}%)</p>
        {canGoNext ? (
          <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
        ) : (
          <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
        )}
        <div className="flex justify-center gap-4">
            <Button onClick={() => setMaterial(null)} variant="outline" className="px-6 py-2 text-base">Пройти ещё раз</Button>
            {canGoNext && (
            <Button onClick={() => goToNextSection('listening', lessonIdFromParams, topicParam || '', baseLevel, router)} className="px-6 py-2 text-base" disabled={isNextLoading}>
                {isNextLoading ? 'Загрузка...' : 'Следующий раздел'}
            </Button>
            )}
        </div>
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
          disabled={isLoading}
        />
        <Button onClick={handleGetMaterial} disabled={isLoading || !topicInput.trim()}>
          {isLoading ? <LoadingSpinner size={16} /> : 'Получить аудиоматериал'}
        </Button>
      </div>
      {error && <div className="text-red-500 mb-4 flex items-center gap-2">{error} <Button onClick={handleGetMaterial} size="sm" variant="outline"><RefreshCw className="h-4 w-4 mr-2" /> Повторить</Button></div>}
      {material && (
        <Card className="mb-6">
        <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <CardTitle style={{ marginBottom: 0 }}>{material.title || 'Скрипт для аудирования'}</CardTitle>
              <MultiVoiceAudioPlayer
                script={material.script}
                targetLang={userData?.settings?.targetLanguage as AppTargetLanguage}
                interfaceLang={userData?.settings?.interfaceLanguage}
                tooltipPlay="Прослушать"
                tooltipStop="Остановить"
                className="ml-3"
              />
            </div>
            {material.scenario && <CardDescription>{material.scenario}</CardDescription>}
        </CardHeader>
          <CardContent>
            <InteractiveText text={material.script} vocabulary={material.vocabulary || []} />
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
