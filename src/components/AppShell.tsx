"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import Navbar from "@/components/Navbar";
import SidebarShell from "@/components/SidebarShell";

const COLLAPSE_STORAGE_KEY = "aeria-sidebar-collapsed";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
  };
  signOutAction: (formData: FormData) => void | Promise<void>;
};

export default function AppShell({ children, user, signOutAction }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (stored === "true") setSidebarCollapsed(true);
      if (stored === "false") setSidebarCollapsed(false);
    } catch {
      // Ignore local storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // Ignore local storage errors.
    }
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarShell
        user={user}
        signOutAction={signOutAction}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
      />
      <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto flex flex-col justify-between">
        <Navbar
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
        <Container>{children}</Container>
      </main>
    </div>
  );
}
