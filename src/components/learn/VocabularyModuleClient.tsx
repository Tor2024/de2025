"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserData } from "@/contexts/UserDataContext";
import { generateVocabulary } from "@/ai/flows/generate-vocabulary-flow";
import type { GenerateVocabularyInput, GenerateVocabularyOutput, VocabularyWord } from "@/ai/flows/generate-vocabulary-flow";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FileText, Sparkles, Languages, MessageSquareText, XCircle, Eye, EyeOff, ArrowLeft, ArrowRight, Repeat, CheckCircle2, Lightbulb, Archive, PartyPopper, RefreshCw, Info } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel, UserLearnedWord } from "@/lib/types";
import { interfaceLanguageCodes, learningStageIntervals, MAX_LEARNING_STAGE } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { enUS, ru as ruLocale } from 'date-fns/locale';
import { useSearchParams, useRouter } from 'next/navigation';
import { getLessonRecommendation } from '@/ai/flows/get-lesson-recommendation-flow';
import { lessonTypes } from '@/config/lessonTypes';

const vocabularySchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});

type VocabularyFormData = z.infer<typeof vocabularySchema>;

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const baseEnTranslations: Record<string, string> = {
  title: "Vocabulary Builder",
  description: "Enter a topic and our AI will generate a list of relevant words, their translations, and example sentences, tailored to your proficiency level. Use the flashcards below to study them, then try the practice modes.",
  topicLabel: "Topic for Vocabulary",
  topicPlaceholder: "E.g., Travel, Food, Business",
  getWordsButton: "Get Words",
  resultsTitlePrefix: "Vocabulary Flashcards for:",
  noWordsGenerated: "No words were generated for this topic. Try a different one.",
  toastSuccessTitle: "Vocabulary List Generated!",
  toastSuccessDescriptionTemplate: "Word list for \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate vocabulary. Please try again.",
  onboardingMissing: "Please complete onboarding first to set your languages and proficiency.",
  loading: "Loading...",
  noExampleSentence: "No example sentence provided.",
  showDetailsButton: "Show Details",
  hideDetailsButton: "Hide Details",
  currentCardOfTotal: "Card {current} of {total}",
  noWordsForFlashcards: "No words generated for this topic to display as flashcards.",
  clearResultsButton: "Clear Results",
  previousButton: "Previous",
  nextButton: "Next",
  wordHeader: "Word",
  translationHeader: "Translation",
  exampleSentenceHeader: "Example Sentence",
  typeInPracticeTitle: "Practice Mode: Type the Translation",
  typeInPracticeWordLabel: "Word:",
  typeInPracticeYourTranslationLabel: "Your Translation:",
  typeInPracticeCheckButton: "Check",
  typeInPracticeNextButton: "Next",
  feedbackCorrect: "Correct!",
  feedbackIncorrectPrefix: "Incorrect. Correct answer was:",
  typeInPracticeComplete: "Practice Complete!",
  typeInPracticeScoreMessage: "Your Score: {correct} out of {total}.",
  showTypeInPracticeHintButton: "Show Hint (First Letter)",
  hideTypeInPracticeHintButton: "Hide Hint",
  hintLabel: "Hint:",
  typeInPracticeAgainButton: "Practice This Set Again",
  archiveMistakeButton: "Archive this mistake",
  mistakeArchivedToastTitle: "Mistake Archived",
  mistakeArchivedToastDescription: "This mistake has been added to your error archive.",
  mcPracticeTitle: "Practice Mode: Choose Correct Translation",
  mcPracticeWordLabel: "Word (in {targetLanguage}):",
  mcPracticeChooseLabel: "Choose the correct translation (in {interfaceLanguage}):",
  practiceCheckMcButton: "Check Answer",
  practiceNextMcButton: "Next Question",
  practiceAgainMcButton: "Practice This Set Again",
  mcFeedbackCorrect: "Correct!",
  mcFeedbackIncorrect: "Not quite!",
  mcPracticeComplete: "Multiple Choice Practice Complete!",
  mcPracticeScoreMessage: "Your Score: {correct} out of {total} correct.",
  flashcardKnewItButton: "Knew It",
  flashcardNotKnewItButton: "Review Again",
  flashcardStatusUpdatedToast: "Word status updated.",
  learningStageLabel: "Learning Stage:",
  nextReviewLabel: "Next Review:",
  newWordStatus: "New word (not in review cycle yet)",
  nextPartButton: "Next Part", // Used for "Next Set" of words / clear results
  repeatLessonPartButton: "Repeat This Set", // Used for "Practice This Set Again"
};

