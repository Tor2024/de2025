
import type { LucideIcon } from "lucide-react";
import { BookOpen, Edit3, Headphones, Mic, FileText, Repeat } from "lucide-react";

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
    icon: Edit3,
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
    id: "speaking",
    href: "/learn/speaking",
    icon: Mic,
    titleKey: "speaking",
    defaultTitle: "Speaking",
    descriptionKey: "speakingDescription",
    defaultDescription: "Practice your pronunciation.",
    tooltipKey: "speakingTooltip",
    defaultTooltip: "Speaking",
    disabled: true,
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
    disabled: true,
  },
];
