import { ai } from '../genkit';
import { z } from 'genkit';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '../../lib/types';

// Типы заданий для новых слов
const newWordsTaskTypes = [
  'translate_word', // Переведи слово
  'choose_translation', // Выбери правильный перевод
  'fill_in_blank', // Вставь слово в предложение
] as const;

export type NewWordsTaskType = typeof newWordsTaskTypes[number];

const NewWordsTaskSchema = z.object({
  type: z.enum(newWordsTaskTypes),
  instruction: z.string().describe('Инструкция для пользователя (на interfaceLanguage)'),
  word: z.string().describe('Новое слово или фраза (на targetLanguage)'),
  options: z.array(z.string()).optional().describe('Варианты ответа (на interfaceLanguage или targetLanguage)'),
  correctAnswer: z.string().describe('Правильный ответ (на interfaceLanguage или targetLanguage)'),
  explanation: z.string().optional().describe('Подробное объяснение на interfaceLanguage. Объясни, почему правильный ответ именно такой, а другие варианты неверны. Приводи примеры, сравнения, аналогии, если это поможет лучше понять материал. Стиль объяснения — дружелюбный, поддерживающий, без сложных терминов без объяснения.'),
});

export type NewWordsTask = z.infer<typeof NewWordsTaskSchema>;

const GenerateNewWordsTasksInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema,
  targetLanguage: z.enum(targetLanguageNames),
  proficiencyLevel: z.enum(proficiencyLevels),
  goals: z.array(z.string()),
  interests: z.array(z.string()),
  newWords: z.array(z.string()).describe('Массив новых слов (на targetLanguage)'),
  count: z.number().min(3).max(10).default(5),
});

export type GenerateNewWordsTasksInput = z.infer<typeof GenerateNewWordsTasksInputSchema>;

const GenerateNewWordsTasksOutputSchema = z.object({
  tasks: z.array(NewWordsTaskSchema),
});

export type GenerateNewWordsTasksOutput = z.infer<typeof GenerateNewWordsTasksOutputSchema>;

const generateNewWordsTasksPrompt = ai.definePrompt({
  name: 'generateNewWordsTasksPrompt',
  input: { schema: GenerateNewWordsTasksInputSchema },
  output: { schema: GenerateNewWordsTasksOutputSchema },
  prompt: `Ты — ИИ-ассистент для тренировки новых слов.

Задача: Сгенерируй {{count}} разнообразных упражнений по новым словам для пользователя, изучающего {{targetLanguage}} на уровне {{proficiencyLevel}}.

Используй новые слова: {{newWords}}.

Виды заданий:
- translate_word: "Переведи слово" (покажи слово на targetLanguage, пользователь пишет перевод)
- choose_translation: "Выбери правильный перевод" (варианты — только один правильный)
- fill_in_blank: "Вставь слово в предложение" (предложение с пропуском, пользователь вписывает слово)

Для каждого задания:
- instruction: чёткая инструкция на {{interfaceLanguage}}. Важно: формулируй инструкцию максимально понятно для новичка. Всегда указывай, что именно должен сделать пользователь (например: вписать слово, выбрать перевод, вставить слово в пропуск и т.д.). Если есть риск неоднозначности, добавь короткую подсказку или пример. Избегай слишком кратких и абстрактных формулировок.
- word: новое слово/фраза (на {{targetLanguage}})
- options: если есть варианты (на interfaceLanguage или targetLanguage)
- correctAnswer: правильный ответ
- explanation: подробное объяснение на {{interfaceLanguage}}. Объясни, почему правильный ответ именно такой, а другие варианты неверны. Приводи примеры, сравнения, аналогии, если это поможет лучше понять материал. Стиль объяснения — дружелюбный, поддерживающий, без сложных терминов без объяснения.

Учитывай цели и интересы пользователя: {{goals}}, {{interests}}.
Темы и примеры должны быть релевантны уровню {{proficiencyLevel}}.

Формат вывода: строго JSON, соответствующий схеме.
`,
});

export const generateNewWordsTasksFlow = ai.defineFlow({
  name: 'generateNewWordsTasksFlow',
  inputSchema: GenerateNewWordsTasksInputSchema,
  outputSchema: GenerateNewWordsTasksOutputSchema,
}, async (input: GenerateNewWordsTasksInput) => {
  const { output } = await generateNewWordsTasksPrompt(input);
  if (!output) throw new Error('AI не сгенерировал упражнения по новым словам.');
  return output;
});
