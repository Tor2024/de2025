
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
import { germanWritingTaskTypes, proficiencyLevels as appProficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';
import type { GermanWritingTaskType, ProficiencyLevel as AppProficiencyLevel } from '@/lib/types';


const writingTaskTypeValues = germanWritingTaskTypes.map(t => t.value) as [string, ...string[]];


const AIPoweredWritingAssistanceInputSchema = z.object({
  prompt: z.string().describe('The writing prompt or topic.'),
  text: z.string().describe('The user-generated text to be evaluated.'),
  interfaceLanguage: InterfaceLanguageSchema.describe('The ISO 639-1 code of the language for explanations and feedback (e.g., en, ru). ALL FEEDBACK MUST BE IN THIS LANGUAGE.'),
  writingTaskType: z.enum(writingTaskTypeValues).optional().describe('The specific type of writing task (e.g., "Informal Letter/Email", "Formal Letter/Email", "Essay"). If provided, feedback should explicitly consider the conventions of this type.'),
  proficiencyLevel: z.enum(appProficiencyLevels).describe('The proficiency level of the user (A1-A2, B1-B2, C1-C2). This should guide the complexity of feedback and suggestions.'),
});
export type AIPoweredWritingAssistanceInput = z.infer<typeof AIPoweredWritingAssistanceInputSchema>;

const ErrorCategorySchema = z.object({
  category: z.string().describe('The general type of error, e.g., "Grammar", "Vocabulary", "Punctuation", "Style". MUST be in the {{{interfaceLanguage}}}.'),
  specificError: z.string().describe('A more specific description of the error, e.g., "Incorrect verb tense", "Word choice", "Missing comma". MUST be in the {{{interfaceLanguage}}}.'),
  comment: z.string().optional().describe('A brief, constructive comment or suggestion related to this specific error type. MUST be in the {{{interfaceLanguage}}}.')
});
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;

const AIPoweredWritingAssistanceOutputSchema = z.object({
  feedback: z.string().describe('AI-driven feedback on structure, grammar, and tone. If writingTaskType was specified, feedback should be contextual to that type. CRITICALLY: This feedback MUST be in the {{{interfaceLanguage}}}. Feedback should be tailored to the user proficiency level. Ensure the text is clear, concise, and well-suited for text-to-speech conversion if applicable.'),
  markedCorrectedText: z.string().describe('The corrected version of the input text, with corrections clearly marked. Use <ins>inserted text</ins> for additions/changes and <del>deleted text</del> for deletions. This text should be suitable for direct HTML rendering. ONLY use <ins> and <del> tags, no other HTML elements, attributes, or styles. The text should be appropriate for the user proficiency level.'),
  errorCategories: z.array(ErrorCategorySchema).optional().describe('A list of identified error categories with specific errors and brief comments. All text within this structure MUST be in the {{{interfaceLanguage}}}.')
});
export type AIPoweredWritingAssistanceOutput = z.infer<typeof AIPoweredWritingAssistanceOutputSchema>;

// Exported wrapper function
export async function aiPoweredWritingAssistance(input: AIPoweredWritingAssistanceInput): Promise<AIPoweredWritingAssistanceOutput> {
  return aiPoweredWritingAssistanceFlow(input);
}

const writingAssistantPrompt = ai.definePrompt({
  name: 'writingAssistantPrompt',
  input: {schema: AIPoweredWritingAssistanceInputSchema},
  output: {schema: AIPoweredWritingAssistanceOutputSchema},
  prompt: `You are an AI writing assistant that provides feedback and corrections on user-submitted text.
CRITICAL: All explanations and feedback in the 'feedback' field and 'errorCategories' field (including category names, specific errors, and comments) MUST be in the language specified by the ISO 639-1 code: {{{interfaceLanguage}}}.

The user's proficiency level in the target language is: {{{proficiencyLevel}}}.
Tailor your feedback, corrections, and error categorization to this level:
- For lower levels (e.g., A1-A2), focus on fundamental errors, use simpler language in your feedback and error descriptions, and suggest simpler corrections.
- For intermediate levels (e.g., B1-B2), address more complex grammatical structures and vocabulary, and provide more detailed explanations.
- For higher levels (e.g., C1-C2), provide nuanced feedback on style, advanced grammar, idiomatic expressions, and overall coherence. Corrected text can be more sophisticated. Error categories can be more specific.

The user is writing based on the following prompt:
Prompt: {{{prompt}}}

The user's text is:
Text: {{{text}}}

{{#if writingTaskType}}
The user has specified that this is a "{{{writingTaskType}}}" type of writing task.
CRITICAL: When providing feedback, you MUST pay close attention to the conventions of this specific task type ({{{writingTaskType}}}). Use the guide below to inform your feedback regarding structure, tone, formality, typical expressions, and salutations/closings, adapting to the user's {{{proficiencyLevel}}}. Your feedback should explicitly comment on how well the user's text adheres to the norms of the specified task type.

--- BEGIN GERMAN WRITING TASK FORMATS GUIDE (Use this if applicable, or adapt principles for other languages) ---
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

Your tasks:
1.  Provide feedback on the structure, grammar, and tone of the user's text. This feedback MUST be in the {{{interfaceLanguage}}} and be appropriate for the user's {{{proficiencyLevel}}}. Ensure it is clear, concise, and well-suited for text-to-speech.
2.  Provide a corrected version of the user's text in the 'markedCorrectedText' field. In this field, you MUST highlight the changes you made compared to the original user's text.
    Use ONLY the HTML tags \`<ins>inserted or changed text</ins>\` for any text you add or modify, and \`<del>deleted text</del>\` for any text you remove from the original.
    For example, if the original was "I go to store" and you correct it to "I went to the store.", your markedCorrectedText should be "I <ins>went</ins> to <ins>the </ins>store<del>go</del>."
    If the original was "I like apples bananas and oranges" and you correct it to "I like apples<ins>,</ins> bananas<ins>,</ins> and oranges.", your markedCorrectedText should be "I like apples<ins>,</ins> bananas<ins>,</ins> and oranges."
    Do NOT use any other HTML tags, attributes, or styles in 'markedCorrectedText'. The corrected text should also be appropriate for the user's {{{proficiencyLevel}}}.
3.  Analyze the errors in the user's text and provide a list of identified error categories in the 'errorCategories' field.
    For each identified error, specify:
    *   'category': The general type of error (e.g., "Grammar", "Vocabulary", "Punctuation", "Style").
    *   'specificError': A more specific description of the error (e.g., "Incorrect verb tense", "Word choice", "Missing comma").
    *   'comment' (optional): A brief, constructive comment or suggestion related to this specific error type.
    All text in 'errorCategories' (category, specificError, comment) MUST be in the {{{interfaceLanguage}}}.

Output the feedback, the marked corrected text, and the error categories as a JSON object matching the defined output schema.
  `,
});

const aiPoweredWritingAssistanceFlow = ai.defineFlow(
  {
    name: 'aiPoweredWritingAssistanceFlow',
    inputSchema: AIPoweredWritingAssistanceInputSchema,
    outputSchema: AIPoweredWritingAssistanceOutputSchema,
  },
  async (input) => {
    const {output} = await writingAssistantPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate writing assistance. Output was null.");
    }
    return output;
  }
);

    
