
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react'; // Removed useState and useEffect
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserData, UserSettings, UserProgress, LearningRoadmap } from '@/lib/types';
import { initialUserProgress } from '@/lib/types'; // Ensured initialUserProgress is imported

interface UserDataContextType {
  userData: UserData;
  setUserData: (dataOrFn: UserData | ((prevData: UserData) => UserData)) => void; // Updated type for setUserData
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  clearUserData: () => void;
  setLearningRoadmap: (roadmap: LearningRoadmap) => void;
  isLoading: boolean; 
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const initialUserData: UserData = {
  settings: null, 
  progress: { ...initialUserProgress }, // Use spread to ensure a new object for progress
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData, isStorageLoading] = useLocalStorage<UserData>('lingualab-user', initialUserData);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setUserData(prev => ({
      ...prev,
      settings: { ...(prev.settings || {}), ...newSettings } as UserSettings, // Handle if prev.settings is null
    }));
  };

  const updateProgress = (newProgress: Partial<UserProgress>) => {
    setUserData(prev => ({
      ...prev,
      // Ensure prev.progress is always an object, even if somehow corrupted or in an unexpected state.
      // Merge with initialUserProgress as a base for safety.
      progress: { ...initialUserProgress, ...(prev.progress || {}), ...newProgress } as UserProgress,
    }));
  };
  
  const setLearningRoadmap = (roadmap: LearningRoadmap) => {
    updateProgress({ learningRoadmap: roadmap });
  };

  const clearUserData = () => {
    setUserData(initialUserData); // Resets to defined initial state
  };

  // The isLoading for the context now directly comes from useLocalStorage
  const contextValue = {
    userData,
    setUserData, // Directly pass the setter from useLocalStorage
    updateSettings,
    updateProgress,
    clearUserData,
    setLearningRoadmap,
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
