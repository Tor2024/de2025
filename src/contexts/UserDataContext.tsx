
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserData, UserSettings, UserProgress, LearningRoadmap } from '@/lib/types';

interface UserDataContextType {
  userData: UserData;
  setUserData: (data: UserData) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  clearUserData: () => void;
  setLearningRoadmap: (roadmap: LearningRoadmap) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const initialUserData: UserData = {
  settings: null,
  progress: {
    xp: 0,
    streak: 0,
    badges: [],
    moduleCompletion: {},
    errorArchive: [],
    learningRoadmap: undefined,
  },
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useLocalStorage<UserData>('lingualab-user', initialUserData);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setUserData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings } as UserSettings,
    }));
  };

  const updateProgress = (newProgress: Partial<UserProgress>) => {
    setUserData(prev => ({
      ...prev,
      progress: { ...prev.progress, ...newProgress } as UserProgress,
    }));
  };
  
  const setLearningRoadmap = (roadmap: LearningRoadmap) => {
    updateProgress({ learningRoadmap: roadmap });
  };

  const clearUserData = () => {
    setUserData(initialUserData);
  };

  return (
    <UserDataContext.Provider value={{ userData, setUserData, updateSettings, updateProgress, clearUserData, setLearningRoadmap }}>
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
