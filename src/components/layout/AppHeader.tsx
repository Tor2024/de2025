
"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUserData } from "@/contexts/UserDataContext";
import { LogOut, Settings, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { interfaceLanguageCodes } from "@/lib/types";

const baseEnTranslations = {
  profile: "Profile",
  settings: "Settings",
  logout: "Log out",
  learnerSuffix: "Learner",
};

const baseRuTranslations = {
  profile: "Профиль",
  settings: "Настройки",
  logout: "Выйти",
  learnerSuffix: "Ученик",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {
    en: baseEnTranslations,
    ru: baseRuTranslations,
  };
  interfaceLanguageCodes.forEach(code => {
    if (code !== 'en' && code !== 'ru') {
      translations[code] = { ...baseEnTranslations };
    }
  });
  return translations;
};

const componentTranslations = generateTranslations();

export function AppHeader() {
  const { userData, clearUserData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = componentTranslations[currentLang as keyof typeof componentTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = componentTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key];
    }
    return defaultText || key;
  };

  const handleLogout = () => {
    clearUserData();
    router.push('/'); 
  };
  
  const userInitial = userData.settings?.userName ? userData.settings.userName.charAt(0).toUpperCase() : "L";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
      </div>
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
          <path d="M10 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5"></path>
          <path d="M14 2h5a2 2 0 0 1 2 2v5"></path>
          <path d="M17 22v-5a2 2 0 0 0-2-2h-5"></path>
          <path d="M20.74 12.25A5.992 5.992 0 0 0 12.25 3.76"></path>
          <path d="M17 17H12"></path>
        </svg>
        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">LinguaLab</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        {userData.settings && !isUserDataLoading && (
           <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-10 w-10 rounded-full">
               <Avatar className="h-10 w-10 border-2 border-primary/50">
                 <AvatarImage src={undefined} alt="User Avatar" data-ai-hint="abstract avatar" />
                 <AvatarFallback className="bg-primary/20 text-primary font-semibold">{userInitial}</AvatarFallback>
               </Avatar>
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent className="w-56" align="end" forceMount>
             <DropdownMenuLabel className="font-normal">
               <div className="flex flex-col space-y-1">
                 <p className="text-sm font-medium leading-none">{userData.settings.userName || "Learner"}</p>
                 <p className="text-xs leading-none text-muted-foreground">
                   {userData.settings.targetLanguage} {t('learnerSuffix')}
                 </p>
               </div>
             </DropdownMenuLabel>
             <DropdownMenuSeparator />
             <DropdownMenuItem onClick={() => router.push('/settings')}>
               <UserCircle className="mr-2 h-4 w-4" />
               <span>{t('profile')}</span>
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => router.push('/settings')}>
               <Settings className="mr-2 h-4 w-4" />
               <span>{t('settings')}</span>
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem onClick={handleLogout}>
               <LogOut className="mr-2 h-4 w-4" />
               <span>{t('logout')}</span>
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
        )}
      </div>
    </header>
  );
}
