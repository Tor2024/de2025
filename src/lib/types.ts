
import { z } from 'zod';

export type InterfaceLanguage =
  | 'en' | 'ru' | 'de' | 'es' | 'fr' | 'it' | 'nl' | 'fi' | 'zh' | 'hi'
  | 'no' | 'hu' | 'da' | 'ko' | 'bg' | 'sl' | 'uk' | 'be' | 'pl' | 'ro' | 'ja' | 'ar'
  | 'tr' | 'la' | 'el' | 'kk' | 'ka' | 'syr' | 'ps' | 'prs';

export type TargetLanguage =
  | 'English' | 'Russian' | 'German' | 'Spanish' | 'French' | 'Italian' | 'Dutch' | 'Finnish' | 'Chinese' | 'Hindi'
  | 'Norwegian' | 'Hungarian' | 'Danish' | 'Korean' | 'Bulgarian' | 'Slovenian' | 'Ukrainian' | 'Belarusian'
  | 'Polish' | 'Romanian' | 'Japanese' | 'Arabic'
  | 'Turkish' | 'Latin' | 'Greek' | 'Kazakh' | 'Georgian' | 'Syriac' | 'Pashto' | 'Dari';

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
  level: string; // This text MUST be in the specified `interfaceLanguage`
  title: string; // Must be in interfaceLanguage
  description: string; // Must be in interfaceLanguage, TTS-friendly
  topics: string[]; // Each topic string ITSELF MUST be in the interfaceLanguage
  estimatedDuration?: string; // Must be in interfaceLanguage
}

export interface LearningRoadmap {
  introduction: string; // Must be in interfaceLanguage, TTS-friendly
  lessons: Lesson[];
  conclusion?: string; // Must be in interfaceLanguage, TTS-friendly
}

export interface ErrorRecord {
  id: string;
  module: string;
  context?: string;
  userAttempt: string;
  correctAnswer?: string;
  aiFeedback?: string;
  date: string; // ISO string
}

export interface UserProgress {
  learningRoadmap?: LearningRoadmap;
  xp: number;
  streak: number;
  badges: string[];
  moduleCompletion: Record<string, number | boolean>;
  errorArchive: ErrorRecord[];
  completedLessonIds: string[];
  practiceSetsCompleted: number;
}

export const initialUserProgress: UserProgress = {
  xp: 0,
  streak: 0,
  badges: [],
  moduleCompletion: {},
  errorArchive: [],
  learningRoadmap: undefined,
  completedLessonIds: [],
  practiceSetsCompleted: 0,
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
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'la', name: 'Latin', nativeName: 'Latina' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'syr', name: 'Syriac', nativeName: 'Syriac' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
  { code: 'prs', name: 'Dari', nativeName: 'دری' },
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


// Function to map TargetLanguage (e.g., "German") to BCP-47 code (e.g., "de-DE")
export const mapTargetLanguageToBcp47 = (targetLanguage: TargetLanguage): string => {
  const langMapping: Partial<Record<TargetLanguage, string>> = {
    'English': 'en-US',
    'Russian': 'ru-RU',
    'German': 'de-DE',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'Italian': 'it-IT',
    'Dutch': 'nl-NL',
    'Finnish': 'fi-FI',
    'Chinese': 'zh-CN', // Simplified Chinese, Mainland
    'Hindi': 'hi-IN',
    'Norwegian': 'nb-NO', // Norwegian Bokmål
    'Hungarian': 'hu-HU',
    'Danish': 'da-DK',
    'Korean': 'ko-KR',
    'Bulgarian': 'bg-BG',
    'Slovenian': 'sl-SI',
    'Ukrainian': 'uk-UA',
    'Belarusian': 'be-BY',
    'Polish': 'pl-PL',
    'Romanian': 'ro-RO',
    'Japanese': 'ja-JP',
    'Arabic': 'ar-SA', // Standard Arabic, Saudi Arabia - common choice
    'Turkish': 'tr-TR',
    'Latin': 'la',
    'Greek': 'el-GR',
    'Kazakh': 'kk-KZ',
    'Georgian': 'ka-GE',
    'Syriac': 'syc', // Classical Syriac, might need specific voice support from TTS
    'Pashto': 'ps-AF',
    'Dari': 'fa-AF', // Dari is often represented as fa-AF (Persian, Afghanistan)
  };
  return langMapping[targetLanguage] || 'en-US'; // Fallback to English US
};

// Function to map InterfaceLanguage (e.g., "en") to BCP-47 code (e.g., "en-US")
export const mapInterfaceLanguageToBcp47 = (interfaceLang: InterfaceLanguage): string => {
  const langMapping: Record<InterfaceLanguage, string> = {
    'en': 'en-US',
    'ru': 'ru-RU',
    'de': 'de-DE',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'it': 'it-IT',
    'nl': 'nl-NL',
    'fi': 'fi-FI',
    'zh': 'zh-CN',
    'hi': 'hi-IN',
    'no': 'nb-NO',
    'hu': 'hu-HU',
    'da': 'da-DK',
    'ko': 'ko-KR',
    'bg': 'bg-BG',
    'sl': 'sl-SI',
    'uk': 'uk-UA',
    'be': 'be-BY',
    'pl': 'pl-PL',
    'ro': 'ro-RO',
    'ja': 'ja-JP',
    'ar': 'ar-SA',
    'tr': 'tr-TR',
    'la': 'la',
    'el': 'el-GR',
    'kk': 'kk-KZ',
    'ka': 'ka-GE',
    'syr': 'syc',
    'ps': 'ps-AF',
    'prs': 'fa-AF', // Dari (prs) often uses fa-AF for BCP-47
  };
  return langMapping[interfaceLang] || 'en-US'; // Fallback to English US
};
