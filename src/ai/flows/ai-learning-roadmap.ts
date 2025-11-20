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
import { englishCurriculum } from '@/curriculums/english';

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
  topics: z.array(z.string()).describe("A list of at least 3-5 specific topics covered, providing a clear breakdown of lesson content. Each topic string MUST be in the `interfaceLanguage`. These strings should be descriptive and MUST be prefixed with a category like 'Грамматика:', 'Лексика:', 'Чтение:', 'Письмо:', 'Аудирование:', or 'Говорение:'. For example: 'Грамматика: Изучение немецкого алфавита', 'Лексика: Практика слов по теме семья'. Every lesson MUST include at least one 'Лексика:' (Vocabulary) topic."),
  estimatedDuration: z.string().optional().describe("Estimated time to complete this lesson/module (e.g., '2 weeks', '10 hours', '2 недели', '10 часов'). MUST be in the specified `interfaceLanguage`.")
});

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  introduction: z.string().describe("A general introduction to the learning plan, explaining its structure and how to use it effectively. Ensure the text is clear, concise, and well-suited for text-to-speech conversion. MUST be in the specified `interfaceLanguage`. If the user provided a `proficiencyLevel`, acknowledge it as their starting point but emphasize the plan covers A0-C2. Do NOT use asterisks or other Markdown-like characters for emphasis."),
  lessons: z.array(LessonSchema).min(18).describe("An array of lessons, structured sequentially from A0/A1 to C2. Ensure comprehensive coverage for the `targetLanguage` across all CEFR levels. Each lesson should aim to integrate various skills (grammar, vocabulary, listening, reading, writing, speaking) in a thematic or functional context where possible."),
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
    case 'English': return englishCurriculum;
    default: return [];
  }
};

const generatePersonalizedLearningRoadmapPrompt = ai.definePrompt({
  name: 'generatePersonalizedLearningRoadmapPrompt',
  input: {schema: GeneratePersonalizedLearningRoadmapInputSchema},
  output: {schema: GeneratePersonalizedLearningRoadmapOutputSchema},
  prompt: `
You are an AI language tutor responsible for creating a complete and personalized learning plan.
Your output MUST be a JSON object that strictly adheres to the provided schema.

**CRITICAL INSTRUCTIONS:**
1.  **Full & Detailed Curriculum (A0-C2):** You MUST generate a comprehensive learning roadmap covering ALL levels from A0 to C2 for the '{{{targetLanguage}}}'. Create at least 3-4 detailed lessons for EACH CEFR level (A0, A1, A2, B1, B2, C1, C2), for a total of at least 18-20 lessons. Do NOT create a partial plan. The user wants to see the entire path.
2.  **Use Provided Curriculum:** You MUST use the provided JSON curriculum as the primary source for topics. For each lesson you create, you MUST pull relevant topics from the corresponding level in the curriculum JSON.
3.  **Language of Output:**
    *   All user-facing text in the output JSON ('introduction', 'lessons.level', 'lessons.title', 'lessons.description', 'lessons.topics', 'lessons.estimatedDuration', 'conclusion') MUST be in the specified '{{{interfaceLanguage}}}'.
    *   The learning concepts themselves (grammar rules, vocabulary themes) should be for the '{{{targetLanguage}}}'.
4.  **Lesson Structure:**
    *   For each lesson, the 'topics' array MUST contain at least 3-5 items.
    *   Each topic string MUST start with a category prefix, like 'Грамматика:', 'Лексика:', 'Чтение:', 'Письмо:', 'Аудирование:', or 'Говорение:'.
    *   **Crucially, every single lesson MUST contain at least one 'Лексика:' (Vocabulary) topic.** This is non-negotiable.
5.  **Personalization:**
    *   If a 'proficiencyLevel' is provided, acknowledge it in the introduction but generate the full A0-C2 plan.
    *   Subtly integrate the user's 'goals' and 'interests' into the lesson descriptions and topic choices to make the plan more engaging.
    *   If mistake data is provided, create more practice opportunities or slightly more detailed explanations for those "weak spots" in the relevant lessons. Do this subtly.
6.  **TTS-Friendly:** All descriptive text must be clear, concise, and suitable for text-to-speech conversion. Avoid complex sentences and do NOT use markdown (like asterisks or underscores).

**User Profile:**
*   **User Name:** {{{userName}}} (if available)
*   **Interface Language:** {{{interfaceLanguage}}}
*   **Target Language:** {{{targetLanguage}}}
*   **Stated Proficiency (for context only):** {{{proficiencyLevel}}}
*   **Goals:** {{{goals}}}
*   **Interests:** {{{interests}}}
*   **Common Mistakes (if any):**
    *   Topics: {{{topicMistakes}}}
    *   Grammar: {{{grammarMistakes}}}
    *   Vocabulary: {{{vocabMistakes}}}

**Reference Curriculum for {{{targetLanguage}}}:**
\`\`\`json
{{{curriculum}}}
\`\`\`

Now, generate the complete, detailed, and personalized learning roadmap from A0 to C2 with at least 18 lessons in total.
`,
});

// Define the flow using the AI prompt
const generatePersonalizedLearningRoadmapFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedLearningRoadmapFlow',
    inputSchema: GeneratePersonalizedLearningRoadmapInputSchema,
    outputSchema: GeneratePersonalizedLearningRoadmapOutputSchema,
  },
  async (input: GeneratePersonalizedLearningRoadmapInput) => {
    // Add the curriculum to the prompt data
    const promptData = {
      ...input,
      curriculum: JSON.stringify(getCurriculum(input.targetLanguage), null, 2),
    };

    const {output} = await generatePersonalizedLearningRoadmapPrompt(promptData);
    // Ensure output is not null or undefined before returning
    if (!output) {
        throw new Error("AI failed to generate a learning roadmap. Output was null.");
    }
    return output;
  }
);
