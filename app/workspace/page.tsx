"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Wrench,
  MessageSquare,
  Building2,
  Layers,
  ArrowRight,
  Plus,
  CheckCircle2,
  Search,
  LogOut,
  User as UserIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { getFirstPropertyRoute } from "@/lib/utils/collection-nav";

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
  if (lower.includes("techform")) return "text-indigo-600 bg-indigo-50 border-indigo-100";
  if (lower.includes("gig")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (lower.includes("shalabam")) return "text-sky-600 bg-sky-50 border-sky-100";
  if (lower.includes("nexonetics")) return "text-amber-600 bg-amber-50 border-amber-100";
  return "text-indigo-600 bg-indigo-50 border-indigo-100";
}

function formatPropertyLabel(prop: string) {
  switch (prop.toLowerCase()) {
    case "techform_dashboard":
    case "job":
      return "Jobs";
    case "chat":
      return "Chat";
    case "job_profile":
    case "profile":
      return "Profile";
    case "nexo_feeds":
      return "Feeds";
    case "company_profile":
      return "Company";
    case "gig_home":
      return "Services";
    case "guest":
      return "Helpdesk";
    default:
      return prop.replace(/_/g, " ");
  }
}

export default function NexoHomePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    collections,
    availableCollections,
    isLoading,
    loadCollections,
    selectCollectionByName,
    joinCollection,
  } = useWorkspaceStore();

  const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
  const [joiningId, setJoiningId] = React.useState<number | null>(null);
  const [discoverSearch, setDiscoverSearch] = React.useState("");

  React.useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "NX";

  // Filter available (unjoined) collections for the modal
  const joinedIds = new Set(collections.map((c) => c.id));
  const filteredAvailable = availableCollections
    .filter((col) => !joinedIds.has(col.id))
    .filter((col) =>
      col.collectionName.toLowerCase().includes(discoverSearch.toLowerCase()) ||
      col.description?.toLowerCase().includes(discoverSearch.toLowerCase())
    );

  const handleJoin = async (collectionId: number, collectionName: string) => {
    if (!user?.id) {
      toast.error("User session not found");
      return;
    }
    setJoiningId(collectionId);
    toast.info(`Joining ${collectionName}...`);
    const success = await joinCollection(collectionId, user.id);
    setJoiningId(null);
    if (success) {
      toast.success(`Successfully joined ${collectionName}!`);
      setIsJoinModalOpen(false);
      const joinedCol = availableCollections.find((c) => c.id === collectionId) || {
        collectionName,
        properties: ["Chat", "Profile"],
      };
      selectCollectionByName(collectionName);
      router.push(getFirstPropertyRoute(joinedCol));
    } else {
      toast.error(`Failed to join ${collectionName}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Pure White Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              N
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                Nexo Home
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-slate-500">
                Workspace Platform
              </span>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                {userInitials}
              </div>
              <span className="font-semibold text-slate-800">
                {user?.fullName || user?.username || "Authenticated User"}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 h-9 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Workspaces Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Collections
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a workspace to access its chat, tools, and features.
          </p>
        </div>

        {/* Collections Grid */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Loading your collections...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Joined Collections Cards */}
            {collections.map((col) => {
              const Icon = getCollectionIcon(col.collectionName);
              const colorClass = getCollectionColor(col.collectionName);
              const slug = col.collectionName.toLowerCase().trim();

              return (
                <div
                  key={col.id}
                  onClick={() => {
                    selectCollectionByName(col.collectionName);
                    router.push(getFirstPropertyRoute(col));
                  }}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center border ${colorClass}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
                        Joined
                      </Badge>
                    </div>

                    {/* Collection Title */}
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {col.collectionName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                      {col.description ||
                        `Collaboration workspace with real-time communications and tools.`}
                    </p>

                    {/* Properties List */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {col.properties.slice(0, 4).map((prop, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700"
                        >
                          {formatPropertyLabel(prop)}
                        </span>
                      ))}
                      {col.properties.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                          +{col.properties.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Open Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              );
            })}

            {/* "Add Collection" CTA Card (Matching Flutter main_home.dart) */}
            <div
              onClick={() => setIsJoinModalOpen(true)}
              className="bg-white/80 hover:bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-5 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[220px] group shadow-2xs hover:shadow-xs"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition-colors mb-3">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                Join New Collection
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Browse and discover public workspaces to join
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 3. Discover & Join Collection Modal */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white border border-slate-200 p-6 rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200 w-fit">
              <Sparkles className="h-3 w-3" />
              <span>Discover Collections</span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Join a Workspace Collection
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Find and join collections available across the enterprise.
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative my-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search available collections..."
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Available Collections List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2 min-h-[220px]">
            {filteredAvailable.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {discoverSearch ? "No collections match your search" : "No new collections available to join"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You are already a member of all active workspaces.
                </p>
              </div>
            ) : (
              filteredAvailable.map((col) => {
                const Icon = getCollectionIcon(col.collectionName);
                const colorClass = getCollectionColor(col.collectionName);

                return (
                  <div
                    key={col.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {col.collectionName}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {col.properties.map((prop, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600"
                            >
                              {formatPropertyLabel(prop)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleJoin(col.id, col.collectionName)}
                      disabled={joiningId === col.id}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 h-8 gap-1.5 px-3"
                    >
                      {joiningId === col.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Join
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
