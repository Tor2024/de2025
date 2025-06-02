import { NextRequest, NextResponse } from 'next/server';
import { adaptiveGrammarExplanations } from '@/ai/flows/adaptive-grammar-explanations';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await adaptiveGrammarExplanations(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка генерации грамматического объяснения' }, { status: 500 });
  }
} 