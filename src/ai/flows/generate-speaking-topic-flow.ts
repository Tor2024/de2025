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
  goals: z.array(z.string()).describe('User learning goals.'),
  interests: z.array(z.string()).describe('User interests.'),
  topicMistakes: z.record(z.number()).optional().describe('User mistakes by topic.'),
  grammarMistakes: z.record(z.number()).optional().describe('User mistakes by grammar point.'),
  vocabMistakes: z.record(z.number()).optional().describe('User mistakes by vocabulary.'),
});
export type GenerateSpeakingTopicInput = z.infer<typeof GenerateSpeakingTopicInputSchema>;

const GenerateSpeakingTopicOutputSchema = z.object({
  speakingTopic: z.string().describe('The generated speaking topic, suitable for the targetLanguage and proficiencyLevel. This topic should be phrased to directly invite a spoken response (e.g., as a question like "What are your plans for the weekend?" or a scenario to describe like "Describe your favorite hobby."). It can be in the interfaceLanguage, clearly stating the task (e.g., "Tell us about your last vacation in {{{targetLanguage}}}"), or directly in the targetLanguage if the user is advanced.'),
  tips: z.array(z.string()).optional().describe('Optional short tips (2-3) on how to approach speaking on this topic, in the interfaceLanguage.'),
  guidingQuestions: z.array(z.string()).optional().describe('Optional short guiding questions (2-3) to help the user structure their speech or elaborate on aspects of the main topic. These questions should be phrased as if a conversational partner is asking them. MUST be in the interfaceLanguage.'),
  practiceScript: z.string().optional().describe('An optional short script or text (e.g., a few sentences, a mini-dialogue starter) related to the speakingTopic, in the targetLanguage, that the user can use for practice. It should be very short and directly useful for the topic.'),
  followUpQuestions: z.array(z.string()).optional().describe('Optional short follow-up questions (2-3) directly related to the speakingTopic to simulate a conversation, in the interfaceLanguage.'),
});
export type GenerateSpeakingTopicOutput = z.infer<typeof GenerateSpeakingTopicOutputSchema>;


export async function generateSpeakingTopic(input: GenerateSpeakingTopicInput): Promise<GenerateSpeakingTopicOutput> {
  return generateSpeakingTopicFlow(input);
}

const generateSpeakingTopicPrompt = ai.definePrompt({
  name: 'generateSpeakingTopicPrompt',
  input: {schema: GenerateSpeakingTopicInputSchema},
  output: {schema: GenerateSpeakingTopicOutputSchema},
  prompt: `You are an AI language learning assistant specializing in creating engaging speaking practice topics and supporting materials.

Task: Generate a speaking topic, 2-3 optional short tips for the user, 2-3 optional guiding questions, an optional short practice script, and 2-3 optional follow-up questions. Учитывай индивидуальный профиль пользователя.

User Profile:
- Interface Language (for tips, guiding questions, and follow-up questions): {{{interfaceLanguage}}}
- Target Language (for the context of the speaking topic and the practice script): {{{targetLanguage}}}
- Proficiency Level (for topic complexity and script complexity): {{{proficiencyLevel}}}
{{#if generalTopic}}
- User-defined General Topic: {{{generalTopic}}}
{{/if}}
- User Goals: {{{goals?.join(', ') || 'не указаны'}}}
- User Interests: {{{interests?.join(', ') || 'не указаны'}}}
- Mistakes by topic: {{{topicMistakes ? JSON.stringify(topicMistakes) : 'нет данных'}}}
- Mistakes by grammar: {{{grammarMistakes ? JSON.stringify(grammarMistakes) : 'нет данных'}}}
- Mistakes by vocabulary: {{{vocabMistakes ? JSON.stringify(vocabMistakes) : 'нет данных'}}}

Instructions:
1.  **Speaking Topic:**
    *   Generate a clear and engaging speaking topic. This topic should be something the user can talk about for a minute or two.
    *   The topic should be suitable for a learner of {{{targetLanguage}}} at the {{{proficiencyLevel}}}.
    *   {{#if generalTopic}}The speaking topic MUST be related to the user-defined General Topic: "{{{generalTopic}}}".{{/if}}
    *   The speaking topic itself MUST be phrased to directly invite a spoken response from the user (e.g., as a question like 'What are your plans for the weekend?' or a scenario to describe like 'Describe your favorite hobby.'). It can be in the {{{interfaceLanguage}}}, clearly stating the task (e.g., 'Tell us about your last vacation in {{{targetLanguage}}}'), or directly in the {{{targetLanguage}}} if the user is advanced. Use your best judgment for clarity and engagement.
    *   Where possible, учитывай интересы, цели и слабые места пользователя (ошибки, темы, грамматика, лексика) — делай тему и подсказки более релевантными и полезными для проработки этих аспектов.
2.  **Guiding Questions (Optional, 2-3 short questions):**
    *   Provide 2-3 brief, actionable guiding questions that the user might address when speaking on the generated topic.
    *   These guiding questions MUST be in the {{{interfaceLanguage}}} and should be phrased as if a conversational partner or tutor is asking them to encourage a natural spoken response or to help the user elaborate on different aspects of the main topic.
    *   For example, if the main topic is "Your last holiday", guiding questions could be "So, where did you go on your last holiday?", "What was the most interesting thing you did there?", "Would you recommend this place to others?".
    *   Если есть ошибки или слабые места, часть вопросов должна быть направлена на их проработку.
3.  **Tips (Optional, 2-3 short tips):**
    *   Provide 2-3 brief, actionable tips on how the user might approach speaking on the generated topic.
    *   These tips MUST be in the {{{interfaceLanguage}}}.
    *   Examples of tips: "Try to use vocabulary related to...", "Think about specific examples.", "Don't be afraid to pause and think."
    *   Если есть ошибки или слабые места, часть советов должна быть направлена на их проработку.
4.  **Practice Script (Optional):**
    *   If appropriate for the speaking topic and proficiency level, generate a short, relevant practice script. This script should be a few sentences or a mini-dialogue starter.
    *   This script MUST be in the {{{targetLanguage}}}, be very short (e.g., 1-3 lines for a monologue starter, or a 2-line mini-dialogue starter like 'A: Did you hear about...? B: No, what happened?'), and appropriate for the {{{proficiencyLevel}}}.
    *   It should give the user an immediate example or starting point for their speech. Ensure it's useful and directly related to the main speaking topic.
    *   Where possible, учитывай интересы, цели и слабые места пользователя (ошибки, темы, грамматика, лексика) — делай скрипт более релевантным и полезным для проработки этих аспектов.
5.  **Follow-up Questions (Optional, 2-3 short questions):**
    *   Provide 2-3 brief, direct questions that a conversational partner might ask *after* the user has spoken on the main {{{speakingTopic}}}. These should encourage further elaboration or continuation of the conversation.
    *   These follow-up questions MUST be in the {{{interfaceLanguage}}}.
    *   Example: If speaking topic is "Describe your favorite hobby", a follow-up question could be "How long have you been doing that?" or "What's the most challenging part of your hobby?".
    *   Если есть ошибки или слабые места, часть вопросов должна быть направлена на их проработку.

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

