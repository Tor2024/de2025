import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { generateListeningMaterial } from '@/ai/flows/generate-listening-material-flow';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    
    // Прямой вызов AI flow
    const result = await generateListeningMaterial(input);

    // Простая валидация, что ответ не пустой
    if (!result || !result.script || !result.comprehensionQuestions) {
        throw new Error('AI returned incomplete listening material.');
    }

    // Простая проверка, что у каждого вопроса есть ответ из предложенных вариантов
    if (Array.isArray(result.comprehensionQuestions)) {
        result.comprehensionQuestions.forEach(q => {
            if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                // Если сгенерированный ответ не входит в опции, выбираем первый как запасной вариант
                if (!q.options.includes(q.answer)) {
                    console.warn(`Generated answer "${q.answer}" is not in options for question "${q.question}". Falling back to the first option.`);
                    q.answer = q.options[0];
                }
            }
        });
    }
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API/generate-listening-material] Error:', error);
    // Возвращаем более детальное сообщение об ошибке
    return NextResponse.json(
        { 
            error: 'Ошибка генерации аудиоматериала на сервере.',
            details: error.message || 'Unknown error' 
        }, 
        { status: 500 }
    );
  }
}
