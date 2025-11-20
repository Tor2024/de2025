
"use client";

import type { UserData, UserSettings, UserProgress, LearningRoadmap, ErrorRecord, VocabularyWord, UserLearnedWord, TargetLanguage } from './types';
import { initialUserProgress, MAX_LEARNING_STAGE, learningStageIntervals } from './types';
import type { Dispatch, SetStateAction } from 'react';

// This utility file centralizes logic for updating UserData state to prevent direct manipulation in multiple components.

export const toggleLessonCompletion = (
  setUserData: Dispatch<SetStateAction<UserData>>,
  lessonId: string
) => {
  setUserData(prev => {
    const currentCompletedIds = prev.progress?.completedLessonIds || [];
    const isCompleted = currentCompletedIds.includes(lessonId);
    const newCompletedLessonIds = isCompleted
      ? currentCompletedIds.filter(id => id !== lessonId)
      : [...currentCompletedIds, lessonId];
    
    return {
      ...prev,
      progress: {
        ...(prev.progress || initialUserProgress),
        completedLessonIds: newCompletedLessonIds,
      },
    };
  });
};

export const addErrorToArchive = (
  setUserData: Dispatch<SetStateAction<UserData>>,
  errorData: Omit<ErrorRecord, 'id' | 'date'>
) => {
  setUserData(prev => {
    const newError: ErrorRecord = {
      ...errorData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
    };
    const updatedErrorArchive = [...(prev.progress?.errorArchive || []), newError];
    const limitedErrorArchive = updatedErrorArchive.slice(-50); 

    return {
      ...prev,
      progress: {
        ...(prev.progress || initialUserProgress),
        errorArchive: limitedErrorArchive,
      },
    };
  });
};

export const clearErrorArchive = (setUserData: Dispatch<SetStateAction<UserData>>) => {
  setUserData(prev => ({
    ...prev,
    progress: {
      ...(prev.progress || initialUserProgress),
      errorArchive: [],
    },
  }));
};

export const processWordRepetition = (
  setUserData: Dispatch<SetStateAction<UserData>>,
  wordData: VocabularyWord,
  targetLanguage: TargetLanguage,
  knewIt: boolean
) => {
  setUserData(prev => {
    if (!prev.settings) return prev;
    const wordId = `${targetLanguage.toLowerCase()}_${wordData.word.toLowerCase()}`;
    const learnedWords = prev.progress?.learnedWords || [];
    let newLearnedWords = [...learnedWords];
    const now = new Date();

    let currentStage: number;
    const existingWordIndex = learnedWords.findIndex(lw => lw.id === wordId);

    if (existingWordIndex !== -1) {
      const oldStage = newLearnedWords[existingWordIndex].learningStage;
      currentStage = knewIt ? Math.min(oldStage + 1, MAX_LEARNING_STAGE) : 0;
      const intervalDays = learningStageIntervals[currentStage];
      const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      
      newLearnedWords[existingWordIndex] = {
        ...newLearnedWords[existingWordIndex],
        learningStage: currentStage,
        lastReviewed: now.toISOString(),
        nextReviewDate: nextReview.toISOString(),
      };
    } else {
      currentStage = knewIt ? 1 : 0;
      const intervalDays = learningStageIntervals[currentStage];
      const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      const newWordEntry: UserLearnedWord = {
        id: wordId,
        word: wordData.word,
        translation: wordData.translation,
        targetLanguage: targetLanguage,
        exampleSentence: wordData.exampleSentence,
        lastReviewed: now.toISOString(),
        nextReviewDate: nextReview.toISOString(),
        learningStage: currentStage,
      };
      newLearnedWords.push(newWordEntry);
    }
    
    return {
      ...prev,
      progress: {
        ...(prev.progress || initialUserProgress),
        learnedWords: newLearnedWords,
      },
    };
  });
};

export const recordPracticeSetCompletion = (setUserData: Dispatch<SetStateAction<UserData>>) => {
  setUserData(prev => ({
    ...prev,
    progress: {
      ...(prev.progress || initialUserProgress),
      practiceSetsCompleted: (prev.progress?.practiceSetsCompleted || 0) + 1,
    },
  }));
};
