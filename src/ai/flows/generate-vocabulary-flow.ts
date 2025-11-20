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
  goals: z.array(z.string()).describe('User learning goals.'),
  interests: z.array(z.string()).describe('User interests.'),
  topicMistakes: z.record(z.number()).optional().describe('User mistakes by topic.'),
  grammarMistakes: z.record(z.number()).optional().describe('User mistakes by grammar point.'),
  vocabMistakes: z.record(z.number()).optional().describe('User mistakes by vocabulary.'),
  userPastErrors: z.string().optional().describe('A list of the user\'s prior known errors in their past practice tasks.'),
});
export type GenerateVocabularyInput = z.infer<typeof GenerateVocabularyInputSchema>;

const VocabularyWordSchema = z.object({ 
    word: z.string().describe('The vocabulary word in the targetLanguage.'),
    translation: z.string().describe('The translation of the word into the interfaceLanguage.'),
    exampleSentence: z.string().optional().describe('An example sentence using the word in the targetLanguage.'),
});
export type VocabularyWord = z.infer<typeof VocabularyWordSchema>;

const GenerateVocabularyOutputSchema = z.object({
  words: z.array(VocabularyWordSchema).min(10).max(20).describe('A list of 10-20 vocabulary words with translations and example sentences, fully covering the topic for the specified proficiency level.'),
});
export type GenerateVocabularyOutput = z.infer<typeof GenerateVocabularyOutputSchema>;


export async function generateVocabulary(input: GenerateVocabularyInput): Promise<GenerateVocabularyOutput> {
  return generateVocabularyFlow(input);
}

const generateVocabularyPrompt = ai.definePrompt({
  name: 'generateVocabularyPrompt',
  input: {schema: GenerateVocabularyInputSchema},
  output: {schema: GenerateVocabularyOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating comprehensive vocabulary lists.

Task: Generate a list of 10-20 relevant vocabulary words based on the user's preferences and learning profile. The list must fully cover the specified topic for the given proficiency level.

User Profile:
- Interface Language (for translations): {{{interfaceLanguage}}}
- Target Language (for the vocabulary words): {{{targetLanguage}}}
- Proficiency Level (for word complexity): {{{proficiencyLevel}}}
- Topic: {{{topic}}}
- User Goals: {{#if goals.length}}{{goals}}{{else}}не указаны{{/if}}
- User Interests: {{#if interests.length}}{{interests}}{{else}}не указаны{{/if}}
- Mistakes by topic: {{#if topicMistakes}}{{topicMistakes}}{{else}}нет данных{{/if}}
- Mistakes by grammar: {{#if grammarMistakes}}{{grammarMistakes}}{{else}}нет данных{{/if}}
- Mistakes by vocabulary: {{#if vocabMistakes}}{{vocabMistakes}}{{else}}нет данных{{/if}}
- User's Past Errors (if any): {{{userPastErrors}}}

CRITICAL Instructions:
1.  **Comprehensive Coverage:** The list of 10-20 words you generate MUST be comprehensive and fully cover the core vocabulary for the specified {{{topic}}} at the user's {{{proficiencyLevel}}}.
2.  **Level Appropriateness:** The complexity of the words, their translations, and especially the example sentences MUST strictly correspond to the {{{proficiencyLevel}}}.
3.  **Relevance and Personalization:**
    *   Where possible, consider the user's interests, goals, and weaknesses (past errors, topics, grammar, vocab) to make the word selection and examples more relevant and useful for addressing these aspects.
    *   Ensure that the selected words are commonly learned or considered essential for a user at the {{{proficiencyLevel}}} studying this {{{topic}}}.
4.  **Translations:** For each word, provide an accurate translation into the {{{interfaceLanguage}}}.
5.  **Example Sentences:** For each word, you MUST provide a simple, clear example sentence in the {{{targetLanguage}}} that demonstrates its usage. The complexity of the example sentence MUST also be appropriate for the {{{proficiencyLevel}}}.
    *   If 'userPastErrors' is provided, some examples should be aimed at addressing them.
6.  **Output Format:** Ensure your response is a JSON object matching the defined output schema.
The 'words' array should contain objects, each with 'word', 'translation', and 'exampleSentence'.
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
