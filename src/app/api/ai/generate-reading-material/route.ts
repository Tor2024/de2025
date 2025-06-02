import { NextRequest, NextResponse } from 'next/server';
import { generateReadingMaterial } from '@/ai/flows/generate-reading-material-flow';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await generateReadingMaterial(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка генерации текста для чтения' }, { status: 500 });
  }
} 