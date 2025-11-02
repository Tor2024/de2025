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
 * - PracticeTask - The type for individual practice tasks.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { proficiencyLevels as appProficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';
import type { ProficiencyLevel as AppProficiencyLevel, InterfaceLanguage as AppInterfaceLanguage } from '@/lib/types';


const AdaptiveGrammarExplanationsInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de). All explanations and task instructions MUST be in this language.'),
  grammarTopic: z.string().describe('The grammar topic to explain.'),
  proficiencyLevel: z.enum(appProficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2).'),
  goals: z.array(z.string()).describe('User learning goals.'),
  interests: z.array(z.string()).describe('User interests.'),
  topicMistakes: z.record(z.number()).optional().describe('User mistakes by topic.'),
  grammarMistakes: z.record(z.number()).optional().describe('User mistakes by grammar point.'),
  vocabMistakes: z.record(z.number()).optional().describe('User mistakes by vocabulary.'),
  userPastErrors: z.string().describe('A list of the user prior known errors in their past practice tasks. This could be a comma-separated list or a more structured description of errors. Example format for one error: "Module: Word Practice, Context: The cat ____ on the mat., User attempt: jump, Correct: sat"'),
});
export type AdaptiveGrammarExplanationsInput = z.infer<typeof AdaptiveGrammarExplanationsInputSchema>;

const PracticeTaskSchema = z.object({
  id: z.string().describe('A unique ID for the task, e.g., "task_1", "task_2".'),
  type: z.enum(['fill-in-the-blank']).describe('The type of the task. For now, only "fill-in-the-blank" is supported.'),
  taskDescription: z.string().describe('The task itself, including very clear instructions on what the user should do and in what format the answer is expected. E.g., for a fill-in-the-blank task: "Complete the sentence: The cat ____ on the mat." The blank should be indicated by "____". This description MUST be in the {{{interfaceLanguage}}}.'),
  correctAnswer: z.string().describe('The correct word(s) for the blank. This should be in the target language the user is learning.'),
});
export type PracticeTask = z.infer<typeof PracticeTaskSchema>;

const AdaptiveGrammarExplanationsOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the grammar topic. Ensure the text is well-suited for text-to-speech conversion (clear, concise, avoids complex sentence structures if possible). This explanation must be in the {{{interfaceLanguage}}}. When target language examples are included, they MUST be marked with ##TARGET_LANG_START## and ##TARGET_LANG_END## delimiters. For example: "В немецком языке это будет звучать так: ##TARGET_LANG_START##Das ist ein Beispiel.##TARGET_LANG_END## Обратите внимание на порядок слов." ABSOLUTELY NO OTHER MARKDOWN-LIKE FORMATTING.'),
  practiceTasks: z.array(PracticeTaskSchema).min(10).describe('A list of at least 10 practice tasks tailored to the user. These tasks must be in the {{{interfaceLanguage}}}.'),
});
export type AdaptiveGrammarExplanationsOutput = z.infer<typeof AdaptiveGrammarExplanationsOutputSchema>;

export async function adaptiveGrammarExplanations(input: AdaptiveGrammarExplanationsInput): Promise<AdaptiveGrammarExplanationsOutput> {
  return adaptiveGrammarExplanationsFlow(input);
}

