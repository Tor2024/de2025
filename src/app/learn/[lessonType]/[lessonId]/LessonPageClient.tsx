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

export default function LessonPageClient({ lessonType, lessonId, displayName }: LessonPageClientProps) {
  let ModuleComponent: React.ComponentType<any> | null = null;
  try {
    ModuleComponent = dynamic(() => import(`@/components/learn/${capitalize(lessonType)}ModuleClient`), { ssr: false });
  } catch (e) {
    ModuleComponent = null;
  }
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