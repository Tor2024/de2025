
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
    .describe('The user-selected current/starting proficiency level (e.g., A1-A2, B1-B2, C1-C2). The generated roadmap must still cover all levels from A0/A1 to C2, but this input provides context for the user\'s starting point.'),
  personalGoal: z.string().describe('The personal goal of the user (e.g., Pass B2 TELC exam).'),
});

export type GeneratePersonalizedLearningRoadmapInput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapInputSchema
>;

const LessonSchema = z.object({
  id: z.string().describe("A unique identifier for this lesson (e.g., 'module_a1_lesson_1', 'german_b2_topic_3'). This ID should be concise and stable."),
  level: z.string().describe("CEFR level for this lesson/module (e.g., A1, A2, B1). Should be in the target language context if applicable (e.g. 'Niveau A1' for French target if interface is English, or 'Уровень A1' if interface is Russian). The text itself must be in the `interfaceLanguage`."),
  title: z.string().describe("Title of the lesson/module. MUST be in the specified `interfaceLanguage`."),
  description: z.string().describe("A detailed, user-friendly description of what this lesson/module covers, suitable for the CEFR level. Include brief explanations or examples for key concepts where appropriate. Highlight important takeaways if possible (e.g., using asterisks for emphasis like *this*). MUST be in the specified `interfaceLanguage`."),
  topics: z.array(z.string()).describe("Specific topics covered, providing a clear breakdown of lesson content. Each topic string ITSELF MUST be in the specified `interfaceLanguage`. These strings should be descriptive and may include very brief examples or clarifications to aid understanding (e.g., for Russian interface and German target, a topic string could be 'Грамматика: Немецкий алфавит (das deutsche Alphabet) и основы произношения'). Aim for a balance of grammar, vocabulary, and practical application within each module, covering reading, writing, listening, and speaking aspects appropriate to the level."),
  estimatedDuration: z.string().optional().describe("Estimated time to complete this lesson/module (e.g., '2 weeks', '10 hours', '2 недели', '10 часов'). MUST be in the specified `interfaceLanguage`.")
});

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  introduction: z.string().describe("A general introduction to the learning plan, explaining its structure and how to use it effectively. MUST be in the specified `interfaceLanguage`. If the user provided a `proficiencyLevel`, acknowledge it as their starting point but emphasize the plan covers A0-C2."),
  lessons: z.array(LessonSchema).describe("An array of lessons, structured sequentially from A0/A1 to C2. Ensure comprehensive coverage for the `targetLanguage` across all CEFR levels. Each lesson should aim to integrate various skills (grammar, vocabulary, listening, reading, writing, speaking) in a thematic or functional context where possible."),
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
  prompt: `You are an AI language tutor specializing in creating personalized, structured, and comprehensive learning roadmaps for language learners.

  Based on the user's interface language, target language, STARTING proficiency level, and personal goal, generate a COMPLETE and ADAPTIVE learning roadmap.

  The output MUST be a JSON object matching the provided schema. Each lesson object in the 'lessons' array must include a unique 'id' field (e.g., 'module_a1_lesson_1', 'german_b2_topic_3').

  VERY IMPORTANT INSTRUCTIONS REGARDING LANGUAGE:
  1.  **Interface Language ({{{interfaceLanguage}}})**: ALL user-facing text within the roadmap structure ITSELF must be in this language. This includes:
      *   The 'introduction' field (provide a welcoming and informative intro. If the user provided a 'proficiencyLevel', acknowledge it as their starting point but emphasize the plan covers A0-C2 for comprehensive learning.).
      *   The 'conclusion' field (if present, make it encouraging).
      *   For EACH lesson in the 'lessons' array:
          *   The 'level' text (e.g., for Russian interface: 'Уровень A1', for English interface: 'Level A1').
          *   The 'title' of the lesson (make it engaging and clear).
          *   The 'description' of the lesson (make this detailed and user-friendly, suitable for the CEFR level. Include brief explanations or examples for key concepts where appropriate. Highlight important takeaways if possible, e.g., using asterisks for emphasis like *this*).
          *   The 'estimatedDuration' text (e.g., '2 недели', '2 weeks').
          *   CRITICALLY: EACH individual string within the 'topics' array. These strings describe learning points FOR the targetLanguage, but THE STRINGS THEMSELVES must be written in the {{{interfaceLanguage}}}. These topic strings should be descriptive and may include very brief examples or clarifications to aid understanding. (e.g., for Russian interface and German target, a topic string could be 'Грамматика: Немецкий алфавит (das deutsche Alphabet) и основы произношения').

  2.  **Target Language ({{{targetLanguage}}})**: The actual linguistic concepts, grammar rules, vocabulary themes, etc., that the roadmap teaches should pertain to this language.

  CONTENT AND STRUCTURE OF LESSONS:
  *   **Comprehensive Coverage (A0-C2)**: The generated roadmap MUST be comprehensive. The 'lessons' array should cover all CEFR levels from A0/A1 (absolute beginner) to C2 (mastery) for the targetLanguage. The provided '{{{proficiencyLevel}}}' indicates the user's STARTING point, but the plan must guide them through all subsequent levels up to C2.
  *   **Balanced Skills**: Design lessons to integrate various language skills (grammar, vocabulary, listening, reading, writing, speaking) where appropriate for the level and topic. Avoid making lessons solely about one skill (e.g., only grammar). Strive to incorporate practical application exercises for each skill within a lesson.
  *   **Thematic/Functional Context**: Whenever possible, frame lessons or modules within a thematic (e.g., "Travel", "Work", "Hobbies") or functional (e.g., "Making appointments", "Expressing opinions") context. This makes learning more engaging.
  *   **Detailed Topics**: The 'topics' array for each lesson should provide a clear breakdown of its content. For example, instead of just "Verbs", specify "Глаголы: Спряжение сильных глаголов в настоящем времени (Präsens), примеры употребления" (if interface language is Russian for German target).
  *   **Systematic Progression**: Ensure a logical and systematic progression of topics and skills throughout the levels.

  EXAMPLE (if interfaceLanguage='ru', targetLanguage='German', proficiencyLevel='A1-A2'):
  - 'introduction' field will be in Russian, and might state something like: "Добро пожаловать! Этот план поможет вам выучить немецкий язык. Вы указали, что ваш текущий уровень A1-A2. План охватывает все уровни от A0 до C2..."
  - 'conclusion' fields will be in Russian.
  - A lesson object might look like:
    {
      "id": "german_a1_module_1_alphabet",
      "level": "Уровень A1", // In Russian
      "title": "Основы немецкого: Алфавит и приветствия", // In Russian
      "description": "Этот модуль знакомит с немецким алфавитом, базовыми правилами произношения и основными фразами для приветствия и знакомства. *Важно* запомнить правильное произношение букв 'ä', 'ö', 'ü', 'ß'. Мы начнем с самых азов, чтобы заложить прочный фундамент.", // In Russian, detailed, with example of emphasis
      "topics": [
          "Лексика: Немецкий алфавит (Das deutsche Alphabet) и его особенности",
          "Фонетика: Основные правила произношения, звуки ä, ö, ü, ß, буквосочетания ei, eu, ch, sch",
          "Практика: Чтение простых слов и имен, упражнения на слух для различения звуков",
          "Коммуникация: Приветствия (Hallo, Guten Tag, Guten Morgen) и прощания (Tschüss, Auf Wiedersehen)",
          "Коммуникация: Как представиться (Ich heiße...), спросить имя (Wie heißen Sie?)",
          "Числа: От 1 до 10 (eins, zwei... zehn) и их употребление",
          "Навыки: Упражнения на аудирование для распознавания приветствий и чисел",
          "Навыки: Письменное упражнение - написать свое имя и возраст"
      ], // CRITICAL: These topic strings are in Russian, describing German concepts, and are more detailed.
      "estimatedDuration": "1 неделя" // In Russian
    }

  SPECIFIC GUIDANCE FOR GERMAN LANGUAGE (if targetLanguage is 'German'):
  If the targetLanguage is 'German', pay close attention to the following detailed curriculum guideline for German language levels A1-C2. This is a strong reference for the depth, breadth, and type of topics expected. Adapt and structure these concepts (or similar ones covering the same grammatical points) into your lesson plan, ensuring each lesson integrates various skills and is presented in a user-friendly way with explanations and examples within the lesson descriptions and topics where appropriate. Remember, while this guide details German grammar and lexis, the topics strings in your JSON output MUST be in the {{{interfaceLanguage}}}.

  --- BEGIN GERMAN LANGUAGE CURRICULUM GUIDELINE (A1-C2) ---

  🇩🇪 A1 (Начальный уровень)
  Цель: простое общение на бытовые темы, понимание повседневных фраз.

  📚 Лексика:
  Приветствие, прощание
  Представление себя, семьи
  Профессии, национальности
  Числа, возраст, время
  Еда и напитки
  Покупки, цены, магазины
  В доме, квартира, мебель
  Город, транспорт
  Повседневные действия
  Погода, времена года
  Дни недели, месяцы
  Хобби, свободное время
  Простые разговоры по телефону

  🔠 Грамматика:
  Определённый/неопределённый артикль (der/die/das/ein/eine)
  Местоимения (ich, du, er, sie, es …)
  Спряжение глаголов в Präsens (жить, быть, иметь, делать)
  Основный порядок слов (глагол на 2-м месте)
  Вопросительные слова (wie, wo, was …)
  Повелительное наклонение (du-формы)
  Akkusativ/ Dativ в простых фразах
  Модальные глаголы (müssen, können, wollen …)
  Предлоги места и времени (in, auf, an, um, am, im)
  Простые связки: weil, aber, und

  🇩🇪 A2 (Базовый уровень)
  Цель: уверенное использование языка в повседневных ситуациях.

  📚 Лексика:
  Путешествия, билеты, гостиницы
  Праздники, подарки, поздравления
  Здоровье, посещение врача
  Повседневная рутина, работа
  Одежда, цвета, стиль
  Письмо, электронная почта, объявления
  Расписание, встречи, договорённости

  🔠 Грамматика:
  Прошедшее время: Perfekt (Ich habe gearbeitet)
  Dativ/ Akkusativ с артиклями и предлогами
  Притяжательные местоимения (mein, dein …)
  Глаголы с управлением (helfen + Dativ)
  Сложные модальные глаголы
  Употребление "es gibt", "man"
  Частицы: doch, mal, ja, denn
  Простые придаточные: weil, dass, wenn
  Степени сравнения прилагательных

  🇩🇪 B1 (Пороговый уровень)
  Цель: участвовать в более сложных диалогах, выражать мнение.

  📚 Лексика:
  Работа и профессия, резюме, интервью
  Образование, школа, университет
  Общество, культура, СМИ
  Природа и экология
  Истории, рассказы, события из прошлого
  Чувства, мнения, аргументы

  🔠 Грамматика:
  Perfekt vs. Präteritum (расширено: повествование, формальный и неформальный стиль)
  Plusquamperfekt (Ich hatte gemacht)
  Konjunktiv II (würde, könnte, hätte…)
  Придаточные предложения: obwohl, damit, als, während
  Пассив (Präsens и Präteritum)
  Наречия времени и порядка (zuerst, danach, schließlich)
  Инфинитивные конструкции mit "zu"
  Relativsätze (который, где…)
  Предлоги с Genitiv (trotz, während, wegen и др.)
  💡 Совет: B1 — минимальный уровень для начала подготовки к TestDaF.

  🇩🇪 B2 (Продвинутый уровень)
  Цель: формулировать аргументированное мнение, понимать абстрактные темы.

  📚 Лексика:
  Политика, наука, техника
  Миграция, культура, интеграция
  Экономика, потребительство
  Интернет, цифровизация
  Общественное мнение, реклама, СМИ
  Эссе, письма, аргументация

  🔠 Грамматика:
  Konjunktiv II Vergangenheit (hätte gemacht, wäre gegangen)
  Сложный пассив + модальные глаголы (könnte gemacht werden)
  Нюансы союзов: dennoch, hingegen, somit
  Nominalisierung (Verlust → der Verlust)
  Придаточные с Partizipien (das Auto, in der Garage stehend…)
  Структуры с "lassen", "werden", "sich lassen"

  🇩🇪 C1 (Продвинутый профессиональный)
  Цель: владение языком на академическом уровне, участие в дискуссиях, написание эссе.
  Уровень сдачи TestDaF и Goethe-Zertifikat C1.

  📚 Лексика:
  Научные и социокультурные термины
  Статистика, графики, аналитика
  Структура эссе, ввод-аргументы-заключение
  Специализированная лексика (университет, образование, работа)

  🔠 Грамматика:
  Все времена (Perfekt, Plusquamperfekt, Futur I/II)
  Все типы пассива и Konjunktiv I/II
  Косвенная речь (Er sagte, er habe …)
  Сложные инфинитивные и причастные конструкции
  Длинные придаточные предложения
  Стилистика: формальный / нейтральный / публицистический стиль
  Упрощённые формулы: "es sei denn", "geschweige denn", "sowohl … als auch …"

  🇩🇪 C2 (Носительский уровень)
  Цель: профессиональное или академическое владение, глубокое понимание сложных текстов.

  📚 Лексика:
  Философия, право, экономика
  Языковой анализ, метафоры, стилистика
  Идиомы, культурные отсылки
  Риторика, речевые манипуляции

  🔠 Грамматика:
  Все вышеуказанное + активное применение
  Сжатие информации (замены сложных конструкций)
  Редкие и редактируемые формы глаголов, местоимений
  Устойчивые обороты, подчинённые обороты
  Сравнительный стилистический анализ

  📑 Для экзаменов:
  🎓 Goethe C1/C2:
  Тестирует: чтение, аудирование, письмо, говорение
  Особое внимание: аргументация, структура, стиль

  🎓 TestDaF (уровень примерно B2–C1):
  TestDaF-4 = уровень C1
  Темы: университет, обучение, наука, интеграция, общество
  Тестирует:
  Чтение сложных текстов
  Письмо академического эссе
  Устную речь (ответы на ситуации и аргументация)
  Аудирование академических лекций

  --- END GERMAN LANGUAGE CURRICULUM GUIDELINE ---

  User's chosen interface language (for ALL roadmap text like titles, descriptions, level text, AND EACH TOPIC STRING): {{{interfaceLanguage}}}
  User's target language (for the concepts the learning content refers to): {{{targetLanguage}}}
  User's STARTING proficiency level (for context, but plan must be A0-C2): {{{proficiencyLevel}}}
  User's personal goal: {{{personalGoal}}}

  Generate the structured learning roadmap now according to ALL the instructions above. Ensure lesson descriptions are detailed and topics are broken down clearly.
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

    