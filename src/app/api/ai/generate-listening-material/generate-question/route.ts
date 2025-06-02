import { NextRequest, NextResponse } from 'next/server';
import { generateSingleListeningQuestion } from '@/ai/flows/generate-listening-material-flow';

export async function POST(req: NextRequest) {
  try {
    const { script, interfaceLanguage, targetLanguage, proficiencyLevel, existingQuestions } = await req.json();
    const question = await generateSingleListeningQuestion({
      script,
      interfaceLanguage,
      targetLanguage,
      proficiencyLevel,
      existingQuestions: existingQuestions || [],
    });
    return NextResponse.json(question);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка генерации вопроса для аудирования' }, { status: 500 });
  }
} 