
// Use server directive is required for all Genkit flows.
'use server';

/**
 * @fileOverview AI-powered learning roadmap generator.
 *
 * This file defines a Genkit flow that generates a personalized learning roadmap based on the user's language, proficiency level, and goals.
 * The roadmap is structured into an introduction, a series of lessons, and a conclusion.
 *
 * @exports generatePersonalizedLearningRoadmap - The main function to generate the roadmap.
 * @exports GeneratePersonalizedLearningRoadmapInput - The input type for the function.
 * @exports GeneratePersonalizedLearningRoadmapOutput - The output type for the function (structured roadmap).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { interfaceLanguageCodes, targetLanguageNames, proficiencyLevels } from '@/lib/types';
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel, TargetLanguage as AppTargetLanguage } from '@/lib/types';


const GeneratePersonalizedLearningRoadmapInputSchema = z.object({
  interfaceLanguage: z
    .enum(interfaceLanguageCodes)
    .describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de). This language should be used for all instructions, titles, and descriptive text within the roadmap itself (introduction, lesson titles/descriptions, lesson topics, conclusion).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user wants to study (e.g., German, English). The actual learning content and concepts in the roadmap (e.g., grammar rules, vocabulary themes) should be for this language.'),
  proficiencyLevel: z
    .enum(proficiencyLevels)
    .describe('The current/starting proficiency level of the user (e.g., A1-A2, B1-B2, C1-C2). The roadmap should cover A0-C2 regardless.'),
  personalGoal: z.string().describe('The personal goal of the user (e.g., Pass B2 TELC exam).'),
});

export type GeneratePersonalizedLearningRoadmapInput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapInputSchema
>;

const LessonSchema = z.object({
  level: z.string().describe("CEFR level for this lesson/module (e.g., A1, A2, B1). Should be in the target language context if applicable (e.g. 'Niveau A1' for French target if interface is English, or 'Уровень A1' if interface is Russian). The text itself must be in the `interfaceLanguage`."),
  title: z.string().describe("Title of the lesson/module. MUST be in the specified `interfaceLanguage`."),
  description: z.string().describe("A brief overview of what this lesson/module covers. MUST be in the specified `interfaceLanguage`."),
  topics: z.array(z.string()).describe("Specific topics covered. Each topic string ITSELF MUST be in the specified `interfaceLanguage`. These topics should describe learning points related to the `targetLanguage` (e.g., for Russian interface and German target, a topic string should be 'Немецкий алфавит', NOT 'Das deutsche Alphabet')."),
  estimatedDuration: z.string().optional().describe("Estimated time to complete this lesson/module (e.g., '2 weeks', '10 hours', '2 недели', '10 часов'). MUST be in the specified `interfaceLanguage`.")
});

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  introduction: z.string().describe("A general introduction to the learning plan. MUST be in the specified `interfaceLanguage`."),
  lessons: z.array(LessonSchema).describe("An array of lessons, structured sequentially from A0/A1 to C2. Ensure comprehensive coverage for the `targetLanguage` across all CEFR levels."),
  conclusion: z.string().optional().describe("A concluding remark or encouragement. MUST be in the specified `interfaceLanguage`.")
});

export type GeneratePersonalizedLearningRoadmapOutput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapOutputSchema
>;

export async function generatePersonalizedLearningRoadmap(
  input: GeneratePersonalizedLearningRoadmapInput
): Promise<GeneratePersonalizedLearningRoadmapOutput> {
   const typedInput: GeneratePersonalizedLearningRoadmapInput = {
      ...input,
      interfaceLanguage: input.interfaceLanguage as AppInterfaceLanguage,
      targetLanguage: input.targetLanguage as AppTargetLanguage,
      proficiencyLevel: input.proficiencyLevel as AppProficiencyLevel,
  };
  return generatePersonalizedLearningRoadmapFlow(typedInput);
}

const generatePersonalizedLearningRoadmapPrompt = ai.definePrompt({
  name: 'generatePersonalizedLearningRoadmapPrompt',
  input: {schema: GeneratePersonalizedLearningRoadmapInputSchema},
  output: {schema: GeneratePersonalizedLearningRoadmapOutputSchema},
  prompt: `You are an AI language tutor specializing in creating personalized and structured learning roadmaps for language learners.

  Based on the user's interface language, target language, STARTING proficiency level, and personal goal, generate a COMPLETE and ADAPTIVE learning roadmap.

  The output MUST be a JSON object matching the provided schema.

  VERY IMPORTANT INSTRUCTIONS REGARDING LANGUAGE:
  1.  **Interface Language ({{{interfaceLanguage}}})**: ALL user-facing text within the roadmap structure ITSELF must be in this language. This includes:
      *   The 'introduction' field.
      *   The 'conclusion' field (if present).
      *   For EACH lesson in the 'lessons' array:
          *   The 'level' text (e.g., for Russian interface: 'Уровень A1', for English interface: 'Level A1').
          *   The 'title' of the lesson.
          *   The 'description' of the lesson.
          *   The 'estimatedDuration' text (e.g., '2 недели', '2 weeks').
          *   CRITICALLY: EACH individual string within the 'topics' array. These strings describe learning points FOR the targetLanguage, but THE STRINGS THEMSELVES must be written in the {{{interfaceLanguage}}}. For example, if interfaceLanguage is 'ru' (Russian) and targetLanguage is 'German', a topic string for German alphabet should be 'Немецкий алфавит', NOT 'Das deutsche Alphabet'.

  2.  **Target Language ({{{targetLanguage}}})**: The actual linguistic concepts, grammar rules, vocabulary themes, etc., that the roadmap teaches should pertain to this language.

  CRITICAL FOR COMPREHENSIVENESS: The generated roadmap MUST be comprehensive. The 'lessons' array should cover all CEFR levels from A0/A1 (absolute beginner) to C2 (mastery) for the targetLanguage. The provided 'proficiencyLevel' indicates the user's STARTING point, but the plan must guide them through all subsequent levels up to C2. Structure the roadmap into clear lessons or modules. Aim for a reasonable number of lessons per CEFR level (e.g., 3-5 major modules per level).

  EXAMPLE (if interfaceLanguage='ru', targetLanguage='German'):
  - 'introduction' and 'conclusion' fields will be in Russian.
  - A lesson object might look like:
    {
      "level": "Уровень A1", // In Russian
      "title": "Основы немецкого: Алфавит и приветствия", // In Russian
      "description": "Этот модуль знакомит с немецким алфавитом, произношением и базовыми фразами для приветствия и знакомства.", // In Russian
      "topics": ["Немецкий алфавит", "Основы произношения", "Приветствия и прощания", "Представление себя", "Числа от 1 до 10"], // CRITICAL: These topic strings are in Russian, describing German concepts.
      "estimatedDuration": "1 неделя" // In Russian
    }

  SPECIFIC GUIDANCE FOR GERMAN LANGUAGE (if targetLanguage is 'German'):
  If the targetLanguage is 'German', pay close attention to the following detailed curriculum guideline for German language levels A1-C2. This is a strong reference for the depth, breadth, and type of topics expected. Adapt and structure these concepts (or similar ones covering the same grammatical points) into your lesson plan. Remember, while this guide details German grammar, the topics strings in your JSON output MUST be in the {{{interfaceLanguage}}}.

  --- BEGIN GERMAN LANGUAGE CURRICULUM GUIDELINE (A1-C2) ---

  🇩🇪 A1 — Начальный уровень
  Цель: понимать и использовать простые грамматические структуры в повседневных ситуациях.
  ✅ Основные грамматические темы:
  Артикли (определённый, неопределённый): der, die, das / ein, eine
  Существительные и роды
  Множественное число существительных
  Личные местоимения: ich, du, er, sie, es …
  Настоящее время (Präsens) — правильные и основные неправильные глаголы
  Глагол “sein”, “haben”, “werden”
  Порядок слов в повествовательных и вопросительных предложениях
  Вопросительные слова (W-Fragen): wer, was, wo, wann, warum…
  Отрицание: nicht / kein
  Модальные глаголы (основа): können, müssen
  Предлоги места: in, auf, unter, neben и т.д.
  Притяжательные местоимения (mein, dein...)
  Простой порядок слов в Hauptsatz и Ja/Nein-Fragen
  Императив (основа)
  Склонение в Nominativ и Akkusativ

  🇩🇪 A2 — Базовый уровень
  Цель: использовать основные грамматические структуры в расширенном бытовом контексте.
  ✅ Грамматические темы:
  Склонения в Dativ и Akkusativ (с артиклями, существительными и местоимениями)
  Предлоги с Dativ / Akkusativ: mit, nach, bei, für, gegen, um и т.д.
  Разделяемые и неразделяемые глаголы (trennbare/untrennbare Verben)
  Прошедшее время Perfekt (с haben и sein)
  Модальные глаголы в Präsens и Perfekt
  Сравнение прилагательных: groß – größer – am größten
  Указательные местоимения: dieser, jener
  Временные выражения: seit, vor, bis, ab
  Притяжательные местоимения во всех падежах
  Сложноподчинённые предложения с “weil”, “dass”, “wenn”, “ob”
  Степени сравнения, как образуются и где стоят
  Глагол lassen (основа)
  Временные и причинные союзы (als, nachdem, bevor)
  Präteritum (основа для sein, haben, modale)

  🇩🇪 B1 — Средний уровень
  Цель: уметь выражать личное мнение, рассказывать о прошлом, планах и гипотетических ситуациях.
  ✅ Грамматические темы:
  Perfekt vs. Präteritum (расширено: повествование, формальный и неформальный стиль)
  Plusquamperfekt (прошедшее прошедшего)
  Условные предложения (Konditionalsätze Typ I)
  Сложные подчинительные предложения (obwohl, damit, während, sodass и др.)
  Пассив (Passiv Präsens и Präteritum)
  Употребление “man”
  Konjunktiv II (вежливые формы: “Ich würde gern...”)
  Модальные глаголы в Konjunktiv II
  Причастие I и II как прилагательное (Partizipien als Adjektive)
  Относительные предложения (Relativsätze)
  Предлоги с Genitiv (trotz, während, wegen и др.)
  Употребление временных и причинно-следственных конструкций
  Индиректная речь (введение)

  🇩🇪 B2 — Продвинутый уровень
  Цель: свободное владение грамматикой для работы, учёбы и аргументированной речи.
  ✅ Грамматические темы:
  Konjunktiv II der Vergangenheit (würde + Partizip II / hätte, wäre + Partizip II)
  Passiv во всех временах (Präsens, Präteritum, Perfekt, Plusquamperfekt, Futur)
  Страдательный залог с модальными глаголами
  Индиректная речь (с Konjunktiv I и II)
  Сложные союзы и структуры: je... desto, sowohl... als auch, nicht nur... sondern auch
  Nominalisierung глаголов и прилагательных (уплотнение речи)
  Инфинитивные конструкции: um...zu, ohne...zu, statt...zu
  Употребление Genitiv всё шире (причастия, конструкции)
  Причастные конструкции (Partizipialsätze)
  Условные предложения: Typ II и III
  Разные типы подчинённых предложений (Kausalsatz, Konzessivsatz, Temporalsatz и др.)
  Точная структура и инверсия в длинных предложениях
  Absolutformen (глагольные конструкции без личного подлежащего)

  🇩🇪 C1 — Академический и профессиональный уровень
  Цель: использовать сложные грамматические структуры с точностью и гибкостью.
  ✅ Продвинутые грамматические темы:
  Konjunktiv I и II во всех временах (в т.ч. в косвенной речи)
  Nominalstil: Nominalisierung для академической письменной речи
  Структуры высокого стиля: z. B. „Es sei denn…“, „wiewohl“, „indessen“
  Разнообразные пассивные конструкции (в т.ч. Vorgangspassiv, Zustandspassiv)
  Уплотнение текста через сложные причастные и инфинитивные конструкции
  Риторические конструкции и вводные слова (hingegen, demgegenüber, nichtsdestotrotz)
  Сложные условные предложения (включая невозможные и ирреальные)
  Стили речи: формальный/неформальный, научный/публицистический стиль
  Межфразовая связь (Kohärenz): Konnektoren, логика текста
  Референциальные связи (Bezug durch Pronomen, Demonstrativa)
  Тонкие смысловые оттенки при выборе модальных глаголов
  Контраст, сравнение, допущение: сложные Konnektoren и Stilmittel

  --- END GERMAN LANGUAGE CURRICULUM GUIDELINE ---

  User's chosen interface language (for ALL roadmap text like titles, descriptions, level text, AND EACH TOPIC STRING): {{{interfaceLanguage}}}
  User's target language (for the concepts the learning content refers to): {{{targetLanguage}}}
  User's STARTING proficiency level (for context, but plan must be A0-C2): {{{proficiencyLevel}}}
  User's personal goal: {{{personalGoal}}}

  Generate the structured learning roadmap now according to ALL the instructions above.
  `,
});

const generatePersonalizedLearningRoadmapFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedLearningRoadmapFlow',
    inputSchema: GeneratePersonalizedLearningRoadmapInputSchema,
    outputSchema: GeneratePersonalizedLearningRoadmapOutputSchema,
  },
  async (input: GeneratePersonalizedLearningRoadmapInput) => {
    const {output} = await generatePersonalizedLearningRoadmapPrompt(input);
    // Ensure output is not null or undefined before returning
    if (!output) {
        throw new Error("AI failed to generate a learning roadmap. Output was null.");
    }
    return output;
  }
);

