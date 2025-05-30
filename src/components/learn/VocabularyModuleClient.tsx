
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
import { FileText, Sparkles, Languages, MessageSquareText, ArrowLeft, ArrowRight } from "lucide-react";
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from "@/lib/types";
import { interfaceLanguageCodes } from "@/lib/types";

const vocabularySchema = z.object({
  topic: z.string().min(3, "Topic should be at least 3 characters"),
});

type VocabularyFormData = z.infer<typeof vocabularySchema>;

const baseEnTranslations: Record<string, string> = {
  title: "Vocabulary Builder",
  description: "Enter a topic and our AI will generate a list of relevant words, their translations, and example sentences, tailored to your proficiency level. Use the flashcards below to study them.",
  topicLabel: "Topic for Vocabulary",
  topicPlaceholder: "E.g., Travel, Food, Business",
  getWordsButton: "Get Words",
  resultsTitlePrefix: "Vocabulary Flashcards for:",
  wordHeader: "Word",
  translationHeader: "Translation",
  exampleSentenceHeader: "Example Sentence",
  noWordsGenerated: "No words were generated for this topic. Try a different one.",
  toastSuccessTitle: "Vocabulary List Generated!",
  toastSuccessDescriptionTemplate: "Word list for \"{topic}\" is ready.",
  toastErrorTitle: "Error",
  toastErrorDescription: "Failed to generate vocabulary. Please try again.",
  onboardingMissing: "Please complete onboarding first to set your languages and proficiency.",
  loading: "Loading...",
  noExampleSentence: "No example sentence provided.",
  previousButton: "Previous",
  nextButton: "Next",
  showAnswerButton: "Show Answer",
  hideAnswerButton: "Hide Answer",
  currentCardOfTotal: "Card {current} of {total}",
  noWordsForFlashcards: "No words generated for this topic to display as flashcards.",
};

const baseRuTranslations: Record<string, string> = {
  title: "Конструктор словарного запаса",
  description: "Введите тему, и наш ИИ сгенерирует список соответствующих слов, их переводы и примеры предложений, адаптированные к вашему уровню. Используйте карточки ниже для их изучения.",
  topicLabel: "Тема для словарного запаса",
  topicPlaceholder: "Напр., Путешествия, Еда, Бизнес",
  getWordsButton: "Получить слова",
  resultsTitlePrefix: "Карточки со словами по теме:",
  wordHeader: "Слово",
  translationHeader: "Перевод",
  exampleSentenceHeader: "Пример предложения",
  noWordsGenerated: "Для этой темы слова не были сгенерированы. Попробуйте другую.",
  toastSuccessTitle: "Список слов создан!",
  toastSuccessDescriptionTemplate: "Список слов для темы \"{topic}\" готов.",
  toastErrorTitle: "Ошибка",
  toastErrorDescription: "Не удалось создать список слов. Пожалуйста, попробуйте снова.",
  onboardingMissing: "Пожалуйста, сначала завершите онбординг, чтобы установить языки и уровень.",
  loading: "Загрузка...",
  noExampleSentence: "Пример предложения не предоставлен.",
  previousButton: "Назад",
  nextButton: "Вперед",
  showAnswerButton: "Показать ответ",
  hideAnswerButton: "Скрыть ответ",
  currentCardOfTotal: "Карточка {current} из {total}",
  noWordsForFlashcards: "Для этой темы не сгенерировано слов для отображения в виде карточек.",
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
    try {
      const flowInput: GenerateVocabularyInput = {
        interfaceLanguage: userData.settings!.interfaceLanguage,
        targetLanguage: userData.settings!.targetLanguage,
        proficiencyLevel: userData.settings!.proficiencyLevel,
        topic: data.topic,
      };

      const result = await generateVocabulary(flowInput);
      setVocabularyResult(result);
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
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {t('resultsTitlePrefix')} {currentTopic}
            </CardTitle>
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
                  className="min-h-[200px] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setIsCardRevealed(!isCardRevealed)}
                >
                  <h3 className="text-3xl font-semibold text-primary mb-3">
                    {currentWordData.word}
                    <span className="text-sm font-normal text-muted-foreground ml-2">({userData.settings?.targetLanguage})</span>
                  </h3>
                  {isCardRevealed && (
                    <div className="space-y-3 text-left w-full">
                      <div className="border-t pt-3">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          <strong>{t('translationHeader')}:</strong> {currentWordData.translation} ({userData.settings?.interfaceLanguage})
                        </p>
                      </div>
                      {currentWordData.exampleSentence && (
                        <div className="border-t pt-3">
                            <p className="text-sm italic text-muted-foreground/80 flex items-start gap-2">
                            <MessageSquareText className="h-4 w-4 mt-0.5 shrink-0" />
                            <span><strong>{t('exampleSentenceHeader')}:</strong> {currentWordData.exampleSentence}</span>
                            </p>
                        </div>
                      )}
                      {!currentWordData.exampleSentence && (
                         <div className="border-t pt-3">
                            <p className="text-sm text-muted-foreground italic flex items-start gap-2">
                                <MessageSquareText className="h-4 w-4 mt-0.5 shrink-0" />
                                {t('noExampleSentence')}
                            </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                <div className="flex justify-between items-center mt-4">
                  <Button onClick={handlePrevCard} variant="outline" disabled={!vocabularyResult.words || vocabularyResult.words.length <= 1}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('previousButton')}
                  </Button>
                  <Button onClick={() => setIsCardRevealed(!isCardRevealed)} variant="secondary" className="w-1/3">
                    {isCardRevealed ? t('hideAnswerButton') : t('showAnswerButton')}
                  </Button>
                  <Button onClick={handleNextCard} variant="outline" disabled={!vocabularyResult.words || vocabularyResult.words.length <= 1}>
                    {t('nextButton')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('noWordsForFlashcards')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    