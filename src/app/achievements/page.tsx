
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star, Zap } from "lucide-react"; // Added Star and Zap for XP and Streak
import { useUserData } from "@/contexts/UserDataContext";
import { interfaceLanguageCodes } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const baseEnTranslations = {
  title: "Your Achievements",
  description: "Track your XP, streaks, and earned badges here. More gamification features and detailed badge information are on the way!",
  loading: "Loading achievements...",
  currentXP: "Your Experience Points (XP):",
  currentStreak: "Current Learning Streak:",
  days: "days",
  earnedBadges: "Earned Badges:",
  noBadgesYet: "You haven't earned any badges yet. Keep learning!",
};

const baseRuTranslations = {
  title: "Ваши достижения",
  description: "Отслеживайте свой опыт, серии и заработанные значки здесь. Больше игровых функций и подробная информация о значках в разработке!",
  loading: "Загрузка достижений...",
  currentXP: "Ваши очки опыта (XP):",
  currentStreak: "Текущая учебная серия:",
  days: "дней",
  earnedBadges: "Заработанные значки:",
  noBadgesYet: "У вас пока нет значков. Продолжайте учиться, чтобы заработать их!",
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

export default function AchievementsPage() {
  const { userData, isLoading: isUserDataLoading } = useUserData();

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
        <Card className="w-full max-w-lg text-center p-6 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <Award className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <div className="p-4 bg-muted/50 rounded-md shadow-sm">
              <h3 className="font-semibold text-lg mb-2 flex items-center"><Star className="h-5 w-5 mr-2 text-yellow-500"/>{t('currentXP')}</h3>
              <p className="text-2xl font-bold text-primary">{userData.progress?.xp || 0}</p>
            </div>

            <div className="p-4 bg-muted/50 rounded-md shadow-sm">
              <h3 className="font-semibold text-lg mb-2 flex items-center"><Zap className="h-5 w-5 mr-2 text-orange-500"/>{t('currentStreak')}</h3>
              <p className="text-2xl font-bold text-primary">{userData.progress?.streak || 0} <span className="text-base font-normal text-muted-foreground">{t('days')}</span></p>
            </div>

            <div className="p-4 bg-muted/50 rounded-md shadow-sm">
              <h3 className="font-semibold text-lg mb-2 flex items-center"><Award className="h-5 w-5 mr-2 text-green-500"/>{t('earnedBadges')}</h3>
              {(userData.progress?.badges && userData.progress.badges.length > 0) ? (
                <div className="flex flex-wrap gap-2">
                  {userData.progress.badges.map((badge, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full font-medium">
                      {badge}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">{t('noBadgesYet')}</p>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-6 text-center">
              {t('description')}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
