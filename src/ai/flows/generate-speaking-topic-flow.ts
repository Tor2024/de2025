
'use server';
/**
 * @fileOverview AI-powered speaking topic generator.
 *
 * - generateSpeakingTopic - A function that generates a speaking topic and optional tips.
 * - GenerateSpeakingTopicInput - The input type for the function.
 * - GenerateSpeakingTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage as AppTargetLanguage, ProficiencyLevel as AppProficiencyLevel, InterfaceLanguage as AppInterfaceLanguage } from '@/lib/types';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

const GenerateSpeakingTopicInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for tips and instructions (e.g., en, ru).'),
  targetLanguage: z.enum(targetLanguageNames).describe('The target language for the speaking practice (e.g., German, English).'),
  proficiencyLevel: z.enum(proficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2) to tailor topic complexity.'),
  generalTopic: z.string().min(3).optional().describe('An optional general topic to narrow down the suggestion (e.g., "Travel", "Work").'),
});
export type GenerateSpeakingTopicInput = z.infer<typeof GenerateSpeakingTopicInputSchema>;

const GenerateSpeakingTopicOutputSchema = z.object({
  speakingTopic: z.string().describe('The generated speaking topic, suitable for the targetLanguage and proficiencyLevel.'),
  tips: z.array(z.string()).optional().describe('Optional short tips (2-3) on how to approach speaking on this topic, in the interfaceLanguage.'),
  guidingQuestions: z.array(z.string()).optional().describe('Optional short guiding questions or sub-topics (2-3) to help the user structure their speech, in the interfaceLanguage.'),
});
export type GenerateSpeakingTopicOutput = z.infer<typeof GenerateSpeakingTopicOutputSchema>;


export async function generateSpeakingTopic(input: GenerateSpeakingTopicInput): Promise<GenerateSpeakingTopicOutput> {
  return generateSpeakingTopicFlow(input);
}

const generateSpeakingTopicPrompt = ai.definePrompt({
  name: 'generateSpeakingTopicPrompt',
  input: {schema: GenerateSpeakingTopicInputSchema},
  output: {schema: GenerateSpeakingTopicOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating engaging speaking practice topics.

Task: Generate a speaking topic, 2-3 optional short tips for the user, and 2-3 optional guiding questions or sub-topics to help structure the speech.

User Preferences:
- Interface Language (for tips and guiding questions): {{{interfaceLanguage}}}
- Target Language (for the context of the speaking topic): {{{targetLanguage}}}
- Proficiency Level (for topic complexity): {{{proficiencyLevel}}}
{{#if generalTopic}}
- User-defined General Topic: {{{generalTopic}}}
{{/if}}

Instructions:
1.  **Speaking Topic:**
    *   Generate a clear and engaging speaking topic. This topic should be something the user can talk about for a minute or two.
    *   The topic should be suitable for a learner of {{{targetLanguage}}} at the {{{proficiencyLevel}}}.
    *   {{#if generalTopic}}The speaking topic MUST be related to the user-defined General Topic: "{{{generalTopic}}}".{{/if}}
    *   The speaking topic itself should be phrased in a way that is natural for the {{{targetLanguage}}}, but the output string for 'speakingTopic' can be in {{{interfaceLanguage}}} if it makes more sense for the user to understand the task (e.g. "Describe your last holiday in German"). Or it can be directly in the target language, for example, "Erzähle über deinen letzten Urlaub." if the user is advanced. Use your best judgment.
2.  **Guiding Questions (Optional, 2-3 short questions/sub-topics):**
    *   Provide 2-3 brief, actionable guiding questions or sub-topics that the user might address when speaking on the generated topic. These should help structure their thoughts.
    *   These guiding questions/sub-topics MUST be in the {{{interfaceLanguage}}}.
    *   Examples of guiding questions (if topic is "Describe your last holiday"): "Where did you go?", "What did you do there?", "What was your favorite part?".
3.  **Tips (Optional, 2-3 short tips):**
    *   Provide 2-3 brief, actionable tips on how the user might approach speaking on the generated topic.
    *   These tips MUST be in the {{{interfaceLanguage}}}.
    *   Examples of tips: "Try to use vocabulary related to...", "Think about specific examples.", "Don't be afraid to pause and think."

Output Format: Ensure your response is a JSON object matching the defined output schema.
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

