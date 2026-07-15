"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import UserButton from "@/components/UserButton";
import { NAV } from "@/lib/data/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COLLAPSED_WIDTH = 72;
const DEFAULT_WIDTH = 300;
const MIN_WIDTH = 300;
const MAX_WIDTH = 360;
const WIDTH_STORAGE_KEY = "aeria-sidebar-width";

type SidebarShellProps = {
  user: {
    name: string;
    email: string;
  };
  signOutAction: (formData: FormData) => void | Promise<void>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function SidebarShell({
  user,
  signOutAction,
  collapsed,
  onToggleCollapsed,
}: SidebarShellProps) {
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WIDTH_STORAGE_KEY);
      if (!stored) return;
      const parsed = Number(stored);
      if (!Number.isFinite(parsed)) return;
      setWidth(clamp(parsed, MIN_WIDTH, MAX_WIDTH));
    } catch {
      // Ignore malformed persisted width.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
    } catch {
      // Ignore storage failures.
    }
  }, [width]);

  useEffect(() => {
    if (collapsed) return;

    const sidebar = sidebarRef.current;
    if (!sidebar || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (!nextWidth) return;

      setWidth((current) => {
        const bounded = clamp(Math.round(nextWidth), MIN_WIDTH, MAX_WIDTH);
        return bounded === current ? current : bounded;
      });
    });

    observer.observe(sidebar);
    return () => observer.disconnect();
  }, [collapsed]);

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : width;

  return (
    <TooltipProvider delayDuration={120}>
      <aside
        ref={sidebarRef}
        className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-navy-700 bg-navy text-white shadow-lg transition-[width] duration-400 ease-out"
        style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
      >
        <div
          className={`relative h-[90px] border-b border-navy-700 ${collapsed ? "px-3 py-5" : "px-5 py-5"}`}
        >
          <Link href="/" className={`flex items-center justify-center ${collapsed ? "" : "gap-2"}`}>
            {collapsed ? (
              <Image
                src="/images/aeria-icon-white.svg"
                alt="AERIA Voyages Academy"
                width={40}
                height={40}
                priority
                className="h-10 w-10 shrink-0"
              />
            ) : (
              <Image
                src="/images/logos/aeria-logo_white.svg"
                alt="AERIA Voyages Academy"
                width={409}
                height={80}
                priority
                className="h-10 w-auto max-w-[220px] shrink-0 md:h-12"
              />
            )}
          </Link>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-l-lg text-white transition hover:bg-white/20"
            aria-label={collapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`nav-link ${collapsed ? "justify-center px-2" : "text-lg font-base"}`}
              >
                <span
                  className={`w-6 shrink-0 text-center ${collapsed ? "w-auto" : ""}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5 inline-block" />
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className={`border-t border-navy-700 p-4 ${collapsed ? "flex justify-center" : ""}`}>
          <UserButton user={user} signOutAction={signOutAction} compact={collapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}
