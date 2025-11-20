'use server';

/**
 * @fileOverview AI-powered individual lesson generator.
 *
 * This file defines a Genkit flow that generates a single, personalized lesson based on a user-provided topic and description.
 * The lesson is structured with a title, description, and a list of topics covering various language skills.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';
import type { Lesson } from '@/lib/types';

const GenerateIndividualLessonInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code for the user\'s interface language (e.g., en, ru). All descriptive text (title, description, topics) MUST be in this language.'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user wants to learn.'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The user\'s current proficiency level (A1-A2, B1-B2, C1-C2).'),
  topicTitle: z.string().min(3).describe('The title for the individual lesson, provided by the user.'),
  topicDescription: z.string().min(10).describe('A short description of what the user wants to learn in this lesson.'),
});

export type GenerateIndividualLessonInput = z.infer<typeof GenerateIndividualLessonInputSchema>;

// The output is a single Lesson object, so we reuse the Lesson schema from the roadmap flow
const LessonSchema = z.object({
  id: z.string().describe("A unique identifier for this lesson (e.g., 'individual_lesson_16999...'). This ID should be concise and stable."),
  level: z.string().describe("The CEFR level this lesson is most appropriate for, determined by the AI based on the topic. The text itself (e.g., 'Level B1', 'Уровень B1') MUST be in the specified `interfaceLanguage`."),
  title: z.string().describe("Title of the lesson. This should be based on the user's `topicTitle` but can be refined by the AI. MUST be in the specified `interfaceLanguage`."),
  description: z.string().describe("A detailed, user-friendly description of what this lesson covers, based on the user's `topicDescription`. MUST be in the `interfaceLanguage`."),
  topics: z.array(z.string()).describe("A list of 3-5 specific topics that break down the lesson content. Each topic string MUST be in the `interfaceLanguage` and prefixed with a category like 'Грамматика:', 'Лексика:', 'Чтение:', etc. Every lesson MUST include at least one 'Лексика:' (Vocabulary) topic."),
  estimatedDuration: z.string().optional().describe("Estimated time to complete this lesson (e.g., '45 minutes', '1 час'). MUST be in the specified `interfaceLanguage`.")
});

export type GenerateIndividualLessonOutput = z.infer<typeof LessonSchema>;

export async function generateIndividualLesson(input: GenerateIndividualLessonInput): Promise<GenerateIndividualLessonOutput> {
  return generateIndividualLessonFlow(input);
}

const generateIndividualLessonPrompt = ai.definePrompt({
  name: 'generateIndividualLessonPrompt',
  input: { schema: GenerateIndividualLessonInputSchema },
  output: { schema: LessonSchema },
  prompt: `
You are an AI language tutor that creates single, focused, and personalized language lessons.
Your output MUST be a JSON object that strictly adheres to the provided Lesson schema.

**CRITICAL INSTRUCTIONS:**
1.  **Lesson Structure:** Based on the user's request, you MUST generate a single, complete lesson object.
2.  **Language of Output:**
    *   All user-facing text in the output JSON ('level', 'title', 'description', 'topics', 'estimatedDuration') MUST be in the specified '{{{interfaceLanguage}}}'.
    *   The learning concepts themselves (grammar rules, vocabulary themes) should be for the '{{{targetLanguage}}}'.
3.  **Content Generation:**
    *   **Level:** Analyze the user's topic and description to determine the most appropriate CEFR level ('A1', 'A2', 'B1', etc.) for this lesson.
    *   **Title:** Use the user's 'topicTitle' as a base, but you can refine it to be more descriptive and engaging.
    *   **Description:** Expand on the user's 'topicDescription' to create a clear, welcoming description of the lesson's content and objectives.
    *   **Topics:** This is the most important part. Create a list of 3-5 specific, actionable topics. Each topic MUST start with a category prefix (in '{{{interfaceLanguage}}}'), like 'Грамматика:', 'Лексика:', 'Чтение:', 'Письмо:', 'Аудирование:', or 'Говорение:'.
    *   **CRUCIALLY, every lesson you create MUST include at least one 'Лексика:' (Vocabulary) topic.** This is non-negotiable.
    *   The topics should logically break down the user's requested theme into manageable learning chunks suitable for their '{{{proficiencyLevel}}}'.
4.  **ID and Duration:**
    *   Generate a unique 'id' for the lesson, for example, by combining "individual_" with a timestamp or random string.
    *   Provide a realistic 'estimatedDuration' for the lesson.

**User Request:**
*   **Interface Language:** {{{interfaceLanguage}}}
*   **Target Language:** {{{targetLanguage}}}
*   **Proficiency Level:** {{{proficiencyLevel}}}
*   **Requested Lesson Title:** {{{topicTitle}}}
*   **Requested Lesson Description:** {{{topicDescription}}}

Now, generate the single lesson JSON object based on this request.
`,
});

const generateIndividualLessonFlow = ai.defineFlow(
  {
    name: 'generateIndividualLessonFlow',
    inputSchema: GenerateIndividualLessonInputSchema,
    outputSchema: LessonSchema,
  },
  async (input) => {
    const { output } = await generateIndividualLessonPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate an individual lesson. Output was null.");
    }
    // Add a unique ID to the lesson object after generation
    return {
        ...output,
        id: `individual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  }
);
