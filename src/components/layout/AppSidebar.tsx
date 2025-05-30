"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  BookOpen,
  Edit3,
  MessageSquare,
  Headphones,
  Mic,
  FileText,
  Repeat,
  Award,
  BarChart3,
  Settings,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserData } from "@/contexts/UserDataContext";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard", tooltip: "Dashboard" },
  { href: "/learn/grammar", icon: BookOpen, label: "Grammar", tooltip: "Grammar" },
  { href: "/learn/vocabulary", icon: FileText, label: "Vocabulary", tooltip: "Vocabulary" },
  { href: "/learn/listening", icon: Headphones, label: "Listening", tooltip: "Listening" },
  { href: "/learn/reading", icon: BookOpen, label: "Reading", tooltip: "Reading (variant)" },
  { href: "/learn/writing", icon: Edit3, label: "Writing", tooltip: "Writing" },
  { href: "/learn/speaking", icon: Mic, label: "Speaking", tooltip: "Speaking" },
  { href: "/learn/practice", icon: Repeat, label: "Word Practice", tooltip: "Word Practice" },
];

const bottomNavItems = [
  { href: "/progress", icon: BarChart3, label: "Progress", tooltip: "Progress" },
  { href: "/achievements", icon: Award, label: "Achievements", tooltip: "Achievements" },
  { href: "/settings", icon: Settings, label: "Settings", tooltip: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { userData } = useUserData();

  if (!userData.settings) {
    return null; // Don't render sidebar if user is not set up (e.g. onboarding)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        {/* Avatar AI assistant placeholder - could be part of header or a floating element */}
        <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center p-2 rounded-md hover:bg-sidebar-accent group-data-[collapsible=icon]:p-0">
           <Bot className="h-8 w-8 text-sidebar-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
           <span className="ml-2 text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">AI Tutor</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.tooltip, className: "translate-x-1" }}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
           {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.tooltip, className: "translate-x-1" }}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
