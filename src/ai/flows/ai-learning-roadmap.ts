
// Use server directive is required for all Genkit flows.
'use server';

/**
 * @fileOverview AI-powered learning roadmap generator.
 *
 * This file defines a Genkit flow that generates a personalized learning roadmap based on the user's language, proficiency level, and goals.
 *
 * @exports generatePersonalizedLearningRoadmap - The main function to generate the roadmap.
 * @exports GeneratePersonalizedLearningRoadmapInput - The input type for the function.
 * @exports GeneratePersonalizedLearningRoadmapOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { interfaceLanguageCodes, targetLanguageNames, proficiencyLevels } from '@/lib/types';
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel, TargetLanguage as AppTargetLanguage } from '@/lib/types';


const GeneratePersonalizedLearningRoadmapInputSchema = z.object({
  interfaceLanguage: z
    .enum(interfaceLanguageCodes)
    .describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de). This language should be used for all instructions, titles, and descriptive text within the roadmap itself.'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user wants to study (e.g., German, English). The actual learning content and topics in the roadmap should be for this language.'),
  proficiencyLevel: z
    .enum(proficiencyLevels) // Using the imported proficiencyLevels from lib/types
    .describe('The current/starting proficiency level of the user (e.g., A1-A2, B1-B2, C1-C2). The roadmap should cover A0-C2 regardless.'),
  personalGoal: z.string().describe('The personal goal of the user (e.g., Pass B2 TELC exam).'),
});

export type GeneratePersonalizedLearningRoadmapInput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapInputSchema
>;

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  roadmap: z
    .string()
    .describe('A detailed learning roadmap tailored to the user. The roadmap instructions and descriptions should be in the specified interface language, while the learning topics should be for the target language.'),
});

export type GeneratePersonalizedLearningRoadmapOutput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapOutputSchema
>;

export async function generatePersonalizedLearningRoadmap(
  input: GeneratePersonalizedLearningRoadmapInput
): Promise<GeneratePersonalizedLearningRoadmapOutput> {
   const typedInput: GeneratePersonalizedLearningRoadmapInput = {
      ...input,
      interfaceLanguage: input.interfaceLanguage as AppInterfaceLanguage,
      targetLanguage: input.targetLanguage as AppTargetLanguage,
      proficiencyLevel: input.proficiencyLevel as AppProficiencyLevel,
  };
  return generatePersonalizedLearningRoadmapFlow(typedInput);
}

const generatePersonalizedLearningRoadmapPrompt = ai.definePrompt({
  name: 'generatePersonalizedLearningRoadmapPrompt',
  input: {schema: GeneratePersonalizedLearningRoadmapInputSchema},
  output: {schema: GeneratePersonalizedLearningRoadmapOutputSchema},
  prompt: `You are an AI language tutor specializing in creating personalized learning roadmaps for language learners.

  Based on the user's interface language, target language, STARTING proficiency level, and personal goal, generate a COMPLETE and ADAPTIVE learning roadmap.

  IMPORTANT: The roadmap's main text (instructions, section titles, descriptions, meta-comments) MUST be written in the language specified by the 'interfaceLanguage' code: {{{interfaceLanguage}}}.
  The actual learning content, examples, topics, and grammar points mentioned *within* the roadmap should pertain to the 'targetLanguage': {{{targetLanguage}}}.

  CRITICAL: The generated roadmap MUST be comprehensive, covering all CEFR levels from A0/A1 (absolute beginner) to C2 (mastery) for the 'targetLanguage'. The provided 'proficiencyLevel' indicates the user's STARTING point, but the plan should guide them through all subsequent levels up to C2. Structure the roadmap into clear modules or stages corresponding to CEFR levels (A1, A2, B1, B2, C1, C2).

  For example, if interfaceLanguage is 'ru' (Russian) and targetLanguage is 'German':
  - Section titles like "Модуль 1: Основы (A1)" should be in Russian.
  - Descriptions of tasks should be in Russian.
  - Specific German grammar points or vocabulary lists mentioned would be in German (e.g., "Die Artikel: der, die, das").
  - The roadmap should start from A1 German content and progress through A2, B1, B2, C1, and C2 German content.

  Interface language code (for roadmap text): {{{interfaceLanguage}}}
  Target language (for learning content): {{{targetLanguage}}}
  User's STARTING proficiency level: {{{proficiencyLevel}}}
  Personal goal: {{{personalGoal}}}

  Roadmap:
  `,
});

const generatePersonalizedLearningRoadmapFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedLearningRoadmapFlow',
    inputSchema: GeneratePersonalizedLearningRoadmapInputSchema,
    outputSchema: GeneratePersonalizedLearningRoadmapOutputSchema,
  },
  async (input: GeneratePersonalizedLearningRoadmapInput) => {
    const {output} = await generatePersonalizedLearningRoadmapPrompt(input);
    return output!;
  }
);
