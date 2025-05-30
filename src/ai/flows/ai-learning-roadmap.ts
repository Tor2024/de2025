
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
import { interfaceLanguageCodes, targetLanguageNames } from '@/lib/types';

const GeneratePersonalizedLearningRoadmapInputSchema = z.object({
  interfaceLanguage: z
    .enum(interfaceLanguageCodes)
    .describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language to study (e.g., German, English).'),
  proficiencyLevel: z
    .enum(['A1-A2', 'B1-B2', 'C1-C2'])
    .describe('The proficiency level of the user (e.g., A1-A2, B1-B2, C1-C2).'),
  personalGoal: z.string().describe('The personal goal of the user (e.g., Pass B2 TELC exam).'),
});

export type GeneratePersonalizedLearningRoadmapInput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapInputSchema
>;

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  roadmap: z
    .string()
    .describe('A detailed learning roadmap tailored to the user.'),
});

export type GeneratePersonalizedLearningRoadmapOutput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapOutputSchema
>;

export async function generatePersonalizedLearningRoadmap(
  input: GeneratePersonalizedLearningRoadmapInput
): Promise<GeneratePersonalizedLearningRoadmapOutput> {
  return generatePersonalizedLearningRoadmapFlow(input);
}

const generatePersonalizedLearningRoadmapPrompt = ai.definePrompt({
  name: 'generatePersonalizedLearningRoadmapPrompt',
  input: {schema: GeneratePersonalizedLearningRoadmapInputSchema},
  output: {schema: GeneratePersonalizedLearningRoadmapOutputSchema},
  prompt: `You are an AI language tutor specializing in creating personalized learning roadmaps for language learners.

  Based on the user's interface language (provided as an ISO 639-1 code), target language, proficiency level, and personal goal, generate a complete and adaptive learning roadmap.

  The roadmap should cover all necessary skills and topics, and be divided into modular learning paths.

  The roadmap itself must be written in the target language: {{{targetLanguage}}}
  The instructions or meta-comments in the roadmap can be in the interface language if it helps clarity for the user.

  Interface language code: {{{interfaceLanguage}}}
  Target language: {{{targetLanguage}}}
  Proficiency level: {{{proficiencyLevel}}}
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
  async input => {
    const {output} = await generatePersonalizedLearningRoadmapPrompt(input);
    return output!;
  }
);
