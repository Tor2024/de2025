
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


export const ExplainGrammarTaskErrorInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for the explanation (e.g., en, ru).'),
  grammarTopic: z.string().describe('The grammar topic the user was practicing.'),
  taskDescription: z.string().describe('The description of the task the user attempted.'),
  userAttempt: z.string().describe("The user's incorrect answer."),
  correctAnswer: z.string().describe('The correct answer to the task.'),
});
export type ExplainGrammarTaskErrorInput = z.infer<typeof ExplainGrammarTaskErrorInputSchema>;

export const ExplainGrammarTaskErrorOutputSchema = z.object({
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
  prompt: `You are an expert language tutor, specializing in explaining grammar mistakes.
Your response MUST be in the language specified by the ISO 639-1 code: {{{interfaceLanguage}}}.
ABSOLUTELY NO MARKDOWN-LIKE FORMATTING. Do NOT use asterisks (*), underscores (_), or any other special characters for emphasis or formatting in your response. Present all text plainly.
Ensure your explanation is well-suited for text-to-speech conversion (clear, concise, avoids complex sentence structures if possible).

A user attempted a grammar task on the topic: "{{{grammarTopic}}}".
The task was: "{{{taskDescription}}}"
The correct answer was: "{{{correctAnswer}}}"
The user's answer was: "{{{userAttempt}}}"

Please provide a detailed explanation of why the user's answer was incorrect.
- Clearly point out the mistake.
- Explain the relevant grammar rule(s) related to "{{{grammarTopic}}}" that the user misunderstood or misapplied.
- Explain why the provided "{{{correctAnswer}}}" is correct according to these rules.
- Be constructive and encouraging.
- Keep the explanation focused on this specific error and task.
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
