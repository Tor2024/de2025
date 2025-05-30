"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/contexts/UserDataContext';
import { AppShell } from '@/components/layout/AppShell';
import { RoadmapDisplay } from '@/components/dashboard/RoadmapDisplay';
import { GoalTracker } from '@/components/dashboard/GoalTracker';
import { ModuleLinkCard } from '@/components/dashboard/ModuleLinkCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BookOpen, Edit3, Headphones, Mic, FileText, Repeat, BarChart3, Award, Settings, Bot } from "lucide-react";

const learningModules = [
  { title: "Grammar", description: "Master sentence structures.", href: "/learn/grammar", icon: BookOpen },
  { title: "Writing Assistant", description: "Get feedback on your texts.", href: "/learn/writing", icon: Edit3 },
  { title: "Vocabulary", description: "Expand your word bank.", href: "/learn/vocabulary", icon: FileText, disabled: true },
  { title: "Listening", description: "Sharpen your comprehension.", href: "/learn/listening", icon: Headphones, disabled: true },
  { title: "Reading", description: "Understand written texts.", href: "/learn/reading", icon: BookOpen, disabled: true },
  { title: "Speaking", description: "Practice your pronunciation.", href: "/learn/speaking", icon: Mic, disabled: true },
  { title: "Word Practice", description: "Reinforce with fun drills.", href: "/learn/practice", icon: Repeat, disabled: true },
];

export default function DashboardPage() {
  const { userData } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (userData.settings === null) { // Explicitly check for null after loading attempt
      router.replace('/'); // Redirect to onboarding if no settings
    }
  }, [userData, router]);

  if (!userData.settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Loading user data...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3">
            <RoadmapDisplay />
          </div>
          <div className="md:w-1/3 space-y-6">
            <GoalTracker />
            <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/>AI Tutor Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Remember to review your mistakes in the Error Archive. Consistent practice is key!</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Explore Learning Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningModules.map((mod) => (
              <ModuleLinkCard
                key={mod.title}
                title={mod.title}
                description={mod.description}
                href={mod.href}
                icon={mod.icon}
                disabled={mod.disabled}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">XP: {userData.progress?.xp || 0}</p>
                <p className="text-sm text-muted-foreground">Streak: {userData.progress?.streak || 0} days</p>
                {/* Placeholder for CEFR tree */}
                <p className="text-sm mt-2 italic">Detailed CEFR progress tree coming soon!</p>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="text-primary"/>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground">Badges: {(userData.progress?.badges || []).join(', ') || 'None yet'}</p>
                 <p className="text-sm mt-2 italic">Unlock badges as you learn!</p>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="text-primary"/>Quick Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Interface: {userData.settings.interfaceLanguage === 'en' ? 'English' : 'Russian'}</p>
                <p className="text-sm text-muted-foreground">Learning: {userData.settings.targetLanguage}</p>
                <Button variant="outline" size="sm" className="mt-2">Go to Settings</Button>
              </CardContent>
            </Card>
        </div>

      </div>
    </AppShell>
  );
}

// Required imports
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
