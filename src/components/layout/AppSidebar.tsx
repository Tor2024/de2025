
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

const translations: Record<string, Record<string, string>> = {
  en: {
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
  },
  ru: {
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
  },
  // Add other languages as needed
};


export function AppSidebar() {
  const pathname = usePathname();
  const { userData, isLoading: isUserDataLoading } = useUserData();

  if (isUserDataLoading || !userData.settings) {
    return null; // Don't render sidebar if user data is loading or not set up
  }

  const currentLang = userData.settings.interfaceLanguage || 'en';
  const t = (key: string, defaultText: string) => {
    return translations[currentLang]?.[key] || translations['en']?.[key] || defaultText;
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
           <span className="ml-2 text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">{t('aiTutor', 'AI Tutor')}</span>
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
