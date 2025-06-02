import { NextRequest, NextResponse } from 'next/server';
import { generatePhoneticsTasksFlow } from '@/ai/flows/generate-phonetics-tasks-flow';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await generatePhoneticsTasksFlow(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка генерации фонетических заданий' }, { status: 500 });
  }
} 