'use server';
/**
 * @fileOverview AI-powered reading material generator.
 *
 * - generateReadingMaterial - A function that generates reading text and comprehension questions.
 * - GenerateReadingMaterialInput - The input type for the function.
 * - GenerateReadingMaterialOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

const GenerateReadingMaterialInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for instructions and comprehension questions (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language for the reading text (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2) to tailor text complexity.'),
  topic: z.string().min(3).describe('The topic for the reading material (e.g., "Daily Routines", "Space Exploration").'),
  goals: z.array(z.string()).describe('User learning goals.'),
  interests: z.array(z.string()).describe('User interests.'),
  topicMistakes: z.record(z.number()).optional().describe('User mistakes by topic.'),
  grammarMistakes: z.record(z.number()).optional().describe('User mistakes by grammar point.'),
  vocabMistakes: z.record(z.number()).optional().describe('User mistakes by vocabulary.'),
  userPastErrors: z.string().optional().describe('A list of the user\'s prior known errors in their past practice tasks.'),
});
export type GenerateReadingMaterialInput = z.infer<typeof GenerateReadingMaterialInputSchema>;

const ComprehensionQuestionSchema = z.object({
  question: z.string().describe('The comprehension question text in the interfaceLanguage.'),
  options: z.array(z.string()).optional().describe('An array of options for multiple-choice questions, in the interfaceLanguage.'),
  answer: z.string().optional().describe('The correct answer or an indication of the correct option for multiple-choice questions, in the interfaceLanguage.'),
  explanation: z.string().optional().describe('A detailed explanation in interfaceLanguage about why the answer is correct, with examples if possible.')
});

const VocabularyEntrySchema = z.object({
  word: z.string().describe('A key vocabulary word from the text, in the targetLanguage. MUST be a single word.'),
  translation: z.string().describe('The translation of the word into the interfaceLanguage.'),
});

const GenerateReadingMaterialOutputSchema = z.object({
  title: z.string().optional().describe('A suitable title for the reading text, in the targetLanguage.'),
  readingText: z.string().describe('The generated reading text in the targetLanguage, adapted to the proficiencyLevel.'),
  comprehensionQuestions: z.array(ComprehensionQuestionSchema).optional().describe('An array of 2-3 comprehension questions about the text, with questions and options in the interfaceLanguage.'),
  vocabulary: z.array(VocabularyEntrySchema).min(10).max(20).optional().describe('A list of 10-20 key vocabulary words from the text with their translations into the interfaceLanguage. Focus on important nouns, verbs, and adjectives relevant to the topic and proficiency level.'),
});
export type GenerateReadingMaterialOutput = z.infer<typeof GenerateReadingMaterialOutputSchema>;


export async function generateReadingMaterial(input: GenerateReadingMaterialInput): Promise<GenerateReadingMaterialOutput> {
  return generateReadingMaterialFlow(input);
}

const generateReadingMaterialPrompt = ai.definePrompt({
  name: 'generateReadingMaterialPrompt',
  input: {schema: GenerateReadingMaterialInputSchema},
  output: {schema: GenerateReadingMaterialOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating engaging reading materials.

Task: Generate a short reading text, optional comprehension questions, and a key vocabulary list based on the user's preferences and learning profile.

User Profile:
- Interface Language (for questions/instructions/translations): {{{interfaceLanguage}}}
- Target Language (for the reading text): {{{targetLanguage}}}
- Proficiency Level (for text complexity): {{{proficiencyLevel}}}
- Topic: {{{topic}}}
- User Goals: {{#if goals.length}}{{goals}}{{else}}не указаны{{/if}}
- User Interests: {{#if interests.length}}{{interests}}{{else}}не указаны{{/if}}
- Mistakes by topic: {{#if topicMistakes}}{{topicMistakes}}{{else}}нет данных{{/if}}
- Mistakes by grammar: {{#if grammarMistakes}}{{grammarMistakes}}{{else}}нет данных{{/if}}
- Mistakes by vocabulary: {{#if vocabMistakes}}{{vocabMistakes}}{{else}}нет данных{{/if}}
- User's Past Errors (if any): {{{userPastErrors}}}

CRITICAL Instructions:
1.  **Reading Text:**
    *   The generated text MUST be highly relevant to the specified {{{topic}}} and appropriate for the {{{proficiencyLevel}}}.
    *   Subtly weave in correct usage of grammar or vocabulary related to 'userPastErrors' if provided.
2.  **Comprehension Questions:**
    *   Generate 2-4 questions to check understanding.
    *   For each question, provide a 'question' in the '{{{interfaceLanguage}}}', a correct 'answer', and a detailed 'explanation' in the '{{{interfaceLanguage}}}'.
    *   Optionally include an 'options' array for multiple-choice questions.
3.  **Vocabulary List:**
    *   Create a 'vocabulary' array containing 10-20 key words from the text.
    *   For each entry, provide the 'word' in the {{{targetLanguage}}} and its 'translation' in the {{{interfaceLanguage}}}.
    *   The words MUST be single words (not phrases) and should be relevant to the {{{topic}}} and proficiency level. Focus on important nouns, verbs, and adjectives.
4.  **Output Format:** Your response MUST be a JSON object matching the defined output schema.
`,
});

const generateReadingMaterialFlow = ai.defineFlow(
  {
    name: 'generateReadingMaterialFlow',
    inputSchema: GenerateReadingMaterialInputSchema,
    outputSchema: GenerateReadingMaterialOutputSchema,
  },
  async (input) => {
    const {output} = await generateReadingMaterialPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate reading material. Output was null.");
    }
    return output;
  }
);
