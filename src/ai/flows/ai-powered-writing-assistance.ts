
'use server';
/**
 * @fileOverview AI-powered writing assistance flow.
 *
 * - aiPoweredWritingAssistance - A function that provides AI-driven correction and feedback on writing.
 * - AIPoweredWritingAssistanceInput - The input type for the aiPoweredWritingAssistance function.
 * - AIPoweredWritingAssistanceOutput - The return type for the aiPoweredWritingAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { interfaceLanguageCodes } from '@/lib/types';

const AIPoweredWritingAssistanceInputSchema = z.object({
  prompt: z.string().describe('The writing prompt or topic.'),
  text: z.string().describe('The user-generated text to be evaluated.'),
  interfaceLanguage: z.enum(interfaceLanguageCodes).describe('The ISO 639-1 code of the language for explanations and feedback (e.g., en, ru).'),
});
export type AIPoweredWritingAssistanceInput = z.infer<typeof AIPoweredWritingAssistanceInputSchema>;

const AIPoweredWritingAssistanceOutputSchema = z.object({
  feedback: z.string().describe('AI-driven feedback on structure, grammar, and tone.'),
  correctedText: z.string().describe('The corrected version of the input text.'),
});
export type AIPoweredWritingAssistanceOutput = z.infer<typeof AIPoweredWritingAssistanceOutputSchema>;

export async function aiPoweredWritingAssistance(input: AIPoweredWritingAssistanceInput): Promise<AIPoweredWritingAssistanceOutput> {
  return aiPoweredWritingAssistanceFlow(input);
}

const writingAssistantPrompt = ai.definePrompt({
  name: 'writingAssistantPrompt',
  input: {schema: AIPoweredWritingAssistanceInputSchema},
  output: {schema: AIPoweredWritingAssistanceOutputSchema},
  prompt: `You are an AI writing assistant that provides feedback and corrections on user-submitted text.

  Provide feedback on the structure, grammar, and tone of the text.
  Correct any errors and provide a revised version of the text.
  All explanations and feedback must be in the language specified by the ISO 639-1 code: {{{interfaceLanguage}}}.

  Prompt: {{{prompt}}}
  Text: {{{text}}}

  Output the feedback and corrected text as a JSON object.
  `,
});

const aiPoweredWritingAssistanceFlow = ai.defineFlow(
  {
    name: 'aiPoweredWritingAssistanceFlow',
    inputSchema: AIPoweredWritingAssistanceInputSchema,
    outputSchema: AIPoweredWritingAssistanceOutputSchema,
  },
  async input => {
    const {output} = await writingAssistantPrompt(input);
    return output!;
  }
);
