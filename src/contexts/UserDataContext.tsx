
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

// Badge Constants
const BADGE_FIRST_LESSON_COMPLETED = "First Lesson Completed";
const BADGE_XP_100 = "100 XP Earned";
const BADGE_STREAK_3_DAYS = "3-Day Streak";
const BADGE_XP_500 = "500 XP Milestone";
const BADGE_STREAK_7_DAYS = "7-Day Learning Habit";
const BADGE_LESSONS_5_COMPLETED = "5 Lessons Conquered";
const BADGE_XP_1000 = "1000 XP Power Up!";
const BADGE_STREAK_14_DAYS = "14-Day Dedication!";
const BADGE_XP_2000 = "2000 XP Grandmaster!";
const BADGE_STREAK_30_DAYS = "30-Day Consistency King/Queen!";
const BADGE_FIRST_PRACTICE_SET_COMPLETED = "First Practice Set Aced!";
const BADGE_PRACTICE_SETS_5_COMPLETED = "5 Practice Sets Mastered!";


const checkAndAwardBadges = (currentProgress: UserProgress): UserProgress => {
  let newBadges = [...(currentProgress.badges || [])];
  const { xp, streak, completedLessonIds, practiceSetsCompleted } = currentProgress;

  // Lesson Badges
  if (completedLessonIds && completedLessonIds.length >= 1 && !newBadges.includes(BADGE_FIRST_LESSON_COMPLETED)) {
    newBadges.push(BADGE_FIRST_LESSON_COMPLETED);
  }
  if (completedLessonIds && completedLessonIds.length >= 5 && !newBadges.includes(BADGE_LESSONS_5_COMPLETED)) {
    newBadges.push(BADGE_LESSONS_5_COMPLETED);
  }

  // XP Badges
  if (xp >= 100 && !newBadges.includes(BADGE_XP_100)) newBadges.push(BADGE_XP_100);
  if (xp >= 500 && !newBadges.includes(BADGE_XP_500)) newBadges.push(BADGE_XP_500);
  if (xp >= 1000 && !newBadges.includes(BADGE_XP_1000)) newBadges.push(BADGE_XP_1000);
  if (xp >= 2000 && !newBadges.includes(BADGE_XP_2000)) newBadges.push(BADGE_XP_2000);

  // Streak Badges
  if (streak >= 3 && !newBadges.includes(BADGE_STREAK_3_DAYS)) newBadges.push(BADGE_STREAK_3_DAYS);
  if (streak >= 7 && !newBadges.includes(BADGE_STREAK_7_DAYS)) newBadges.push(BADGE_STREAK_7_DAYS);
  if (streak >= 14 && !newBadges.includes(BADGE_STREAK_14_DAYS)) newBadges.push(BADGE_STREAK_14_DAYS);
  if (streak >= 30 && !newBadges.includes(BADGE_STREAK_30_DAYS)) newBadges.push(BADGE_STREAK_30_DAYS);

  // Practice Set Badges
  if (practiceSetsCompleted >= 1 && !newBadges.includes(BADGE_FIRST_PRACTICE_SET_COMPLETED)) {
    newBadges.push(BADGE_FIRST_PRACTICE_SET_COMPLETED);
  }
  if (practiceSetsCompleted >= 5 && !newBadges.includes(BADGE_PRACTICE_SETS_5_COMPLETED)) {
    newBadges.push(BADGE_PRACTICE_SETS_5_COMPLETED);
  }
  
  return { ...currentProgress, badges: newBadges };
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
        progress: checkAndAwardBadges(updatedProgress),
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
      let newXp = currentProgress.xp || 0;
      let newStreak = currentProgress.streak || 0;
      
      if (isCompleted) {
        newCompletedLessonIds = currentCompletedIds.filter(id => id !== lessonId);
        newXp = Math.max(0, newXp - 25); 
        // Streak is not removed when un-completing a lesson
      } else {
        newCompletedLessonIds = [...currentCompletedIds, lessonId];
        newXp += 25; 
        newStreak += 1; 
      }

      let updatedProgress = {
        ...currentProgress,
        completedLessonIds: newCompletedLessonIds,
        xp: newXp,
        streak: newStreak,
      };

      updatedProgress = checkAndAwardBadges(updatedProgress);

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
        if (!prev.settings) return prev; // Should not happen if user is in this module

        const wordId = `${targetLanguage.toLowerCase()}_${wordData.word.toLowerCase()}`;
        const learnedWords = prev.progress.learnedWords || [];
        const existingWordIndex = learnedWords.findIndex(lw => lw.id === wordId);
        let newLearnedWords = [...learnedWords];
        const now = new Date();

        let currentStage: number;
        if (existingWordIndex !== -1) { // Word exists, update it
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
        } else { // New word
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
      const newXp = (currentProgress.xp || 0) + 10; // Award 10 XP for completing a practice set
      
      let updatedProgress = {
        ...currentProgress,
        practiceSetsCompleted: newPracticeSetsCompleted,
        xp: newXp,
      };

      updatedProgress = checkAndAwardBadges(updatedProgress);
      
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
