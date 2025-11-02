'use server';
/**
 * @fileOverview AI-powered listening material generator.
 *
 * - generateListeningMaterial - A function that generates a listening script and comprehension questions.
 * - GenerateListeningMaterialInput - The input type for the function.
 * - GenerateListeningMaterialOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

const GenerateListeningMaterialInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for the scenario description and comprehension questions (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language for the listening script (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2) to tailor script complexity.'),
  topic: z.string().min(3).describe('The topic for the listening material (e.g., "Ordering food", "Weekend plans").'),
  goals: z.array(z.string()).describe('User learning goals.'),
  interests: z.array(z.string()).describe('User interests.'),
  topicMistakes: z.record(z.number()).optional().describe('User mistakes by topic.'),
  grammarMistakes: z.record(z.number()).optional().describe('User mistakes by grammar point.'),
  vocabMistakes: z.record(z.number()).optional().describe('User mistakes by vocabulary.'),
});
export type GenerateListeningMaterialInput = z.infer<typeof GenerateListeningMaterialInputSchema>;

const ComprehensionQuestionSchema = z.object({
  question: z.string().describe('The comprehension question text in the interfaceLanguage.'),
  options: z.array(z.string()).min(3).max(4).describe('An array of 3-4 options for multiple-choice questions, in the interfaceLanguage.'),
  answer: z.string().describe('The correct answer, which MUST be one of the provided options. This text MUST be in the interfaceLanguage.'),
});

const GenerateListeningMaterialOutputSchema = z.object({
  title: z.string().optional().describe('A suitable title for the listening material, in the targetLanguage.'),
  scenario: z.string().optional().describe('A brief description of the listening scenario (e.g., "A conversation at a train station"), in the interfaceLanguage.'),
  script: z.string().describe('The generated listening script (dialogue or monologue) in the targetLanguage, adapted to the proficiencyLevel.'),
  comprehensionQuestions: z.array(ComprehensionQuestionSchema).min(2).max(4).describe('An array of 2-4 multiple-choice comprehension questions about the script, with questions and options in the interfaceLanguage.'),
});
export type GenerateListeningMaterialOutput = z.infer<typeof GenerateListeningMaterialOutputSchema>;

export async function generateListeningMaterial(input: GenerateListeningMaterialInput): Promise<GenerateListeningMaterialOutput> {
    return generateListeningMaterialFlow(input);
}


const generateListeningMaterialPrompt = ai.definePrompt({
  name: 'generateListeningMaterialPrompt',
  input: {schema: GenerateListeningMaterialInputSchema},
  output: {schema: GenerateListeningMaterialOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating engaging listening materials.

Task: Generate a listening script and 2-4 multiple-choice comprehension questions based on the user's preferences and learning profile.

User Profile:
- Interface Language (for questions/instructions): {{{interfaceLanguage}}}
- Target Language (for the listening script): {{{targetLanguage}}}
- Proficiency Level (for script and question complexity): {{{proficiencyLevel}}}
- Topic: {{{topic}}}
- User Goals: {{#if goals.length}}{{goals}}{{else}}не указаны{{/if}}
- User Interests: {{#if interests.length}}{{interests}}{{else}}не указаны{{/if}}

CRITICAL INSTRUCTIONS:
1.  **Listening Script:**
    *   Create a short, coherent, and engaging monologue or dialogue in the {{{targetLanguage}}}.
    *   The script's length, grammar, and vocabulary MUST be appropriate for the user's {{{proficiencyLevel}}}.
    *   The script MUST be directly related to the specified {{{topic}}}.
2.  **Comprehension Questions (Multiple Choice ONLY):**
    *   Generate 2 to 4 multiple-choice questions about the script.
    *   Each question must have 3 or 4 distinct options.
    *   There MUST be only ONE correct answer for each question.
    *   The question text, all options, and the final 'answer' field MUST be in the {{{interfaceLanguage}}}.
    *   The 'answer' field MUST exactly match the text of one of the provided options.
    *   Questions should test understanding of the main ideas, specific details, or implied meanings in the script. Avoid questions that can be answered without understanding the script.
    *   Distractor options should be plausible but incorrect based on the script's content.

Output Format: Ensure your response is a JSON object matching the defined output schema.
`,
});

const generateListeningMaterialFlow = ai.defineFlow(
    {
        name: 'generateListeningMaterialFlow',
        inputSchema: GenerateListeningMaterialInputSchema,
        outputSchema: GenerateListeningMaterialOutputSchema,
    },
    async (input) => {
        const {output} = await generateListeningMaterialPrompt(input);
        if (!output) {
            throw new Error('AI failed to generate listening material. Output was null.');
        }
        // Post-processing to ensure the 'answer' is one of the 'options'
        output.comprehensionQuestions.forEach(q => {
            if (!q.options.includes(q.answer)) {
                // If the answer is not in the options, log it and fallback to the first option.
                // A better long-term solution would be to regenerate or fix this in the prompt.
                console.warn(`Generated answer "${q.answer}" is not in options [${q.options.join(', ')}]. Falling back to first option.`);
                q.answer = q.options[0];
            }
        });

        return output;
    }
);
