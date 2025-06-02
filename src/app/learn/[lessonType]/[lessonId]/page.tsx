import React from 'react';
import { lessonTypes } from '@/config/lessonTypes';
import dynamic from 'next/dynamic';
import LessonPageClient from './LessonPageClient';

interface LessonPageProps {
  params: {
    lessonType: string;
    lessonId: string;
  };
}

type LessonTypeConfig = { displayName: string; componentPath: string };

export default function LessonPage({ params }: LessonPageProps) {
  const { lessonType, lessonId } = params;
  const lessonTypeConfig = (lessonTypes as Record<string, LessonTypeConfig>)[lessonType];

  return (
    <LessonPageClient lessonType={lessonType} lessonId={lessonId} displayName={lessonTypeConfig?.displayName} />
  );
} 