const baseRuTranslations: Record<string, string> = {
  title: "Конструктор словарного запаса",
  description: "Введите тему, и наш ИИ сгенерирует список соответствующих слов, их переводы и примеры предложений, адаптированные к вашему уровню. Используйте карточки ниже для их изучения, затем попробуйте режимы практики.",
  topicLabel: "Тема для словарного запаса",
  topicPlaceholder: "Напр., Путешествия, Еда, Бизнес",
  getWordsButton: "Получить слова",
  resultsTitlePrefix: "Карточки со словами по теме:",
  noWordsGenerated: "Для этой темы слова не были сгенерированы. Попробуйте другую.",
  toastSuccessTitle: "Список слов создан!",
  toastSuccessDescriptionTemplate: "Список слов для темы \"{topic}\" готов.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать список слов. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг, чтобы установить языки и уровень.",
  loading: "Загрузка...",
  noExampleSentence: "Пример предложения не предоставлен.",
  showDetailsButton: "Показать детали",
  hideDetailsButton: "Скрыть детали",
  currentCardOfTotal: "Карточка {current} из {total}",
  noWordsForFlashcards: "Для этой темы не сгенерировано слов для отображения в виде карточек.",
  clearResultsButton: "Очистить результаты",
  previousButton: "Назад",
  nextButton: "Вперед",
  wordHeader: "Слово",
  translationHeader: "Перевод",
  exampleSentenceHeader: "Пример предложения",
  typeInPracticeTitle: "Режим практики: Введите перевод",
  typeInPracticeWordLabel: "Слово:",
  typeInPracticeYourTranslationLabel: "Ваш перевод:",
  typeInPracticeCheckButton: "Проверить",
  typeInPracticeNextButton: "Дальше",
  feedbackCorrect: "Правильно!",
  feedbackIncorrectPrefix: "Неправильно. Правильный ответ:",
  typeInPracticeComplete: "Практика завершена!",
  typeInPracticeScoreMessage: "Ваш результат: {correct} из {total}.",
  showTypeInPracticeHintButton: "Показать подсказку (первая буква)",
  hideTypeInPracticeHintButton: "Скрыть подсказку",
  hintLabel: "Подсказка:",
  typeInPracticeAgainButton: "Практиковать этот набор снова",
  archiveMistakeButton: "Добавить ошибку в архив",
  mistakeArchivedToastTitle: "Ошибка добавлена в архив",
  mistakeArchivedToastDescription: "Эта ошибка была добавлена в ваш архив ошибок.",
  mcPracticeTitle: "Режим практики: Выберите правильный перевод",
  mcPracticeWordLabel: "Слово (на {targetLanguage}):",
  mcPracticeChooseLabel: "Выберите правильный перевод (на {interfaceLanguage}):",
  practiceCheckMcButton: "Проверить ответ",
  practiceNextMcButton: "Следующий вопрос",
  practiceAgainMcButton: "Практиковать этот набор снова",
  mcFeedbackCorrect: "Правильно!",
  mcFeedbackIncorrect: "Не совсем!",
  mcPracticeComplete: "Практика 'Множественный выбор' завершена!",
  mcPracticeScoreMessage: "Ваш результат: {correct} из {total} правильно.",
  flashcardKnewItButton: "Знал",
  flashcardNotKnewItButton: "Повторить",
  flashcardStatusUpdatedToast: "Статус слова обновлен.",
  learningStageLabel: "Стадия изучения:",
  nextReviewLabel: "Следующее повторение:",
  newWordStatus: "Новое слово (еще не в цикле повторения)",
  nextPartButton: "Следующий набор",
  repeatLessonPartButton: "Повторить этот набор",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {};
  interfaceLanguageCodes.forEach(code => {
    if (code === 'ru') {
      translations[code] = { ...baseEnTranslations, ...baseRuTranslations };
    } else {
      translations[code] = { ...baseEnTranslations };
    }
  });
  return translations;
};

const componentTranslations = generateTranslations();

// Тип для статического лексического задания
interface StaticVocabTask {
  type: 'translate' | 'synonym' | 'fill' | 'antonym';
  question: string;
  correctAnswer: string;
  explanation: string;
  options?: string[]; // для выбора
}

const staticVocabTasks: StaticVocabTask[] = [
  {
    type: 'translate',
    question: 'Переведите на английский: "яблоко"',
    correctAnswer: 'apple',
    explanation: '"Яблоко" по-английски — "apple".',
  },
  {
    type: 'synonym',
    question: 'Выберите синоним к слову "big":',
    correctAnswer: 'large',
    explanation: 'Синоним слова "big" — "large".',
    options: ['small', 'large', 'thin', 'old'],
  },
  {
    type: 'fill',
    question: 'Вставьте слово: "I ___ to school every day."',
    correctAnswer: 'go',
    explanation: 'Правильный вариант: "I go to school every day."',
  },
  {
    type: 'antonym',
    question: 'Выберите антоним к слову "hot":',
    correctAnswer: 'cold',
    explanation: 'Антоним слова "hot" — "cold".',
    options: ['cold', 'warm', 'soft', 'hard'],
  },
  {
    type: 'translate',
    question: 'Переведите на английский: "книга"',
    correctAnswer: 'book',
    explanation: '"Книга" по-английски — "book".',
  },
  {
    type: 'fill',
    question: 'Вставьте слово: "She ___ a doctor."',
    correctAnswer: 'is',
    explanation: 'Правильный вариант: "She is a doctor."',
  },
  {
    type: 'synonym',
    question: 'Выберите синоним к слову "happy":',
    correctAnswer: 'joyful',
    explanation: 'Синоним слова "happy" — "joyful".',
    options: ['sad', 'angry', 'joyful', 'tired'],
  },
];

