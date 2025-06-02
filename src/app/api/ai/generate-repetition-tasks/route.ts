import { NextRequest, NextResponse } from 'next/server';
import { generateRepetitionTasksFlow } from '@/ai/flows/generate-repetition-tasks-flow';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await generateRepetitionTasksFlow(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка генерации заданий на повторение' }, { status: 500 });
  }
} 