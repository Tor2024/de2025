"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


export default function SettingsPage() {
  const { userData, clearUserData } = useUserData();
  const router = useRouter();

  const handleResetOnboarding = () => {
    clearUserData();
    router.push('/');
  };

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md text-center p-8 shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <SettingsIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Manage your account, preferences, and notification settings here. This section is currently under development.
            </p>
            {userData.settings && (
              <div className="text-left text-sm bg-muted/50 p-4 rounded-md">
                <p><strong>User:</strong> {userData.settings.userName}</p>
                <p><strong>Interface Language:</strong> {userData.settings.interfaceLanguage === 'en' ? 'English' : 'Русский'}</p>
                <p><strong>Target Language:</strong> {userData.settings.targetLanguage}</p>
                <p><strong>Proficiency:</strong> {userData.settings.proficiencyLevel}</p>
                <p><strong>Goal:</strong> {userData.settings.goal}</p>
              </div>
            )}
             <Button variant="destructive" onClick={handleResetOnboarding}>
              Reset & Re-Onboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
