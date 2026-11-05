"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Video,
  ExternalLink,
  ChevronRight,
  Shield,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Badge } from "@/components/ui/badge";

export function TopHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { activeCollection, setMobileNavOpen } = useWorkspaceStore();
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "NX";

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between gap-4 z-20 select-none">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/workspace"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Workspaces
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {activeCollection?.collectionName || "Techform"}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          onClick={() => {
            // Can open search modal in future
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search jobs, messages, files...</span>
          </div>
          <kbd className="hidden lg:inline-flex h-4 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-1 font-mono text-[10px] text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions, Notifications, User Dropdown */}
      <div className="flex items-center gap-2">
        {/* Instant Meeting Shortcut */}
        <Link href={`/workspace/${activeCollection?.collectionName?.toLowerCase() || "techform"}/meeting`}>
          <Button
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex h-8 gap-1.5 text-xs border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/60 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Meeting</span>
          </Button>
        </Link>

        {/* Notifications Popover */}
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              <Badge variant="brand" className="text-[10px] px-1.5 py-0">
                Real-time
              </Badge>
            </div>
            <div className="p-4 text-center py-8">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                You&apos;re all caught up!
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                New chat mentions, appointments, and job alerts will appear here.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none">
              <Avatar className="h-8 w-8">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
                <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1 shadow-lg">
            <DropdownMenuLabel className="p-2">
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                {user?.fullName || user?.username || "Authenticated User"}
              </div>
              <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                {user?.email || "user@nexonetics.com"}
              </div>
              <div className="mt-1.5">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {user?.role || "Member"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href={`/workspace/${activeCollection?.collectionName?.toLowerCase() || "techform"}/profile`}
                className="cursor-pointer text-xs flex items-center gap-2"
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>My Profile & CV</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/workspace"
                className="cursor-pointer text-xs flex items-center gap-2"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                <span>All Collections</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
