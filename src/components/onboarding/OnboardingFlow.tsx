
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUserData } from "@/contexts/UserDataContext";
import type { InterfaceLanguage, ProficiencyLevel, TargetLanguage, UserSettings } from "@/lib/types";
import { supportedLanguages, interfaceLanguageCodes, targetLanguageNames } from "@/lib/types";
import { generatePersonalizedLearningRoadmap } from "@/ai/flows/ai-learning-roadmap";
import type { GeneratePersonalizedLearningRoadmapInput } from "@/ai/flows/ai-learning-roadmap";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Zod schema: proficiencyLevel removed from direct user input validation
const onboardingSchema = z.object({
  userName: z.string().min(1, "Nickname is required"),
  interfaceLanguage: z.enum(interfaceLanguageCodes, { required_error: "Interface language is required" }),
  targetLanguage: z.enum(targetLanguageNames, { required_error: "Target language is required" }),
  // proficiencyLevel is no longer part of the form data to be validated from user input here
  goal: z.string().min(10, "Goal should be at least 10 characters").max(200, "Goal should be at most 200 characters"),
});

// OnboardingFormData: proficiencyLevel removed
type OnboardingFormData = Omit<z.infer<typeof onboardingSchema>, 'proficiencyLevel'>;


// Basic translation structure
const translations: Record<InterfaceLanguage, Record<string, string>> = {
  en: {
    step1Title: "Welcome to LinguaLab!",
    step2Title: "Your Learning Focus",
    step3Title: "Define Your Goal",
    nicknameLabel: "Your Nickname",
    nicknamePlaceholder: "E.g., Alex",
    interfaceLanguageLabel: "Interface Language",
    interfaceLanguagePlaceholder: "Select language",
    targetLanguageLabel: "Target Language",
    targetLanguagePlaceholder: "Select language to learn",
    goalLabel: "Your Personal Goal",
    goalPlaceholder: "E.g., Pass B2 TELC exam, Speak fluently with colleagues...",
    previousButton: "Previous",
    nextButton: "Next",
    submitButton: "Generate My Plan & Start Learning!",
    stepDescription: "Step {current} of {total}",
  },
  ru: {
    step1Title: "Добро пожаловать в LinguaLab!",
    step2Title: "Ваш фокус обучения",
    step3Title: "Определите вашу цель",
    nicknameLabel: "Ваш псевдоним",
    nicknamePlaceholder: "Напр., Алекс",
    interfaceLanguageLabel: "Язык интерфейса",
    interfaceLanguagePlaceholder: "Выберите язык",
    targetLanguageLabel: "Изучаемый язык",
    targetLanguagePlaceholder: "Выберите язык для изучения",
    goalLabel: "Ваша личная цель",
    goalPlaceholder: "Напр., Сдать экзамен B2 TELC, Свободно говорить с коллегами...",
    previousButton: "Назад",
    nextButton: "Далее",
    submitButton: "Создать мой план и начать обучение!",
    stepDescription: "Шаг {current} из {total}",
  },
  de: {
    step1Title: "Willkommen bei LinguaLab!",
    step2Title: "Dein Lernfokus",
    step3Title: "Definiere dein Ziel",
    nicknameLabel: "Dein Spitzname",
    nicknamePlaceholder: "Z.B. Alex",
    interfaceLanguageLabel: "Oberflächensprache",
    interfaceLanguagePlaceholder: "Sprache auswählen",
    targetLanguageLabel: "Zielsprache",
    targetLanguagePlaceholder: "Zu lernende Sprache auswählen",
    goalLabel: "Dein persönliches Ziel",
    goalPlaceholder: "Z.B. B2 TELC Prüfung bestehen, Fließend mit Kollegen sprechen...",
    previousButton: "Zurück",
    nextButton: "Weiter",
    submitButton: "Meinen Plan erstellen & Lernen starten!",
    stepDescription: "Schritt {current} von {total}",
   },
  es: {
    step1Title: "¡Bienvenido a LinguaLab!",
    step2Title: "Tu enfoque de aprendizaje",
    step3Title: "Define tu objetivo",
    nicknameLabel: "Tu apodo",
    nicknamePlaceholder: "Ej. Alex",
    interfaceLanguageLabel: "Idioma de la interfaz",
    interfaceLanguagePlaceholder: "Selecciona el idioma",
    targetLanguageLabel: "Idioma de destino",
    targetLanguagePlaceholder: "Selecciona el idioma a aprender",
    goalLabel: "Tu objetivo personal",
    goalPlaceholder: "Ej. Aprobar el examen B2 TELC, Hablar con fluidez con colegas...",
    previousButton: "Anterior",
    nextButton: "Siguiente",
    submitButton: "¡Generar mi plan y empezar a aprender!",
    stepDescription: "Paso {current} de {total}",
   },
  fr: {
    step1Title: "Bienvenue chez LinguaLab !",
    step2Title: "Votre objectif d'apprentissage",
    step3Title: "Définissez votre objectif",
    nicknameLabel: "Votre pseudo",
    nicknamePlaceholder: "Ex. Alex",
    interfaceLanguageLabel: "Langue de l'interface",
    interfaceLanguagePlaceholder: "Sélectionner la langue",
    targetLanguageLabel: "Langue cible",
    targetLanguagePlaceholder: "Sélectionner la langue à apprendre",
    goalLabel: "Votre objectif personnel",
    goalPlaceholder: "Ex. Réussir l'examen B2 TELC, Parler couramment avec des collègues...",
    previousButton: "Précédent",
    nextButton: "Suivant",
    submitButton: "Générer mon plan et commencer à apprendre !",
    stepDescription: "Étape {current} sur {total}",
   },
  it: {
    step1Title: "Benvenuto in LinguaLab!",
    step2Title: "Il tuo focus di apprendimento",
    step3Title: "Definisci il tuo obiettivo",
    nicknameLabel: "Il tuo nickname",
    nicknamePlaceholder: "Es. Alex",
    interfaceLanguageLabel: "Lingua interfaccia",
    interfaceLanguagePlaceholder: "Seleziona lingua",
    targetLanguageLabel: "Lingua di destinazione",
    targetLanguagePlaceholder: "Seleziona la lingua da imparare",
    goalLabel: "Il tuo obiettivo personale",
    goalPlaceholder: "Es. Superare l'esame B2 TELC, Parlare fluentemente con i colleghi...",
    previousButton: "Precedente",
    nextButton: "Successivo",
    submitButton: "Genera il mio piano e inizia a imparare!",
    stepDescription: "Passaggio {current} di {total}",
   },
  nl: {
    step1Title: "Welkom bij LinguaLab!",
    step2Title: "Jouw leerfocus",
    step3Title: "Definieer je doel",
    nicknameLabel: "Jouw bijnaam",
    nicknamePlaceholder: "Bijv. Alex",
    interfaceLanguageLabel: "Interfacetaal",
    interfaceLanguagePlaceholder: "Selecteer taal",
    targetLanguageLabel: "Doeltaal",
    targetLanguagePlaceholder: "Selecteer taal om te leren",
    goalLabel: "Jouw persoonlijke doel",
    goalPlaceholder: "Bijv. B2 TELC examen halen, Vloeiend spreken met collega's...",
    previousButton: "Vorige",
    nextButton: "Volgende",
    submitButton: "Mijn plan genereren & beginnen met leren!",
    stepDescription: "Stap {current} van {total}",
   },
  fi: {
    step1Title: "Tervetuloa LinguaLabiin!",
    step2Title: "Oppimisesi painopiste",
    step3Title: "Määritä tavoitteesi",
    nicknameLabel: "Lempinimesi",
    nicknamePlaceholder: "Esim. Alex",
    interfaceLanguageLabel: "Käyttöliittymän kieli",
    interfaceLanguagePlaceholder: "Valitse kieli",
    targetLanguageLabel: "Kohdekieli",
    targetLanguagePlaceholder: "Valitse opiskeltava kieli",
    goalLabel: "Henkilökohtainen tavoitteesi",
    goalPlaceholder: "Esim. Läpäise B2 TELC -tentti, Puhu sujuvasti kollegoiden kanssa...",
    previousButton: "Edellinen",
    nextButton: "Seuraava",
    submitButton: "Luo suunnitelmani & aloita oppiminen!",
    stepDescription: "Vaihe {current}/{total}",
   },
  zh: {
    step1Title: "欢迎来到 LinguaLab！",
    step2Title: "您的学习重点",
    step3Title: "明确您的目标",
    nicknameLabel: "您的昵称",
    nicknamePlaceholder: "例如：Alex",
    interfaceLanguageLabel: "界面语言",
    interfaceLanguagePlaceholder: "选择语言",
    targetLanguageLabel: "目标语言",
    targetLanguagePlaceholder: "选择要学习的语言",
    goalLabel: "您的个人目标",
    goalPlaceholder: "例如：通过 B2 TELC 考试，与同事流利交谈...",
    previousButton: "上一步",
    nextButton: "下一步",
    submitButton: "生成我的计划并开始学习！",
    stepDescription: "第 {current} 步，共 {total} 步",
   },
  hi: {
    step1Title: "लिंग्वालैब में आपका स्वागत है!",
    step2Title: "आपका सीखने का फोकस",
    step3Title: "अपना लक्ष्य परिभाषित करें",
    nicknameLabel: "आपका उपनाम",
    nicknamePlaceholder: "जैसे, एलेक्स",
    interfaceLanguageLabel: "इंटरफ़ेस भाषा",
    interfaceLanguagePlaceholder: "भाषा चुनें",
    targetLanguageLabel: "लक्ष्य भाषा",
    targetLanguagePlaceholder: "सीखने के लिए भाषा चुनें",
    goalLabel: "आपका व्यक्तिगत लक्ष्य",
    goalPlaceholder: "जैसे, बी2 टीईएलसी परीक्षा उत्तीर्ण करें, सहकर्मियों के साथ धाराप्रवाह बोलें...",
    previousButton: "पिछला",
    nextButton: "अगला",
    submitButton: "मेरी योजना बनाएं और सीखना शुरू करें!",
    stepDescription: "चरण {current} का {total}",
   },
  no: {
    step1Title: "Velkommen til LinguaLab!",
    step2Title: "Ditt læringsfokus",
    step3Title: "Definer målet ditt",
    nicknameLabel: "Ditt kallenavn",
    nicknamePlaceholder: "F.eks. Alex",
    interfaceLanguageLabel: "Grensesnittspråk",
    interfaceLanguagePlaceholder: "Velg språk",
    targetLanguageLabel: "Målspråk",
    targetLanguagePlaceholder: "Velg språk å lære",
    goalLabel: "Ditt personlige mål",
    goalPlaceholder: "F.eks. Bestå B2 TELC-eksamen, Snakke flytende med kolleger...",
    previousButton: "Forrige",
    nextButton: "Neste",
    submitButton: "Generer min plan & begynn å lære!",
    stepDescription: "Trinn {current} av {total}",
   },
  hu: {
    step1Title: "Üdvözöljük a LinguaLab-ban!",
    step2Title: "A tanulási fókuszod",
    step3Title: "Határozd meg a célodat",
    nicknameLabel: "Beceneved",
    nicknamePlaceholder: "Pl. Alex",
    interfaceLanguageLabel: "Felület nyelve",
    interfaceLanguagePlaceholder: "Válassz nyelvet",
    targetLanguageLabel: "Célnyelv",
    targetLanguagePlaceholder: "Válaszd ki a tanulni kívánt nyelvet",
    goalLabel: "Személyes célod",
    goalPlaceholder: "Pl. B2 TELC vizsga letétele, Folyékonyan beszélni a kollégákkal...",
    previousButton: "Előző",
    nextButton: "Következő",
    submitButton: "Tervem létrehozása & Tanulás megkezdése!",
    stepDescription: "{current}. lépés / {total}",
   },
  da: {
    step1Title: "Velkommen til LinguaLab!",
    step2Title: "Dit læringsfokus",
    step3Title: "Definer dit mål",
    nicknameLabel: "Dit kaldenavn",
    nicknamePlaceholder: "F.eks. Alex",
    interfaceLanguageLabel: "Grænsefladesprog",
    interfaceLanguagePlaceholder: "Vælg sprog",
    targetLanguageLabel: "Målsprog",
    targetLanguagePlaceholder: "Vælg sprog at lære",
    goalLabel: "Dit personlige mål",
    goalPlaceholder: "F.eks. Bestå B2 TELC-eksamen, Tale flydende med kolleger...",
    previousButton: "Forrige",
    nextButton: "Næste",
    submitButton: "Generer min plan & start med at lære!",
    stepDescription: "Trin {current} af {total}",
   },
  ko: {
    step1Title: "LinguaLab에 오신 것을 환영합니다!",
    step2Title: "학습 초점",
    step3Title: "목표 정의",
    nicknameLabel: "닉네임",
    nicknamePlaceholder: "예: Alex",
    interfaceLanguageLabel: "인터페이스 언어",
    interfaceLanguagePlaceholder: "언어 선택",
    targetLanguageLabel: "목표 언어",
    targetLanguagePlaceholder: "학습할 언어 선택",
    goalLabel: "개인 목표",
    goalPlaceholder: "예: B2 TELC 시험 합격, 동료와 유창하게 대화하기...",
    previousButton: "이전",
    nextButton: "다음",
    submitButton: "내 계획 생성 및 학습 시작!",
    stepDescription: "{total}단계 중 {current}단계",
   },
  bg: {
    step1Title: "Добре дошли в LinguaLab!",
    step2Title: "Вашият фокус на обучение",
    step3Title: "Определете целта си",
    nicknameLabel: "Вашият псевдоним",
    nicknamePlaceholder: "Напр. Алекс",
    interfaceLanguageLabel: "Език на интерфейса",
    interfaceLanguagePlaceholder: "Изберете език",
    targetLanguageLabel: "Целеви език",
    targetLanguagePlaceholder: "Изберете език за учене",
    goalLabel: "Вашата лична цел",
    goalPlaceholder: "Напр. Да взема изпит B2 TELC, Да говоря свободно с колеги...",
    previousButton: "Предишен",
    nextButton: "Следващ",
    submitButton: "Генерирай моя план и започни да учиш!",
    stepDescription: "Стъпка {current} от {total}",
   },
  sl: {
    step1Title: "Dobrodošli v LinguaLab!",
    step2Title: "Vaš fokus učenja",
    step3Title: "Določite svoj cilj",
    nicknameLabel: "Vaš vzdevek",
    nicknamePlaceholder: "Npr. Alex",
    interfaceLanguageLabel: "Jezik vmesnika",
    interfaceLanguagePlaceholder: "Izberite jezik",
    targetLanguageLabel: "Ciljni jezik",
    targetLanguagePlaceholder: "Izberite jezik za učenje",
    goalLabel: "Vaš osebni cilj",
    goalPlaceholder: "Npr. Opraviti izpit B2 TELC, Tekoče govoriti s sodelavci...",
    previousButton: "Nazaj",
    nextButton: "Naprej",
    submitButton: "Ustvari moj načrt & Začni z učenjem!",
    stepDescription: "Korak {current} od {total}",
   },
  uk: {
    step1Title: "Ласкаво просимо до LinguaLab!",
    step2Title: "Ваш фокус навчання",
    step3Title: "Визначте вашу мету",
    nicknameLabel: "Ваш псевдонім",
    nicknamePlaceholder: "Напр., Алекс",
    interfaceLanguageLabel: "Мова інтерфейсу",
    interfaceLanguagePlaceholder: "Оберіть мову",
    targetLanguageLabel: "Цільова мова",
    targetLanguagePlaceholder: "Оберіть мову для вивчення",
    goalLabel: "Ваша особиста мета",
    goalPlaceholder: "Напр., Скласти іспит B2 TELC, Вільно спілкуватися з колегами...",
    previousButton: "Назад",
    nextButton: "Далі",
    submitButton: "Створити мій план і почати навчання!",
    stepDescription: "Крок {current} з {total}",
   },
  be: {
    step1Title: "Вітаем у LinguaLab!",
    step2Title: "Ваш фокус навучання",
    step3Title: "Вызначце вашу мэту",
    nicknameLabel: "Ваш псеўданім",
    nicknamePlaceholder: "Напр., Алекс",
    interfaceLanguageLabel: "Мова інтэрфейсу",
    interfaceLanguagePlaceholder: "Абярыце мову",
    targetLanguageLabel: "Мэтавая мова",
    targetLanguagePlaceholder: "Абярыце мову для вывучэння",
    goalLabel: "Ваша асабістая мэта",
    goalPlaceholder: "Напр., Здаць экзамен B2 TELC, Вольна размаўляць з калегамі...",
    previousButton: "Назад",
    nextButton: "Далей",
    submitButton: "Стварыць мой план і пачаць навучанне!",
    stepDescription: "Крок {current} з {total}",
   },
  pl: {
    step1Title: "Witamy w LinguaLab!",
    step2Title: "Twój cel nauki",
    step3Title: "Określ swój cel",
    nicknameLabel: "Twój pseudonim",
    nicknamePlaceholder: "Np. Alex",
    interfaceLanguageLabel: "Język interfejsu",
    interfaceLanguagePlaceholder: "Wybierz język",
    targetLanguageLabel: "Język docelowy",
    targetLanguagePlaceholder: "Wybierz język do nauki",
    goalLabel: "Twój osobisty cel",
    goalPlaceholder: "Np. Zdać egzamin B2 TELC, Płynnie rozmawiać z kolegami...",
    previousButton: "Poprzedni",
    nextButton: "Następny",
    submitButton: "Wygeneruj mój plan i zacznij naukę!",
    stepDescription: "Krok {current} z {total}",
   },
  ro: {
    step1Title: "Bun venit la LinguaLab!",
    step2Title: "Focusul tău de învățare",
    step3Title: "Definește-ți obiectivul",
    nicknameLabel: "Pseudonimul tău",
    nicknamePlaceholder: "Ex. Alex",
    interfaceLanguageLabel: "Limba interfeței",
    interfaceLanguagePlaceholder: "Selectează limba",
    targetLanguageLabel: "Limba țintă",
    targetLanguagePlaceholder: "Selectează limba de învățat",
    goalLabel: "Obiectivul tău personal",
    goalPlaceholder: "Ex. Trecerea examenului B2 TELC, Vorbirea fluentă cu colegii...",
    previousButton: "Anterior",
    nextButton: "Următor",
    submitButton: "Generează planul meu și începe să înveți!",
    stepDescription: "Pasul {current} din {total}",
   },
  ja: {
    step1Title: "LinguaLabへようこそ！",
    step2Title: "学習の焦点",
    step3Title: "目標を定義する",
    nicknameLabel: "ニックネーム",
    nicknamePlaceholder: "例：アレックス",
    interfaceLanguageLabel: "インターフェース言語",
    interfaceLanguagePlaceholder: "言語を選択",
    targetLanguageLabel: "ターゲット言語",
    targetLanguagePlaceholder: "学習する言語を選択",
    goalLabel: "個人的な目標",
    goalPlaceholder: "例：B2 TELC試験に合格する、同僚と流暢に話す...",
    previousButton: "前へ",
    nextButton: "次へ",
    submitButton: "私のプランを生成して学習を開始！",
    stepDescription: "ステップ {current}/{total}",
   },
  ar: {
    step1Title: "أهلاً بك في LinguaLab!",
    step2Title: "تركيز تعلمك",
    step3Title: "حدد هدفك",
    nicknameLabel: "اسمك المستعار",
    nicknamePlaceholder: "مثال: أليكس",
    interfaceLanguageLabel: "لغة الواجهة",
    interfaceLanguagePlaceholder: "اختر اللغة",
    targetLanguageLabel: "اللغة الهدف",
    targetLanguagePlaceholder: "اختر اللغة التي ترغب بتعلمها",
    goalLabel: "هدفك الشخصي",
    goalPlaceholder: "مثال: اجتياز امتحان B2 TELC، التحدث بطلاقة مع الزملاء...",
    previousButton: "السابق",
    nextButton: "التالي",
    submitButton: "أنشئ خطتي وابدأ التعلم!",
    stepDescription: "الخطوة {current} من {total}",
   },
};