const adaptiveGrammarExplanationsPrompt = ai.definePrompt({
  name: 'adaptiveGrammarExplanationsPrompt',
  input: {schema: AdaptiveGrammarExplanationsInputSchema},
  output: {schema: AdaptiveGrammarExplanationsOutputSchema},
  prompt: `You are an expert language tutor, specializing in grammar explanations.

You will generate a grammar explanation and structured practice tasks tailored to the user's proficiency level, learning goals, interests, interface language, and common mistakes. Ensure the explanation is clear, concise, easy to understand, and TTS-friendly.

User Details:
- Grammar Topic: {{{grammarTopic}}}
- Proficiency Level: {{{proficiencyLevel}}}
- User Goals: {{{goalsString}}}
- User Interests: {{{interestsString}}}
- Mistakes by topic: {{{topicMistakesString}}}
- Mistakes by grammar: {{{grammarMistakesString}}}
- Mistakes by vocabulary: {{{vocabMistakesString}}}
- User's Past Errors (if any, pay attention to those relevant to the current Grammar Topic):
{{#if firstPastErrorModule}}
Module: {{{firstPastErrorModule}}}, Context: {{{firstPastErrorContext}}}, User attempt: {{{firstPastErrorUserAttempt}}}, Correct: {{{firstPastErrorCorrect}}}
(Full error list: {{{userPastErrors}}})
{{else}}
(No specific past error details provided for quick reference, but consider the general list if available: {{{userPastErrors}}})
{{/if}}

CRITICAL INSTRUCTIONS FOR LANGUAGE AND FORMATTING:
1.  **Interface Language ({{{interfaceLanguage}}})**:
    *   ALL textual content of your 'explanation' field MUST be in this language. This includes all instructions, subheadings, and explanatory text.
    *   For EACH task in the 'practiceTasks' array, the 'taskDescription' field (which includes the instructions for the task) MUST be in this language.
2.  **Target Language Examples (within the 'explanation' field)**:
    *   When explaining the '{{{grammarTopic}}}' for the target language the user is learning, all example sentences or phrases demonstrating the grammar rule MUST be IN THE TARGET LANGUAGE.
    *   You MUST enclose these target language examples with special delimiters:
        *   Start of target language example: \`##TARGET_LANG_START##\`
        *   End of target language example: \`##TARGET_LANG_END##\`
    *   For instance, if \`{{{interfaceLanguage}}}\` is Russian and the target language is German, an explanation segment might look like:
        "В немецком языке это будет звучать так: ##TARGET_LANG_START##Das ist ein Beispiel.##TARGET_LANG_END## Обратите внимание на порядок слов."
    *   Ensure these delimiters are used precisely and only around text that is strictly in the target language. The surrounding explanatory text remains in \`{{{interfaceLanguage}}}\`.
    *   If you provide translations for these target language example sentences to help the user understand, these translations MUST be into the '{{{interfaceLanguage}}}' and be OUTSIDE the ##TARGET_LANG_START##...##TARGET_LANG_END## delimiters.
    *   **STRICT REQUIREMENT:** Inside ##TARGET_LANG_START##...##TARGET_LANG_END## there must be ONLY words and phrases in the target language (German). There MUST NOT be any Russian words or mixed-language phrases inside these markers. If you see a phrase like 'Ich bin студент.', this is INVALID. It must be 'Ich bin Student.' or another correct German phrase. If you need to show a translation, do it OUTSIDE the markers, in the interface language.
3.  **ABSOLUTELY NO OTHER MARKDOWN-LIKE FORMATTING**: Do NOT use asterisks (*), underscores (_), or any other special characters for emphasis or formatting in any part of your response (explanation, task descriptions), EXCEPT for the required ##TARGET_LANG_START## and ##TARGET_LANG_END## delimiters. Present all text plainly.
4.  **Practice Task Structure**: Each task in the 'practiceTasks' array MUST be an object with:
    *   'id': A unique ID (e.g., "task_1").
    *   'type': Currently only "fill-in-the-blank".
    *   'taskDescription': The task itself, including VERY CLEAR AND UNAMBIGUOUS instructions on what the user should do and in what format the answer is expected. Для каждой инструкции: формулируй максимально понятно для новичка, всегда указывай, что именно должен сделать пользователь (например: вписать слово, выбрать вариант, вставить артикль и т.д.). Если есть риск неоднозначности, добавь короткую подсказку или пример. Избегай слишком кратких и абстрактных формулировок.
    *   'correctAnswer': The correct word(s) for the blank. This MUST be in the target language.

Your task:
1.  Provide a very **Detailed Explanation** of the {{{grammarTopic}}}.
    *   This explanation must be in the {{{interfaceLanguage}}}.
    *   Make sure the explanation is well-suited for text-to-speech conversion (clear, simple sentences).
    *   Embed target language examples using ##TARGET_LANG_START## and ##TARGET_LANG_END## delimiters as specified above.
    *   The explanation must be very detailed. Explain *why* the rule is the way it is, not just what the rule is. Use analogies, comparisons to the user's interface language if possible, and provide at least 2-3 different examples for each key aspect of the rule.
    *   Объяснение должно быть подробным, с разъяснением, почему правило работает именно так, а другие варианты неверны. Приводи примеры, сравнения, аналогии, если это поможет лучше понять материал. Стиль объяснения — дружелюбный, поддерживающий, но обстоятельный, без сложных терминов без объяснения.
2.  If the {{{userPastErrors}}} or mistakes are provided and contain errors relevant to the current {{{grammarTopic}}}, subtly tailor parts of your explanation and some practice tasks to help address these specific past weaknesses. Не говори явно "вы ошибались", а просто усиливай проработку этих мест.
3.  Generate a list of **at least 10 Practice Tasks**. These tasks should:
    *   Follow the structured format described in "Practice Task Structure" above.
    *   The 'taskDescription' MUST be in the {{{interfaceLanguage}}} и быть максимально понятной и однозначной.
    *   The 'correctAnswer' MUST be in the target language.
    *   Be suitable for the user's {{{proficiencyLevel}}}.
    *   Help achieve the {{{goalsString}}}.
    *   Если есть ошибки или слабые места, часть заданий должна быть направлена на их проработку.

Output format:
Your response must be a JSON object matching the defined output schema.

В инструкции к генерации practiceTasks и объяснений:
- Если в формулировке задания явно сказано 'вставьте букву', 'впишите букву', 'укажите букву', то правильным считается ответ, совпадающий с нужной буквой, а не только с полным словом. Проверяй и объясняй строго в соответствии с формулировкой задания.
`,
});

