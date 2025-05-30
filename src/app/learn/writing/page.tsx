
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
  const [isCheckingData, setIsCheckingData] = useState(true);

  useEffect(() => {
    if (userData.settings !== undefined) {
      setIsCheckingData(false);
      if (userData.settings === null) {
        router.replace('/');
      }
    }
  }, [userData, router]);

  if (isCheckingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4">Loading writing module...</p>
      </div>
    );
  }

  if (!userData.settings) { // Fallback redirect
     return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting to setup...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <WritingAssistantClient />
    </AppShell>
  );
}
