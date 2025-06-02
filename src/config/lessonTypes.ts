// Конфиг типов уроков для масштабируемой архитектуры
// Ключ — тип урока, displayName — отображаемое имя, componentPath — путь к компоненту (пока строкой)

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
  theory: {
    displayName: 'Теория',
    componentPath: '@/components/learn/TheoryModuleClient',
  },
}; 