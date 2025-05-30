
'use server';
/**
 * @fileOverview AI-powered fill-in-the-blank exercise generator.
 *
 * - generateFillInTheBlankExercises - A function that generates fill-in-the-blank exercises.
 * - GenerateFillInTheBlankInput - The input type for the function.
 * - GenerateFillInTheBlankOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel, InterfaceLanguage as AppInterfaceLanguage } from '@/lib/types';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

const GenerateFillInTheBlankInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for instructions or any UI elements related to the exercise (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language for the sentences and blank words (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2) to tailor exercise complexity.'),
  topic: z.string().min(3).optional().describe('An optional topic to narrow down the theme of the sentences (e.g., "Travel", "Food").'),
  count: z.number().min(1).max(10).optional().default(5).describe('The number of exercises to generate (default 5).'),
});
export type GenerateFillInTheBlankInput = z.infer<typeof GenerateFillInTheBlankInputSchema>;

const ExerciseSchema = z.object({
    sentenceWithBlank: z.string().describe('The sentence in the targetLanguage with a blank (e.g., "The cat ____ on the mat."). The blank should be clearly indicated, for example, with "____" or "...".'),
    blankWord: z.string().describe('The word that was removed from the blank. This is the word the user should try to guess.'),
    correctAnswer: z.string().describe('The correct word for the blank (usually the same as blankWord).'),
});

const GenerateFillInTheBlankOutputSchema = z.object({
  exercises: z.array(ExerciseSchema).describe('A list of fill-in-the-blank exercises.'),
});
export type GenerateFillInTheBlankOutput = z.infer<typeof GenerateFillInTheBlankOutputSchema>;


export async function generateFillInTheBlankExercises(input: GenerateFillInTheBlankInput): Promise<GenerateFillInTheBlankOutput> {
  return generateFillInTheBlankFlow(input);
}

const generateFillInTheBlankPrompt = ai.definePrompt({
  name: 'generateFillInTheBlankPrompt',
  input: {schema: GenerateFillInTheBlankInputSchema},
  output: {schema: GenerateFillInTheBlankOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating fill-in-the-blank exercises.

Task: Generate a list of {{count}} fill-in-the-blank exercises based on the user's preferences.

User Preferences:
- Target Language (for sentences and blanks): {{{targetLanguage}}}
- Proficiency Level (for sentence complexity and vocabulary): {{{proficiencyLevel}}}
{{#if topic}}
- Topic (for thematic context): {{{topic}}}
{{/if}}

Instructions for each exercise:
1.  **Sentence with Blank:** Create a sentence in the {{{targetLanguage}}} that is appropriate for the {{{proficiencyLevel}}}.
    {{#if topic}}The sentence should be related to the topic "{{{topic}}}".{{/if}}
    One key word in the sentence should be replaced with a clear blank marker (e.g., "____" or "...").
2.  **Blank Word:** Provide the original word that was removed to create the blank.
3.  **Correct Answer:** This should be the same as the "Blank Word".

Example (if targetLanguage is English, proficiency A2, topic "Animals"):
{
  "exercises": [
    {
      "sentenceWithBlank": "A dog says 'woof', but a cat ____.",
      "blankWord": "meows",
      "correctAnswer": "meows"
    },
    {
      "sentenceWithBlank": "Elephants are very ____ animals.",
      "blankWord": "big",
      "correctAnswer": "big"
    }
  ]
}

Output Format: Ensure your response is a JSON object matching the defined output schema.
The 'exercises' array should contain objects, each with 'sentenceWithBlank', 'blankWord', and 'correctAnswer'.
`,
});

const generateFillInTheBlankFlow = ai.defineFlow(
  {
    name: 'generateFillInTheBlankFlow',
    inputSchema: GenerateFillInTheBlankInputSchema,
    outputSchema: GenerateFillInTheBlankOutputSchema,
  },
  async (input) => {
    const {output} = await generateFillInTheBlankPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate fill-in-the-blank exercises. Output was null.");
    }
    return output;
  }
);
