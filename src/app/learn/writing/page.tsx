"use client";

import { AppShell } from "@/components/layout/AppShell";
import { WritingAssistantClient } from "@/components/learn/WritingAssistantClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";


export default function WritingPage() {
  const { userData } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (userData.settings === null) {
      router.replace('/');
    }
  }, [userData, router]);

  if (!userData.settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <AppShell>
      <WritingAssistantClient />
    </AppShell>
  );
}
