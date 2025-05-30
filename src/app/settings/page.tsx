
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supportedLanguages, interfaceLanguageCodes, type InterfaceLanguage } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import * as React from 'react'; // Ensure React is imported for useState

const baseEnTranslations = {
  title: "Settings",
  description: "Manage your account, preferences, and notification settings here. This section is currently under development.",
  userLabel: "User:",
  interfaceLanguageLabel: "Interface Language:",
  targetLanguageLabel: "Target Language:",
  proficiencyLabel: "Proficiency:",
  goalLabel: "Goal:",
  resetButton: "Reset & Re-Onboard",
  loading: "Loading settings...",
  alertResetTitle: "Are you sure?",
  alertResetDescription: "This will erase all your progress and settings. You'll need to go through onboarding again.",
  alertResetCancel: "Cancel",
  alertResetConfirm: "Confirm Reset",
};

const baseRuTranslations = {
  title: "Настройки",
  description: "Управляйте своей учетной записью, предпочтениями и настройками уведомлений здесь. Этот раздел в настоящее время находится в разработке.",
  userLabel: "Пользователь:",
  interfaceLanguageLabel: "Язык интерфейса:",
  targetLanguageLabel: "Изучаемый язык:",
  proficiencyLabel: "Уровень:",
  goalLabel: "Цель:",
  resetButton: "Сбросить и пройти заново",
  loading: "Загрузка настроек...",
  alertResetTitle: "Вы уверены?",
  alertResetDescription: "Это действие удалит весь ваш прогресс и настройки. Вам нужно будет снова пройти процесс первоначальной настройки.",
  alertResetCancel: "Отмена",
  alertResetConfirm: "Подтвердить сброс",
};

const generateTranslations = () => {
  const translations: Record<string, Record<string, string>> = {};
  interfaceLanguageCodes.forEach(code => {
    let base = baseEnTranslations;
    if (code === 'ru') base = { ...baseEnTranslations, ...baseRuTranslations };
    // Add other language specific base translations here if needed
    // e.g. if (code === 'de') base = { ...baseEnTranslations, ...baseDeTranslations };
    translations[code] = base;
  });
  return translations;
};

const pageTranslations = generateTranslations();


export default function SettingsPage() {
  const { userData, clearUserData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = pageTranslations[currentLang as keyof typeof pageTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    // Fallback to English if specific key not found in current lang's specific translations
    const enTranslations = pageTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key]; 
    }
    return defaultText || key; 
  };

  const handleResetOnboarding = () => {
    clearUserData();
    router.push('/');
    setIsResetDialogOpen(false); // Close dialog after action
  };

  const getLanguageDisplayName = (codeOrName: string | undefined, type: 'interface' | 'target'): string => {
    if (!codeOrName) return 'N/A';
    if (type === 'interface') {
      const lang = supportedLanguages.find(l => l.code === codeOrName);
      return lang ? `${lang.nativeName} (${lang.name})` : codeOrName;
    }
    const lang = supportedLanguages.find(l => l.name === codeOrName);
    return lang ? `${lang.nativeName} (${lang.name})` : codeOrName;
  };

  if (isUserDataLoading) { 
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t('loading')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-8 shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <SettingsIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('description')}
            </p>
            {userData.settings && (
              <div className="text-left text-sm bg-muted/50 p-4 rounded-md shadow-sm">
                <p><strong>{t('userLabel')}</strong> {userData.settings.userName}</p>
                <p><strong>{t('interfaceLanguageLabel')}</strong> {getLanguageDisplayName(userData.settings.interfaceLanguage, 'interface')}</p>
                <p><strong>{t('targetLanguageLabel')}</strong> {getLanguageDisplayName(userData.settings.targetLanguage, 'target')}</p>
                <p><strong>{t('proficiencyLabel')}</strong> {userData.settings.proficiencyLevel}</p>
                <p><strong>{t('goalLabel')}</strong> {userData.settings.goal}</p>
              </div>
            )}
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" onClick={() => setIsResetDialogOpen(true)} className="mt-4">
                  {t('resetButton')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('alertResetTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('alertResetDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsResetDialogOpen(false)}>{t('alertResetCancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetOnboarding}>{t('alertResetConfirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
