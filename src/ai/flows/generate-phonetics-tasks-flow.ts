import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { targetLanguageNames, proficiencyLevels, InterfaceLanguageSchema } from '@/lib/types';

// Типы заданий для фонетики
const phoneticsTaskTypes = [
  'repeat', // Прослушай и повтори
  'choose_pronunciation', // Выбери правильное произношение
  'identify_word', // Отметь услышанное слово
  'match_transcription', // Сопоставь слово и транскрипцию
] as const;

export type PhoneticsTaskType = typeof phoneticsTaskTypes[number];

const PhoneticsTaskSchema = z.object({
  type: z.enum(phoneticsTaskTypes),
  instruction: z.string().describe('Инструкция для пользователя (на interfaceLanguage)'),
  audioText: z.string().optional().describe('Текст для озвучивания (на targetLanguage)'),
  options: z.array(z.string()).optional().describe('Варианты ответа (на targetLanguage)'),
  correctAnswer: z.string().describe('Правильный ответ (или эталонная фраза)'),
  explanation: z.string().optional().describe('Подробное объяснение на interfaceLanguage. Объясни, почему правильный ответ именно такой, а другие варианты неверны. Приводи примеры, сравнения, аналогии, если это поможет лучше понять материал. Если задание связано с фонетикой, обязательно поясни, какой звук имеется в виду и как он образуется. Стиль объяснения — дружелюбный, поддерживающий, без сложных терминов без объяснения.'),
});

export type PhoneticsTask = z.infer<typeof PhoneticsTaskSchema>;

const GeneratePhoneticsTasksInputSchema = z.object({
  interfaceLanguage: InterfaceLanguageSchema,
  targetLanguage: z.enum(targetLanguageNames),
  proficiencyLevel: z.enum(proficiencyLevels),
  goals: z.array(z.string()),
  interests: z.array(z.string()),
  count: z.number().min(3).max(10).default(5),
});

export type GeneratePhoneticsTasksInput = z.infer<typeof GeneratePhoneticsTasksInputSchema>;

const GeneratePhoneticsTasksOutputSchema = z.object({
  tasks: z.array(PhoneticsTaskSchema),
});

export type GeneratePhoneticsTasksOutput = z.infer<typeof GeneratePhoneticsTasksOutputSchema>;

const generatePhoneticsTasksPrompt = ai.definePrompt({
  name: 'generatePhoneticsTasksPrompt',
  input: { schema: GeneratePhoneticsTasksInputSchema },
  output: { schema: GeneratePhoneticsTasksOutputSchema },
  prompt: `Ты — ИИ-ассистент для изучения фонетики иностранного языка.

Задача: Сгенерируй массив из {{count}} разнообразных фонетических заданий для пользователя, изучающего {{targetLanguage}} на уровне {{proficiencyLevel}}.

Виды заданий:
- repeat: "Прослушай и повтори" (дай короткую фразу/слово для озвучки)
- choose_pronunciation: "Выбери правильное произношение" (варианты — слова/фразы, только один правильный)
- identify_word: "Отметь услышанное слово" (озвучь слово, предложи варианты, пользователь должен выбрать услышанное)
- match_transcription: "Сопоставь слово и транскрипцию" (варианты: слова и их транскрипции)

Для каждого задания:
- instruction: чёткая инструкция на {{interfaceLanguage}}. Важно: формулируй инструкцию максимально понятно для новичка. Всегда указывай, что именно должен сделать пользователь (например: вписать букву, выбрать слово, вставить артикль и т.д.). Если есть риск неоднозначности, добавь короткую подсказку или пример. Избегай слишком кратких и абстрактных формулировок.
- audioText: если нужно озвучить (на {{targetLanguage}})
- options: если есть варианты (на {{targetLanguage}})
- correctAnswer: правильный ответ (или эталонная фраза)
- explanation: подробное объяснение на {{interfaceLanguage}}. Объясни, почему правильный ответ именно такой, а другие варианты неверны. Приводи примеры, сравнения, аналогии, если это поможет лучше понять материал. Если задание связано с фонетикой, обязательно поясни, какой звук имеется в виду и как он образуется. Стиль объяснения — дружелюбный, поддерживающий, без сложных терминов без объяснения.

Учитывай цели и интересы пользователя: {{goals}}, {{interests}}.
Темы и примеры должны быть релевантны уровню {{proficiencyLevel}}.

Формат вывода: строго JSON, соответствующий схеме.
`,
});

export const generatePhoneticsTasksFlow = ai.defineFlow(
  {
    name: 'generatePhoneticsTasksFlow',
    inputSchema: GeneratePhoneticsTasksInputSchema,
    outputSchema: GeneratePhoneticsTasksOutputSchema,
  },
  async (input) => {
    const { output } = await generatePhoneticsTasksPrompt(input);
    if (!output) {
      throw new Error('AI не сгенерировал фонетические задания.');
    }
    return output;
  }
);
