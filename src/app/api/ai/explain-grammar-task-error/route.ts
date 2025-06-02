import { NextRequest, NextResponse } from 'next/server';
import { explainGrammarTaskError } from '@/ai/flows/explain-grammar-task-error-flow';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await explainGrammarTaskError(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка объяснения грамматической ошибки' }, { status: 500 });
  }
} 