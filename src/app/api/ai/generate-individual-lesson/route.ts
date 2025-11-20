import { NextRequest, NextResponse } from 'next/server';
import { generateIndividualLesson } from '@/ai/flows/generate-individual-lesson-flow';
import type { GenerateIndividualLessonInput } from '@/ai/flows/generate-individual-lesson-flow';

export async function POST(req: NextRequest) {
  try {
    const input: GenerateIndividualLessonInput = await req.json();

    // Basic validation
    if (!input.topicTitle || !input.topicDescription) {
        return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    const result = await generateIndividualLesson(input);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API/generate-individual-lesson] Error:', error);
    return NextResponse.json(
        { 
            error: 'Ошибка при генерации индивидуального урока.',
            details: error.message || 'Unknown error' 
        }, 
        { status: 500 }
    );
  }
}
