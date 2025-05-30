
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
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de). All explanations and task instructions MUST be in this language.'),
  grammarTopic: z.string().describe('The grammar topic to explain.'),
  proficiencyLevel: z.enum(appProficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2).'),
  learningGoal: z.string().describe('The user defined learning goal.'),
  userPastErrors: z.string().describe('A list of the user prior known errors in their past practice tasks. This could be a comma-separated list or a more structured description of errors. Example format for one error: "Module: Word Practice, Context: The cat ____ on the mat., User attempt: jump, Correct: sat"'),
});
export type AdaptiveGrammarExplanationsInput = z.infer<typeof AdaptiveGrammarExplanationsInputSchema>;

const AdaptiveGrammarExplanationsOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the grammar topic. Ensure the text is well-suited for text-to-speech conversion (clear, concise, avoids complex sentence structures if possible). ABSOLUTELY NO MARKDOWN-LIKE FORMATTING. Do NOT use asterisks (*), underscores (_), or any other special characters for emphasis or formatting in your response. Present all text plainly.'),
  practiceTasks: z.array(z.string()).describe('A list of practice tasks tailored to the user. These tasks must be in the interfaceLanguage.'),
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

You will generate a grammar explanation and practice tasks tailored to the user's proficiency level, learning goal, and interface language. Ensure the explanation is clear, concise, easy to understand, and TTS-friendly.

CRITICAL INSTRUCTIONS:
1.  **Interface Language ({{{interfaceLanguage}}})**: ALL textual content of your response, including the main 'explanation' and each string in the 'practiceTasks' array, MUST be in this language.
2.  **Target Language Examples**: When explaining the '{{{grammarTopic}}}' for the target language the user is learning, all example sentences demonstrating the grammar rule MUST be IN THE TARGET LANGUAGE. If you provide translations for these example sentences to help the user understand, these translations MUST be into the '{{{interfaceLanguage}}}'. The primary examples illustrating the target language grammar must be in the target language itself.
3.  **ABSOLUTELY NO MARKDOWN-LIKE FORMATTING**: Do NOT use asterisks (*), underscores (_), or any other special characters for emphasis or formatting in any part of your response (explanation, practice tasks). Present all text plainly.

User Details:
Grammar Topic: {{{grammarTopic}}}
Proficiency Level: {{{proficiencyLevel}}}
Learning Goal: {{{learningGoal}}}
User's Past Errors (if any, pay attention to those relevant to the current Grammar Topic):
{{{userPastErrors}}}

Your task:
1.  Provide a clear and concise **Explanation** of the {{{grammarTopic}}}. This explanation must be in the {{{interfaceLanguage}}}. Make sure the explanation is well-suited for text-to-speech conversion (clear, simple sentences).
2.  If the {{{userPastErrors}}} are provided and contain errors relevant to the current {{{grammarTopic}}}, subtly tailor parts of your explanation and some practice tasks to help address these specific past weaknesses. Do not explicitly say "because you made this error before". Instead, provide more examples (in the target language, with translations to interface language if needed) or a slightly different angle on the parts of the topic the user struggled with.
3.  Generate a list of **Practice Tasks**. These tasks should:
    *   Be in the {{{interfaceLanguage}}}.
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
