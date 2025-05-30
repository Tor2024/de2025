
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { WritingAssistantClient } from "@/components/learn/WritingAssistantClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as React from 'react';


export default function WritingPage() {
  const { userData } = useUserData();
  const router = useRouter();
  const [isCheckingData, setIsCheckingData] = useState(() => userData.settings === undefined);

  useEffect(() => {
    if (userData.settings !== undefined) {
      setIsCheckingData(false);
      if (userData.settings === null) {
        router.replace('/');
      }
    } else {
      setIsCheckingData(true);
    }
  }, [userData.settings, router]);

  if (isCheckingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Загрузка модуля помощи в письме...</p>
      </div>
    );
  }

  if (!userData.settings) { 
     return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Перенаправление на страницу настройки...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <WritingAssistantClient />
    </AppShell>
  );
}
