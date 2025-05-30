
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
  SidebarMenuSkeleton, // Already available from ui/sidebar
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
import { interfaceLanguageCodes, type InterfaceLanguage } from "@/lib/types"; 
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface NavItemDef {
  href: string;
  icon: LucideIcon;
  labelKey: string;
  defaultLabel: string;
  tooltipKey: string;
  defaultTooltip: string;
  disabled?: boolean; 
}

const learningModulesConfig = [
  { titleKey: "grammar", defaultTitle: "Grammar", href: "/learn/grammar", icon: BookOpen, tooltipKey: "grammarTooltip", defaultTooltip: "Grammar", disabled: false },
  { titleKey: "writing", defaultTitle: "Writing Assistant", href: "/learn/writing", icon: Edit3, tooltipKey: "writingTooltip", defaultTooltip: "Writing Assistant", disabled: false },
  { titleKey: "vocabulary", defaultTitle: "Vocabulary", href: "/learn/vocabulary", icon: FileText, tooltipKey: "vocabularyTooltip", defaultTooltip: "Vocabulary", disabled: false },
  { titleKey: "reading", defaultTitle: "Reading", href: "/learn/reading", icon: BookOpen, tooltipKey: "readingTooltip", defaultTooltip: "Reading", disabled: false }, 
  { titleKey: "listening", defaultTitle: "Listening", href: "/learn/listening", icon: Headphones, tooltipKey: "listeningTooltip", defaultTooltip: "Listening", disabled: false },
  { titleKey: "speaking", defaultTitle: "Speaking", href: "/learn/speaking", icon: Mic, tooltipKey: "speakingTooltip", defaultTooltip: "Speaking", disabled: true },
  { titleKey: "wordPractice", defaultTitle: "Word Practice", href: "/learn/practice", icon: Repeat, tooltipKey: "wordPracticeTooltip", defaultTooltip: "Word Practice", disabled: true },
];

const navItemDefinitions: NavItemDef[] = [
  { href: "/dashboard", icon: Home, labelKey: "dashboard", defaultLabel: "Dashboard", tooltipKey: "dashboardTooltip", defaultTooltip: "Dashboard" },
  ...learningModulesConfig.map(mod => ({ 
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

const baseEnTranslations: Record<string, string> = {
  aiTutor: "AI Tutor",
  dashboard: "Dashboard",
  dashboardTooltip: "Dashboard",
  grammar: "Grammar",
  grammarTooltip: "Grammar",
  vocabulary: "Vocabulary",
  vocabularyTooltip: "Vocabulary",
  listening: "Listening",
  listeningTooltip: "Listening",
  reading: "Reading", 
  readingTooltip: "Reading", 
  writing: "Writing Assistant", 
  writingTooltip: "Writing Assistant", 
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
};

const baseRuTranslations: Record<string, string> = {
  aiTutor: "AI Репетитор",
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
  writing: "Помощник по письму", 
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
};

const generateSidebarTranslations = () => {
  const translations: Record<string, Record<string, string>> = {};
  interfaceLanguageCodes.forEach(code => {
    if (code === 'ru') {
      translations[code] = { ...baseEnTranslations, ...baseRuTranslations };
    } else {
      translations[code] = { ...baseEnTranslations };
    }
  });
  return translations;
};

const sidebarTranslations = generateSidebarTranslations();


export function AppSidebar() {
  const pathname = usePathname();
  const { userData, isLoading: isUserDataLoading } = useUserData();

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = sidebarTranslations[currentLang as keyof typeof sidebarTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = sidebarTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key]; 
    }
    return defaultText || key; 
  };
  
  if (isUserDataLoading || !userData.settings) {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-2">
          <Link href="/dashboard" className="block text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center p-2 rounded-md hover:bg-sidebar-accent group-data-[collapsible=icon]:p-0">
              <Skeleton className="h-8 w-8 rounded-md group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
              <Skeleton className="ml-2 h-4 w-20 group-data-[collapsible=icon]:hidden" />
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {Array.from({ length: 8 }).map((_, index) => (
              <SidebarMenuSkeleton key={`skel-top-${index}`} showIcon={true} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            {Array.from({ length: 3 }).map((_, index) => (
              <SidebarMenuSkeleton key={`skel-bottom-${index}`} showIcon={true} />
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }

  const mapNavItem = (itemDef: NavItemDef) => ({
    ...itemDef, 
    label: t(itemDef.labelKey, itemDef.defaultLabel),
    tooltip: t(itemDef.tooltipKey, itemDef.defaultTooltip),
  });

  const navItems = navItemDefinitions.map(mapNavItem);
  const bottomNavItems = bottomNavItemDefinitions.map(mapNavItem);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <Link href="/dashboard" className="block text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center p-2 rounded-md hover:bg-sidebar-accent group-data-[collapsible=icon]:p-0">
            <Bot className="h-8 w-8 text-sidebar-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
            <span className="ml-2 text-sm font-semibold group-data-[collapsible=icon]:hidden">{t('aiTutor', baseEnTranslations.aiTutor)}</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href} className={item.disabled ? "" : ""}>
              <Link href={item.disabled ? "#" : item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={!item.disabled && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))}
                  tooltip={{ children: item.tooltip, className: "translate-x-1" }}
                  disabled={item.disabled}
                  aria-disabled={item.disabled}
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

