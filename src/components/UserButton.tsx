"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserButtonProps = {
  user: {
    name: string;
    email: string;
  };
  signOutAction: (formData: FormData) => void | Promise<void>;
  compact?: boolean;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "U";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function UserButton({ user, signOutAction, compact = false }: UserButtonProps) {
  const triggerButton = (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-navy-700 ${
        compact ? "h-11 w-11 justify-center gap-0 px-0 py-0" : ""
      }`}
      aria-label={`${user.name} ${user.email}`}
    >
      <Avatar className={`border border-navy-500 ${compact ? "h-8 w-8" : "h-9 w-9"}`}>
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-300">{user.email}</p>
        </div>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-64">
            <div className="space-y-0.5">
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      )}

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs font-normal text-slate-500">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2 text-red-600">
              <LogOut className="h-4 w-4" />
              Se deconnecter
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
