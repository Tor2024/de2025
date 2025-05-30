
"use client";

import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* SidebarInset is the main tag. Its base classes from ui/sidebar.tsx include:
          "relative flex min-h-svh flex-1 flex-col bg-background".
          We don't need to pass className to it here as its default styles are sufficient.
      */}
      <SidebarInset>
        <AppHeader />
        {/* This div is for the content area that grows and scrolls */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
