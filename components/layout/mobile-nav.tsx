"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Layers, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { getNavigationForCollection } from "@/lib/navigation/workspace-nav";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const pathname = usePathname();
  const { collections, activeCollection, isMobileNavOpen, setMobileNavOpen, selectCollectionByName } =
    useWorkspaceStore();
  const { user, logout } = useAuthStore();

  const collectionName = activeCollection?.collectionName || "Techform";
  const properties = activeCollection?.properties || ["Chat", "Profile"];
  const navItems = getNavigationForCollection(collectionName, properties);

  if (!isMobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in-50"
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                N
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Nexonetics
              </span>
            </div>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Collections Selector */}
          <div className="py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workspaces
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {collections.map((col) => {
                const isActive = activeCollection?.id === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => {
                      selectCollectionByName(col.collectionName);
                      setMobileNavOpen(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                    )}
                  >
                    {col.collectionName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Navigation */}
          <div className="py-3 space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {collectionName} Navigation
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-xs text-slate-500 truncate">
            Signed in as <span className="font-semibold text-slate-800">{user?.fullName || user?.username}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMobileNavOpen(false);
              logout();
            }}
            className="w-full text-xs text-rose-600 gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
