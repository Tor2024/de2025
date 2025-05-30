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

const GeneratePersonalizedLearningRoadmapInputSchema = z.object({
  interfaceLanguage: z
    .string()
    .describe('The interface language of the user (e.g., Russian or English).'),
  targetLanguage: z.string().describe('The target language to study (e.g., German).'),
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

  Based on the user's interface language, target language, proficiency level, and personal goal, generate a complete and adaptive learning roadmap.

  The roadmap should cover all necessary skills and topics, and be divided into modular learning paths.

  The roadmap must be in the target language: ${'{{targetLanguage}}'}

  Interface language: ${'{{interfaceLanguage}}'}
  Proficiency level: ${'{{proficiencyLevel}}'}
  Personal goal: ${'{{personalGoal}}'}

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
