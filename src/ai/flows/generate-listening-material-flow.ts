
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
});
export type GenerateListeningMaterialInput = z.infer<typeof GenerateListeningMaterialInputSchema>;

const ComprehensionQuestionSchema = z.object({
  question: z.string().describe('The comprehension question text in the interfaceLanguage.'),
  options: z.array(z.string()).optional().describe('An array of options for multiple-choice questions, in the interfaceLanguage.'),
  answer: z.string().optional().describe('The correct answer or an indication of the correct option for multiple-choice questions, in the interfaceLanguage.'),
});

const GenerateListeningMaterialOutputSchema = z.object({
  title: z.string().optional().describe('A suitable title for the listening material, in the targetLanguage.'),
  scenario: z.string().optional().describe('A brief description of the listening scenario (e.g., "A conversation at a train station"), in the interfaceLanguage.'),
  script: z.string().describe('The generated listening script (dialogue or monologue) in the targetLanguage, adapted to the proficiencyLevel.'),
  comprehensionQuestions: z.array(ComprehensionQuestionSchema).optional().describe('An array of 2-3 comprehension questions about the script, with questions and options in the interfaceLanguage.'),
});
export type GenerateListeningMaterialOutput = z.infer<typeof GenerateListeningMaterialOutputSchema>;


export async function generateListeningMaterial(input: GenerateListeningMaterialInput): Promise<GenerateListeningMaterialOutput> {
  return generateListeningMaterialFlow(input);
}

const generateListeningMaterialPrompt = ai.definePrompt({
  name: 'generateListeningMaterialPrompt',
  input: {schema: GenerateListeningMaterialInputSchema},
  output: {schema: GenerateListeningMaterialOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating listening materials.

Task: Generate a short listening script (dialogue or monologue), an optional title, an optional scenario description, and optional comprehension questions.

User Preferences:
- Interface Language (for scenario description & questions/instructions): {{{interfaceLanguage}}}
- Target Language (for the listening script): {{{targetLanguage}}}
- Proficiency Level (for script complexity): {{{proficiencyLevel}}}
- Topic: {{{topic}}}

Instructions:
1.  **Title (Optional):** Generate a concise and relevant title for the listening script. The title MUST be in the {{{targetLanguage}}}.
2.  **Scenario (Optional):** Provide a brief (1-2 sentences) description of the situation or context for the listening script (e.g., "Two friends are discussing their plans for the weekend," "A customer is ordering food at a restaurant."). This scenario description MUST be in the {{{interfaceLanguage}}}.
3.  **Script:**
    *   Generate a coherent and engaging script (dialogue or monologue) on the specified {{{topic}}}.
    *   The script MUST be in the {{{targetLanguage}}}.
    *   The complexity of vocabulary, sentence structure, and overall content MUST be appropriate for the {{{proficiencyLevel}}}. Aim for a script that would take approximately 30-90 seconds to read aloud naturally.
    *   Ensure the script is grammatically correct and natural-sounding. For dialogues, clearly indicate speaker changes (e.g., "Anna: ...", "Mark: ...").
4.  **Comprehension Questions (Optional, 2-3 questions):**
    *   If you generate questions, they should test understanding of the main ideas or key details of the {{{script}}}.
    *   Each question (the 'question' field) MUST be in the {{{interfaceLanguage}}}.
    *   If providing multiple-choice options (the 'options' array), these options MUST also be in the {{{interfaceLanguage}}}.
    *   Provide the correct answer or an indication of the correct option (the 'answer' field), also in the {{{interfaceLanguage}}}.
    *   Keep questions relatively simple.

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
        throw new Error("AI failed to generate listening material. Output was null.");
    }
    return output;
  }
);
