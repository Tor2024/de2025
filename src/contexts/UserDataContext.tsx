
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserData, UserSettings, UserProgress, LearningRoadmap, ErrorRecord } from '@/lib/types';
import { initialUserProgress } from '@/lib/types';

interface UserDataContextType {
  userData: UserData;
  setUserData: (dataOrFn: UserData | ((prevData: UserData) => UserData)) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  clearUserData: () => void;
  setLearningRoadmap: (roadmap: LearningRoadmap) => void;
  toggleLessonCompletion: (lessonId: string) => void;
  addErrorToArchive: (errorData: Omit<ErrorRecord, 'id' | 'date'>) => void;
  isLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// Moved to module scope to ensure stable reference
const initialUserData: UserData = {
  settings: null,
  progress: { ...initialUserProgress },
};

const BADGE_FIRST_LESSON_COMPLETED = "First Lesson Completed";
const BADGE_XP_100 = "100 XP Earned";
const BADGE_STREAK_3_DAYS = "3-Day Streak";

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
      progress: { ...initialUserProgress, ...(prev.progress || {}), ...newProgress } as UserProgress,
    }));
  }, [setUserData]);
  
  const setLearningRoadmap = useCallback((roadmap: LearningRoadmap) => {
    updateProgress({ learningRoadmap: roadmap });
  }, [updateProgress]);

  const toggleLessonCompletion = useCallback((lessonId: string) => {
    setUserData(prev => {
      const currentProgress = prev.progress || initialUserProgress;
      const currentCompletedIds = currentProgress.completedLessonIds || [];
      const isCompleted = currentCompletedIds.includes(lessonId);
      
      let newCompletedLessonIds: string[];
      let newXp = currentProgress.xp;
      let newStreak = currentProgress.streak;
      let newBadges = [...(currentProgress.badges || [])];

      if (isCompleted) {
        // Mark as incomplete
        newCompletedLessonIds = currentCompletedIds.filter(id => id !== lessonId);
        newXp = Math.max(0, newXp - 25);
        // For simplicity, streak is not decremented, nor are badges removed.
      } else {
        // Mark as complete
        newCompletedLessonIds = [...currentCompletedIds, lessonId];
        newXp += 25;
        newStreak += 1; // Simplified streak logic

        // Award badges
        if (newCompletedLessonIds.length >= 1 && !newBadges.includes(BADGE_FIRST_LESSON_COMPLETED)) {
          newBadges.push(BADGE_FIRST_LESSON_COMPLETED);
        }
        if (newXp >= 100 && !newBadges.includes(BADGE_XP_100)) {
          newBadges.push(BADGE_XP_100);
        }
        if (newStreak >= 3 && !newBadges.includes(BADGE_STREAK_3_DAYS)) {
          newBadges.push(BADGE_STREAK_3_DAYS);
        }
      }

      return {
        ...prev,
        progress: {
          ...currentProgress,
          completedLessonIds: newCompletedLessonIds,
          xp: newXp,
          streak: newStreak,
          badges: newBadges,
        },
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
      return {
        ...prev,
        progress: {
          ...(prev.progress || initialUserProgress),
          errorArchive: updatedErrorArchive,
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
    toggleLessonCompletion,
    addErrorToArchive,
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
