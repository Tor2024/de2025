'use server';
/**
 * @fileOverview AI-powered lesson recommendation flow.
 *
 * - getLessonRecommendation - A function that recommends the next lesson for the user.
 * - GetLessonRecommendationInput - The input type for the function.
 * - GetLessonRecommendationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel, TargetLanguage as AppTargetLanguage } from '@/lib/types';
import { InterfaceLanguageSchema, proficiencyLevels, targetLanguageNames } from '@/lib/types';

// Define Lesson and LearningRoadmap schemas for input validation, similar to ai-learning-roadmap.ts
const LessonSchema = z.object({
  id: z.string().describe("A unique identifier for this lesson"),
  level: z.string().describe("CEFR level for this lesson/module, in interfaceLanguage"),
  title: z.string().describe("Title of the lesson/module, in interfaceLanguage"),
  description: z.string().describe("A detailed description of what this lesson/module covers, in interfaceLanguage"),
  topics: z.array(z.string()).describe("Specific topics covered, in interfaceLanguage"),
  estimatedDuration: z.string().optional().describe("Estimated time to complete, in interfaceLanguage")
});
export type Lesson = z.infer<typeof LessonSchema>;

const LearningRoadmapSchema = z.object({
  introduction: z.string().describe("Introduction to the learning plan, in interfaceLanguage"),
  lessons: z.array(LessonSchema).describe("An array of lessons"),
  conclusion: z.string().optional().describe("Concluding remark, in interfaceLanguage")
});
export type LearningRoadmap = z.infer<typeof LearningRoadmapSchema>;


const GetLessonRecommendationInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for the reasoning text.'),
  currentLearningRoadmap: LearningRoadmapSchema.describe("The user's current learning roadmap object."),
  completedLessonIds: z.array(z.string()).describe("An array of IDs of lessons the user has already completed."),
  userGoal: z.string().describe("The user's personal learning goal."),
  currentProficiencyLevel: z.enum(proficiencyLevels).describe("The user's current proficiency level."),
});
export type GetLessonRecommendationInput = z.infer<typeof GetLessonRecommendationInputSchema>;

const GetLessonRecommendationOutputSchema = z.object({
  recommendedLessonId: z.string().nullable().describe('The ID of the recommended lesson from the roadmap, or null if no suitable lesson is found (e.g., all completed or empty plan).'),
  reasoning: z.string().nullable().describe('A brief explanation (in the specified interfaceLanguage) why this lesson is recommended, or a message if no lesson is recommended.'),
});
export type GetLessonRecommendationOutput = z.infer<typeof GetLessonRecommendationOutputSchema>;

export async function getLessonRecommendation(input: GetLessonRecommendationInput): Promise<GetLessonRecommendationOutput> {
  return getLessonRecommendationFlow(input);
}

const getLessonRecommendationPrompt = ai.definePrompt({
  name: 'getLessonRecommendationPrompt',
  input: { schema: GetLessonRecommendationInputSchema },
  output: { schema: GetLessonRecommendationOutputSchema },
  prompt: `You are an intelligent AI language tutor. Your task is to recommend the next most suitable lesson for the user based on their learning plan, progress, goals, and proficiency.

User's Context:
- Interface Language (for your reasoning): {{{interfaceLanguage}}}
- Current Proficiency Level: {{{currentProficiencyLevel}}}
- Personal Learning Goal: {{{userGoal}}}
- Completed Lesson IDs: {{#if completedLessonIds.length}} {{{json completedLessonIds}}} {{else}} (No lessons completed yet) {{/if}}
- Full Learning Roadmap: {{{json currentLearningRoadmap}}}

Your Task:
1.  Analyze the user's full learning roadmap ('currentLearningRoadmap.lessons').
2.  Identify all lessons that have NOT been completed (i.e., their 'id' is not in 'completedLessonIds').
3.  From these uncompleted lessons, determine the most logical "next" lesson. This is typically the first uncompleted lesson in the sequence provided in the roadmap.
4.  Consider the user's 'currentProficiencyLevel' and 'userGoal'. If multiple uncompleted lessons seem equally viable as the "next step" based on sequence, try to pick one that aligns well with their current level or might help them towards their goal. However, sequence is usually the primary factor.
5.  If a suitable lesson is found:
    *   Set 'recommendedLessonId' to the 'id' of that lesson.
    *   In 'reasoning', provide a brief, encouraging explanation in the specified '{{{interfaceLanguage}}}' why this lesson is recommended (e.g., "This is the next lesson in your A2 plan and covers essential vocabulary for travel." or "Continuing with your B1 level, this lesson focuses on a grammar point relevant to your goal of passing the exam.").
6.  If all lessons in the 'currentLearningRoadmap.lessons' array are completed, or if the 'lessons' array is empty:
    *   Set 'recommendedLessonId' to null.
    *   In 'reasoning', provide a message in '{{{interfaceLanguage}}}' like "Congratulations, you've completed all lessons in your current plan!" or "Your learning plan is currently empty. A new plan might need to be generated."
7.  If no uncompleted lessons are found for any other reason (which shouldn't happen with a valid plan), set 'recommendedLessonId' to null and explain in 'reasoning' that no suitable next lesson could be determined.

Output Format: Ensure your response is a JSON object matching the defined output schema.
`,
});

const getLessonRecommendationFlow = ai.defineFlow(
  {
    name: 'getLessonRecommendationFlow',
    inputSchema: GetLessonRecommendationInputSchema,
    outputSchema: GetLessonRecommendationOutputSchema,
  },
  async (input: GetLessonRecommendationInput) => {
    // Basic validation on client side is good, but AI will handle logic
    if (!input.currentLearningRoadmap || !input.currentLearningRoadmap.lessons || input.currentLearningRoadmap.lessons.length === 0) {
      return {
        recommendedLessonId: null,
        reasoning: input.interfaceLanguage === 'ru' ? "Ваш учебный план пока пуст. Возможно, его нужно сгенерировать." : "Your learning plan is currently empty. It might need to be generated.",
      };
    }

    const { output } = await getLessonRecommendationPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a lesson recommendation. Output was null.");
    }
    return output;
  }
);
