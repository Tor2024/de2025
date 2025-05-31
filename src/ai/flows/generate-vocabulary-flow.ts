
'use server';
/**
 * @fileOverview AI-powered vocabulary list generator.
 *
 * - generateVocabulary - A function that generates a list of vocabulary words.
 * - GenerateVocabularyInput - The input type for the function.
 * - GenerateVocabularyOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

const GenerateVocabularyInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for translations (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language for the vocabulary words (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2) to tailor word complexity.'),
  topic: z.string().min(3).describe('The topic for the vocabulary list (e.g., "Travel", "Food").'),
});
export type GenerateVocabularyInput = z.infer<typeof GenerateVocabularyInputSchema>;

const VocabularyWordSchema = z.object({ 
    word: z.string().describe('The vocabulary word in the targetLanguage.'),
    translation: z.string().describe('The translation of the word into the interfaceLanguage.'),
    exampleSentence: z.string().optional().describe('An example sentence using the word in the targetLanguage.'),
});
export type VocabularyWord = z.infer<typeof VocabularyWordSchema>;

const GenerateVocabularyOutputSchema = z.object({
  words: z.array(VocabularyWordSchema).describe('A list of vocabulary words with translations and example sentences.'),
});
export type GenerateVocabularyOutput = z.infer<typeof GenerateVocabularyOutputSchema>;


export async function generateVocabulary(input: GenerateVocabularyInput): Promise<GenerateVocabularyOutput> {
  return generateVocabularyFlow(input);
}

const generateVocabularyPrompt = ai.definePrompt({
  name: 'generateVocabularyPrompt',
  input: {schema: GenerateVocabularyInputSchema},
  output: {schema: GenerateVocabularyOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating vocabulary lists.

Task: Generate a list of 5-10 relevant vocabulary words based on the user's preferences.

User Preferences:
- Interface Language (for translations): {{{interfaceLanguage}}}
- Target Language (for the vocabulary words): {{{targetLanguage}}}
- Proficiency Level (for word complexity): {{{proficiencyLevel}}}
- Topic: {{{topic}}}

CRITICAL Instructions:
1.  **Words Relevance and Level Appropriateness:**
    *   The generated words MUST be highly relevant to the specified {{{topic}}}.
    *   The complexity of the words, their translations, and especially the example sentences MUST be strictly appropriate for the {{{proficiencyLevel}}}. For example:
        - For A1-A2: Use very common words, simple translations, and very basic example sentences.
        - For B1-B2: Use more nuanced vocabulary, accurate translations of more complex meanings, and sentences with moderately complex structures.
        - For C1-C2: Introduce idiomatic expressions, specialized vocabulary (if relevant to the topic), and complex example sentences that demonstrate advanced usage.
    *   Ensure that the selected words are commonly learned or considered essential for a user at the {{{proficiencyLevel}}} studying this {{{topic}}}.
2.  **Translations:** For each word, provide an accurate translation into the {{{interfaceLanguage}}}.
3.  **Example Sentences (Optional but HIGHLY encouraged):** For each word, try to provide a simple, clear example sentence in the {{{targetLanguage}}} that demonstrates its usage. The complexity of the example sentence MUST also be appropriate for the {{{proficiencyLevel}}}.

Output Format: Ensure your response is a JSON object matching the defined output schema.
The 'words' array should contain objects, each with 'word', 'translation', and optionally 'exampleSentence'.
`,
});

const generateVocabularyFlow = ai.defineFlow(
  {
    name: 'generateVocabularyFlow',
    inputSchema: GenerateVocabularyInputSchema,
    outputSchema: GenerateVocabularyOutputSchema,
  },
  async (input) => {
    const {output} = await generateVocabularyPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate vocabulary list. Output was null.");
    }
    return output;
  }
);