export function OnboardingFlow() {
  const { updateSettings, setLearningRoadmap } = useUserData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uiLang, setUiLang] = useState<InterfaceLanguage>('en'); // Default to English

  const { register, handleSubmit, control, trigger, formState: { errors, isValid }, watch } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
  });

  const selectedInterfaceLanguage = watch("interfaceLanguage");
  useEffect(() => {
    if (selectedInterfaceLanguage && selectedInterfaceLanguage !== uiLang) {
      setUiLang(selectedInterfaceLanguage);
    }
  }, [selectedInterfaceLanguage, uiLang]);

  const currentTranslations = translations[uiLang] || translations.en;

  const steps = [
    { id: 1, titleKey: "step1Title", fields: ["userName", "interfaceLanguage"] },
    { id: 2, titleKey: "step2Title", fields: ["targetLanguage"] }, // proficiencyLevel removed from fields
    { id: 3, titleKey: "step3Title", fields: ["goal"] },
  ];

  const handleNext = async () => {
    const currentFields = steps[currentStep].fields as Array<keyof OnboardingFormData>;
    const isValidStep = await trigger(currentFields);
    if (isValidStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
    setIsLoading(true);
    try {
      const userSettings: UserSettings = {
        userName: data.userName,
        interfaceLanguage: data.interfaceLanguage,
        targetLanguage: data.targetLanguage,
        proficiencyLevel: 'A1-A2', // Default proficiency level
        goal: data.goal,
      };
      updateSettings(userSettings);

      const roadmapInput: GeneratePersonalizedLearningRoadmapInput = {
        interfaceLanguage: data.interfaceLanguage,
        targetLanguage: data.targetLanguage,
        proficiencyLevel: 'A1-A2', // Pass default/starting proficiency
        personalGoal: data.goal,
      };
      const roadmapOutput = await generatePersonalizedLearningRoadmap(roadmapInput);

      const MAX_ROADMAP_LENGTH = 50000; // Approx 50KB as a safe limit for localStorage
      let roadmapToStore = roadmapOutput.roadmap;
      if (roadmapToStore.length > MAX_ROADMAP_LENGTH) {
        console.warn(`Roadmap too long (${roadmapToStore.length} chars), truncating for localStorage.`);
        roadmapToStore = roadmapOutput.roadmap.substring(0, MAX_ROADMAP_LENGTH) + "\n\n... (план был сокращен из-за большого размера)";
      }
      setLearningRoadmap({ rawContent: roadmapToStore });

      toast({
        title: currentTranslations.submitButton || "Setup Complete!", // Use translated title
        description: currentTranslations.stepDescription?.replace("{current}", (steps.length).toString()).replace("{total}", (steps.length).toString()) || "Your personalized learning roadmap has been generated.",
      });
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const stepConfig = steps[currentStep];
    return (
      <>
        {stepConfig.fields.includes("userName") && (
          <div className="space-y-2">
            <Label htmlFor="userName">{currentTranslations.nicknameLabel || "Your Nickname"}</Label>
            <Input id="userName" placeholder={currentTranslations.nicknamePlaceholder || "E.g., Alex"} {...register("userName")} />
            {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
          </div>
        )}
        {stepConfig.fields.includes("interfaceLanguage") && (
          <div className="space-y-2">
            <Label htmlFor="interfaceLanguage">{currentTranslations.interfaceLanguageLabel || "Interface Language"}</Label>
            <Controller
              name="interfaceLanguage"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setUiLang(value as InterfaceLanguage);
                  }}
                  defaultValue={field.value}
                >
                  <SelectTrigger id="interfaceLanguage">
                    <SelectValue placeholder={currentTranslations.interfaceLanguagePlaceholder || "Select language"} />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.interfaceLanguage && <p className="text-sm text-destructive">{errors.interfaceLanguage.message}</p>}
          </div>
        )}
        {stepConfig.fields.includes("targetLanguage") && (
          <div className="space-y-2">
            <Label htmlFor="targetLanguage">{currentTranslations.targetLanguageLabel || "Target Language"}</Label>
             <Controller name="targetLanguage" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="targetLanguage">
                    <SelectValue placeholder={currentTranslations.targetLanguagePlaceholder || "Select language to learn"} />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map(lang => (
                      <SelectItem key={lang.name} value={lang.name}>
                        {lang.nativeName} ({lang.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            {errors.targetLanguage && <p className="text-sm text-destructive">{errors.targetLanguage.message}</p>}
          </div>
        )}
        {/* Proficiency Level select removed from here */}
        {stepConfig.fields.includes("goal") && (
          <div className="space-y-2">
            <Label htmlFor="goal">{currentTranslations.goalLabel || "Your Personal Goal"}</Label>
            <Textarea
              id="goal"
              placeholder={currentTranslations.goalPlaceholder || "E.g., Pass B2 TELC exam, Speak fluently with colleagues..."}
              {...register("goal")}
              className="min-h-[100px]"
            />
            {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
          </div>
        )}
      </>
    )
  };

  const stepTitle = currentTranslations[steps[currentStep].titleKey] || `Step ${currentStep + 1} Title`;
  const stepDescription = (currentTranslations.stepDescription || "Step {current} of {total}")
    .replace("{current}", (currentStep + 1).toString())
    .replace("{total}", steps.length.toString());

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{stepTitle}</span>
          </CardTitle>
          <CardDescription className="text-center">
            {stepDescription}
          </CardDescription>
           <div className="w-full bg-muted rounded-full h-1.5 mt-2">
             <div className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
           </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {renderStepContent()}
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrev} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {currentTranslations.previousButton || "Previous"}
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext} disabled={isLoading} className="ml-auto">
                {currentTranslations.nextButton || "Next"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="submit" disabled={isLoading || !isValid} className="ml-auto w-full md:w-auto">
                {isLoading ? <LoadingSpinner /> : (currentTranslations.submitButton || "Generate My Plan & Start Learning!")}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
