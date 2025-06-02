import { NextRequest, NextResponse } from 'next/server';
import { generateListeningMaterial } from '@/ai/flows/generate-listening-material-flow';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await generateListeningMaterial(input);
    // --- Валидация comprehensionQuestions: answer должен совпадать с вариантом, который встречается в script ---
    if (result && Array.isArray(result.comprehensionQuestions)) {
      const script = (result.script || '').toLowerCase();
      // Простейший бесплатный словарь для сопоставления ключевых слов (расширяйте по необходимости)
      const ruDeDict: Record<string, string[]> = {
        'кофе': ['kaffee'],
        'хлеб': ['brot'],
        'джем': ['marmelade'],
        'варенье': ['marmelade'],
        'сыр': ['käse', 'gouda'],
        'яйцо': ['ei'],
        'яйца': ['ei', 'eier'],
        'яблоко': ['apfel'],
        'яблоки': ['apfel', 'äpfel'],
        'огурец': ['gurke'],
        'огурцы': ['gurke', 'gurken'],
        'помидор': ['tomate'],
        'помидоры': ['tomate', 'tomaten'],
        'мюсли': ['müsli'],
        'чай': ['tee'],
        'печенье': ['keks', 'kekse', 'plätzchen'],
        'сок': ['saft'],
        'фрукты': ['frucht', 'früchte', 'obst'],
        'салат': ['salat'],
        'картофель': ['kartoffel', 'kartoffeln'],
        'бутерброд': ['brot', 'brötchen'],
        'джемом': ['marmelade'],
      };
      result.comprehensionQuestions = await Promise.all(result.comprehensionQuestions.map(async q => {
        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          // --- Gemini-анализ для выбора правильного ответа ---
          const geminiPrompt = `Скрипт (на языке targetLanguage):\n"""\n${result.script}\n"""\nВопрос: ${q.question}\nВарианты ответа (на ${input.interfaceLanguage}):\n${q.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nДля каждого варианта сделай внутренний перевод на язык скрипта, но не показывай перевод пользователю. Выбери тот вариант, который по смыслу и содержанию наиболее точно соответствует тексту скрипта. Верни только исходный вариант ответа (на ${input.interfaceLanguage}).`;
          let geminiAnswer = '';
          try {
            const geminiRes = await ai.generate({ prompt: geminiPrompt });
            geminiAnswer = (geminiRes?.text || '').trim();
          } catch (e) {
            geminiAnswer = '';
          }
          // Если Gemini-ответ совпадает с одним из вариантов — подставляем его
          if (q.options.includes(geminiAnswer)) {
            return { ...q, answer: geminiAnswer };
          }
          // Если не найдено — прежняя логика (словари и т.д.)
          // --- Улучшенная логика для вопросов про количество и предмет ---
          let found: string | undefined;
          // Пробуем извлечь ключевое слово из вопроса
          const match = q.question.match(/(Tomaten|Gurken|Kartoffeln|Brot|Käse|Äpfel|яйцо|сыр|яблок|помидор|огурец|картофель|хлеб|Gouda|Salat|Abendessen|Nachtisch|кофе|джем|варенье|мюсли|чай|печенье|сок|фрукты|бутерброд)/i);
          if (match) {
            const keyword = match[1].toLowerCase();
            // Пробуем найти вариант, который встречается в скрипте рядом с этим словом
            for (const opt of q.options) {
              const optNorm = opt.toLowerCase();
              // 1. Сопоставление по переводу (если вариант на русском, а скрипт на немецком)
              let translations: string[] = [];
              if (ruDeDict[optNorm]) {
                translations = ruDeDict[optNorm];
              } else {
                // Пробуем разбить вариант на слова и искать переводы для каждого
                translations = optNorm.split(/\s|,|и/).flatMap(word => ruDeDict[word] || []);
              }
              // Если хотя бы один перевод встречается в скрипте — считаем этот вариант правильным
              if (translations.some(tr => script.includes(tr))) {
                found = opt;
                break;
              }
              // Также ищем сочетание "<перевод> <ключевое слово>" или наоборот
              if (translations.some(tr => script.includes(tr + ' ' + keyword) || script.includes(keyword + ' ' + tr))) {
                found = opt;
                break;
              }
              // Старый способ: ищем сочетание "<вариант> <ключевое слово>"
              if (
                script.includes(optNorm + ' ' + keyword) ||
                script.includes(keyword + ' ' + optNorm)
              ) {
                found = opt;
                break;
              }
            }
          }
          // Если найдено по ключевому слову или переводу — подставляем
          if (found) {
            return { ...q, answer: found };
          }
          // Если не найдено — ищем любой вариант, который встречается в скрипте
          const foundSimple = q.options.find(opt => script.includes(opt.toLowerCase()));
          if (foundSimple) {
            return { ...q, answer: foundSimple };
          }
          // Если не найдено — подставить первый вариант
          return { ...q, answer: q.options[0] };
        }
        return q;
      }));
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка генерации аудиоматериала' }, { status: 500 });
  }
} 