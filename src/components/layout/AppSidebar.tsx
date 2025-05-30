
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  BookOpen,
  Edit3,
  Headphones,
  Mic,
  FileText,
  Repeat,
  Award,
  BarChart3,
  Settings,
  Bot,
} from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import type { LucideIcon } from "lucide-react";
import { interfaceLanguageCodes } from "@/lib/types"; // Added import

interface NavItemDef {
  href: string;
  icon: LucideIcon;
  labelKey: string;
  defaultLabel: string;
  tooltipKey: string;
  defaultTooltip: string;
}

const navItemDefinitions: NavItemDef[] = [
  { href: "/dashboard", icon: Home, labelKey: "dashboard", defaultLabel: "Dashboard", tooltipKey: "dashboardTooltip", defaultTooltip: "Dashboard" },
  { href: "/learn/grammar", icon: BookOpen, labelKey: "grammar", defaultLabel: "Grammar", tooltipKey: "grammarTooltip", defaultTooltip: "Grammar" },
  { href: "/learn/vocabulary", icon: FileText, labelKey: "vocabulary", defaultLabel: "Vocabulary", tooltipKey: "vocabularyTooltip", defaultTooltip: "Vocabulary" },
  { href: "/learn/listening", icon: Headphones, labelKey: "listening", defaultLabel: "Listening", tooltipKey: "listeningTooltip", defaultTooltip: "Listening" },
  { href: "/learn/reading", icon: BookOpen, labelKey: "reading", defaultLabel: "Reading", tooltipKey: "readingTooltip", defaultTooltip: "Reading (variant)" },
  { href: "/learn/writing", icon: Edit3, labelKey: "writing", defaultLabel: "Writing", tooltipKey: "writingTooltip", defaultTooltip: "Writing" },
  { href: "/learn/speaking", icon: Mic, labelKey: "speaking", defaultLabel: "Speaking", tooltipKey: "speakingTooltip", defaultTooltip: "Speaking" },
  { href: "/learn/practice", icon: Repeat, labelKey: "wordPractice", defaultLabel: "Word Practice", tooltipKey: "wordPracticeTooltip", defaultTooltip: "Word Practice" },
];

const bottomNavItemDefinitions: NavItemDef[] = [
  { href: "/progress", icon: BarChart3, labelKey: "progress", defaultLabel: "Progress", tooltipKey: "progressTooltip", defaultTooltip: "Progress" },
  { href: "/achievements", icon: Award, labelKey: "achievements", defaultLabel: "Achievements", tooltipKey: "achievementsTooltip", defaultTooltip: "Achievements" },
  { href: "/settings", icon: Settings, labelKey: "settings", defaultLabel: "Settings", tooltipKey: "settingsTooltip", defaultTooltip: "Settings" },
];

// Base translations
const baseEnTranslations: Record<string, string> = {
  dashboard: "Dashboard",
  dashboardTooltip: "Dashboard",
  grammar: "Grammar",
  grammarTooltip: "Grammar",
  vocabulary: "Vocabulary",
  vocabularyTooltip: "Vocabulary",
  listening: "Listening",
  listeningTooltip: "Listening",
  reading: "Reading",
  readingTooltip: "Reading (variant)",
  writing: "Writing",
  writingTooltip: "Writing",
  speaking: "Speaking",
  speakingTooltip: "Speaking",
  wordPractice: "Word Practice",
  wordPracticeTooltip: "Word Practice",
  progress: "Progress",
  progressTooltip: "Progress",
  achievements: "Achievements",
  achievementsTooltip: "Achievements",
  settings: "Settings",
  settingsTooltip: "Settings",
  aiTutor: "AI Tutor",
};

const baseRuTranslations: Record<string, string> = {
  dashboard: "Панель",
  dashboardTooltip: "Панель управления",
  grammar: "Грамматика",
  grammarTooltip: "Грамматика",
  vocabulary: "Словарь",
  vocabularyTooltip: "Словарный запас",
  listening: "Аудирование",
  listeningTooltip: "Аудирование",
  reading: "Чтение",
  readingTooltip: "Чтение",
  writing: "Письмо",
  writingTooltip: "Письмо",
  speaking: "Говорение",
  speakingTooltip: "Говорение",
  wordPractice: "Практика слов",
  wordPracticeTooltip: "Практика слов",
  progress: "Прогресс",
  progressTooltip: "Прогресс",
  achievements: "Достижения",
  achievementsTooltip: "Достижения",
  settings: "Настройки",
  settingsTooltip: "Настройки",
  aiTutor: "AI Репетитор",
};

// Generate full translations object at module level
const generateSidebarTranslations = () => {
  const translations: Record<string, Record<string, string>> = {
    en: baseEnTranslations,
    ru: baseRuTranslations,
  };
  interfaceLanguageCodes.forEach(code => {
    if (code !== 'en' && code !== 'ru') {
      translations[code] = { ...baseEnTranslations }; // Fallback to English for other languages
    }
  });
  return translations;
};

const sidebarTranslations = generateSidebarTranslations();


export function AppSidebar() {
  const pathname = usePathname();
  const { userData, isLoading: isUserDataLoading } = useUserData();

  // Determine language to use for translations *for this render cycle*
  // Crucial for hydration safety: defaults to 'en' if data is still loading.
  const currentDisplayLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');

  // Sidebar should not render at all if settings are not loaded,
  // or if onboarding is not complete. This prevents trying to translate before language is known.
  if (isUserDataLoading || !userData.settings) {
    return null;
  }

  // At this point, userData.settings is guaranteed to be non-null.
  const actualInterfaceLang = userData.settings.interfaceLanguage || 'en';

  const t = (key: string, defaultText?: string): string => {
    const langTranslations = sidebarTranslations[actualInterfaceLang as keyof typeof sidebarTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = sidebarTranslations['en']; // Fallback to English
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key];
    }
    return defaultText || key; // Fallback to defaultText or key itself
  };

  const mapNavItem = (itemDef: NavItemDef) => ({
    href: itemDef.href,
    icon: itemDef.icon,
    label: t(itemDef.labelKey, itemDef.defaultLabel),
    tooltip: t(itemDef.tooltipKey, itemDef.defaultTooltip),
  });

  const navItems = navItemDefinitions.map(mapNavItem);
  const bottomNavItems = bottomNavItemDefinitions.map(mapNavItem);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center p-2 rounded-md hover:bg-sidebar-accent group-data-[collapsible=icon]:p-0">
           <Bot className="h-8 w-8 text-sidebar-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
           <span className="ml-2 text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">{t('aiTutor', baseEnTranslations.aiTutor)}</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.tooltip, className: "translate-x-1" }}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
           {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.tooltip, className: "translate-x-1" }}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
