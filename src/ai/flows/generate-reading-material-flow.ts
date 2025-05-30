
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
import type { InterfaceLanguage as AppInterfaceLanguage, TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';
import { interfaceLanguageCodes, targetLanguageNames, proficiencyLevels } from '@/lib/types';

const GenerateReadingMaterialInputSchema = z.object({
  interfaceLanguage: z.enum(interfaceLanguageCodes).describe('The ISO 639-1 code of the language for instructions and comprehension questions (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language for the reading text (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2) to tailor text complexity.'),
  topic: z.string().min(3).describe('The topic for the reading material (e.g., "Daily Routines", "Space Exploration").'),
});
export type GenerateReadingMaterialInput = z.infer<typeof GenerateReadingMaterialInputSchema>;

const ComprehensionQuestionSchema = z.object({
  question: z.string().describe('The comprehension question text in the interfaceLanguage.'),
  options: z.array(z.string()).optional().describe('An array of options for multiple-choice questions, in the interfaceLanguage.'),
  answer: z.string().optional().describe('The correct answer or an indication of the correct option for multiple-choice questions, in the interfaceLanguage.'),
});

const GenerateReadingMaterialOutputSchema = z.object({
  title: z.string().optional().describe('A suitable title for the reading text, in the targetLanguage.'),
  readingText: z.string().describe('The generated reading text in the targetLanguage, adapted to the proficiencyLevel.'),
  comprehensionQuestions: z.array(ComprehensionQuestionSchema).optional().describe('An array of 2-3 comprehension questions about the text, with questions and options in the interfaceLanguage.'),
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

Task: Generate a short reading text and optional comprehension questions based on the user's preferences.

User Preferences:
- Interface Language (for questions/instructions): {{{interfaceLanguage}}}
- Target Language (for the reading text): {{{targetLanguage}}}
- Proficiency Level (for text complexity): {{{proficiencyLevel}}}
- Topic: {{{topic}}}

Instructions:
1.  **Title (Optional):** Generate a concise and relevant title for the reading text. The title MUST be in the {{{targetLanguage}}}.
2.  **Reading Text:**
    *   Generate a coherent and engaging text on the specified {{{topic}}}.
    *   The text MUST be in the {{{targetLanguage}}}.
    *   The complexity of vocabulary, sentence structure, and overall content MUST be appropriate for the {{{proficiencyLevel}}}. Aim for approximately 150-200 words for A1-A2, 200-250 for B1-B2, and 250-300 for C1-C2.
    *   Ensure the text is grammatically correct and natural-sounding.
3.  **Comprehension Questions (Optional, 2-3 questions):**
    *   If you generate questions, they should test understanding of the main ideas or key details of the {{{readingText}}}.
    *   Each question (the 'question' field) MUST be in the {{{interfaceLanguage}}}.
    *   If providing multiple-choice options (the 'options' array), these options MUST also be in the {{{interfaceLanguage}}}.
    *   Provide the correct answer or an indication of the correct option (the 'answer' field), also in the {{{interfaceLanguage}}}. This could be the full answer for open questions, or the letter/number of the correct option for multiple choice.
    *   Keep questions relatively simple and appropriate for the user's ability to understand them in their {{{interfaceLanguage}}} after reading a text in the {{{targetLanguage}}} at the specified {{{proficiencyLevel}}}.

Output Format: Ensure your response is a JSON object matching the defined output schema.
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
