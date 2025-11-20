
'use server';
/**
 * @fileOverview AI-powered writing task generator.
 *
 * - generateWritingTask - A function that creates a specific writing task based on a general topic.
 * - GenerateWritingTaskInput - The input type for the function.
 * - GenerateWritingTaskOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { germanWritingTaskTypes, proficiencyLevels as appProficiencyLevels, InterfaceLanguageSchema, targetLanguageNames, type TargetLanguage } from '@/lib/types';
import type { GermanWritingTaskType, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';

const writingTaskTypeValues = germanWritingTaskTypes.map(t => t.value) as [string, ...string[]];

const GenerateWritingTaskInputSchema = z.object({
  topic: z.string().describe('The general topic or theme for the writing task (e.g., "Holidays", "Work").'),
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for the task prompt (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user should write in (e.g., German, English).'),
  proficiencyLevel: z.enum(appProficiencyLevels).describe('The user\'s proficiency level (A1-A2, B1-B2, C1-C2) to tailor the task complexity.'),
  goals: z.array(z.string()).optional().describe('User learning goals to help tailor the task.'),
  interests: z.array(z.string()).optional().describe('User interests to make the task more engaging.'),
});
export type GenerateWritingTaskInput = z.infer<typeof GenerateWritingTaskInputSchema>;


const GenerateWritingTaskOutputSchema = z.object({
  writingPrompt: z.string().describe('A clear, specific, and engaging writing prompt for the user, in the specified interfaceLanguage. It should clearly state what the user needs to do.'),
  taskType: z.enum(writingTaskTypeValues).describe('The specific type of writing task (e.g., "Informal Letter/Email", "Essay") that the prompt corresponds to. This helps in providing targeted feedback later.'),
});
export type GenerateWritingTaskOutput = z.infer<typeof GenerateWritingTaskOutputSchema>;


export async function generateWritingTask(input: GenerateWritingTaskInput): Promise<GenerateWritingTaskOutput> {
  return generateWritingTaskFlow(input);
}


const generateWritingTaskPrompt = ai.definePrompt({
  name: 'generateWritingTaskPrompt',
  input: {schema: GenerateWritingTaskInputSchema},
  output: {schema: GenerateWritingTaskOutputSchema},
  prompt: `You are an AI language tutor. Your job is to create a specific, engaging, and level-appropriate writing task for a student.

User Profile:
- They are learning: {{{targetLanguage}}}
- Their proficiency level is: {{{proficiencyLevel}}}
- Their interface language is: {{{interfaceLanguage}}}
- Their general topic of interest for this task is: "{{{topic}}}"
- Their goals: {{{goals}}}
- Their interests: {{{interests}}}

Your Task:
1.  Based on the user's general "{{{topic}}}", create a concrete and clear **writingPrompt**.
    *   The prompt must be in the specified **{{{interfaceLanguage}}}**.
    *   The complexity and nature of the task must be appropriate for the **{{{proficiencyLevel}}}**.
        *   **For A1-A2:** The task should be very simple and direct. Avoid complex scenarios. Focus on basic descriptions. For example, if the topic is "Family", a good prompt is "Опиши свою семью. Напиши 3-5 предложений." (Describe your family. Write 3-5 sentences). If the topic is "My Room", a good prompt is "Опиши свою комнату. Что в ней находится? Напиши 5 предложений." (Describe your room. What is in it? Write 5 sentences). DO NOT ask them to write letters or emails at this level.
        *   **For B1-B2:** The task can be more complex, involving informal letters, describing experiences, or giving opinions on familiar topics. Example for "Work": "You received an email from a colleague asking for help with a project. Write a formal email response. In your email, you should: 1. Acknowledge their request. 2. Politely explain that you are busy but can help later. 3. Suggest a specific time to meet and discuss the project."
        *   **For C1-C2:** The task should require argumentation, detailed description, or formal writing, like an essay or a formal complaint.
    *   Make it engaging by considering the user's **goals** and **interests** if possible. For example, if their interest is 'technology' and topic is 'hobbies', you could ask them to write about their favorite tech-related hobby.

2.  Determine the most appropriate **taskType** for the prompt you created.
    *   Select one of the following values: "Informal Letter/Email", "Formal Letter/Email", "Complaint Letter", "Announcement/Notice", "Chat/SMS/Short Note", "Essay/Argumentative Text".
    *   For the A1 example "Describe your family", the taskType would be "Chat/SMS/Short Note" or a similar simple descriptive task.
    *   For the B2 example about the email, it would be "Formal Letter/Email".

Output the result as a JSON object matching the defined output schema.
`,
});


const generateWritingTaskFlow = ai.defineFlow(
  {
    name: 'generateWritingTaskFlow',
    inputSchema: GenerateWritingTaskInputSchema,
    outputSchema: GenerateWritingTaskOutputSchema,
  },
  async (input) => {
    const {output} = await generateWritingTaskPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a writing task. Output was null.");
    }
    return output;
  }
);
