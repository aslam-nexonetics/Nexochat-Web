"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Hash, BellOff, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { getNavigationForCollection } from "@/lib/navigation/workspace-nav";
import { Badge } from "@/components/ui/badge";

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { activeCollection, sidebarCollapsed, toggleSidebar } = useWorkspaceStore();

  const collectionName = activeCollection?.collectionName || "Techform";
  const properties = activeCollection?.properties || [
    "techform_dashboard",
    "Chat",
    "job_profile",
    "Guest",
    "Job",
  ];

  const navItems = getNavigationForCollection(collectionName, properties);

  if (sidebarCollapsed) {
    return (
      <aside className="w-12 shrink-0 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col items-center justify-between py-4 select-none">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col justify-between select-none">
      {/* Workspace Header */}
      <div>
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {collectionName}
            </h2>
            {activeCollection?.isMuted && (
              <BellOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace Modules
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <Badge variant="brand" className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Workspace Footer status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Active Network
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
