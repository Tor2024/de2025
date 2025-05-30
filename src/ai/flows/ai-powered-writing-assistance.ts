
'use server';
/**
 * @fileOverview AI-powered writing assistance flow.
 *
 * - aiPoweredWritingAssistance - A function that provides AI-driven correction and feedback on writing.
 * - AIPoweredWritingAssistanceInput - The input type for the aiPoweredWritingAssistance function.
 * - AIPoweredWritingAssistanceOutput - The return type for the aiPoweredWritingAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { interfaceLanguageCodes, germanWritingTaskTypes } from '@/lib/types';
import { ProficiencyLevelSchema, type ProficiencyLevel } from './adaptive-grammar-explanations'; // Import from grammar flow

const writingTaskTypeValues = germanWritingTaskTypes.map(t => t.value) as [string, ...string[]];


const AIPoweredWritingAssistanceInputSchema = z.object({
  prompt: z.string().describe('The writing prompt or topic.'),
  text: z.string().describe('The user-generated text to be evaluated.'),
  interfaceLanguage: z.enum(interfaceLanguageCodes).describe('The ISO 639-1 code of the language for explanations and feedback (e.g., en, ru).'),
  writingTaskType: z.enum(writingTaskTypeValues).optional().describe('The specific type of writing task (e.g., "Informal Letter/Email", "Formal Letter/Email", "Essay"). If provided, feedback should consider the conventions of this type.'),
  proficiencyLevel: ProficiencyLevelSchema.describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2). This should guide the complexity of feedback and suggestions.'),
});
export type AIPoweredWritingAssistanceInput = z.infer<typeof AIPoweredWritingAssistanceInputSchema>;

const AIPoweredWritingAssistanceOutputSchema = z.object({
  feedback: z.string().describe('AI-driven feedback on structure, grammar, and tone. If writingTaskType was specified, feedback should be contextual to that type. Feedback should be tailored to the user proficiency level.'),
  correctedText: z.string().describe('The corrected version of the input text, appropriate for the user proficiency level.'),
});
export type AIPoweredWritingAssistanceOutput = z.infer<typeof AIPoweredWritingAssistanceOutputSchema>;

export async function aiPoweredWritingAssistance(input: AIPoweredWritingAssistanceInput): Promise<AIPoweredWritingAssistanceOutput> {
  // Ensure the proficiencyLevel from app matches the flow's expected type
    const typedInput: AIPoweredWritingAssistanceInput = {
        ...input,
        proficiencyLevel: input.proficiencyLevel as ProficiencyLevel,
    };
  return aiPoweredWritingAssistanceFlow(typedInput);
}

const writingAssistantPrompt = ai.definePrompt({
  name: 'writingAssistantPrompt',
  input: {schema: AIPoweredWritingAssistanceInputSchema},
  output: {schema: AIPoweredWritingAssistanceOutputSchema},
  prompt: `You are an AI writing assistant that provides feedback and corrections on user-submitted text.
All explanations and feedback must be in the language specified by the ISO 639-1 code: {{{interfaceLanguage}}}.

The user's proficiency level in the target language is: {{{proficiencyLevel}}}.
Tailor your feedback and corrections to this level.
- For lower levels (e.g., A1-A2), focus on fundamental errors, use simpler language in your feedback, and suggest simpler corrections.
- For intermediate levels (e.g., B1-B2), address more complex grammatical structures and vocabulary, and provide more detailed explanations.
- For higher levels (e.g., C1-C2), provide nuanced feedback on style, advanced grammar, idiomatic expressions, and overall coherence. Corrected text can be more sophisticated.

The user is writing based on the following prompt:
Prompt: {{{prompt}}}

The user's text is:
Text: {{{text}}}

{{#if writingTaskType}}
The user has specified that this is a "{{{writingTaskType}}}" type of writing task.
When providing feedback, pay close attention to the conventions of this specific task type regarding structure, tone, formality, and typical expressions, adapting to the user's {{{proficiencyLevel}}}.
Here is a guide to common German writing task formats to help you contextualize your feedback if the target language is German or if the task type is similar to one of these:

--- BEGIN GERMAN WRITING TASK FORMATS GUIDE ---
Основные форматы письменных заданий в немецком языке
Вот список основных типов письменных работ, которые встречаются в учебных курсах, экзаменах (Goethe, TELC, TestDaF) и на практике:

🟢 1. Неофициальное письмо (Brief an einen Freund / E-Mail an eine Freundin) - "Informal Letter/Email"
Применяется на уровнях A1–B1
Примеры тем:
Напиши другу, как прошли твои выходные.
Пригласи друга на день рождения.
Расскажи другу о своём новом доме.
Извинись за то, что не смог прийти на встречу.
Особенности:
Обращение: Hallo Paul! / Liebe Anna!
Простой язык, разговорный стиль
Эмоциональность, личные выражения
Закрытие: Viele Grüße / Liebe Grüße / Bis bald

🟡 2. Официальное письмо (Formeller Brief / Offizielle E-Mail) - "Formal Letter/Email"
Применяется с уровня A2–C1
Примеры тем:
Жалоба в администрацию (на шум, мусор, транспорт)
Запрос информации о курсе, бронировании
Заявление на участие / отказ / просьбу
Письмо в страховую / Jobcenter / школу
Особенности:
Обращение: Sehr geehrte Damen und Herren / Sehr geehrter Herr Müller
Формальный стиль
Четкая структура (введение, основная часть, просьба, завершение)
Закрытие: Mit freundlichen Grüßen

🟠 3. Жалоба (Beschwerdebrief) - "Complaint Letter"
Применяется на уровнях B1–C1
Примеры тем:
Жалоба на плохое обслуживание в отеле
Претензия по заказу из интернета
Критика качества товара или курса
Особенности:
Вежливый, но настойчивый тон
Конкретные факты + предложения решения
Часто — письмо в организацию, учреждение

🔵 4. Объявление (Anzeige, Aushang, Notiz, Mitteilung) - "Announcement/Notice"
Уровни A2–B1
Примеры тем:
Написать объявление о продаже велосипеда
Сообщение на доску объявлений в школе
Заметка в общежитии (по поводу вечеринки)
Особенности:
Краткий, информативный стиль
Без избыточной личной информации
Используются списки, ключевые слова

🔴 5. Электронное письмо (E-Mail) - This is very general. Types 1 and 2 are more specific for emails.
Все уровни, от A1 до C1
Может быть:
официальным или неофициальным
запрос, приглашение, извинение, подтверждение
Структура:
Приветствие (формальное/неформальное)
Введение (почему пишете)
Содержание письма
Заключение (благодарность, ожидание ответа)

🟣 6. Сообщение в чат / SMS / краткая заметка (Nachricht, SMS, Notiz) - "Chat/SMS/Short Note"
Уровни A1–A2
Примеры тем:
Сообщение соседу, что ты уехал
Напомнить о встрече
Написать короткое сообщение другу

🟤 7. Эссе, аргументативный текст, статья (Aufsatz, Stellungnahme, Essay) - "Essay/Argumentative Text"
Уровни B2–C1 (особенно на TestDaF и Goethe C1)
Примеры тем:
Нужно ли вводить школьную форму?
Онлайн-обучение — за и против
Иностранные языки — зачем учить?
Особенности:
Введение → аргументы за → аргументы против → мнение → заключение
Формальный стиль, логическая структура
Часто требуется выразить и обосновать собственную позицию
--- END GERMAN WRITING TASK FORMATS GUIDE ---
{{/if}}

Provide feedback on the structure, grammar, and tone of the text.
Correct any errors and provide a revised version of the text.
Ensure both feedback and corrected text are appropriate for the user's proficiency level ({{{proficiencyLevel}}}).
Output the feedback and corrected text as a JSON object.
  `,
});

const aiPoweredWritingAssistanceFlow = ai.defineFlow(
  {
    name: 'aiPoweredWritingAssistanceFlow',
    inputSchema: AIPoweredWritingAssistanceInputSchema,
    outputSchema: AIPoweredWritingAssistanceOutputSchema,
  },
  async input => {
    const {output} = await writingAssistantPrompt(input);
    return output!;
  }
);

