import { NextRequest, NextResponse } from 'next/server';
import { generateNewWordsTasks } from '@/ai/flows/generate-new-words-tasks-flow';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await generateNewWordsTasks(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка генерации заданий по новым словам' }, { status: 500 });
  }
}
