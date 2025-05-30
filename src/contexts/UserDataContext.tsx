
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserData, UserSettings, UserProgress, LearningRoadmap } from '@/lib/types';
import { initialUserProgress } from '@/lib/types';

interface UserDataContextType {
  userData: UserData;
  setUserData: (dataOrFn: UserData | ((prevData: UserData) => UserData)) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  clearUserData: () => void;
  setLearningRoadmap: (roadmap: LearningRoadmap) => void;
  toggleLessonCompletion: (lessonId: string) => void; // Added
  isLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const initialUserData: UserData = {
  settings: null,
  progress: { ...initialUserProgress },
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData, isStorageLoading] = useLocalStorage<UserData>('lingualab-user', initialUserData);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setUserData(prev => ({
      ...prev,
      settings: { ...(prev.settings || {} as UserSettings), ...newSettings },
    }));
  }, [setUserData]);

  const updateProgress = useCallback((newProgress: Partial<UserProgress>) => {
    setUserData(prev => ({
      ...prev,
      progress: { ...initialUserProgress, ...(prev.progress || {}), ...newProgress },
    }));
  }, [setUserData]);
  
  const setLearningRoadmap = useCallback((roadmap: LearningRoadmap) => {
    updateProgress({ learningRoadmap: roadmap });
  }, [updateProgress]);

  const toggleLessonCompletion = useCallback((lessonId: string) => {
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
  }, [setUserData]);

  const clearUserData = useCallback(() => {
    setUserData(initialUserData);
  }, [setUserData]);

  const contextValue = {
    userData,
    setUserData,
    updateSettings,
    updateProgress,
    clearUserData,
    setLearningRoadmap,
    toggleLessonCompletion, // Added
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
