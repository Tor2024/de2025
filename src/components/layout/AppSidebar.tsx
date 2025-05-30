
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
import { interfaceLanguageCodes } from "@/lib/types"; 

interface NavItemDef {
  href: string;
  icon: LucideIcon;
  labelKey: string;
  defaultLabel: string;
  tooltipKey: string;
  defaultTooltip: string;
  disabled?: boolean; // Added to allow disabling from learningModules source
}

// Synchronize with learningModules from dashboard
const learningModulesConfig = [
  { titleKey: "grammar", defaultTitle: "Grammar", href: "/learn/grammar", icon: BookOpen, tooltipKey: "grammarTooltip", defaultTooltip: "Grammar" },
  { titleKey: "writing", defaultTitle: "Writing", href: "/learn/writing", icon: Edit3, tooltipKey: "writingTooltip", defaultTooltip: "Writing Assistant" },
  { titleKey: "vocabulary", defaultTitle: "Vocabulary", href: "/learn/vocabulary", icon: FileText, tooltipKey: "vocabularyTooltip", defaultTooltip: "Vocabulary" },
  { titleKey: "reading", defaultTitle: "Reading", href: "/learn/reading", icon: BookOpen, tooltipKey: "readingTooltip", defaultTooltip: "Reading" }, // Assuming BookOpen is also for reading
  { titleKey: "listening", defaultTitle: "Listening", href: "/learn/listening", icon: Headphones, tooltipKey: "listeningTooltip", defaultTooltip: "Listening", disabled: true },
  { titleKey: "speaking", defaultTitle: "Speaking", href: "/learn/speaking", icon: Mic, tooltipKey: "speakingTooltip", defaultTooltip: "Speaking", disabled: true },
  { titleKey: "wordPractice", defaultTitle: "Word Practice", href: "/learn/practice", icon: Repeat, tooltipKey: "wordPracticeTooltip", defaultTooltip: "Word Practice", disabled: true },
];

const navItemDefinitions: NavItemDef[] = [
  { href: "/dashboard", icon: Home, labelKey: "dashboard", defaultLabel: "Dashboard", tooltipKey: "dashboardTooltip", defaultTooltip: "Dashboard" },
  ...learningModulesConfig.map(mod => ({ // Spread learning modules here
    href: mod.href,
    icon: mod.icon,
    labelKey: mod.titleKey,
    defaultLabel: mod.defaultTitle,
    tooltipKey: mod.tooltipKey,
    defaultTooltip: mod.defaultTooltip,
    disabled: mod.disabled,
  })),
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
  reading: "Reading", // Added
  readingTooltip: "Reading", // Added
  writing: "Writing Assistant", // Changed from "Writing" to match dashboard
  writingTooltip: "Writing Assistant", // Changed from "Writing"
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
  reading: "Чтение", // Added
  readingTooltip: "Чтение", // Added
  writing: "Помощник по письму", // Changed to match dashboard
  writingTooltip: "Помощник по письму",
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
  const translations: Record<string, Record<string, string>> = {};
  interfaceLanguageCodes.forEach(code => {
    if (code === 'ru') {
      translations[code] = { ...baseEnTranslations, ...baseRuTranslations };
    } else {
      translations[code] = { ...baseEnTranslations }; // Fallback to English for other languages
    }
  });
  return translations;
};

const sidebarTranslations = generateSidebarTranslations();


export function AppSidebar() {
  const pathname = usePathname();
  const { userData, isLoading: isUserDataLoading } = useUserData();

  const currentDisplayLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');

  if (isUserDataLoading || !userData.settings) {
    return null;
  }

  const actualInterfaceLang = userData.settings.interfaceLanguage || 'en';

  const t = (key: string, defaultText?: string): string => {
    const langTranslations = sidebarTranslations[actualInterfaceLang as keyof typeof sidebarTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = sidebarTranslations['en']; 
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key];
    }
    return defaultText || key; 
  };

  const mapNavItem = (itemDef: NavItemDef) => ({
    ...itemDef, // Spread to keep disabled status and other props
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
            <SidebarMenuItem key={item.href} className={item.disabled ? "opacity-50 cursor-not-allowed" : ""}>
              <Link href={item.disabled ? "#" : item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={!item.disabled && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))}
                  tooltip={{ children: item.tooltip, className: "translate-x-1" }}
                  disabled={item.disabled}
                  aria-disabled={item.disabled}
                >
                  <a style={item.disabled ? { pointerEvents: 'none' } : {}}>
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
