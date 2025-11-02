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
});
export type GenerateReadingMaterialInput = z.infer<typeof GenerateReadingMaterialInputSchema>;

const ComprehensionQuestionSchema = z.object({
  question: z.string().describe('The comprehension question text in the interfaceLanguage.'),
  options: z.array(z.string()).optional().describe('An array of options for multiple-choice questions, in the interfaceLanguage.'),
  answer: z.string().optional().describe('The correct answer or an indication of the correct option for multiple-choice questions, in the interfaceLanguage.'),
  explanation: z.string().optional().describe('A detailed explanation in interfaceLanguage about why the answer is correct, with examples if possible.')
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

Task: Generate a short reading text and optional comprehension questions based on the user's preferences and learning profile.

User Profile:
- Interface Language (for questions/instructions): {{{interfaceLanguage}}}
- Target Language (for the reading text): {{{targetLanguage}}}
- Proficiency Level (for text complexity): {{{proficiencyLevel}}}
- Topic: {{{topic}}}
- User Goals: {{#if goals.length}}{{goals}}{{else}}не указаны{{/if}}
- User Interests: {{#if interests.length}}{{interests}}{{else}}не указаны{{/if}}
- Mistakes by topic: {{#if topicMistakes}}{{topicMistakes}}{{else}}нет данных{{/if}}
- Mistakes by grammar: {{#if grammarMistakes}}{{grammarMistakes}}{{else}}нет данных{{/if}}
- Mistakes by vocabulary: {{#if vocabMistakes}}{{vocabMistakes}}{{else}}нет данных{{/if}}

CRITICAL Instructions:
1.  **Text Relevance and Level Appropriateness:**
    *   The generated text MUST be highly relevant to the specified {{{topic}}}.
    *   The complexity of the text, questions, и особенно примеры ДОЛЖНЫ строго соответствовать уровню {{{proficiencyLevel}}}.
    *   Where possible, учитывай интересы, цели и слабые места пользователя (ошибки, темы, грамматика, лексика) — делай текст более релевантным и полезным для проработки этих аспектов.
    *   Ensure that the selected text is commonly learned or considered essential for a user at the {{{proficiencyLevel}}} studying this {{{topic}}}.
2.  **Comprehension Questions:** Generate 2-4 questions to check understanding. Для каждого вопроса: формулируй его максимально понятно для новичка, всегда указывай, что именно должен сделать пользователь (например: выбрать правильный вариант, вписать слово, ответить на вопрос по содержанию и т.д.). Если есть риск неоднозначности, добавь короткую подсказку или пример. Избегай слишком кратких и абстрактных формулировок. Для каждого вопроса указывай правильный ответ и, если возможно, варианты (для multiple choice).
3.  **Detailed Explanations:** For each question, you MUST provide a detailed explanation in the 'explanation' field. This explanation should clarify why the correct answer is right and, if applicable, why the other options are wrong, citing evidence from the reading text. The explanation MUST be in the {{{interfaceLanguage}}} and be friendly and supportive.
4.  **Output Format:** Ensure your response is a JSON object matching the defined output schema.
The 'comprehensionQuestions' array should contain objects, each with 'question', 'answer', 'explanation', and optionally 'options'.
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