const lessonSections = ['theory', 'grammar', 'vocabulary', 'practice', 'reading', 'listening', 'writing'];

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

export function VocabularyModuleClient() {
  const router = useRouter();
  const { userData, isLoading: isUserDataLoading, addErrorToArchive, processWordRepetition, recordPracticeSetCompletion } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [vocabularyResult, setVocabularyResult] = useState<GenerateVocabularyOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [currentWordSrsData, setCurrentWordSrsData] = useState<UserLearnedWord | null>(null);

  const [practiceWords, setPracticeWords] = useState<VocabularyWord[]>([]);
  // Type-In Practice States
  const [currentTypeInPracticeIndex, setCurrentTypeInPracticeIndex] = useState(0);
  const [userTypeInAnswer, setUserTypeInAnswer] = useState("");
  const [typeInPracticeFeedback, setTypeInPracticeFeedback] = useState("");
  const [isTypeInPracticeSubmitted, setIsTypeInPracticeSubmitted] = useState(false);
  const [typeInPracticeScore, setTypeInPracticeScore] = useState({ correct: 0, total: 0 });
  const [showTypeInPracticeHint, setShowTypeInPracticeHint] = useState(false);
  const [isCurrentTypeInPracticeMistakeArchived, setIsCurrentTypeInPracticeMistakeArchived] = useState(false);

  // Multiple Choice Practice States
  const [currentMcPracticeIndex, setCurrentMcPracticeIndex] = useState(0);
  const [mcPracticeOptions, setMcPracticeOptions] = useState<VocabularyWord[]>([]);
  const [selectedMcOption, setSelectedMcOption] = useState<VocabularyWord | null>(null);
  const [isMcPracticeSubmitted, setIsMcPracticeSubmitted] = useState(false);
  const [mcPracticeFeedback, setMcPracticeFeedback] = useState("");
  const [mcPracticeScore, setMcPracticeScore] = useState({ correct: 0, total: 0 });
  const [isCurrentMcPracticeMistakeArchived, setIsCurrentMcPracticeMistakeArchived] = useState(false);

  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextError, setNextError] = useState('');

  const searchParams = useSearchParams();
  const lessonIdFromParams = searchParams.get('lessonId');
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VocabularyFormData>({
    resolver: zodResolver(vocabularySchema),
  });

  const currentLang = isUserDataLoading || !userData.settings ? 'en' : userData.settings.interfaceLanguage;
  const t = useCallback((key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  }, [currentLang]);

  const getDateLocale = () => {
    if (currentLang === 'ru') return ruLocale;
    return enUS;
  };

  const fetchVocabularyList = useCallback(async (formData: VocabularyFormData) => {
    if (!userData.settings) {
      toast({ title: t('onboardingMissing', 'Пожалуйста, завершите ввод данных для начала работы.'), variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setVocabularyResult(null); // Clear previous results
    setCurrentTopic(formData.topic);
    setCurrentCardIndex(0);
    setIsCardRevealed(false);
    setCurrentWordSrsData(null);
    setPracticeWords([]);
    
    // Reset Type-In Practice
    setCurrentTypeInPracticeIndex(0);
    setUserTypeInAnswer("");
    setTypeInPracticeFeedback("");
    setIsTypeInPracticeSubmitted(false);
    setTypeInPracticeScore({ correct: 0, total: 0 });
    setShowTypeInPracticeHint(false);
    setIsCurrentTypeInPracticeMistakeArchived(false);
    
    // Reset Multiple Choice Practice
    setCurrentMcPracticeIndex(0);
    setMcPracticeOptions([]);
    setSelectedMcOption(null);
    setIsMcPracticeSubmitted(false);
    setMcPracticeFeedback("");
    setMcPracticeScore({ correct: 0, total: 0 });
    setIsCurrentMcPracticeMistakeArchived(false);

    try {
      const safeProficiencyLevel = (userData.settings.proficiencyLevel as 'A1-A2' | 'B1-B2' | 'C1-C2') || 'A1-A2';
      const flowInput: GenerateVocabularyInput = {
        interfaceLanguage: 'ru',
        targetLanguage: 'German',
        proficiencyLevel: safeProficiencyLevel,
        topic: formData.topic,
        goals: [],
        interests: [],
      };

      const result = await generateVocabulary(flowInput);
      setVocabularyResult(result);
      if (result && result.words && result.words.length > 0) {
        const shuffledWords = shuffleArray([...result.words]);
        setPracticeWords(shuffledWords);
        setTypeInPracticeScore(prev => ({ ...prev, total: result.words.length }));
        setMcPracticeScore(prev => ({ ...prev, total: result.words.length }));
      } else {
        setPracticeWords([]); // Ensure practice words are empty if no words generated
        setTypeInPracticeScore({ correct: 0, total: 0 });
        setMcPracticeScore({ correct: 0, total: 0 });
      }
      toast({
        title: t('toastSuccessTitle', 'Список слов успешно сгенерирован!'),
        description: t('toastSuccessDescriptionTemplate', 'Слова по теме: {topic}').replace('{topic}', formData.topic),
      });
    } catch (error) {
      console.error("Vocabulary generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('toastErrorTitle', 'Ошибка при генерации словаря'),
        description: `${t('toastErrorDescription', 'Попробуйте ещё раз.')}${errorMessage ? ` (${errorMessage})` : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [userData.settings, toast, t]);

  const onSubmit: SubmitHandler<VocabularyFormData> = async (data) => {
    await fetchVocabularyList(data);
    reset();
  };

  useEffect(() => {
    const initialTopic = searchParams.get('topic');
    if (initialTopic && !vocabularyResult && !isAiLoading) { 
      setValue('topic', initialTopic);
      fetchVocabularyList({ topic: initialTopic });
    }
  }, [searchParams, setValue, fetchVocabularyList, vocabularyResult, isAiLoading]);


  const handleClearResults = () => {
    setVocabularyResult(null);
    setCurrentTopic("");
    setCurrentCardIndex(0);
    setIsCardRevealed(false);
    setCurrentWordSrsData(null);
    setPracticeWords([]);
    // Reset Type-In Practice
    setCurrentTypeInPracticeIndex(0);
    setUserTypeInAnswer("");
    setTypeInPracticeFeedback("");
    setIsTypeInPracticeSubmitted(false);
    setTypeInPracticeScore({ correct: 0, total: 0 });
    setShowTypeInPracticeHint(false);
    setIsCurrentTypeInPracticeMistakeArchived(false);
    // Reset Multiple Choice Practice
    setCurrentMcPracticeIndex(0);
    setMcPracticeOptions([]);
    setSelectedMcOption(null);
    setIsMcPracticeSubmitted(false);
    setMcPracticeFeedback("");
    setMcPracticeScore({ correct: 0, total: 0 });
    setIsCurrentMcPracticeMistakeArchived(false);
    reset();
  };

  const handleNextCard = useCallback(() => {
    if (vocabularyResult && vocabularyResult.words && currentCardIndex < vocabularyResult.words.length - 1) {
      setCurrentCardIndex((prevIndex) => prevIndex + 1);
      setIsCardRevealed(false);
    }
  }, [vocabularyResult, currentCardIndex]);

  const handlePrevCard = () => {
    if (vocabularyResult && vocabularyResult.words && currentCardIndex > 0) {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1));
      setIsCardRevealed(false);
    }
  };
  
  useEffect(() => {
    const currentWordData = vocabularyResult?.words?.[currentCardIndex];
    if (currentWordData && userData.settings && userData.progress?.learnedWords) {
      const srsEntry = userData.progress.learnedWords.find(
        (lw) => lw.word.toLowerCase() === currentWordData.word.toLowerCase() && lw.targetLanguage === userData.settings!.targetLanguage
      );
      setCurrentWordSrsData(srsEntry || null);
    } else {
      setCurrentWordSrsData(null);
    }
  }, [currentCardIndex, vocabularyResult, userData.progress?.learnedWords, userData.settings]);

  const handleWordRepetition = (knewIt: boolean) => {
    const wordData = vocabularyResult?.words?.[currentCardIndex];
    if (wordData && userData.settings) {
      processWordRepetition(wordData, userData.settings.targetLanguage as AppTargetLanguage, knewIt);
      toast({
        title: t('flashcardStatusUpdatedToast', 'Статус карточки обновлён!'),
        duration: 2000,
      });
      handleNextCard(); 
    }
  };


  const currentTypeInPracticeWord = practiceWords[currentTypeInPracticeIndex];

  const handleUserTypeInAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTypeInAnswer(e.target.value);
  };

  const handleCheckTypeInPracticeAnswer = () => {
    if (!currentTypeInPracticeWord) return;
    const userAnswer = userTypeInAnswer.trim().toLowerCase();
    const correctAnswer = currentTypeInPracticeWord.translation.trim().toLowerCase();
    if (userAnswer === correctAnswer) {
      setTypeInPracticeFeedback(t('feedbackCorrect'));
      setTypeInPracticeScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setTypeInPracticeFeedback(`${t('feedbackIncorrectPrefix')} ${currentTypeInPracticeWord.translation}`);
    }
    setIsTypeInPracticeSubmitted(true);
    setShowTypeInPracticeHint(false);
    setIsCurrentTypeInPracticeMistakeArchived(false);
  };

  const handleNextTypeInPractice = () => {
    if (currentTypeInPracticeIndex < practiceWords.length - 1) {
      setCurrentTypeInPracticeIndex(prev => prev + 1);
      setUserTypeInAnswer("");
      setTypeInPracticeFeedback("");
      setIsTypeInPracticeSubmitted(false);
      setShowTypeInPracticeHint(false);
      setIsCurrentTypeInPracticeMistakeArchived(false);
    } else {
      setTypeInPracticeFeedback(t('typeInPracticeComplete'));
      if (practiceWords.length > 0) recordPracticeSetCompletion();
    }
  };

  const handleToggleTypeInPracticeHint = () => {
    setShowTypeInPracticeHint(prev => !prev);
  };

  const handleRestartTypeInPractice = () => {
    setCurrentTypeInPracticeIndex(0);
    setUserTypeInAnswer("");
    setTypeInPracticeFeedback("");
    setIsTypeInPracticeSubmitted(false);
    setTypeInPracticeScore(prev => ({ ...prev, correct: 0 }));
    setShowTypeInPracticeHint(false);
    setIsCurrentTypeInPracticeMistakeArchived(false);
  };

  const handleArchiveTypeInPracticeMistake = () => {
    if (!currentTypeInPracticeWord || !userData.settings) return;
    addErrorToArchive({
      module: "Vocabulary Practice - Type In",
      context: currentTypeInPracticeWord.word,
      userAttempt: userTypeInAnswer,
      correctAnswer: currentTypeInPracticeWord.translation,
    });
    setIsCurrentTypeInPracticeMistakeArchived(true);
    toast({
      title: t('mistakeArchivedToastTitle', 'Ошибка добавлена в архив'),
      description: t('mistakeArchivedToastDescription', 'Вы сможете повторить это слово позже.'),
    });
  };

  const currentMcPracticeWord = practiceWords[currentMcPracticeIndex];

  const setupMcPracticeExercise = useCallback((index: number, wordsForMc: VocabularyWord[]) => {
    if (!wordsForMc || wordsForMc.length === 0 || index < 0 || index >= wordsForMc.length) {
      setMcPracticeOptions([]);
      return;
    }
    const correctWord = wordsForMc[index];
    const distractors = wordsForMc
      .filter(word => word.word.toLowerCase() !== correctWord.word.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = shuffleArray([correctWord, ...distractors]);
    setMcPracticeOptions(options.slice(0, Math.min(4, wordsForMc.length))); // Ensure max 4 options, or less if not enough words
    setSelectedMcOption(null);
    setMcPracticeFeedback("");
    setIsMcPracticeSubmitted(false);
    setIsCurrentMcPracticeMistakeArchived(false);
  }, []);

  useEffect(() => {
    if (practiceWords.length > 0 && currentMcPracticeIndex < practiceWords.length) {
      setupMcPracticeExercise(currentMcPracticeIndex, practiceWords);
    }
  }, [currentMcPracticeIndex, practiceWords, setupMcPracticeExercise]);

  const handleMcOptionSelect = (option: VocabularyWord) => {
    if (isMcPracticeSubmitted) return;
    setSelectedMcOption(option);
  };

  const handleCheckMcPracticeAnswer = () => {
    if (!currentMcPracticeWord || !selectedMcOption) return;
    if (selectedMcOption.translation.trim().toLowerCase() === currentMcPracticeWord.translation.trim().toLowerCase()) {
      setMcPracticeFeedback(t('mcFeedbackCorrect'));
      setMcPracticeScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setMcPracticeFeedback(t('mcFeedbackIncorrect'));
    }
    setIsMcPracticeSubmitted(true);
    setIsCurrentMcPracticeMistakeArchived(false);
  };

  const handleNextMcPracticeExercise = () => {
    if (currentMcPracticeIndex < practiceWords.length - 1) {
      setCurrentMcPracticeIndex(prev => prev + 1);
    } else {
      setMcPracticeFeedback(t('mcPracticeComplete'));
      if (practiceWords.length > 0) recordPracticeSetCompletion();
    }
  };

  const handleRestartMcPractice = () => {
    setCurrentMcPracticeIndex(0);
    setMcPracticeScore(prev => ({ ...prev, correct: 0 }));
    // Re-setup first exercise options
    if (practiceWords.length > 0) {
        setupMcPracticeExercise(0, practiceWords);
    } else {
        setMcPracticeOptions([]);
    }
    setSelectedMcOption(null);
    setMcPracticeFeedback("");
    setIsMcPracticeSubmitted(false);
    setIsCurrentMcPracticeMistakeArchived(false);
  };

  const handleArchiveMcPracticeMistake = () => {
    if (!currentMcPracticeWord || !selectedMcOption || !userData.settings) return;
    addErrorToArchive({
      module: "Vocabulary Practice - MC",
      context: currentMcPracticeWord.word,
      userAttempt: selectedMcOption.translation,
      correctAnswer: currentMcPracticeWord.translation,
    });
    setIsCurrentMcPracticeMistakeArchived(true);
    toast({
      title: t('mistakeArchivedToastTitle', 'Ошибка добавлена в архив'),
      description: t('mistakeArchivedToastDescription', 'Вы сможете повторить это слово позже.'),
    });
  };

  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }
  const currentWordData = vocabularyResult?.words?.[currentCardIndex];
  const typeInScorePercentage = typeInPracticeScore.total > 0 ? (typeInPracticeScore.correct / typeInPracticeScore.total) * 100 : 0;
  const mcScorePercentage = mcPracticeScore.total > 0 ? (mcPracticeScore.correct / mcPracticeScore.total) * 100 : 0;

  React.useEffect(() => {
    if (typeInScorePercentage >= 70 || mcScorePercentage >= 70) {
      goToNextSection('vocabulary', lessonIdFromParams || '', currentTopic, userData.settings?.proficiencyLevel || '', router);
    }
  }, [typeInScorePercentage, mcScorePercentage, lessonIdFromParams, currentTopic, userData.settings?.proficiencyLevel, router]);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-center">{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3 mb-6">
          <Input
            {...register('topic')}
            placeholder={t('topicPlaceholder')}
            className="flex-1"
            disabled={isAiLoading}
          />
          <Button type="submit" disabled={isAiLoading || !Boolean(errors.topic) && !currentTopic.trim()} className="min-w-[140px]">
            {isAiLoading ? <LoadingSpinner size={16} /> : t('getWordsButton')}
          </Button>
        </form>
        {errors.topic && <div className="text-red-500 mb-4">{errors.topic.message}</div>}
      </Card>

      {isAiLoading && !vocabularyResult && (
        <div className="flex justify-center items-center p-10">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      )}

      {vocabularyResult && currentTopic && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {t('resultsTitlePrefix')} {currentTopic}
              </CardTitle>
              {vocabularyResult.words && vocabularyResult.words.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearResults} aria-label={t('clearResultsButton')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('clearResultsButton')}
                </Button>
              )}
            </div>
            {vocabularyResult.words && vocabularyResult.words.length > 0 && (
              <CardDescription>
                {t('currentCardOfTotal')
                  .replace('{current}', (currentCardIndex + 1).toString())
                  .replace('{total}', vocabularyResult.words.length.toString())}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {currentWordData ? (
               <div className="space-y-4">
                <Card
                  className="min-h-[250px] flex flex-col items-center justify-center p-6 text-center shadow-lg border border-border/70 hover:shadow-primary/20 transition-shadow duration-300 cursor-pointer"
                  onClick={() => setIsCardRevealed(prev => !prev)}
                >
                  {!isCardRevealed ? (
                    <>
                      <h3 className="text-3xl md:text-4xl font-semibold text-primary break-all mb-6">
                        {currentWordData.word}
                      </h3>
                       <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsCardRevealed(true);}}>
                        <Eye className="mr-2 h-4 w-4" /> {t('showDetailsButton')}
                      </Button>
                    </>
                  ) : (
                    <div className="w-full text-left space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl md:text-3xl font-semibold text-primary break-all">
                          {currentWordData.word}
                          <span className="text-sm font-normal text-muted-foreground ml-2">({userData.settings?.targetLanguage})</span>
                        </h3>
                         <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsCardRevealed(false);}}>
                            <EyeOff className="mr-2 h-4 w-4" /> {t('hideDetailsButton')}
                        </Button>
                      </div>
                      <div className="border-t pt-3 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1 flex items-center">
                            <Languages className="mr-2 h-4 w-4" /> {t('translationHeader')} ({userData.settings?.interfaceLanguage}):
                          </p>
                          <p className="text-lg">{currentWordData.translation}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1 flex items-center">
                            <MessageSquareText className="mr-2 h-4 w-4" /> {t('exampleSentenceHeader')}:
                          </p>
                          {currentWordData.exampleSentence ? (
                            <p className="text-base italic">{currentWordData.exampleSentence}</p>
                          ) : (
                            <p className="text-base italic text-muted-foreground">{t('noExampleSentence')}</p>
                          )}
                        </div>
                         {currentWordSrsData && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Info size={14} /> {t('learningStageLabel')} {currentWordSrsData.learningStage}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Info size={14} /> {t('nextReviewLabel')} {format(new Date(currentWordSrsData.nextReviewDate), 'PPP', { locale: getDateLocale() })}
                                </p>
                            </div>
                        )}
                        {!currentWordSrsData && (
                             <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30 flex items-center gap-1">
                                <Info size={14} /> {t('newWordStatus')}
                             </p>
                        )}
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button onClick={(e) => { e.stopPropagation(); handleWordRepetition(false); }} variant="outline" size="sm">
                            <XCircle className="mr-2 h-4"/> {t('flashcardNotKnewItButton')}
                          </Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleWordRepetition(true); }} size="sm">
                             <CheckCircle2 className="mr-2 h-4 w-4"/> {t('flashcardKnewItButton')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {vocabularyResult.words && vocabularyResult.words.length > 0 && (
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      onClick={handlePrevCard}
                      variant="outline"
                      disabled={!vocabularyResult.words || vocabularyResult.words.length <= 1 || currentCardIndex === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t('previousButton')}
                    </Button>
                    <Button
                      onClick={handleNextCard}
                      variant="outline"
                      disabled={!vocabularyResult.words || vocabularyResult.words.length <= 1 || currentCardIndex === vocabularyResult.words.length - 1}
                    >
                      {t('nextButton')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground p-4 md:p-6 lg:p-8">{isAiLoading ? t('loading') : t('noWordsForFlashcards')}</p>
            )}
          </CardContent>

          {/* Type-In Practice Mode Section */}
          {practiceWords.length > 0 && (
            <CardFooter className="flex-col items-start border-t mt-6 pt-6">
              <CardTitle className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Repeat className="h-6 w-6 text-primary" />
                {t('typeInPracticeTitle')}
              </CardTitle>
              {currentTypeInPracticeWord && !typeInPracticeFeedback.startsWith(t('typeInPracticeComplete')) ? (
                <div className="w-full space-y-3">
                  <p className="text-lg">
                    <span className="font-semibold">{t('typeInPracticeWordLabel')}</span> {currentTypeInPracticeWord.word}
                    <span className="text-sm text-muted-foreground ml-1">({userData.settings?.targetLanguage})</span>
                  </p>
                  <div className="space-y-1">
                    <Label htmlFor="userTypeInAnswer">{t('typeInPracticeYourTranslationLabel')} ({userData.settings?.interfaceLanguage})</Label>
                    <Input
                      id="userTypeInAnswer"
                      type="text"
                      value={userTypeInAnswer}
                      onChange={handleUserTypeInAnswerChange}
                      disabled={isTypeInPracticeSubmitted}
                      className={cn(
                        "transition-colors duration-300 ease-in-out",
                        isTypeInPracticeSubmitted &&
                        (typeInPracticeFeedback === t('feedbackCorrect') ?
                          'border-green-500 focus-visible:ring-green-500 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          :
                          'border-red-500 focus-visible:ring-red-500 bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400')
                      )}
                    />
                  </div>

                  {!isTypeInPracticeSubmitted && (
                    <Button onClick={handleToggleTypeInPracticeHint} variant="link" size="sm" className="p-0 h-auto text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {showTypeInPracticeHint ? t('hideTypeInPracticeHintButton') : t('showTypeInPracticeHintButton')}
                    </Button>
                  )}

                  {showTypeInPracticeHint && !isTypeInPracticeSubmitted && currentTypeInPracticeWord && (
                    <p className="text-sm mt-1 text-muted-foreground bg-background p-2 rounded-md shadow-sm">
                      {t('hintLabel')}: <span className="font-semibold text-primary">{currentTypeInPracticeWord.translation.charAt(0)}...</span>
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    {!isTypeInPracticeSubmitted ? (
                      <Button onClick={handleCheckTypeInPracticeAnswer} disabled={!userTypeInAnswer.trim()}>
                        {t('typeInPracticeCheckButton')}
                      </Button>
                    ) : currentTypeInPracticeIndex < practiceWords.length - 1 ? (
                      <Button onClick={handleNextTypeInPractice}>
                        {t('typeInPracticeNextButton')}
                      </Button>
                    ) : null 
                    }
                    {isTypeInPracticeSubmitted && typeInPracticeFeedback !== t('feedbackCorrect') && !isCurrentTypeInPracticeMistakeArchived && (
                      <Button variant="outline" size="sm" onClick={handleArchiveTypeInPracticeMistake} className="text-xs">
                        <Archive className="mr-1.5 h-3.5 w-3.5" />
                        {t('archiveMistakeButton')}
                      </Button>
                    )}
                  </div>

                  {typeInPracticeFeedback && !typeInPracticeFeedback.startsWith(t('typeInPracticeComplete')) && (
                    <p className={cn(
                      "text-sm mt-2 flex items-center gap-1",
                      typeInPracticeFeedback === t('feedbackCorrect') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                    >
                      {typeInPracticeFeedback === t('feedbackCorrect') ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {typeInPracticeFeedback}
                    </p>
                  )}
                </div>
              ) : (
                <CardFooter className="flex-col items-center border-t mt-6 pt-6">
                  <PartyPopper className="h-12 w-12 text-primary mb-2" />
                  <div className="text-lg mb-3">Ваш результат: <b>{typeInPracticeScore.correct} из {typeInPracticeScore.total}</b> ({typeInScorePercentage}%)</div>
                  {typeInScorePercentage > 70 ? (
                    <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
                  ) : (
                    <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
                  )}
                  <Button onClick={handleRestartTypeInPractice} variant="default" className="w-full sm:w-auto mr-3">Пройти ещё раз</Button>
                  {typeInScorePercentage > 70 && (
                    <Button onClick={async () => {
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
                            window.location.href = `/learn/vocabulary?topic=${encodeURIComponent(lesson.topics[0])}&lessonId=${lesson.id}`;
                            return;
                          }
                        }
                        setNextError('Не удалось определить следующий урок. Вернитесь на главную.');
                      } catch (e) {
                        setNextError('Ошибка перехода к следующему уроку.');
                      } finally {
                        setIsNextLoading(false);
                      }
                    }} className="px-6 py-2 text-base" disabled={isNextLoading}>
                      {isNextLoading ? 'Загрузка...' : 'Следующий урок'}
                  </Button>
                  )}
                  {typeInScorePercentage <= 70 && (
                    <div className="mt-4 text-muted-foreground text-sm">Чтобы перейти дальше, повторите тему.</div>
                  )}
                  {nextError && <div className="text-red-600 mt-4">{nextError}</div>}
                </CardFooter>
              )}
            </CardFooter>
          )}

          {/* Multiple Choice Practice Mode Section */}
          {practiceWords.length > 0 && (
            <CardFooter className="flex-col items-start border-t mt-6 pt-6">
              <CardTitle className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Repeat className="h-6 w-6 text-primary" />
                {t('mcPracticeTitle')}
              </CardTitle>
              {currentMcPracticeWord && !mcPracticeFeedback.startsWith(t('mcPracticeComplete')) ? (
                <div className="w-full space-y-3">
                  <p className="text-lg">
                    <span className="font-semibold">{t('mcPracticeWordLabel').replace('{targetLanguage}', userData.settings!.targetLanguage)}</span> {currentMcPracticeWord.word}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('mcPracticeChooseLabel').replace('{interfaceLanguage}', userData.settings!.interfaceLanguage)}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mcPracticeOptions.map((option, idx) => {
                      const isSelected = selectedMcOption?.translation === option.translation;
                      const isActualCorrectAnswer = currentMcPracticeWord.translation.trim().toLowerCase() === option.translation.trim().toLowerCase();

                      let buttonClassName = "justify-start text-left h-auto py-2 transition-colors duration-200 whitespace-normal";

                      if (isMcPracticeSubmitted) {
                         buttonClassName = cn(buttonClassName, "disabled:opacity-100");
                        if (isActualCorrectAnswer) {
                          buttonClassName = cn(buttonClassName, "bg-green-500/20 border-green-500 text-green-700 hover:bg-green-500/30 dark:bg-green-700/30 dark:text-green-400 dark:border-green-600");
                        } else if (isSelected && !isActualCorrectAnswer) {
                          buttonClassName = cn(buttonClassName, "bg-red-500/20 border-red-500 text-red-700 hover:bg-red-500/30 dark:bg-red-700/30 dark:text-red-400 dark:border-red-600");
                        } else {
                           buttonClassName = cn(buttonClassName, "border-border opacity-60 hover:bg-muted/50");
                        }
                      } else if (isSelected) {
                        buttonClassName = cn(buttonClassName, "bg-primary/20 border-primary text-primary hover:bg-primary/30");
                      } else {
                        buttonClassName = cn(buttonClassName, "border-border hover:bg-muted/50");
                      }

                      return (
                        <Button
                          key={`${option.word}-${idx}-${option.translation}`}
                          variant="outline"
                          className={buttonClassName}
                          onClick={() => handleMcOptionSelect(option)}
                          disabled={isMcPracticeSubmitted}
                        >
                          {option.translation}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    {!isMcPracticeSubmitted ? (
                      <Button onClick={handleCheckMcPracticeAnswer} disabled={!selectedMcOption}>
                        {t('practiceCheckMcButton')}
                      </Button>
                    ) : currentMcPracticeIndex < practiceWords.length - 1 ? (
                      <Button onClick={handleNextMcPracticeExercise}>
                        {t('practiceNextMcButton')}
                      </Button>
                    ) : null 
                    }
                     {isMcPracticeSubmitted && mcPracticeFeedback !== t('mcFeedbackCorrect') && !isCurrentMcPracticeMistakeArchived && (
                      <Button variant="outline" size="sm" onClick={handleArchiveMcPracticeMistake} className="text-xs">
                        <Archive className="mr-1.5 h-3.5 w-3.5" />
                        {t('archiveMistakeButton')}
                      </Button>
                    )}
                  </div>

                  {mcPracticeFeedback && !mcPracticeFeedback.startsWith(t('mcPracticeComplete')) && (
                    <p className={cn(
                      "text-sm mt-2 flex items-center gap-1",
                      mcPracticeFeedback === t('mcFeedbackCorrect') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                    >
                      {mcPracticeFeedback === t('mcFeedbackCorrect') ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {mcPracticeFeedback}
                      {mcPracticeFeedback === t('mcFeedbackIncorrect') && currentMcPracticeWord && selectedMcOption && currentMcPracticeWord.translation.trim().toLowerCase() !== selectedMcOption.translation.trim().toLowerCase() &&
                        <span className="ml-1">{t('feedbackIncorrectPrefix')} {currentMcPracticeWord.translation}</span>
                      }
                    </p>
                  )}
                </div>
              ) : (
                <CardFooter className="flex-col items-center border-t mt-6 pt-6">
                  <PartyPopper className="h-12 w-12 text-primary mb-2" />
                  <div className="text-lg mb-3">Ваш результат: <b>{mcPracticeScore.correct} из {practiceWords.length}</b> ({mcScorePercentage}%)</div>
                  {mcScorePercentage > 70 ? (
                    <div className="text-green-600 text-xl mb-4">Поздравляем! Вы можете перейти к следующей теме.</div>
                  ) : (
                    <div className="text-red-600 text-xl mb-4">Рекомендуем повторить тему для лучшего результата.</div>
                  )}
                  <Button onClick={handleRestartMcPractice} variant="default" className="w-full sm:w-auto mr-3">Пройти ещё раз</Button>
                  {mcScorePercentage > 70 && (
                    <Button onClick={async () => {
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
                            window.location.href = `/learn/vocabulary?topic=${encodeURIComponent(lesson.topics[0])}&lessonId=${lesson.id}`;
                            return;
                          }
                        }
                        setNextError('Не удалось определить следующий урок. Вернитесь на главную.');
                      } catch (e) {
                        setNextError('Ошибка перехода к следующему уроку.');
                      } finally {
                        setIsNextLoading(false);
                      }
                    }} className="px-6 py-2 text-base" disabled={isNextLoading}>
                      {isNextLoading ? 'Загрузка...' : 'Следующий урок'}
                  </Button>
                  )}
                  {mcScorePercentage <= 70 && (
                    <div className="mt-4 text-muted-foreground text-sm">Чтобы перейти дальше, повторите тему.</div>
                  )}
                  {nextError && <div className="text-red-600 mt-4">{nextError}</div>}
                </CardFooter>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}


    