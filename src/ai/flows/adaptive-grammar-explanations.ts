
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
import type { ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';
import { proficiencyLevels as appProficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';


const AdaptiveGrammarExplanationsInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de).'),
  grammarTopic: z.string().describe('The grammar topic to explain.'),
  proficiencyLevel: z.enum(appProficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2).'),
  learningGoal: z.string().describe('The user defined learning goal.'),
  userPastErrors: z.string().describe('A list of the user prior known errors in their past practice tasks. This could be a comma-separated list or a more structured description of errors.'),
});
export type AdaptiveGrammarExplanationsInput = z.infer<typeof AdaptiveGrammarExplanationsInputSchema>;

const AdaptiveGrammarExplanationsOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the grammar topic.'),
  practiceTasks: z.array(z.string()).describe('A list of practice tasks tailored to the user.'),
});
export type AdaptiveGrammarExplanationsOutput = z.infer<typeof AdaptiveGrammarExplanationsOutputSchema>;

// Exported wrapper function
export async function adaptiveGrammarExplanations(input: AdaptiveGrammarExplanationsInput): Promise<AdaptiveGrammarExplanationsOutput> {
  return adaptiveGrammarExplanationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptiveGrammarExplanationsPrompt',
  input: {schema: AdaptiveGrammarExplanationsInputSchema},
  output: {schema: AdaptiveGrammarExplanationsOutputSchema},
  prompt: `You are an expert language tutor, specializing in grammar explanations.

You will generate a grammar explanation and practice tasks tailored to the user's proficiency level, learning goal, and interface language. Ensure the explanation is clear, concise, and easy to understand. All explanations and practice tasks must be in the language specified by the interfaceLanguage code.

Interface Language (ISO 639-1 code): {{{interfaceLanguage}}}
Grammar Topic: {{{grammarTopic}}}
Proficiency Level: {{{proficiencyLevel}}}
Learning Goal: {{{learningGoal}}}
User's Past Errors related to various topics (if any, pay attention to those relevant to the current Grammar Topic): {{{userPastErrors}}}

Your task:
1.  Provide a clear and concise Explanation of the {{{grammarTopic}}} in the {{{interfaceLanguage}}}.
2.  If the {{{userPastErrors}}} are provided and contain errors relevant to the current {{{grammarTopic}}}, subtly tailor parts of your explanation and some practice tasks to help address these specific past weaknesses. Do not explicitly say "because you made this error before". Instead, provide more examples or a slightly different angle on the parts of the topic the user struggled with.
3.  Generate a list of Practice Tasks. These tasks should:
    *   Be in the {{{interfaceLanguage}}}.
    *   Be suitable for the user's {{{proficiencyLevel}}}.
    *   Help achieve the {{{learningGoal}}}.
    *   If relevant past errors were noted, some tasks should specifically target re-learning or reinforcing those concepts related to the current {{{grammarTopic}}}.

Output format:
Explanation: [Your explanation here]
Practice Tasks:
- Task 1
- Task 2
...`,
});

const adaptiveGrammarExplanationsFlow = ai.defineFlow(
  {
    name: 'adaptiveGrammarExplanationsFlow',
    inputSchema: AdaptiveGrammarExplanationsInputSchema,
    outputSchema: AdaptiveGrammarExplanationsOutputSchema,
  },
  async (input: AdaptiveGrammarExplanationsInput) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate grammar explanation. Output was null.");
    }
    return output;
  }
);
