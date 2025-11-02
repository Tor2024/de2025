
"use client";

import { AppShell } from "@/components/layout/AppShell";
import RepetitionModuleClient from "@/components/learn/RepetitionModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';

export default function RepetitionPage() {
  const { userData, isLoading: isUserDataLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!isUserDataLoading && userData.settings === null) {
      router.replace('/');
    }
  }, [userData, isUserDataLoading, router]);

  if (isUserDataLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center p-4 md:p-6 lg:p-8">
          <LoadingSpinner size={32} />
          <p className="ml-2">Загрузка модуля повторения...</p>
        </div>
      </AppShell>
    );
  }
  
  if (userData.settings === null) {
     return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="ml-4">Перенаправление...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RepetitionModuleClient />
    </AppShell>
  );
}
