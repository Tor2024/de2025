
export type InterfaceLanguage = 'en' | 'ru';
export type ProficiencyLevel = 'A1-A2' | 'B1-B2' | 'C1-C2';
export type TargetLanguage = 'German' | 'English' | 'Spanish' | 'French'; // Example, can be extended

export interface UserSettings {
  interfaceLanguage: InterfaceLanguage;
  targetLanguage: TargetLanguage;
  proficiencyLevel: ProficiencyLevel;
  goal: string;
  userName?: string;
}

export interface LearningRoadmap {
  // Assuming the AI returns a markdown string or structured text
  // This could be parsed into a more structured format if needed
  rawContent: string;
  // Example structured format (optional, for future enhancement)
  // weeks?: Array<{
  //   weekNumber: number;
  //   theme: string;
  //   skills: Array<{
  //     type: 'Grammar' | 'Vocabulary' | 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'WordPractice';
  //     topic: string;
  //     completed: boolean;
  //   }>;
  // }>;
}

export interface ErrorRecord {
  id: string;
  topic: string;
  error: string;
  feedback: string;
  date: string;
}

export interface UserProgress {
  learningRoadmap?: LearningRoadmap;
  xp: number;
  streak: number;
  badges: string[];
  // Key: module or lesson ID, Value: completion status (e.g., percentage or boolean)
  moduleCompletion: Record<string, number | boolean>; 
  errorArchive: ErrorRecord[];
  // Tracks current step in onboarding if not completed in one go
  onboardingStep?: number; 
}

export interface UserData {
  settings: UserSettings | null;
  progress: UserProgress | null;
}

// For AI flow inputs/outputs - already defined in src/ai/flows, but good to be aware
// Example:
// import type { GeneratePersonalizedLearningRoadmapInput } from '@/ai/flows/ai-learning-roadmap';
// import type { AdaptiveGrammarExplanationsInput } from '@/ai/flows/adaptive-grammar-explanations';
// import type { AIPoweredWritingAssistanceInput } from '@/ai/flows/ai-powered-writing-assistance';
