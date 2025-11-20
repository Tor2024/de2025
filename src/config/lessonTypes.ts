// Конфиг типов уроков для масштабируемой архитектуры
// Ключ — тип урока, displayName — отображаемое имя, componentPath — путь к компоненту (пока строкой)
import type { TargetLanguage } from '@/lib/types';

export const lessonTypes = {
  grammar: {
    displayName: 'Грамматика',
    componentPath: '@/components/learn/GrammarModuleClient',
  },
  writing: {
    displayName: 'Письмо',
    componentPath: '@/components/learn/WritingModuleClient',
  },
  speaking: {
    displayName: 'Говорение',
    componentPath: '@/components/learn/SpeakingModuleClient',
  },
  phonetics: {
    displayName: 'Фонетика',
    componentPath: '@/components/learn/PhoneticsModuleClient',
  },
  vocabulary: {
    displayName: 'Лексика',
    componentPath: '@/components/learn/VocabularyModuleClient',
  },
  listening: {
    displayName: 'Аудирование',
    componentPath: '@/components/learn/ListeningModuleClient',
  },
  reading: {
    displayName: 'Чтение',
    componentPath: '@/components/learn/ReadingModuleClient',
  },
  repetition: {
    displayName: 'Повторение слов',
    componentPath: '@/components/learn/RepetitionModuleClient',
  },
  newwords: {
    displayName: 'Изучение новых слов',
    componentPath: '@/components/learn/NewWordsModuleClient',
  },
  practice: {
    displayName: 'Практика слов',
    componentPath: '@/components/learn/WordPracticeClient',
  },
};

export const mapTargetLanguageToBcp47: Record<TargetLanguage, string> = {
    'English': 'en-US', 'Russian': 'ru-RU', 'German': 'de-DE', 'Spanish': 'es-ES',
    'French': 'fr-FR', 'Italian': 'it-IT', 'Dutch': 'nl-NL', 'Finnish': 'fi-FI',
    'Chinese': 'zh-CN', 'Hindi': 'hi-IN', 'Norwegian': 'nb-NO', 'Hungarian': 'hu-HU',
    'Danish': 'da-DK', 'Korean': 'ko-KR', 'Bulgarian': 'bg-BG', 'Slovenian': 'sl-SI',
    'Ukrainian': 'uk-UA', 'Belarusian': 'be-BY', 'Polish': 'pl-PL', 'Romanian': 'ro-RO',
    'Japanese': 'ja-JP', 'Arabic': 'ar-SA', 'Turkish': 'tr-TR', 'Latin': 'la',
    'Greek': 'el-GR', 'Kazakh': 'kk-KZ', 'Georgian': 'ka-GE', 'Syriac': 'syc',
    'Pashto': 'ps-AF', 'Dari': 'fa-AF',
};
