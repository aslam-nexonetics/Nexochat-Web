"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Compass,
  LogOut,
  Menu,
  X,
  Plus,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";
import {
  getCollectionTabs,
  getFirstPropertyRoute,
  getCollectionIcon,
} from "@/lib/utils/collection-nav";

export default function CollectionWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const workspaceSlug = (params?.workspace as string) || "techform";
  const { user, logout } = useAuthStore();
  const {
    collections,
    activeCollection,
    selectCollectionByName,
    loadCollections,
  } = useWorkspaceStore();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Load collections if not already loaded (e.g. direct deep link or page refresh)
  React.useEffect(() => {
    if (collections.length === 0) {
      loadCollections();
    }
  }, [collections.length, loadCollections]);

  // Synchronize active collection with URL slug
  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const matchedBySlug =
    collections.find(
      (c) => c.collectionName.toLowerCase().trim() === workspaceSlug.toLowerCase()
    ) ||
    (activeCollection &&
    activeCollection.collectionName.toLowerCase().trim() ===
      workspaceSlug.toLowerCase()
      ? activeCollection
      : null);

  const currentCollection =
    matchedBySlug || {
      id: 0,
      collectionName:
        workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1),
      properties:
        workspaceSlug.toLowerCase() === "gig"
          ? ["Gigs", "Appointments", "Chat", "Profile"]
          : workspaceSlug.toLowerCase() === "techform"
          ? ["Jobs", "Applications", "Recruiter", "Profile", "Chat"]
          : ["Chat", "Profile"],
      collectionType: "general",
      status: "active",
    };

  const tabs = getCollectionTabs(currentCollection);
  const currentSlug = currentCollection.collectionName.toLowerCase().trim();

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "NX";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-slate-50 flex font-sans antialiased">
        {/* =========================================================================
            1. LEFT NAVIGATION RAIL (Desktop) - Modern Fixed Icon Rail
            ========================================================================= */}
        <aside className="hidden md:flex flex-col w-16 bg-white border-r border-slate-200 h-screen sticky top-0 z-40 items-center justify-between py-3 shrink-0 shadow-2xs">
          {/* Top: Brand Logo */}
          <div className="flex flex-col items-center gap-3 w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/workspace"
                  className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-extrabold text-base shadow-xs transition-colors"
                >
                  N
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-semibold">
                Nexonetics Home (All Collections)
              </TooltipContent>
            </Tooltip>

            <div className="w-8 h-px bg-slate-200" />
          </div>

          {/* Middle: Active Collection's Property Modules */}
          <nav className="flex-1 flex flex-col items-center gap-2 pt-2 overflow-y-auto no-scrollbar w-full px-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={tab.href}
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group",
                        isActive
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <TabIcon className="h-5 w-5" />
                      {isActive && (
                        <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold">
                    {tab.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Bottom: Explore Collections & Sign Out */}
          <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-slate-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/workspace"
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Compass className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Discover Collections</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] cursor-default">
                  {userInitials}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user?.fullName || user?.username || "Authenticated User"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => logout()}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* =========================================================================
            2. MAIN CANVAS WRAPPER
            ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xs">
            {/* Top Row: Collection Switcher Pills Bar */}
            <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3 border-b border-slate-100">
              {/* Left: Mobile Menu Toggle + Collections Switcher Pills */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 shrink-0 cursor-pointer"
                  aria-label="Toggle Navigation"
                >
                  {mobileMenuOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </button>

                {/* Horizontal Scrollable Collection Pills (Matching Reference UX) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
                  {collections.map((col) => {
                    const colSlug = col.collectionName.toLowerCase().trim();
                    const isSelected = colSlug === currentSlug;

                    return (
                      <button
                        key={col.id}
                        onClick={() => {
                          selectCollectionByName(col.collectionName);
                          router.push(getFirstPropertyRoute(col));
                        }}
                        className={cn(
                          "h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-600/20"
                            : "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        )}
                        <span>{col.collectionName}</span>
                      </button>
                    );
                  })}

                  {/* Add / Explore More Collections Chip */}
                  <Link
                    href="/workspace"
                    className="h-8 px-3 rounded-full border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-500 hover:text-indigo-600 text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Join More</span>
                  </Link>
                </div>
              </div>

              {/* Right: User Information & Sign Out */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-700">
                  <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {userInitials}
                  </div>
                  <span className="font-semibold text-slate-800 max-w-[120px] truncate">
                    {user?.fullName || user?.username || "Authenticated"}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5 gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </div>
            </div>

            {/* Bottom Row: Collection Property Tabs Bar */}
            <div className="px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive =
                  pathname === tab.href || pathname.startsWith(`${tab.href}/`);

                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer",
                      isActive
                        ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <TabIcon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-indigo-600" : "text-slate-400"
                      )}
                    />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </header>

          {/* Mobile Navigation Drawer Sheet */}
          {mobileMenuOpen && (
            <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-4 shadow-md animate-in slide-in-from-top-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Properties in {currentCollection.collectionName}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive =
                      pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all",
                          isActive
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <TabIcon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/workspace"
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  <Compass className="h-4 w-4" />
                  <span>Browse All Collections</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Property Canvas */}
          <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
