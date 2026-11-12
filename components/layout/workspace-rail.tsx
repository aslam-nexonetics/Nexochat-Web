"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Wrench,
  MessageSquare,
  Building2,
  Plus,
  Layers,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function getCollectionIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("techform") || lower.includes("job")) return Briefcase;
  if (lower.includes("gig")) return Wrench;
  if (lower.includes("shalabam")) return MessageSquare;
  if (lower.includes("nexonetics")) return Building2;
  return Layers;
}

function getCollectionColor(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("techform")) return "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60";
  if (lower.includes("gig")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60";
  if (lower.includes("shalabam")) return "text-sky-600 bg-sky-50 dark:bg-sky-950/60";
  if (lower.includes("nexonetics")) return "text-amber-600 bg-amber-50 dark:bg-amber-950/60";
  return "text-slate-600 bg-slate-100 dark:bg-slate-800";
}

export function WorkspaceRail() {
  const pathname = usePathname();
  const { collections, availableCollections, activeCollection, selectCollectionByName } =
    useWorkspaceStore();

  const displayCollections =
    collections.length > 0 ? collections : availableCollections.slice(0, 5);

  return (
    <aside className="w-16 shrink-0 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-between py-3 z-30 select-none">
      {/* Top: Brand Logo & Workspaces */}
      <div className="flex flex-col items-center w-full gap-2">
        {/* Brand Home Icon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/workspace"
              className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs hover:border-indigo-500 hover:shadow-indigo-500/10 transition-all mb-2 overflow-hidden p-1.5"
            >
              <img src="/icon-192.png" alt="Nexonetics" className="h-full w-full object-contain" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Nexonetics Home</TooltipContent>
        </Tooltip>

        <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1" />

        {/* Collections Switcher List */}
        <div className="flex flex-col items-center w-full gap-2 overflow-y-auto py-1 px-2">
          {displayCollections.map((col) => {
            const Icon = getCollectionIcon(col.collectionName);
            const colorClass = getCollectionColor(col.collectionName);
            const slug = col.collectionName.toLowerCase().trim();
            const isActive =
              activeCollection?.id === col.id ||
              pathname.includes(`/workspace/${slug}`);

            return (
              <Tooltip key={col.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/workspace/${slug}`}
                    onClick={() => selectCollectionByName(col.collectionName)}
                    className={cn(
                      "relative h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group",
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        : `${colorClass} hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-700`
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute -left-2 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" />
                    )}
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="font-semibold">{col.collectionName}</div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {col.properties.slice(0, 3).join(", ")}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Bottom: Utilities */}
      <div className="flex flex-col items-center w-full gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/workspace"
              className="h-9 w-9 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Browse & Join Collections</TooltipContent>
        </Tooltip>

        <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer">
              <Settings className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Preferences</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
