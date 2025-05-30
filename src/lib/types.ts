
import { z } from 'zod';

export type InterfaceLanguage =
  | 'en' | 'ru' | 'de' | 'es' | 'fr' | 'it' | 'nl' | 'fi' | 'zh' | 'hi'
  | 'no' | 'hu' | 'da' | 'ko' | 'bg' | 'sl' | 'uk' | 'be' | 'pl' | 'ro' | 'ja' | 'ar';

export type TargetLanguage =
  | 'English' | 'Russian' | 'German' | 'Spanish' | 'French' | 'Italian' | 'Dutch' | 'Finnish' | 'Chinese' | 'Hindi'
  | 'Norwegian' | 'Hungarian' | 'Danish' | 'Korean' | 'Bulgarian' | 'Slovenian' | 'Ukrainian' | 'Belarusian'
  | 'Polish' | 'Romanian' | 'Japanese' | 'Arabic';

export const proficiencyLevels = ['A1-A2', 'B1-B2', 'C1-C2'] as const;
export type ProficiencyLevel = typeof proficiencyLevels[number];


export interface UserSettings {
  interfaceLanguage: InterfaceLanguage;
  targetLanguage: TargetLanguage;
  proficiencyLevel: ProficiencyLevel;
  goal: string;
  userName?: string;
}

export interface Lesson {
  id: string;
  level: string;
  title: string;
  description: string;
  topics: string[];
  estimatedDuration?: string;
}

export interface LearningRoadmap {
  introduction: string;
  lessons: Lesson[];
  conclusion?: string;
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
  moduleCompletion: Record<string, number | boolean>;
  errorArchive: ErrorRecord[];
  onboardingStep?: number;
  completedLessonIds: string[]; // Added for tracking completed lessons
}

export const initialUserProgress: UserProgress = {
  xp: 0,
  streak: 0,
  badges: [],
  moduleCompletion: {},
  errorArchive: [],
  learningRoadmap: undefined,
  completedLessonIds: [], // Initialized
};

export interface UserData {
  settings: UserSettings | null;
  progress: UserProgress;
}

export const supportedLanguages: Array<{ code: InterfaceLanguage; name: TargetLanguage; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

export const interfaceLanguageCodes = supportedLanguages.map(lang => lang.code) as [InterfaceLanguage, ...InterfaceLanguage[]];
export const InterfaceLanguageSchema = z.enum(interfaceLanguageCodes);

export const targetLanguageNames = supportedLanguages.map(lang => lang.name) as [TargetLanguage, ...TargetLanguage[]];

export const germanWritingTaskTypes = [
  { value: "Informal Letter/Email", labelKey: "informalLetterEmail", defaultLabel: "Informal Letter/Email" },
  { value: "Formal Letter/Email", labelKey: "formalLetterEmail", defaultLabel: "Formal Letter/Email" },
  { value: "Complaint Letter", labelKey: "complaintLetter", defaultLabel: "Complaint Letter" },
  { value: "Announcement/Notice", labelKey: "announcementNotice", defaultLabel: "Announcement/Notice" },
  { value: "Chat/SMS/Short Note", labelKey: "chatSmsNote", defaultLabel: "Chat/SMS/Short Note" },
  { value: "Essay/Argumentative Text", labelKey: "essayArgumentative", defaultLabel: "Essay/Argumentative Text" },
] as const;

export type GermanWritingTaskType = typeof germanWritingTaskTypes[number]['value'];
