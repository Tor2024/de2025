
"use client";

import { useState, useEffect } from "react";
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
import { FileText, Sparkles, Languages, MessageSquareText, XCircle, Eye, EyeOff, ArrowLeft, ArrowRight, Repeat, CheckCircle2, Lightbulb, Archive, PartyPopper } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { interfaceLanguageCodes } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const vocabularySchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});

type VocabularyFormData = z.infer<typeof vocabularySchema>;

// Helper function to shuffle an array
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
  // Type In Translation Practice
  typeInPracticeTitle: "Practice Mode: Type the Translation",
  typeInPracticeWordLabel: "Word:",
  typeInPracticeYourTranslationLabel: "Your Translation:",
  typeInPracticeCheckButton: "Check",
  typeInPracticeNextButton: "Next",
  typeInFeedbackCorrect: "Correct!",
  typeInFeedbackIncorrectPrefix: "Incorrect. Correct answer was:",
  typeInPracticeComplete: "Practice Complete!",
  typeInPracticeScoreMessage: "Your Score: {correct} out of {total}.",
  showTypeInPracticeHintButton: "Show Hint (First Letter)",
  hideTypeInPracticeHintButton: "Hide Hint",
  typeInHintLabel: "Hint:",
  typeInPracticeAgainButton: "Practice Again",
  archiveMistakeButton: "Archive this mistake",
  mistakeArchivedToastTitle: "Mistake Archived",
  mistakeArchivedToastDescription: "This mistake has been added to your error archive.",
  // Multiple Choice Practice
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
  // Type In Translation Practice
  typeInPracticeTitle: "Режим практики: Введите перевод",
  typeInPracticeWordLabel: "Слово:",
  typeInPracticeYourTranslationLabel: "Ваш перевод:",
  typeInPracticeCheckButton: "Проверить",
  typeInPracticeNextButton: "Дальше",
  typeInFeedbackCorrect: "Правильно!",
  typeInFeedbackIncorrectPrefix: "Неправильно. Правильный ответ:",
  typeInPracticeComplete: "Практика завершена!",
  typeInPracticeScoreMessage: "Ваш результат: {correct} из {total}.",
  showTypeInPracticeHintButton: "Показать подсказку (первая буква)",
  hideTypeInPracticeHintButton: "Скрыть подсказку",
  typeInHintLabel: "Подсказка:",
  typeInPracticeAgainButton: "Практиковать снова",
  archiveMistakeButton: "Добавить ошибку в архив",
  mistakeArchivedToastTitle: "Ошибка добавлена в архив",
  mistakeArchivedToastDescription: "Эта ошибка была добавлена в ваш архив ошибок.",
  // Multiple Choice Practice
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

