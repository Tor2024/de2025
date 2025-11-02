'use server';
/**
 * @fileOverview Explains a user's error in a grammar task.
 *
 * - explainGrammarTaskError - A function that provides an explanation for a user's mistake.
 * - ExplainGrammarTaskErrorInput - The input type for the function.
 * - ExplainGrammarTaskErrorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { InterfaceLanguageSchema } from '@/lib/types';


const ExplainGrammarTaskErrorInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for the explanation (e.g., en, ru).'),
  grammarTopic: z.string().describe('The grammar topic the user was practicing.'),
  taskDescription: z.string().describe('The description of the task the user attempted.'),
  userAttempt: z.string().describe("The user's incorrect answer."),
  correctAnswer: z.string().describe('The correct answer to the task.'),
});
export type ExplainGrammarTaskErrorInput = z.infer<typeof ExplainGrammarTaskErrorInputSchema>;

const ExplainGrammarTaskErrorOutputSchema = z.object({
  explanation: z.string().describe('A detailed explanation of why the user\'s answer was incorrect, in the specified interfaceLanguage. This explanation should be clear, constructive, and refer to grammar rules related to the grammarTopic. It should also be TTS-friendly and avoid markdown-like formatting.'),
});
export type ExplainGrammarTaskErrorOutput = z.infer<typeof ExplainGrammarTaskErrorOutputSchema>;

export async function explainGrammarTaskError(input: ExplainGrammarTaskErrorInput): Promise<ExplainGrammarTaskErrorOutput> {
  return explainGrammarTaskErrorFlow(input);
}

const explainGrammarTaskErrorPrompt = ai.definePrompt({
  name: 'explainGrammarTaskErrorPrompt',
  input: {schema: ExplainGrammarTaskErrorInputSchema},
  output: {schema: ExplainGrammarTaskErrorOutputSchema},
  prompt: `You are an expert language tutor, specializing in explaining grammar mistakes in a very detailed and encouraging way.
Your response MUST be in the language specified by the ISO 639-1 code: {{{interfaceLanguage}}}.
ABSOLUTELY NO MARKDOWN-LIKE FORMATTING. Do NOT use asterisks (*), underscores (_), or any other special characters for emphasis or formatting in your response. Present all text plainly.
Ensure your explanation is well-suited for text-to-speech conversion (clear, concise, avoids complex sentence structures where possible).

A user attempted a grammar task on the topic: "{{{grammarTopic}}}".
The task was: "{{{taskDescription}}}"
The correct answer was: "{{{correctAnswer}}}"
The user's answer was: "{{{userAttempt}}}"

Please provide a very detailed, step-by-step explanation of why the user's answer was incorrect. Structure your explanation as follows:

1.  **Acknowledge and Encourage**: Start with a positive and encouraging tone, even if the answer is wrong. For example, "Хорошая попытка, давайте разберемся вместе!" или "Вы близки к правильному ответу, это распространенная ошибка!".
2.  **Identify the Core Mistake**: Clearly and simply state what the main error was. For example, "Здесь ошибка в окончании глагола" или "В этом контексте требуется другой предлог".
3.  **Explain the Rule in Detail**:
    *   Explain the relevant grammar rule(s) from "{{{grammarTopic}}}" that the user misunderstood or misapplied.
    *   Explain it simply, as if you're talking to a beginner. Use analogies if they help.
    *   Provide **at least two clear examples** of the rule being used correctly. For each example, briefly explain how the rule applies.
4.  **Compare and Contrast**:
    *   Directly compare the user's incorrect answer ("{{{userAttempt}}}") with the correct answer ("{{{correctAnswer}}}").
    *   Explain exactly *why* "{{{correctAnswer}}}" is correct in this specific sentence and *why* "{{{userAttempt}}}" is incorrect. For example: "В этом предложении мы говорим о прошлом, поэтому нужен глагол в форме Präteritum 'war', а не в настоящем времени 'ist'".
5.  **Provide a "Tip to Remember" (Совет для запоминания)**: Give a simple mnemonic, tip, or a key question the user can ask themselves in the future to avoid this mistake. For example, "Чтобы выбрать между 'mir' и 'mich', спросите себя: 'Кому?' (Dativ) или 'Кого?' (Akkusativ)?".
6.  **Maintain a Friendly Tone**: The overall tone should be supportive, not critical. The goal is to build confidence.

- Если ответ пользователя частично совпадает с правильным (например, буква или часть слова), обязательно укажи, что он был близок, и объясни, чего не хватило.
- Если задание на вставку буквы/части слова, объясняй, почему засчитан только полный ответ.
- Приводи сравнения с другими словами, если это поможет запомнить.
- Не повторяй очевидное, если пользователь уже понял суть.
`,
});

const explainGrammarTaskErrorFlow = ai.defineFlow(
  {
    name: 'explainGrammarTaskErrorFlow',
    inputSchema: ExplainGrammarTaskErrorInputSchema,
    outputSchema: ExplainGrammarTaskErrorOutputSchema,
  },
  async (input) => {
    const {output} = await explainGrammarTaskErrorPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate an explanation for the grammar task error. Output was null.");
    }
    return output;
  }
);
