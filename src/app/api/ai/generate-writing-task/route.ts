
import { NextRequest, NextResponse } from 'next/server';
import { generateWritingTask } from '@/ai/flows/generate-writing-task-flow';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await generateWritingTask(input);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API/generate-writing-task] Error:', error);
    return NextResponse.json(
        { 
            error: 'Ошибка при генерации письменного задания.',
            details: error.message || 'Unknown error' 
        }, 
        { status: 500 }
    );
  }
}
