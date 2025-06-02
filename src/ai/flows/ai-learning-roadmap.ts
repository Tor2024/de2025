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
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';
import type { Lesson } from '@/lib/types'; // Ensure Lesson type is imported if its structure is complex
import { germanCurriculum } from '@/curriculums/german';
import { frenchCurriculum } from '@/curriculums/french';
import { spanishCurriculum } from '@/curriculums/spanish';
import { italianCurriculum } from '@/curriculums/italian';
import { portugueseCurriculum } from '@/curriculums/portuguese';
import { chineseCurriculum } from '@/curriculums/chinese';
import { japaneseCurriculum } from '@/curriculums/japanese';
import { koreanCurriculum } from '@/curriculums/korean';
import { turkishCurriculum } from '@/curriculums/turkish';
import { arabicCurriculum } from '@/curriculums/arabic';

const GeneratePersonalizedLearningRoadmapInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema
    .describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de). This language should be used for all instructions, titles, and descriptive text within the roadmap itself (introduction, lesson titles/descriptions, lesson topics, conclusion).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user wants to study (e.g., German, English). The actual learning content and concepts in the roadmap (e.g., grammar rules, vocabulary themes) should be for this language.'),
  proficiencyLevel: z
    .enum(proficiencyLevels)
    .describe('The user-selected current/starting proficiency level (e.g., A1-A2, B1-B2, C1-C2). The generated roadmap must still cover all levels from A0/A1 to C2, но это поле теперь необязательное.')
    .optional(),
  goals: z.array(z.string()),
  interests: z.array(z.string()),
  topicMistakes: z.record(z.number()).optional(),
  grammarMistakes: z.record(z.number()).optional(),
  vocabMistakes: z.record(z.number()).optional(),
  userName: z.string().optional(),
});

export type GeneratePersonalizedLearningRoadmapInput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapInputSchema
>;

const LessonSchema = z.object({
  id: z.string().describe("A unique identifier for this lesson (e.g., 'module_a1_lesson_1', 'german_b2_topic_3'). This ID should be concise and stable."),
  level: z.string().describe("CEFR level for this lesson/module (e.g., A1, A2, B1). The text itself (e.g., 'Level A1', 'Уровень A1') MUST be in the specified `interfaceLanguage`."),
  title: z.string().describe("Title of the lesson/module. MUST be in the specified `interfaceLanguage`."),
  description: z.string().describe("A detailed, user-friendly description of what this lesson/module covers, suitable for the CEFR level. Include brief explanations or examples for key concepts where appropriate. Ensure the text is clear, concise, and well-suited for text-to-speech conversion. Do NOT use asterisks or other Markdown-like characters for emphasis in the description. MUST be in the specified `interfaceLanguage`."),
  topics: z.array(z.string()).describe("Specific topics covered, providing a clear breakdown of lesson content. Each topic string ITSELF MUST be in the specified `interfaceLanguage`. These strings should be descriptive, action-oriented (e.g., 'Грамматика: Изучение немецкого алфавита...', 'Лексика: Практика слов по теме...'), and may include very brief examples or clarifications to aid understanding (e.g., for Russian interface and German target, a topic string could be 'Грамматика: Немецкий алфавит (das deutsche Alphabet) и основы произношения'). Aim for a balance of grammar, vocabulary, and practical application within each module, covering reading, writing, listening, and speaking aspects appropriate to the level."),
  estimatedDuration: z.string().optional().describe("Estimated time to complete this lesson/module (e.g., '2 weeks', '10 hours', '2 недели', '10 часов'). MUST be in the specified `interfaceLanguage`.")
});

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  introduction: z.string().describe("A general introduction to the learning plan, explaining its structure and how to use it effectively. Ensure the text is clear, concise, and well-suited for text-to-speech conversion. MUST be in the specified `interfaceLanguage`. If the user provided a `proficiencyLevel`, acknowledge it as their starting point but emphasize the plan covers A0-C2. Do NOT use asterisks or other Markdown-like characters for emphasis."),
  lessons: z.array(LessonSchema).describe("An array of lessons, structured sequentially from A0/A1 to C2. Ensure comprehensive coverage for the `targetLanguage` across all CEFR levels. Each lesson should aim to integrate various skills (grammar, vocabulary, listening, reading, writing, speaking) in a thematic or functional context where possible."),
  conclusion: z.string().optional().describe("A concluding remark or encouragement. Ensure the text is clear, concise, and well-suited for text-to-speech conversion. MUST be in the specified `interfaceLanguage`. Do NOT use asterisks or other Markdown-like characters for emphasis.")
});

export type GeneratePersonalizedLearningRoadmapOutput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapOutputSchema
>;

export async function generatePersonalizedLearningRoadmap(
  input: GeneratePersonalizedLearningRoadmapInput
): Promise<GeneratePersonalizedLearningRoadmapOutput> {
  return generatePersonalizedLearningRoadmapFlow(input);
}

const getCurriculum = (targetLanguage: string) => {
  switch (targetLanguage) {
    case 'German': return germanCurriculum;
    case 'French': return frenchCurriculum;
    case 'Spanish': return spanishCurriculum;
    case 'Italian': return italianCurriculum;
    case 'Portuguese': return portugueseCurriculum;
    case 'Chinese': return chineseCurriculum;
    case 'Japanese': return japaneseCurriculum;
    case 'Korean': return koreanCurriculum;
    case 'Turkish': return turkishCurriculum;
    case 'Arabic': return arabicCurriculum;
    default: return [];
  }
};

const generatePersonalizedLearningRoadmapPrompt = ai.definePrompt({
  name: 'generatePersonalizedLearningRoadmapPrompt',
  input: {schema: GeneratePersonalizedLearningRoadmapInputSchema},
  output: {schema: GeneratePersonalizedLearningRoadmapOutputSchema},
  prompt: ({ interfaceLanguage, targetLanguage, proficiencyLevel, goals, interests, topicMistakes, grammarMistakes, vocabMistakes, userName }) => ([
    {
      text: `
Сгенерируй индивидуальный учебный план для пользователя:
- Уровень: ${proficiencyLevel}
- Цели: ${goals?.join(', ') || 'не указаны'}
- Интересы: ${interests?.join(', ') || 'не указаны'}
- Частые ошибки по темам: ${topicMistakes ? JSON.stringify(topicMistakes) : 'нет данных'}
- Частые ошибки по грамматике: ${grammarMistakes ? JSON.stringify(grammarMistakes) : 'нет данных'}
- Частые ошибки по лексике: ${vocabMistakes ? JSON.stringify(vocabMistakes) : 'нет данных'}

В качестве основы для структуры учебного плана используй следующий curriculum для языка ${targetLanguage}:
${JSON.stringify(getCurriculum(targetLanguage))}

Важное правило: для каждого уровня CEFR (A1, A2, B1, B2, C1, C2) обязательно включай как минимум одну грамматическую и одну лексическую тему из curriculum. Не допускается, чтобы в каком-либо уровне отсутствовала одна из этих категорий.

Уделяй больше внимания темам и заданиям, связанным с интересами и целями пользователя. Включай больше упражнений на "слабые места" (темы/грамматика/лексика, где были ошибки). Длина и сложность заданий должны соответствовать уровню пользователя.
`  
    }
  ]),
});

// Define the flow using the AI prompt
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

