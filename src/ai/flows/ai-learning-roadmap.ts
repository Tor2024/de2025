
// Use server directive is required for all Genkit flows.
'use server';

/**
 * @fileOverview AI-powered learning roadmap generator.
 *
 * This file defines a Genkit flow that generates a personalized learning roadmap based on the user's language, proficiency level, and goals.
 * The roadmap is structured into an introduction, a series of lessons, and a conclusion.
 *
 * @exports generatePersonalizedLearningRoadmap - The main function to generate the roadmap.
 * @exports GeneratePersonalizedLearningRoadmapInput - The input type for the function.
 * @exports GeneratePersonalizedLearningRoadmapOutput - The output type for the function (structured roadmap).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { interfaceLanguageCodes, targetLanguageNames, proficiencyLevels } from '@/lib/types';
import type { InterfaceLanguage as AppInterfaceLanguage, ProficiencyLevel as AppProficiencyLevel, TargetLanguage as AppTargetLanguage } from '@/lib/types';


const GeneratePersonalizedLearningRoadmapInputSchema = z.object({
  interfaceLanguage: z
    .enum(interfaceLanguageCodes)
    .describe('The ISO 639-1 code of the interface language for the user (e.g., en, ru, de). This language should be used for all instructions, titles, and descriptive text within the roadmap itself (introduction, lesson titles/descriptions, lesson topics, conclusion).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user wants to study (e.g., German, English). The actual learning content and concepts in the roadmap (e.g., grammar rules, vocabulary themes) should be for this language.'),
  proficiencyLevel: z
    .enum(proficiencyLevels)
    .describe('The current/starting proficiency level of the user (e.g., A1-A2, B1-B2, C1-C2). The roadmap should cover A0-C2 regardless.'),
  personalGoal: z.string().describe('The personal goal of the user (e.g., Pass B2 TELC exam).'),
});

export type GeneratePersonalizedLearningRoadmapInput = z.infer<
  typeof GeneratePersonalizedLearningRoadmapInputSchema
>;

const LessonSchema = z.object({
  level: z.string().describe("CEFR level for this lesson/module (e.g., A1, A2, B1). Should be in the target language context if applicable (e.g. 'Niveau A1' for French target if interface is English, or 'Уровень A1' if interface is Russian). The text itself must be in the `interfaceLanguage`."),
  title: z.string().describe("Title of the lesson/module. MUST be in the specified `interfaceLanguage`."),
  description: z.string().describe("A brief overview of what this lesson/module covers. MUST be in the specified `interfaceLanguage`."),
  topics: z.array(z.string()).describe("Specific topics covered. Each topic string itself MUST be in the specified `interfaceLanguage`. These topics should describe learning points related to the `targetLanguage` (e.g., for Russian interface and German target: 'Немецкий алфавит', 'Основы произношения')."),
  estimatedDuration: z.string().optional().describe("Estimated time to complete this lesson/module (e.g., '2 weeks', '10 hours', '2 недели', '10 часов'). MUST be in the specified `interfaceLanguage`.")
});

const GeneratePersonalizedLearningRoadmapOutputSchema = z.object({
  introduction: z.string().describe("A general introduction to the learning plan. MUST be in the specified `interfaceLanguage`."),
  lessons: z.array(LessonSchema).describe("An array of lessons, structured sequentially from A0/A1 to C2. Ensure comprehensive coverage for the `targetLanguage` across all CEFR levels."),
  conclusion: z.string().optional().describe("A concluding remark or encouragement. MUST be in the specified `interfaceLanguage`.")
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
  prompt: `You are an AI language tutor specializing in creating personalized and structured learning roadmaps for language learners.

  Based on the user's interface language, target language, STARTING proficiency level, and personal goal, generate a COMPLETE and ADAPTIVE learning roadmap.

  The output MUST be a JSON object matching the provided schema.

  VERY IMPORTANT:
  - All user-facing text such as 'introduction', 'conclusion', lesson 'title's, lesson 'description's, lesson 'level' text (e.g. 'Уровень A1' or 'Level A1'), lesson 'topics' (each string in the topics array), and 'estimatedDuration' MUST be written in the language specified by the 'interfaceLanguage' code: {{{interfaceLanguage}}}.
  - The actual learning content and concepts that these topics describe should pertain to the 'targetLanguage': {{{targetLanguage}}}. For example, if interfaceLanguage is 'ru' (Russian) and targetLanguage is 'German', a topic could be 'Немецкие артикли: der, die, das' (this topic string is in Russian, and refers to German articles).

  CRITICAL: The generated roadmap MUST be comprehensive. The 'lessons' array should cover all CEFR levels from A0/A1 (absolute beginner) to C2 (mastery) for the 'targetLanguage'. The provided 'proficiencyLevel' indicates the user's STARTING point, but the plan must guide them through all subsequent levels up to C2. Structure the roadmap into clear lessons or modules. Aim for a reasonable number of lessons per CEFR level (e.g. 3-5 major modules per level).

  For example, if interfaceLanguage is 'ru' (Russian) and targetLanguage is 'German':
  - 'introduction' and 'conclusion' fields will be in Russian.
  - A lesson object might look like:
    {
      "level": "Уровень A1", // In Russian
      "title": "Основы немецкого: Алфавит и приветствия", // In Russian
      "description": "Этот модуль знакомит с немецким алфавитом, произношением и базовыми фразами для приветствия и знакомства.", // In Russian
      "topics": ["Немецкий алфавит", "Основы произношения", "Приветствия и прощания", "Представление себя"], // Topics in Russian, referring to German learning points
      "estimatedDuration": "1 неделя" // In Russian
    }

  Interface language code (for ALL roadmap text like titles, descriptions, topics, level text): {{{interfaceLanguage}}}
  Target language (for the concepts the learning content refers to): {{{targetLanguage}}}
  User's STARTING proficiency level (for context, but plan must be A0-C2): {{{proficiencyLevel}}}
  Personal goal: {{{personalGoal}}}

  Generate the structured learning roadmap now.
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
    // Ensure output is not null or undefined before returning
    if (!output) {
        throw new Error("AI failed to generate a learning roadmap. Output was null.");
    }
    return output;
  }
);

