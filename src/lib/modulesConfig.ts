import type { LucideIcon } from "lucide-react";
import { BookOpen, Edit3, Headphones, FileText, Repeat, Brain, Pencil } from "lucide-react";

export interface AppModuleConfig {
  id: string;
  href: string;
  icon: LucideIcon;
  titleKey: string;
  defaultTitle: string;
  descriptionKey: string;
  defaultDescription: string;
  tooltipKey: string;
  defaultTooltip: string;
  disabled: boolean;
}

export const appModulesConfig: AppModuleConfig[] = [
  {
    id: "grammar",
    href: "/learn/grammar",
    icon: BookOpen,
    titleKey: "grammar",
    defaultTitle: "Grammar",
    descriptionKey: "grammarDescription",
    defaultDescription: "Master sentence structures.",
    tooltipKey: "grammarTooltip",
    defaultTooltip: "Grammar",
    disabled: false,
  },
  {
    id: "writingAssistant",
    href: "/learn/writing",
    icon: Pencil,
    titleKey: "writingAssistant",
    defaultTitle: "Writing Assistant",
    descriptionKey: "writingAssistantDescription",
    defaultDescription: "Get feedback on your texts.",
    tooltipKey: "writingTooltip",
    defaultTooltip: "Writing Assistant",
    disabled: false,
  },
  {
    id: "vocabulary",
    href: "/learn/vocabulary",
    icon: FileText,
    titleKey: "vocabulary",
    defaultTitle: "Vocabulary",
    descriptionKey: "vocabularyDescription",
    defaultDescription: "Expand your word bank.",
    tooltipKey: "vocabularyTooltip",
    defaultTooltip: "Vocabulary",
    disabled: false,
  },
    {
    id: "repetition",
    href: "/learn/repetition",
    icon: Brain,
    titleKey: "repetition",
    defaultTitle: "Repetition",
    descriptionKey: "repetitionDescription",
    defaultDescription: "Review words with spaced repetition.",
    tooltipKey: "repetitionTooltip",
    defaultTooltip: "Spaced Repetition",
    disabled: false,
  },
  {
    id: "reading",
    href: "/learn/reading",
    icon: BookOpen, // Consider a different icon if BookOpen is already used for Grammar
    titleKey: "reading",
    defaultTitle: "Reading",
    descriptionKey: "readingDescription",
    defaultDescription: "Understand written texts.",
    tooltipKey: "readingTooltip",
    defaultTooltip: "Reading",
    disabled: false,
  },
  {
    id: "listening",
    href: "/learn/listening",
    icon: Headphones,
    titleKey: "listening",
    defaultTitle: "Listening",
    descriptionKey: "listeningDescription",
    defaultDescription: "Sharpen your comprehension.",
    tooltipKey: "listeningTooltip",
    defaultTooltip: "Listening",
    disabled: false,
  },
  {
    id: "wordPractice",
    href: "/learn/practice",
    icon: Repeat,
    titleKey: "wordPractice",
    defaultTitle: "Word Practice",
    descriptionKey: "wordPracticeDescription",
    defaultDescription: "Reinforce with fun drills.",
    tooltipKey: "wordPracticeTooltip",
    defaultTooltip: "Word Practice",
    disabled: false, // Enabled this module
  },
];
