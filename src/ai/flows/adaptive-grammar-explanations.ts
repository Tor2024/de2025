
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
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';
import { interfaceLanguageCodes, proficiencyLevels as appProficiencyLevels } from '@/lib/types';


const InterfaceLanguageSchema = z.enum(interfaceLanguageCodes);
export type InterfaceLanguage = z.infer<typeof InterfaceLanguageSchema>;

// ProficiencyLevelSchema and local ProficiencyLevel type are removed.
// We will use appProficiencyLevels (imported from @/lib/types) directly in the Zod schema.
// The type AdaptiveGrammarExplanationsInput will infer ProficiencyLevel correctly.

const AdaptiveGrammarExplanationsInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de).'),
  grammarTopic: z.string().describe('The grammar topic to explain.'),
  proficiencyLevel: z.enum(appProficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2).'),
  learningGoal: z.string().describe('The user defined learning goal.'),
  userPastErrors: z.string().describe('A list of the user prior known errors in their past practice tasks.'),
});
export type AdaptiveGrammarExplanationsInput = z.infer<typeof AdaptiveGrammarExplanationsInputSchema>;

const AdaptiveGrammarExplanationsOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the grammar topic.'),
  practiceTasks: z.array(z.string()).describe('A list of practice tasks tailored to the user.'),
});
export type AdaptiveGrammarExplanationsOutput = z.infer<typeof AdaptiveGrammarExplanationsOutputSchema>;

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
Past Errors: {{{userPastErrors}}}

Explanation:
Practice Tasks:`, 
});

const adaptiveGrammarExplanationsFlow = ai.defineFlow(
  {
    name: 'adaptiveGrammarExplanationsFlow',
    inputSchema: AdaptiveGrammarExplanationsInputSchema,
    outputSchema: AdaptiveGrammarExplanationsOutputSchema,
  },
  async input => {
    // Ensure the input types from the app match the flow's expected types
    const typedInput: AdaptiveGrammarExplanationsInput = {
        ...input,
        interfaceLanguage: input.interfaceLanguage as AppInterfaceLanguage, // Assuming InterfaceLanguage from this file matches AppInterfaceLanguage
        proficiencyLevel: input.proficiencyLevel as AppProficiencyLevel, // Use AppProficiencyLevel from @/lib/types
    };
    const {output} = await prompt(typedInput);
    if (!output) {
        throw new Error("AI failed to generate grammar explanation. Output was null.");
    }
    return output;
  }
);

