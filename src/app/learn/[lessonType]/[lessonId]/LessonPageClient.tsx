"use client";
import React from 'react';
import dynamic from 'next/dynamic';

interface LessonPageClientProps {
  lessonType: string;
  lessonId: string;
  displayName?: string;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Define a map of lesson types to their corresponding dynamic imports
const moduleComponents = {
  grammar: dynamic(() => import('@/components/learn/GrammarModuleClient'), { ssr: false }),
  listening: dynamic(() => import('@/components/learn/ListeningModuleClient'), { ssr: false }),
  reading: dynamic(() => import('@/components/learn/ReadingModuleClient'), { ssr: false }),
  speaking: dynamic(() => import('@/components/learn/SpeakingModuleClient'), { ssr: false }),
  vocabulary: dynamic(() => import('@/components/learn/VocabularyModuleClient'), { ssr: false }),
  writing: dynamic(() => import('@/components/learn/WritingAssistantClient'), { ssr: false }),
  newwords: dynamic(() => import('@/components/learn/NewWordsModuleClient'), { ssr: false }),
  // Add other lesson types and their imports here if needed
};

export default function LessonPageClient({ lessonType, lessonId, displayName }: LessonPageClientProps) {
  // Get the component based on the lesson type from the map
  const ModuleComponent = moduleComponents[lessonType as keyof typeof moduleComponents] || null;
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>
        {displayName || 'Урок'}
      </h1>
      <p style={{ fontSize: 18, color: '#888' }}>ID урока: {lessonId}</p>
      <div style={{ marginTop: 32 }}>
        {ModuleComponent ? <ModuleComponent lessonId={lessonId} /> : <div style={{ fontSize: 20, color: '#c00' }}>Модуль не найден</div>}
      </div>
    </div>
  );
} 