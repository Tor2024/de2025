
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserData, UserSettings, UserProgress, LearningRoadmap, ErrorRecord, VocabularyWord } from '@/lib/types';
import { initialUserProgress, MAX_LEARNING_STAGE, learningStageIntervals } from '@/lib/types';

interface UserDataContextType {
  userData: UserData;
  setUserData: (dataOrFn: UserData | ((prevData: UserData) => UserData)) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  clearUserData: () => void;
  setLearningRoadmap: (roadmap: LearningRoadmap) => void;
  toggleLessonCompletion: (lessonId: string) => void;
  addErrorToArchive: (errorData: Omit<ErrorRecord, 'id' | 'date'>) => void;
  clearErrorArchive: () => void;
  processWordRepetition: (wordData: VocabularyWord, targetLanguage: UserSettings['targetLanguage'], knewIt: boolean) => void;
  recordPracticeSetCompletion: () => void;
  isLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// Moved to module scope to ensure stable reference
const initialUserData: UserData = {
  settings: null,
  progress: { ...initialUserProgress },
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [userDataState, setUserDataState, isStorageLoading] = useLocalStorage<UserData>('lingualab-user', initialUserData);

  const setUserData = useCallback((dataOrFn: UserData | ((prevData: UserData) => UserData)) => {
    setUserDataState(dataOrFn);
  }, [setUserDataState]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setUserData(prev => ({
      ...prev,
      settings: { ...(prev.settings || {} as UserSettings), ...newSettings },
    }));
  }, [setUserData]);

  const updateProgress = useCallback((newProgress: Partial<UserProgress>) => {
    setUserData(prev => {
      const updatedProgress = { 
        ...initialUserProgress, 
        ...(prev.progress || {}), 
        ...newProgress 
      } as UserProgress;
      return {
        ...prev,
        progress: updatedProgress,
      };
    });
  }, [setUserData]);
  
  const setLearningRoadmap = useCallback((roadmap: LearningRoadmap) => {
    updateProgress({ learningRoadmap: roadmap });
  }, [updateProgress]);

  const toggleLessonCompletion = useCallback((lessonId: string) => {
    setUserData(prev => {
      const currentProgress = prev.progress;
      const currentCompletedIds = currentProgress.completedLessonIds || [];
      const isCompleted = currentCompletedIds.includes(lessonId);
      
      let newCompletedLessonIds: string[];
      
      if (isCompleted) {
        newCompletedLessonIds = currentCompletedIds.filter(id => id !== lessonId);
      } else {
        newCompletedLessonIds = [...currentCompletedIds, lessonId];
      }

      let updatedProgress: UserProgress = {
        ...currentProgress,
        completedLessonIds: newCompletedLessonIds,
      };

      return {
        ...prev,
        progress: updatedProgress,
      };
    });
  }, [setUserData]);

  const addErrorToArchive = useCallback((errorData: Omit<ErrorRecord, 'id' | 'date'>) => {
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
  }, [setUserData]);

  const clearErrorArchive = useCallback(() => {
    setUserData(prev => ({
      ...prev,
      progress: {
        ...(prev.progress || initialUserProgress),
        errorArchive: [],
      },
    }));
  }, [setUserData]);

  const processWordRepetition = useCallback(
    (wordData: VocabularyWord, targetLanguage: UserSettings['targetLanguage'], knewIt: boolean) => {
      setUserData(prev => {
        if (!prev.settings) return prev; 

        const wordId = `${targetLanguage.toLowerCase()}_${wordData.word.toLowerCase()}`;
        const learnedWords = prev.progress.learnedWords || [];
        const existingWordIndex = learnedWords.findIndex(lw => lw.id === wordId);
        let newLearnedWords = [...learnedWords];
        const now = new Date();

        let currentStage: number;
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
            ...prev.progress,
            learnedWords: newLearnedWords,
          },
        };
      });
    },
    [setUserData]
  );

  const recordPracticeSetCompletion = useCallback(() => {
    setUserData(prev => {
      const currentProgress = prev.progress;
      const newPracticeSetsCompleted = (currentProgress.practiceSetsCompleted || 0) + 1;
      
      let updatedProgress: UserProgress = {
        ...currentProgress,
        practiceSetsCompleted: newPracticeSetsCompleted,
      };
      
      return {
        ...prev,
        progress: updatedProgress,
      };
    });
  }, [setUserData]);


  const clearUserData = useCallback(() => {
    setUserDataState(initialUserData);
  }, [setUserDataState]);

  const contextValue = {
    userData: userDataState,
    setUserData,
    updateSettings,
    updateProgress,
    clearUserData,
    setLearningRoadmap,
    toggleLessonCompletion,
    addErrorToArchive,
    clearErrorArchive,
    processWordRepetition,
    recordPracticeSetCompletion,
    isLoading: isStorageLoading,
  };

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
