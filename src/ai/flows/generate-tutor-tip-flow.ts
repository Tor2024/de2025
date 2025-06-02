'use server';
/**
 * @fileOverview AI-powered tutor tip generator.
 *
 * - generateTutorTip - A function that generates a short, actionable learning tip.
 * - GenerateTutorTipInput - The input type for the function.
 * - GenerateTutorTipOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

const GenerateTutorTipInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for the tip (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user is learning (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2).').optional(),
  learningGoal: z.string().optional().describe('The user-defined learning goal, if available, to make the tip more relevant.'),
});
export type GenerateTutorTipInput = z.infer<typeof GenerateTutorTipInputSchema>;

const GenerateTutorTipOutputSchema = z.object({
  tip: z.string().describe('A short, encouraging, and practical learning tip in the specified interfaceLanguage.'),
});
export type GenerateTutorTipOutput = z.infer<typeof GenerateTutorTipOutputSchema>;


export async function generateTutorTip(input: GenerateTutorTipInput): Promise<GenerateTutorTipOutput> {
  return generateTutorTipFlow(input);
}

const generateTutorTipPrompt = ai.definePrompt({
  name: 'generateTutorTipPrompt',
  input: {schema: GenerateTutorTipInputSchema},
  output: {schema: GenerateTutorTipOutputSchema},
  prompt: `You are a friendly and encouraging AI language tutor.

Your task is to generate a single, short, actionable, and practical learning tip for a user.
The tip MUST be in the language specified by the ISO 639-1 code: {{{interfaceLanguage}}}.

User's learning context:
- They are learning: {{{targetLanguage}}}
- Their current proficiency level is: {{{proficiencyLevel}}}
{{#if learningGoal}}
- Their learning goal is: "{{{learningGoal}}}"
{{/if}}

Instructions for the tip:
1.  Make it concise and easy to understand (one or two sentences).
2.  Ensure it is practical and actionable for the user.
3.  It should be encouraging and motivational.
4.  Consider the user's proficiency level ({{{proficiencyLevel}}}) to make the tip appropriate for their current stage.
5.  The tip should be relevant for someone learning {{{targetLanguage}}}.
{{#if learningGoal}}
6.  If possible, try to make your tip relevant to their learning goal "{{{learningGoal}}}", while also being suitable for their {{{proficiencyLevel}}} and the {{{targetLanguage}}}.
{{else}}
6.  Provide a general language learning tip that is appropriate for a user learning {{{targetLanguage}}} at the {{{proficiencyLevel}}}.
{{/if}}

Examples of good tips (if interfaceLanguage is English for learning {{{targetLanguage}}}):
- "Try to label objects around your house in {{{targetLanguage}}}!"
- "Don't be afraid to make mistakes when speaking {{{targetLanguage}}}; they are part of the learning journey!"
- "Review new {{{targetLanguage}}} vocabulary for 5-10 minutes every day to help it stick."
- "Watch a short video or listen to a song in {{{targetLanguage}}} today."

Provide only the tip text.
`,
});

const generateTutorTipFlow = ai.defineFlow(
  {
    name: 'generateTutorTipFlow',
    inputSchema: GenerateTutorTipInputSchema,
    outputSchema: GenerateTutorTipOutputSchema,
  },
  async (input) => {
    const {output} = await generateTutorTipPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate a tutor tip. Output was null.");
    }
    return output;
  }
);

