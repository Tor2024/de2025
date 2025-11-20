
'use server';
/**
 * @fileOverview AI-powered speaking topic generator.
 *
 * - generateSpeakingTopic - A function that generates a detailed speaking topic with questions and tips.
 * - GenerateSpeakingTopicInput - The input type for the function.
 * - GenerateSpeakingTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel, InterfaceLanguage as AppInterfaceLanguage } from '@/lib/types';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

const GenerateSpeakingTopicInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for the topic prompt, questions, and tips (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language the user should speak in (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The user\'s proficiency level (A1-A2, B1-B2, C1-C2) to tailor the task complexity.'),
  generalTopic: z.string().min(3).optional().describe('An optional general theme to guide the AI\'s suggestion (e.g., "Travel", "Work").'),
  goals: z.array(z.string()).describe('User learning goals.'),
  interests: z.array(z.string()).describe('User interests.'),
});
export type GenerateSpeakingTopicInput = z.infer<typeof GenerateSpeakingTopicInputSchema>;

const GenerateSpeakingTopicOutputSchema = z.object({
  speakingTopic: z.string().describe('A clear, specific, and engaging speaking topic for the user, in the specified interfaceLanguage. It should clearly state what the user needs to talk about.'),
  guidingQuestions: z.array(z.string()).optional().describe('A list of 2-4 guiding questions in the interfaceLanguage to help the user structure their speech.'),
  tips: z.array(z.string()).optional().describe('A few short, actionable tips in the interfaceLanguage for the user, related to the topic or common speaking challenges.'),
  practiceScript: z.string().optional().describe('A short example script or text in the targetLanguage that the user can use as a model or for practice.'),
  followUpQuestions: z.array(z.string()).optional().describe('A list of 2-3 follow-up questions in the interfaceLanguage that a conversation partner might ask.'),
});
export type GenerateSpeakingTopicOutput = z.infer<typeof GenerateSpeakingTopicOutputSchema>;


export async function generateSpeakingTopic(input: GenerateSpeakingTopicInput): Promise<GenerateSpeakingTopicOutput> {
  return generateSpeakingTopicFlow(input);
}


const generateSpeakingTopicPrompt = ai.definePrompt({
  name: 'generateSpeakingTopicPrompt',
  input: {schema: GenerateSpeakingTopicInputSchema},
  output: {schema: GenerateSpeakingTopicOutputSchema},
  prompt: `You are an AI language tutor creating an engaging speaking practice task.

User Profile:
- Interface Language: {{{interfaceLanguage}}}
- Target Language: {{{targetLanguage}}}
- Proficiency Level: {{{proficiencyLevel}}}
- Goals: {{{goals}}}
- Interests: {{{interests}}}
{{#if generalTopic}}
- General Topic of Interest: "{{{generalTopic}}}"
{{/if}}

Your Task:
Based on the user's profile, create a comprehensive speaking practice set.

1.  **speakingTopic**: Create a clear and specific speaking topic in the {{{interfaceLanguage}}}. It should be more concrete than the general topic. For example, if the general topic is "Travel", a good specific topic is "Describe your dream vacation" or "Talk about the most interesting place you have visited".
2.  **guidingQuestions**: Provide 2-4 open-ended questions in the {{{interfaceLanguage}}} to help the user start talking and structure their thoughts.
3.  **tips**: Give 2-3 practical tips in the {{{interfaceLanguage}}} for this specific task. For example, "Try to use past tense verbs to describe your trip" or "Don't forget to use adjectives to make your story more interesting."
4.  **practiceScript**: Write a short (3-5 sentences) example monologue or script in the {{{targetLanguage}}} that demonstrates how one might approach the topic. This should be a model for the user.
5.  **followUpQuestions**: Imagine you are a conversation partner. Provide 2-3 follow-up questions in the {{{interfaceLanguage}}} that you might ask after the user has finished speaking.

Adapt the complexity of the entire output (topic, questions, script) to the user's {{{proficiencyLevel}}}.
- **For A1-A2**: Simple, concrete topics (e.g., "Describe your family", "What did you do yesterday?"). Short sentences, basic vocabulary in tips and script.
- **For B1-B2**: More abstract topics (e.g., "Discuss the pros and cons of social media", "Describe a challenge you overcame"). More complex sentence structures.
- **For C1-C2**: Nuanced, argumentative, or hypothetical topics (e.g., "Debate the impact of artificial intelligence on the job market", "If you could change one thing about your country, what would it be and why?").

Output must be a JSON object matching the schema.
`,
});

const generateSpeakingTopicFlow = ai.defineFlow(
  {
    name: 'generateSpeakingTopicFlow',
    inputSchema: GenerateSpeakingTopicInputSchema,
    outputSchema: GenerateSpeakingTopicOutputSchema,
  },
  async (input) => {
    const {output} = await generateSpeakingTopicPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a speaking topic. Output was null.");
    }
    return output;
  }
);
