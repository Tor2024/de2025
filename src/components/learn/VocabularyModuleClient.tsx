
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
import { FileText, Sparkles, Languages, MessageSquareText, XCircle, Eye, EyeOff, ArrowLeft, ArrowRight, Repeat, CheckCircle2, Lightbulb } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { interfaceLanguageCodes } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const vocabularySchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});

type VocabularyFormData = z.infer<typeof vocabularySchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Vocabulary Builder",
  description: "Enter a topic and our AI will generate a list of relevant words, their translations, and example sentences, tailored to your proficiency level. Use the flashcards below to study them, then try the practice mode.",
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
  practiceModeTitle: "Practice Mode: Type the Translation",
  practiceWordLabel: "Word:",
  practiceYourTranslationLabel: "Your Translation:",
  practiceCheckButton: "Check",
  practiceNextButton: "Next",
  feedbackCorrect: "Correct!",
  feedbackIncorrectPrefix: "Incorrect. Correct answer was:",
  practiceComplete: "Practice Complete!",
  practiceScoreMessage: "Your Score: {correct} out of {total}.",
  showPracticeHintButton: "Show Hint (First Letter)",
  hidePracticeHintButton: "Hide Hint",
  hintLabel: "Hint:",
};

const baseRuTranslations: Record<string, string> = {
  title: "Конструктор словарного запаса",
  description: "Введите тему, и наш ИИ сгенерирует список соответствующих слов, их переводы и примеры предложений, адаптированные к вашему уровню. Используйте карточки ниже для их изучения, затем попробуйте режим практики.",
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
  practiceModeTitle: "Режим практики: Введите перевод",
  practiceWordLabel: "Слово:",
  practiceYourTranslationLabel: "Ваш перевод:",
  practiceCheckButton: "Проверить",
  practiceNextButton: "Дальше",
  feedbackCorrect: "Правильно!",
  feedbackIncorrectPrefix: "Неправильно. Правильный ответ:",
  practiceComplete: "Практика завершена!",
  practiceScoreMessage: "Ваш результат: {correct} из {total}.",
  showPracticeHintButton: "Показать подсказку (первая буква)",
  hidePracticeHintButton: "Скрыть подсказку",
  hintLabel: "Подсказка:",
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
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [vocabularyResult, setVocabularyResult] = useState<GenerateVocabularyOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  // State for practice mode
  const [practiceWords, setPracticeWords] = useState<VocabularyWord[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [userPracticeAnswer, setUserPracticeAnswer] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState("");
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false);
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 });
  const [showPracticeHint, setShowPracticeHint] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<VocabularyFormData>({
    resolver: zodResolver(vocabularySchema),
  });

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    return langTranslations?.[key] || componentTranslations['en']?.[key] || defaultText || key;
  };

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
    setCurrentCardIndex(0);
    setIsCardRevealed(false);
    setPracticeWords([]);
    setCurrentPracticeIndex(0);
    setUserPracticeAnswer("");
    setPracticeFeedback("");
    setIsPracticeSubmitted(false);
    setPracticeScore({ correct: 0, total: 0 });
    setShowPracticeHint(false);

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
        setPracticeWords([...result.words]); 
        setPracticeScore(prev => ({ ...prev, total: result.words.length }));
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
    setCurrentPracticeIndex(0);
    setUserPracticeAnswer("");
    setPracticeFeedback("");
    setIsPracticeSubmitted(false);
    setPracticeScore({ correct: 0, total: 0 });
    setShowPracticeHint(false);
  };

  const handleNextCard = () => {
    if (vocabularyResult && vocabularyResult.words) {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % vocabularyResult.words.length);
      setIsCardRevealed(false);
    }
  };

  const handlePrevCard = () => {
    if (vocabularyResult && vocabularyResult.words) {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1 + vocabularyResult.words.length) % vocabularyResult.words.length);
      setIsCardRevealed(false);
    }
  };

  const currentWordData = vocabularyResult?.words?.[currentCardIndex];
  const currentPracticeWord = practiceWords[currentPracticeIndex];

  const handleUserPracticeAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserPracticeAnswer(e.target.value);
  };

  const handleCheckPractice = () => {
    if (!currentPracticeWord) return;
    const userAnswer = userPracticeAnswer.trim().toLowerCase();
    const correctAnswer = currentPracticeWord.translation.trim().toLowerCase();
    if (userAnswer === correctAnswer) {
      setPracticeFeedback(t('feedbackCorrect'));
      setPracticeScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setPracticeFeedback(`${t('feedbackIncorrectPrefix')} ${currentPracticeWord.translation}`);
    }
    setIsPracticeSubmitted(true);
    setShowPracticeHint(false); // Hide hint after submission
  };

  const handleNextPractice = () => {
    if (currentPracticeIndex < practiceWords.length - 1) {
      setCurrentPracticeIndex(prev => prev + 1);
      setUserPracticeAnswer("");
      setPracticeFeedback("");
      setIsPracticeSubmitted(false);
      setShowPracticeHint(false);
    } else {
      const finalScoreMsg = t('practiceScoreMessage')
        .replace('{correct}', practiceScore.correct.toString())
        .replace('{total}', practiceScore.total.toString());
      setPracticeFeedback(`${t('practiceComplete')} ${finalScoreMsg}`);
      // isPracticeSubmitted remains true to show final score
    }
  };
  
  const handleTogglePracticeHint = () => {
    setShowPracticeHint(prev => !prev);
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
                      <Button onClick={() => setIsCardRevealed(true)} size="lg" variant="outline">
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
                      disabled={!vocabularyResult.words || vocabularyResult.words.length <= 1}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t('previousButton')}
                    </Button>
                    <Button 
                      onClick={handleNextCard} 
                      variant="outline" 
                      disabled={!vocabularyResult.words || vocabularyResult.words.length <= 1}
                    >
                      {t('nextButton')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">{isAiLoading ? t('loading') : t('noWordsForFlashcards')}</p>
            )}
          </CardContent>

          {practiceWords.length > 0 && (
            <CardFooter className="flex-col items-start border-t mt-6 pt-6">
              <CardTitle className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Repeat className="h-6 w-6 text-primary" />
                {t('practiceModeTitle')}
              </CardTitle>
              {currentPracticeWord && currentPracticeIndex < practiceWords.length && !practiceFeedback.startsWith(t('practiceComplete')) ? (
                <div className="w-full space-y-3">
                  <p className="text-lg">
                    <span className="font-semibold">{t('practiceWordLabel')}</span> {currentPracticeWord.word}
                    <span className="text-sm text-muted-foreground ml-1">({userData.settings?.targetLanguage})</span>
                  </p>
                  <div className="space-y-1">
                    <Label htmlFor="userPracticeAnswer">{t('practiceYourTranslationLabel')} ({userData.settings?.interfaceLanguage})</Label>
                    <Input
                      id="userPracticeAnswer"
                      type="text"
                      value={userPracticeAnswer}
                      onChange={handleUserPracticeAnswerChange}
                      disabled={isPracticeSubmitted}
                      className={cn(
                        "transition-colors duration-300 ease-in-out",
                        isPracticeSubmitted && 
                        (practiceFeedback === t('feedbackCorrect') ? 
                            'border-green-500 focus-visible:ring-green-500 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 
                            'border-red-500 focus-visible:ring-red-500 bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )
                      )}
                    />
                  </div>
                  
                  {!isPracticeSubmitted && (
                    <Button onClick={handleTogglePracticeHint} variant="link" size="sm" className="p-0 h-auto text-xs">
                        <Lightbulb className="h-3 w-3 mr-1"/>
                        {showPracticeHint ? t('hidePracticeHintButton') : t('showPracticeHintButton')}
                    </Button>
                  )}

                  {showPracticeHint && !isPracticeSubmitted && currentPracticeWord && (
                     <p className="text-sm mt-1 text-muted-foreground bg-background p-2 rounded-md shadow-sm">
                        {t('hintLabel')}: <span className="font-semibold text-primary">{currentPracticeWord.translation.charAt(0)}...</span>
                    </p>
                  )}
                  
                  <div className="pt-2">
                    {!isPracticeSubmitted ? (
                      <Button onClick={handleCheckPractice} disabled={!userPracticeAnswer.trim()}>
                        {t('practiceCheckButton')}
                      </Button>
                    ) : (
                      <Button onClick={handleNextPractice}>
                        {t('practiceNextButton')}
                      </Button>
                    )}
                  </div>

                   {practiceFeedback && (
                    <p className={cn(
                        "text-sm mt-2 flex items-center gap-1",
                        practiceFeedback === t('feedbackCorrect') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {practiceFeedback === t('feedbackCorrect') ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {practiceFeedback}
                    </p>
                  )}
                </div>
              ) : (
                 <p className="text-lg font-semibold text-primary">{practiceFeedback || t('practiceComplete')}</p>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
    