const adaptiveGrammarExplanationsFlow = ai.defineFlow(
  {
    name: 'adaptiveGrammarExplanationsFlow',
    inputSchema: AdaptiveGrammarExplanationsInputSchema,
    outputSchema: AdaptiveGrammarExplanationsOutputSchema,
  },
  async (input: AdaptiveGrammarExplanationsInput) => {
    const promptData: AdaptiveGrammarExplanationsInput & Record<string, any> = { ...input };

    // Формируем строки для целей и интересов
    promptData.goalsString = Array.isArray(input.goals) ? (input.goals.length > 0 ? input.goals.join(', ') : 'не указаны') : (input.goals || 'не указаны');
    promptData.interestsString = Array.isArray(input.interests) ? (input.interests.length > 0 ? input.interests.join(', ') : 'не указаны') : (input.interests || 'не указаны');
    // Формируем строки для ошибок
    promptData.topicMistakesString = input.topicMistakes ? JSON.stringify(input.topicMistakes) : 'нет данных';
    promptData.grammarMistakesString = input.grammarMistakes ? JSON.stringify(input.grammarMistakes) : 'нет данных';
    promptData.vocabMistakesString = input.vocabMistakes ? JSON.stringify(input.vocabMistakes) : 'нет данных';

    // Initialize default values for first past error details
    promptData.firstPastErrorModule = 'N/A';
    promptData.firstPastErrorContext = 'N/A';
    promptData.firstPastErrorUserAttempt = 'N/A';
    promptData.firstPastErrorCorrect = 'N/A';

    if (input.userPastErrors && input.userPastErrors !== "No past errors recorded.") {
      const firstErrorLine = input.userPastErrors.split('\n')[0];
      if (firstErrorLine) {
        // Regex to capture values for each key, allowing commas within values
        const moduleMatch = firstErrorLine.match(/Module:\s*(.*?)(?=\s*,\s*Context:|$)/);
        const contextMatch = firstErrorLine.match(/Context:\s*(.*?)(?=\s*,\s*User attempt:|$)/);
        const attemptMatch = firstErrorLine.match(/User attempt:\s*(.*?)(?=\s*,\s*Correct:|$)/);
        const correctMatch = firstErrorLine.match(/Correct:\s*(.*)$/);

        promptData.firstPastErrorModule = moduleMatch && moduleMatch[1] ? moduleMatch[1].trim() : 'N/A';
        promptData.firstPastErrorContext = contextMatch && contextMatch[1] ? contextMatch[1].trim() : 'N/A';
        promptData.firstPastErrorUserAttempt = attemptMatch && attemptMatch[1] ? attemptMatch[1].trim() : 'N/A';
        promptData.firstPastErrorCorrect = correctMatch && correctMatch[1] ? correctMatch[1].trim() : 'N/A';
      }
    }

    const {output} = await adaptiveGrammarExplanationsPrompt(promptData);
    if (!output) {
        throw new Error("AI failed to generate grammar explanation. Output was null.");
    }
    return output;
  }
);
