
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
  goal: string[];
  interests: string[];
  userName?: string;
  proficiencyLevel?: ProficiencyLevel;
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

// For Vocabulary Module / SRS
export interface VocabularyWord {
    word: string;
    translation: string;
    exampleSentence?: string;
}

export interface UserLearnedWord extends VocabularyWord {
  id: string; // Уникальный идентификатор, например, targetLanguage_word
  targetLanguage: TargetLanguage;
  lastReviewed: string; // Дата последнего повторения в ISO формате
  nextReviewDate: string; // Предполагаемая дата следующего повторения в ISO формате
  learningStage: number; // Стадия изучения (0-MAX_LEARNING_STAGE)
}

export interface UserProgress {
  learningRoadmap?: LearningRoadmap;
  errorArchive: ErrorRecord[];
  completedLessonIds: string[]; // IDs of lessons from LearningRoadmap
  learnedWords: UserLearnedWord[]; // For SRS
  practiceSetsCompleted: number; // Counter for completed practice sets
  topicMistakes?: Record<string, number>; // ошибки по темам
  grammarMistakes?: Record<string, number>; // ошибки по грамматике
  vocabMistakes?: Record<string, number>; // ошибки по лексике
}

export const initialUserProgress: UserProgress = {
  errorArchive: [],
  learningRoadmap: undefined,
  completedLessonIds: [],
  learnedWords: [],
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
  { code: 'syr', name: 'Syriac', nativeName: 'Syriac' }, // Note: Specific BCP-47 for Syriac might be 'syc' for classical, or others for modern dialects.
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
  { code: 'prs', name: 'Dari', nativeName: 'دری' }, // Dari is often considered a variety of Persian (Farsi)
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
    'English': 'en-US', 'Russian': 'ru-RU', 'German': 'de-DE', 'Spanish': 'es-ES',
    'French': 'fr-FR', 'Italian': 'it-IT', 'Dutch': 'nl-NL', 'Finnish': 'fi-FI',
    'Chinese': 'zh-CN', 'Hindi': 'hi-IN', 'Norwegian': 'nb-NO', 'Hungarian': 'hu-HU',
    'Danish': 'da-DK', 'Korean': 'ko-KR', 'Bulgarian': 'bg-BG', 'Slovenian': 'sl-SI',
    'Ukrainian': 'uk-UA', 'Belarusian': 'be-BY', 'Polish': 'pl-PL', 'Romanian': 'ro-RO',
    'Japanese': 'ja-JP', 'Arabic': 'ar-SA', 'Turkish': 'tr-TR', 'Latin': 'la',
    'Greek': 'el-GR', 'Kazakh': 'kk-KZ', 'Georgian': 'ka-GE', 'Syriac': 'syc',
    'Pashto': 'ps-AF', 'Dari': 'fa-AF',
  };
  return langMapping[targetLanguage] || 'en-US'; // Fallback to English US
};

// Function to map InterfaceLanguage (e.g., "en") to BCP-47 code (e.g., "en-US")
export const mapInterfaceLanguageToBcp47 = (interfaceLang: InterfaceLanguage): string => {
  const langMapping: Record<InterfaceLanguage, string> = {
    'en': 'en-US', 'ru': 'ru-RU', 'de': 'de-DE', 'es': 'es-ES',
    'fr': 'fr-FR', 'it': 'it-IT', 'nl': 'nl-NL', 'fi': 'fi-FI',
    'zh': 'zh-CN', 'hi': 'hi-IN', 'no': 'nb-NO', 'hu': 'hu-HU',
    'da': 'da-DK', 'ko': 'ko-KR', 'bg': 'bg-BG', 'sl': 'sl-SI',
    'uk': 'uk-UA', 'be': 'be-BY', 'pl': 'pl-PL', 'ro': 'ro-RO',
    'ja': 'ja-JP', 'ar': 'ar-SA', 'tr': 'tr-TR', 'la': 'la',
    'el': 'el-GR', 'kk': 'kk-KZ', 'ka': 'ka-GE', 'syr': 'syc',
    'ps': 'ps-AF', 'prs': 'fa-AF',
  };
  return langMapping[interfaceLang] || 'en-US'; // Fallback to English US
};

// For Spaced Repetition System (SRS)
export const learningStageIntervals: Record<number, number> = { // days
  0: 1,  // After "Didn't Know" -> review in 1 day
  1: 3,  // After "Knew It" (was stage 0) -> review in 3 days
  2: 7,
  3: 14,
  4: 30,
  5: 60, // Max interval for "know well"
};
export const MAX_LEARNING_STAGE = 5;
