"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GrammarModuleClient } from "@/components/learn/GrammarModuleClient";
import { useUserData } from "@/contexts/UserDataContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function GrammarPage() {
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
      <GrammarModuleClient />
    </AppShell>
  );
}