export function VocabularyModuleClient() {
  const { userData, isLoading: isUserDataLoading, addErrorToArchive, recordPracticeSetCompletion } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [vocabularyResult, setVocabularyResult] = useState<GenerateVocabularyOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  // Type-in practice states
  const [practiceWords, setPracticeWords] = useState<VocabularyWord[]>([]);
  const [currentTypeInPracticeIndex, setCurrentTypeInPracticeIndex] = useState(0);
  const [userTypeInAnswer, setUserTypeInAnswer] = useState("");
  const [typeInPracticeFeedback, setTypeInPracticeFeedback] = useState("");
  const [isTypeInPracticeSubmitted, setIsTypeInPracticeSubmitted] = useState(false);
  const [typeInPracticeScore, setTypeInPracticeScore] = useState({ correct: 0, total: 0 });
  const [showTypeInPracticeHint, setShowTypeInPracticeHint] = useState(false);
  const [isCurrentTypeInPracticeMistakeArchived, setIsCurrentTypeInPracticeMistakeArchived] = useState(false);

  // Multiple Choice (MC) practice states
  const [currentMcPracticeIndex, setCurrentMcPracticeIndex] = useState(0);
  const [mcPracticeOptions, setMcPracticeOptions] = useState<VocabularyWord[]>([]);
  const [selectedMcOption, setSelectedMcOption] = useState<VocabularyWord | null>(null);
  const [isMcPracticeSubmitted, setIsMcPracticeSubmitted] = useState(false);
  const [mcPracticeFeedback, setMcPracticeFeedback] = useState("");
  const [mcPracticeScore, setMcPracticeScore] = useState({ correct: 0, total: 0 });
  const [isCurrentMcPracticeMistakeArchived, setIsCurrentMcPracticeMistakeArchived] = useState(false);


  const { register, handleSubmit, formState: { errors }, reset } = useForm<VocabularyFormData>({
    resolver: zodResolver(vocabularySchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };

  // Setup MC exercise options
  const setupMcPracticeExercise = (index: number) => {
    if (!practiceWords || practiceWords.length === 0 || index < 0 || index >= practiceWords.length) {
      setMcPracticeOptions([]);
      return;
    }
    const correctWord = practiceWords[index];
    const distractors = practiceWords
      .filter(word => word.word !== correctWord.word) 
      .sort(() => 0.5 - Math.random()) 
      .slice(0, 3);
    
    const options = shuffleArray([correctWord, ...distractors]);
    setMcPracticeOptions(options.slice(0, Math.min(4, practiceWords.length))); // Ensure max 4 options
    setSelectedMcOption(null);
    setMcPracticeFeedback("");
    setIsMcPracticeSubmitted(false);
    setIsCurrentMcPracticeMistakeArchived(false);
  };

  useEffect(() => {
    if (practiceWords.length > 0 && currentMcPracticeIndex < practiceWords.length) {
      setupMcPracticeExercise(currentMcPracticeIndex);
    }
  }, [currentMcPracticeIndex, practiceWords]);


  if (isUserDataLoading) {
    return <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner size={32} /><p className="ml-2">{t('loading')}</p></div>;
  }

  if (!userData.settings) {
    return <p className="p-4 md:p-6 lg:p-8">{t('onboardingMissing')}</p>;
  }

  const onSubmit: SubmitHandler<VocabularyFormData> = async (data) => {
    setIsAiLoading(true);
    setVocabularyResult(null);
    setCurrentTopic(data.topic);
    // Reset flashcard states
    setCurrentCardIndex(0);
    setIsCardRevealed(false);
    // Reset type-in practice states
    setPracticeWords([]);
    setCurrentTypeInPracticeIndex(0);
    setUserTypeInAnswer("");
    setTypeInPracticeFeedback("");
    setIsTypeInPracticeSubmitted(false);
    setTypeInPracticeScore({ correct: 0, total: 0 });
    setShowTypeInPracticeHint(false);
    setIsCurrentTypeInPracticeMistakeArchived(false);
    // Reset MC practice states
    setCurrentMcPracticeIndex(0);
    setMcPracticeOptions([]);
    setSelectedMcOption(null);
    setIsMcPracticeSubmitted(false);
    setMcPracticeFeedback("");
    setMcPracticeScore({ correct: 0, total: 0 });
    setIsCurrentMcPracticeMistakeArchived(false);


    try {
      const flowInput: GenerateVocabularyInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage as AppInterfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage as AppTargetLanguage,
        proficiencyLevel: userData.settings!.proficiencyLevel as AppProficiencyLevel,
        topic: data.topic,
      };

      const result = await generateVocabulary(flowInput);
      setVocabularyResult(result);
      if (result && result.words && result.words.length > 0) {
        const shuffledWords = shuffleArray([...result.words]);
        setPracticeWords(shuffledWords); 
        setTypeInPracticeScore(prev => ({ ...prev, total: result.words.length }));
        setMcPracticeScore(prev => ({ ...prev, total: result.words.length }));
        setupMcPracticeExercise(0); 
      }
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessDescriptionTemplate').replace('{topic}', data.topic),
      });
      reset(); 
    } catch (error) {
      console.error("Vocabulary generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('toastErrorTitle'),
        description: `${t('toastErrorDescription')} ${errorMessage ? `(${errorMessage})` : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearResults = () => {
    setVocabularyResult(null);
    setCurrentTopic("");
    setCurrentCardIndex(0);
    setIsCardRevealed(false);
    setPracticeWords([]);
    setCurrentTypeInPracticeIndex(0);
    setUserTypeInAnswer("");
    setTypeInPracticeFeedback("");
    setIsTypeInPracticeSubmitted(false);
    setTypeInPracticeScore({ correct: 0, total: 0 });
    setShowTypeInPracticeHint(false);
    setIsCurrentTypeInPracticeMistakeArchived(false);
    setCurrentMcPracticeIndex(0);
    setMcPracticeOptions([]);
    setSelectedMcOption(null);
    setIsMcPracticeSubmitted(false);
    setMcPracticeFeedback("");
    setMcPracticeScore({ correct: 0, total: 0 });
    setIsCurrentMcPracticeMistakeArchived(false);
  };

  const handleNextCard = () => {
    if (vocabularyResult && vocabularyResult.words) {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1));
      setIsCardRevealed(false);
    }
  };

  const handlePrevCard = () => {
    if (vocabularyResult && vocabularyResult.words) {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1));
      setIsCardRevealed(false);
    }
  };

  const currentWordData = vocabularyResult?.words?.[currentCardIndex];

  const currentTypeInPracticeWord = practiceWords[currentTypeInPracticeIndex];

  const handleUserTypeInAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTypeInAnswer(e.target.value);
  };

  const handleCheckTypeInPracticeAnswer = () => {
    if (!currentTypeInPracticeWord) return;
    const userAnswer = userTypeInAnswer.trim().toLowerCase();
    const correctAnswer = currentTypeInPracticeWord.translation.trim().toLowerCase();
    if (userAnswer === correctAnswer) {
      setTypeInPracticeFeedback(t('typeInFeedbackCorrect'));
      setTypeInPracticeScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setTypeInPracticeFeedback(`${t('typeInFeedbackIncorrectPrefix')} ${currentTypeInPracticeWord.translation}`);
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
      const finalScoreMsg = t('typeInPracticeScoreMessage')
        .replace('{correct}', typeInPracticeScore.correct.toString())
        .replace('{total}', typeInPracticeScore.total.toString());
      setTypeInPracticeFeedback(`${t('typeInPracticeComplete')} ${finalScoreMsg}`);
      recordPracticeSetCompletion();
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
      title: t('mistakeArchivedToastTitle'),
      description: t('mistakeArchivedToastDescription'),
    });
  };

  const currentMcPracticeWord = practiceWords[currentMcPracticeIndex];

  const handleMcOptionSelect = (option: VocabularyWord) => {
    if (isMcPracticeSubmitted) return;
    setSelectedMcOption(option);
  };

  const handleCheckMcPracticeAnswer = () => {
    if (!currentMcPracticeWord || !selectedMcOption) return;
    if (selectedMcOption.translation === currentMcPracticeWord.translation) {
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
      // setupMcPracticeExercise is called via useEffect
    } else {
      const finalScoreMsg = t('mcPracticeScoreMessage')
        .replace('{correct}', mcPracticeScore.correct.toString())
        .replace('{total}', mcPracticeScore.total.toString());
      setMcPracticeFeedback(`${t('mcPracticeComplete')} ${finalScoreMsg}`);
      recordPracticeSetCompletion();
    }
  };

  const handleRestartMcPractice = () => {
    setCurrentMcPracticeIndex(0);
    setMcPracticeScore(prev => ({ ...prev, correct: 0 })); 
    // setupMcPracticeExercise is called via useEffect
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
      title: t('mistakeArchivedToastTitle'),
      description: t('mistakeArchivedToastDescription'),
    });
  };


  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="topic">{t('topicLabel')}</Label>
              <Input id="topic" placeholder={t('topicPlaceholder')} {...register("topic")} />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isAiLoading} className="w-full md:w-auto">
              {isAiLoading && <LoadingSpinner size={16} className="mr-2" />}
              {t('getWordsButton')}
            </Button>
          </CardFooter>
        </form>
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
              {vocabularyResult && vocabularyResult.words && vocabularyResult.words.length > 0 && (
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
                    className="min-h-[250px] flex flex-col items-center justify-center p-6 text-center shadow-lg border border-border/70 hover:shadow-primary/20 transition-shadow duration-300"
                >
                  {!isCardRevealed ? (
                    <>
                      <h3 className="text-3xl md:text-4xl font-semibold text-primary break-all mb-6">
                        {currentWordData.word}
                      </h3>
                      <Button onClick={() => setIsCardRevealed(true)} size="lg">
                        <Eye className="mr-2 h-5 w-5" /> {t('showDetailsButton')}
                      </Button>
                    </>
                  ) : (
                    <div className="w-full text-left space-y-3">
                       <div className="flex justify-between items-start">
                        <h3 className="text-2xl md:text-3xl font-semibold text-primary break-all">
                          {currentWordData.word}
                          <span className="text-sm font-normal text-muted-foreground ml-2">({userData.settings?.targetLanguage})</span>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCardRevealed(false)}
                          className="whitespace-nowrap shrink-0 ml-2"
                        >
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
                        (typeInPracticeFeedback === t('typeInFeedbackCorrect') ? 
                            'border-green-500 focus-visible:ring-green-500 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 
                            'border-red-500 focus-visible:ring-red-500 bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )
                      )}
                    />
                  </div>
                  
                  {!isTypeInPracticeSubmitted && (
                    <Button onClick={handleToggleTypeInPracticeHint} variant="link" size="sm" className="p-0 h-auto text-xs">
                        <Lightbulb className="h-3 w-3 mr-1"/>
                        {showTypeInPracticeHint ? t('hideTypeInPracticeHintButton') : t('showTypeInPracticeHintButton')} 
                    </Button>
                  )}

                  {showTypeInPracticeHint && !isTypeInPracticeSubmitted && currentTypeInPracticeWord && (
                     <p className="text-sm mt-1 text-muted-foreground bg-background p-2 rounded-md shadow-sm">
                        {t('typeInHintLabel')}: <span className="font-semibold text-primary">{currentTypeInPracticeWord.translation.charAt(0)}...</span>
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
                    {isTypeInPracticeSubmitted && typeInPracticeFeedback !== t('typeInFeedbackCorrect') && !isCurrentTypeInPracticeMistakeArchived && (
                       <Button variant="outline" size="sm" onClick={handleArchiveTypeInPracticeMistake} className="text-xs">
                          <Archive className="mr-1.5 h-3.5 w-3.5" />
                          {t('archiveMistakeButton')}
                       </Button>
                    )}
                  </div>

                   {typeInPracticeFeedback && !typeInPracticeFeedback.startsWith(t('typeInPracticeComplete')) && (
                    <p className={cn(
                        "text-sm mt-2 flex items-center gap-1",
                        typeInPracticeFeedback === t('typeInFeedbackCorrect') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {typeInPracticeFeedback === t('typeInFeedbackCorrect') ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {typeInPracticeFeedback}
                    </p>
                  )}
                </div>
              ) : ( // This part handles the completion message for Type-In practice
                 <div className="text-center p-4 flex flex-col items-center gap-3">
                    <PartyPopper className="h-12 w-12 text-primary" />
                    <p className="text-lg font-semibold text-primary">
                        {typeInPracticeFeedback.startsWith(t('typeInPracticeComplete')) ? t('typeInPracticeComplete') : typeInPracticeFeedback}
                    </p>
                    {typeInPracticeFeedback.startsWith(t('typeInPracticeComplete')) && (
                        <p className="text-muted-foreground">
                            {t('typeInPracticeScoreMessage')
                                .replace('{correct}', typeInPracticeScore.correct.toString())
                                .replace('{total}', typeInPracticeScore.total.toString())}
                        </p>
                    )}
                    <Button onClick={handleRestartTypeInPractice} variant="outline">
                        {t('typeInPracticeAgainButton')}
                    </Button>
                 </div>
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
                      const isCorrect = currentMcPracticeWord.translation === option.translation;
                      
                      let buttonClassName = "justify-start text-left h-auto py-2 transition-colors duration-200";

                      if (isMcPracticeSubmitted) {
                        if (isCorrect) {
                           buttonClassName = cn(buttonClassName, "bg-green-500/20 border-green-500 text-green-700 hover:bg-green-500/30 dark:bg-green-700/30 dark:text-green-400 dark:border-green-600");
                        } else if (isSelected && !isCorrect) {
                           buttonClassName = cn(buttonClassName, "bg-red-500/20 border-red-500 text-red-700 hover:bg-red-500/30 dark:bg-red-700/30 dark:text-red-400 dark:border-red-600");
                        } else {
                           buttonClassName = cn(buttonClassName, "border-border opacity-60");
                        }
                      } else if (isSelected) {
                         buttonClassName = cn(buttonClassName, "bg-primary/20 border-primary text-primary hover:bg-primary/30");
                      } else {
                         buttonClassName = cn(buttonClassName, "border-border");
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
                    {!isMcPracticeSubmitted && (
                      <Button onClick={handleCheckMcPracticeAnswer} disabled={!selectedMcOption}>
                        {t('practiceCheckMcButton')}
                      </Button>
                    )}
                    {isMcPracticeSubmitted && currentMcPracticeIndex < practiceWords.length - 1 && (
                      <Button onClick={handleNextMcPracticeExercise}>
                        {t('practiceNextMcButton')}
                      </Button>
                    )}
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
                      {mcPracticeFeedback === t('mcFeedbackIncorrect') && currentMcPracticeWord && 
                        <span className="ml-1">{t('typeInFeedbackIncorrectPrefix')} {currentMcPracticeWord.translation}</span>
                      }
                    </p>
                  )}
                </div>
              ) : ( // This part handles the completion message for MC practice
                 <div className="text-center p-4 flex flex-col items-center gap-3">
                    <PartyPopper className="h-12 w-12 text-primary" />
                     <p className="text-lg font-semibold text-primary">
                        {mcPracticeFeedback.startsWith(t('mcPracticeComplete')) ? t('mcPracticeComplete') : mcPracticeFeedback}
                    </p>
                    {mcPracticeFeedback.startsWith(t('mcPracticeComplete')) && (
                        <p className="text-muted-foreground">
                            {t('mcPracticeScoreMessage')
                                .replace('{correct}', mcPracticeScore.correct.toString())
                                .replace('{total}', mcPracticeScore.total.toString())}
                        </p>
                    )}
                    <Button onClick={handleRestartMcPractice} variant="outline">
                        {t('practiceAgainMcButton')}
                    </Button>
                 </div>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
    
