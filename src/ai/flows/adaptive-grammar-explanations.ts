
'use server';

/**
 * @fileOverview This file implements the adaptive grammar explanations flow.
 *
 * The flow takes a grammar topic, the user's proficiency level, and their learning goal as input.
 * It then generates a clear explanation and practice tasks tailored to the user's needs.
 *
 * @remarks
 * - adaptiveGrammarExplanations - A function that handles the adaptive grammar explanations process.
 * - AdaptiveGrammarExplanationsInput - The input type for the adaptiveGrammarExplanations function.
 * - AdaptiveGrammarExplanationsOutput - The return type for the adaptiveGrammarExplanations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { proficiencyLevels as appProficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';
import type { ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';


const AdaptiveGrammarExplanationsInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de). All explanations and task instructions MUST be in this language.'),
  grammarTopic: z.string().describe('The grammar topic to explain.'),
  proficiencyLevel: z.enum(appProficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2).'),
  learningGoal: z.string().describe('The user defined learning goal.'),
  userPastErrors: z.string().describe('A list of the user prior known errors in their past practice tasks. This could be a comma-separated list or a more structured description of errors. Example format for one error: "Module: Word Practice, Context: The cat ____ on the mat., User attempt: jump, Correct: sat"'),
});
export type AdaptiveGrammarExplanationsInput = z.infer<typeof AdaptiveGrammarExplanationsInputSchema>;

export const PracticeTaskSchema = z.object({
  id: z.string().describe('A unique ID for the task, e.g., "task_1", "task_2".'),
  type: z.enum(['fill-in-the-blank']).describe('The type of the task. For now, only "fill-in-the-blank" is supported.'),
  taskDescription: z.string().describe('The task itself, including very clear instructions on what the user should do and in what format the answer is expected. E.g., for a fill-in-the-blank task: "Complete the sentence: The cat ____ on the mat." The blank should be indicated by "____". This description MUST be in the {{{interfaceLanguage}}}.'),
  correctAnswer: z.string().describe('The correct word(s) for the blank. This should be in the target language the user is learning.'),
});
export type PracticeTask = z.infer<typeof PracticeTaskSchema>;

const AdaptiveGrammarExplanationsOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the grammar topic. Ensure the text is well-suited for text-to-speech conversion (clear, concise, avoids complex sentence structures if possible). ABSOLUTELY NO MARKDOWN-LIKE FORMATTING. Do NOT use asterisks (*), underscores (_), or any other special characters for emphasis or formatting in your response. Present all text plainly. This explanation must be in the {{{interfaceLanguage}}}.'),
  practiceTasks: z.array(PracticeTaskSchema).describe('A list of practice tasks tailored to the user. These tasks must be in the {{{interfaceLanguage}}}.'),
});
export type AdaptiveGrammarExplanationsOutput = z.infer<typeof AdaptiveGrammarExplanationsOutputSchema>;

export async function adaptiveGrammarExplanations(input: AdaptiveGrammarExplanationsInput): Promise<AdaptiveGrammarExplanationsOutput> {
  return adaptiveGrammarExplanationsFlow(input);
}

const adaptiveGrammarExplanationsPrompt = ai.definePrompt({
  name: 'adaptiveGrammarExplanationsPrompt',
  input: {schema: AdaptiveGrammarExplanationsInputSchema},
  output: {schema: AdaptiveGrammarExplanationsOutputSchema},
  prompt: `You are an expert language tutor, specializing in grammar explanations.

You will generate a grammar explanation and structured practice tasks tailored to the user's proficiency level, learning goal, and interface language. Ensure the explanation is clear, concise, easy to understand, and TTS-friendly.

CRITICAL INSTRUCTIONS:
1.  **Interface Language ({{{interfaceLanguage}}})**: 
    *   ALL textual content of your 'explanation' field MUST be in this language.
    *   For EACH task in the 'practiceTasks' array, the 'taskDescription' field (which includes the instructions for the task) MUST be in this language.
2.  **Target Language Examples**: When explaining the '{{{grammarTopic}}}' for the target language the user is learning, all example sentences demonstrating the grammar rule MUST be IN THE TARGET LANGUAGE. If you provide translations for these example sentences to help the user understand, these translations MUST be into the '{{{interfaceLanguage}}}'. The primary examples illustrating the target language grammar must be in the target language itself.
3.  **ABSOLUTELY NO MARKDOWN-LIKE FORMATTING**: Do NOT use asterisks (*), underscores (_), or any other special characters for emphasis or formatting in any part of your response (explanation, task descriptions). Present all text plainly.
4.  **Practice Task Structure**: Each task in the 'practiceTasks' array MUST be an object with:
    *   'id': A unique ID (e.g., "task_1").
    *   'type': Currently only "fill-in-the-blank".
    *   'taskDescription': The task itself, including VERY CLEAR AND UNAMBIGUOUS instructions on what the user should do and in what format the answer is expected. For "fill-in-the-blank" tasks, the blank MUST be indicated by "____". This 'taskDescription' field (including instructions) MUST be in the {{{interfaceLanguage}}}.
    *   'correctAnswer': The correct word(s) for the blank. This MUST be in the target language.

User Details:
Grammar Topic: {{{grammarTopic}}}
Proficiency Level: {{{proficiencyLevel}}}
Learning Goal: {{{learningGoal}}}
User's Past Errors (if any, pay attention to those relevant to the current Grammar Topic):
Module: {{userPastErrors.split('\n')[0]?.split(',')[0]?.split(':')[1]?.trim() || 'N/A'}}, Context: {{userPastErrors.split('\n')[0]?.split(',')[1]?.split(':')[1]?.trim() || 'N/A'}}, User attempt: {{userPastErrors.split('\n')[0]?.split(',')[2]?.split(':')[1]?.trim() || 'N/A'}}, Correct: {{userPastErrors.split('\n')[0]?.split(',')[3]?.split(':')[1]?.trim() || 'N/A'}}

Your task:
1.  Provide a clear and concise **Explanation** of the {{{grammarTopic}}}. This explanation must be in the {{{interfaceLanguage}}}. Make sure the explanation is well-suited for text-to-speech conversion (clear, simple sentences).
2.  If the {{{userPastErrors}}} are provided and contain errors relevant to the current {{{grammarTopic}}}, subtly tailor parts of your explanation and some practice tasks to help address these specific past weaknesses. Do not explicitly say "because you made this error before". Instead, provide more examples (in the target language, with translations to interface language if needed) or a slightly different angle on the parts of the topic the user struggled with.
3.  Generate a list of **Practice Tasks** (usually 2-3 tasks). These tasks should:
    *   Follow the structured format described in "Practice Task Structure" above.
    *   The 'taskDescription' MUST be in the {{{interfaceLanguage}}} and be extremely clear.
    *   The 'correctAnswer' MUST be in the target language.
    *   Be suitable for the user's {{{proficiencyLevel}}}.
    *   Help achieve the {{{learningGoal}}}.
    *   If relevant past errors were noted, some tasks should specifically target re-learning or reinforcing those concepts related to the current {{{grammarTopic}}}.

Output format:
Your response must be a JSON object matching the defined output schema.
`,
});

const adaptiveGrammarExplanationsFlow = ai.defineFlow(
  {
    name: 'adaptiveGrammarExplanationsFlow',
    inputSchema: AdaptiveGrammarExplanationsInputSchema,
    outputSchema: AdaptiveGrammarExplanationsOutputSchema,
  },
  async (input: AdaptiveGrammarExplanationsInput) => {
    const {output} = await adaptiveGrammarExplanationsPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate grammar explanation. Output was null.");
    }
    return output;
  }
);

