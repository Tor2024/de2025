"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, UserCircle, Languages, GraduationCap, BarChartHorizontalBig, Flag } from "lucide-react"; // Added new icons
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
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useTheme, Theme } from '@/contexts/ThemeContext';

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
  fallbackLearnerName: "Learner",
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
  fallbackLearnerName: "Ученик",
};

const generateTranslations = () => {
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

const pageTranslations = generateTranslations();


export default function SettingsPage() {
  const { userData, clearUserData, isLoading: isUserDataLoading, updateSettings } = useUserData();
  const router = useRouter();
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [interests, setInterests] = React.useState<string[]>(userData.settings?.interests || []);
  const [goals, setGoals] = React.useState<string[]>(Array.isArray(userData.settings?.goal) ? userData.settings.goal : userData.settings?.goal ? [userData.settings.goal] : []);
  const [interestInput, setInterestInput] = React.useState('');
  const [goalInput, setGoalInput] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const currentLang = isUserDataLoading ? 'en' : (userData.settings?.interfaceLanguage || 'en');
  const t = (key: string, defaultText?: string): string => {
    const langTranslations = pageTranslations[currentLang as keyof typeof pageTranslations];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    const enTranslations = pageTranslations['en'];
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key];
    }
    return defaultText || key;
  };

  const handleResetOnboarding = () => {
    setIsResetDialogOpen(false); // Close dialog first
    clearUserData();
    router.push('/');
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

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleAddGoal = () => {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const handleRemoveGoal = (goal: string) => {
    setGoals(goals.filter(g => g !== goal));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateSettings({ interests, goal: Array.isArray(goals) ? goals : goals ? [goals] : [] });
      toast({ title: 'Изменения сохранены', description: 'Ваши интересы и цели обновлены.', variant: 'default' });
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить изменения. Попробуйте ещё раз.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
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
        <Card className="w-full max-w-md text-center p-6 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <SettingsIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('description')}
            </p>
            {userData.settings && (
              <div className="text-left text-sm bg-muted/50 p-4 rounded-md shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary/80" />
                  <p><strong>{t('userLabel')}</strong> {userData.settings.userName || t('fallbackLearnerName', 'Learner')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary/80" />
                  <p><strong>{t('interfaceLanguageLabel')}</strong> {getLanguageDisplayName(userData.settings.interfaceLanguage, 'interface')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary/80" />
                  <p><strong>{t('targetLanguageLabel')}</strong> {getLanguageDisplayName(userData.settings.targetLanguage, 'target')}</p>
                </div>
                <div className="mt-4">
                  <p className="font-semibold mb-1">Интересы:</p>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {interests.map((interest, idx) => (
                      <Badge key={idx} className="bg-primary/10 text-primary cursor-pointer" onClick={() => handleRemoveInterest(interest)}>
                        {interest} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={interestInput}
                      onChange={e => setInterestInput(e.target.value)}
                      placeholder="Добавить интерес..."
                      onKeyDown={e => { if (e.key === 'Enter') handleAddInterest(); }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddInterest} disabled={!interestInput.trim()}>Добавить</Button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-semibold mb-1">Цели изучения:</p>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {goals.map((goal, idx) => (
                      <Badge key={idx} className="bg-primary/10 text-primary cursor-pointer" onClick={() => handleRemoveGoal(goal)}>
                        {goal} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      placeholder="Добавить цель..."
                      onKeyDown={e => { if (e.key === 'Enter') handleAddGoal(); }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddGoal} disabled={!goalInput.trim()}>Добавить</Button>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} variant="default">
                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                </div>
              </div>
            )}
            <div className="text-left text-sm bg-muted/50 p-4 rounded-md shadow-sm space-y-2">
              <div className="mb-2 font-semibold">Тема оформления:</div>
              <div className="flex gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Светлая</Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Тёмная</Button>
                <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>Системная</Button>
              </div>
            </div>
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

