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

// Новый prompt для генерации только скрипта (монолога)
const generateListeningScriptPrompt = ai.definePrompt({
  name: 'generateListeningScriptPrompt',
  input: {schema: GenerateListeningMaterialInputSchema},
  output: {schema: z.object({ script: z.string().describe('Монолог для аудирования в targetLanguage') })},
  prompt: `Ты — помощник по языковому обучению. Сгенерируй короткий, связный монолог на тему "{{{topic}}}" на языке {{{targetLanguage}}}, подходящий для уровня {{{proficiencyLevel}}}. Не используй диалоги. Не добавляй вопросы. Просто цельный монолог, длиной 30-90 секунд. Учитывай интересы и цели пользователя, если они есть.`
});

// Новый prompt для генерации вопросов по готовому скрипту
const generateListeningQuestionsPrompt = ai.definePrompt({
  name: 'generateListeningQuestionsPrompt',
  input: {schema: z.object({
    script: z.string(),
    interfaceLanguage: InterfaceLanguageSchema,
    targetLanguage: z.enum(targetLanguageNames),
    proficiencyLevel: z.enum(proficiencyLevels),
  })},
  output: {schema: z.object({
    comprehensionQuestions: z.array(ComprehensionQuestionSchema)
  })},
  prompt: `Ты — помощник по языковому обучению. На основе следующего монолога на языке {{{targetLanguage}}}:
"""
{{{script}}}
"""
Сгенерируй 1 вопрос на понимание для аудирования (comprehensionQuestions) на языке {{{interfaceLanguage}}}. Для вопроса:
- Только один правильный ответ (single choice или короткий текст).
- Если вопрос с вариантами, правильный ответ должен совпадать с вариантом и быть тем, который однозначно вытекает из текста (например, если вопрос про Tomaten, ищи число, связанное с Tomaten).
- Не придумывай вопросы, на которые нет ответа в тексте.
- Не используй слишком простые или абстрактные вопросы.
- Варианты и правильный ответ должны быть на языке {{{interfaceLanguage}}}.
- Если не можешь придумать хороший вопрос — лучше не добавляй его.
Верни только массив comprehensionQuestions по схеме.`
});

// Новый flow: двухшаговая генерация
export async function generateListeningMaterial(input: GenerateListeningMaterialInput): Promise<GenerateListeningMaterialOutput> {
  // 1. Генерируем скрипт
  const { output: scriptResult } = await generateListeningScriptPrompt(input);
  if (!scriptResult?.script) throw new Error('AI не сгенерировал скрипт для аудирования.');
  // 2. Генерируем вопросы по скрипту
  const { output: questionsResult } = await generateListeningQuestionsPrompt({
    script: scriptResult.script,
    interfaceLanguage: input.interfaceLanguage,
    targetLanguage: input.targetLanguage,
    proficiencyLevel: input.proficiencyLevel,
  });
  return {
    title: undefined,
    scenario: undefined,
    script: scriptResult.script,
    comprehensionQuestions: questionsResult?.comprehensionQuestions || [],
  };
}
