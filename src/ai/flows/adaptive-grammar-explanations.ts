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

const InterfaceLanguageSchema = z.enum(['Russian', 'English']);
export type InterfaceLanguage = z.infer<typeof InterfaceLanguageSchema>;

const ProficiencyLevelSchema = z.enum(['A1-A2', 'B1-B2', 'C1-C2']);
export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>;

const AdaptiveGrammarExplanationsInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The interface language of the user'),
  grammarTopic: z.string().describe('The grammar topic to explain.'),
  proficiencyLevel: ProficiencyLevelSchema.describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2).'),
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
  prompt: `You are an expert German language tutor, specializing in grammar explanations for Russian and English speakers.

You will generate a grammar explanation and practice tasks tailored to the user's proficiency level, learning goal, and interface language. Ensure the explanation is clear, concise, and easy to understand.

Interface Language: {{{interfaceLanguage}}}
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
    const {output} = await prompt(input);
    return output!;
  }
);
