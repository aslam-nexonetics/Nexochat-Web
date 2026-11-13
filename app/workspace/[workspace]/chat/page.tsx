"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Send,
  Phone,
  Video,
  MessageSquare,
  Users,
  Check,
  CheckCheck,
  Loader2,
  Sparkles,
  User as UserIcon,
  Circle,
  Bot,
  Clock,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Bell,
  ChevronLeft,
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
import { useCallStore } from "@/lib/store/call-store";
import { chatApi, ChatRoom, ChatMessage, CollectionUser } from "@/lib/api/chat";
import { ChatWebSocketClient, SocketEvent } from "@/lib/api/chat-socket";
import { gigApi } from "@/lib/api/gig";
import { GigBotKnowledgeEngine, GigBoatQuestionsService } from "@/lib/api/gig-bot";
import { GigBotReply } from "@/lib/types/gig";
import { requestFcmToken, onFcmForegroundMessage } from "@/lib/firebase";
import { cn, parseServerDate, formatMessageTime, formatChatListTime } from "@/lib/utils";
import { toast } from "sonner";

export default function WorkspaceChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-[calc(100vh-8.5rem)] flex items-center justify-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        </div>
      }
    >
      <WorkspaceChatContent />
    </React.Suspense>
  );
}

function isSameDay(d1: string | Date, d2: string | Date): boolean {
  const a = parseServerDate(d1);
  const b = parseServerDate(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateSeparator(dateStr: string): string {
  const d = parseServerDate(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Pixel-perfect vector AI Boat Mascot matching Flutter's AiBoatMascotWidget
 */
function AiBoatMascot({ size = 96 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center shrink-0 drop-shadow-sm select-none"
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="boatHullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Ocean Waves */}
        <path
          d="M10 98 Q 35 90 60 98 T 110 98 L 110 110 L 10 110 Z"
          fill="url(#waveGrad)"
        />
        <path
          d="M5 104 Q 30 96 60 104 T 115 104 L 115 114 L 5 114 Z"
          fill="#0284C7"
          opacity="0.4"
        />

        {/* Boat Hull */}
        <path
          d="M22 84 L 32 98 Q 60 102 88 98 L 98 84 Q 60 88 22 84 Z"
          fill="url(#boatHullGrad)"
        />
        <path
          d="M26 84 L 94 84"
          stroke="#BAE6FD"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Robot Torso */}
        <rect
          x="44"
          y="56"
          width="32"
          height="28"
          rx="8"
          fill="url(#robotBodyGrad)"
        />
        <circle cx="60" cy="70" r="4" fill="#67E8F9" className="animate-pulse" />

        {/* Robot Head */}
        <rect
          x="40"
          y="28"
          width="40"
          height="26"
          rx="10"
          fill="#1E293B"
          stroke="#38BDF8"
          strokeWidth="2"
        />

        {/* Robot Screen & Eyes */}
        <rect x="46" y="34" width="28" height="14" rx="5" fill="#0F172A" />
        <circle cx="53" cy="41" r="3" fill="#38BDF8" />
        <circle cx="67" cy="41" r="3" fill="#38BDF8" />
        <circle cx="54" cy="40" r="1" fill="#FFFFFF" />
        <circle cx="68" cy="40" r="1" fill="#FFFFFF" />

        {/* Antenna */}
        <line x1="60" y1="28" x2="60" y2="18" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="16" r="3.5" fill="#F59E0B" />

        {/* Robot Ears */}
        <rect x="36" y="36" width="4" height="8" rx="2" fill="#64748B" />
        <rect x="80" y="36" width="4" height="8" rx="2" fill="#64748B" />

        {/* Friendly Waving Hand */}
        <path
          d="M76 62 Q 88 56 90 48"
          stroke="#3B82F6"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="91" cy="46" r="3" fill="#60A5FA" />
      </svg>
    </div>
  );
}

/**
 * Red status strip shown at the top of chat when provider is offline (matching Flutter AryaOfflineBanner)
 */
function AryaOfflineBanner({ message }: { message: string }) {
  return (
    <div className="w-full px-4 py-2 bg-red-50/90 border-b border-red-100 flex items-center justify-center gap-2 text-xs font-bold text-red-600 shrink-0 select-none">
      <div className="w-7 h-4 bg-red-500 rounded-full p-0.5 flex items-center justify-start shrink-0">
        <div className="w-3 h-3 bg-white rounded-full shadow-xs" />
      </div>
      <span>{message}</span>
    </div>
  );
}

/**
 * Invitation card prompting user to optionally chat with AI Assistant when provider is offline (matching Flutter AryaAiInviteCard)
 */
function AryaAiInviteCard({
  providerName,
  boatName,
  onAccept,
  onDecline,
}: {
  providerName: string;
  boatName: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="h-full flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center animate-in fade-in-50 duration-200">
        <AiBoatMascot size={96} />
        <h3 className="mt-5 font-black text-lg sm:text-xl text-slate-900 tracking-tight">
          {providerName} is not available now
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-sm">
          They will be back soon. Meanwhile, do you want to chat with {boatName}?
        </p>

        {/* AI Offer Card */}
        <div className="w-full mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 via-slate-50 to-emerald-50/30 border border-slate-200/80 text-left flex flex-col gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Chat with {boatName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Get instant answers about services, pricing, and book directly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              type="button"
              onClick={onAccept}
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Yes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDecline}
              className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
            >
              No, Thanks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Animated Typing Bubble for Arya AI (matching Flutter AryaAiTypingBubble)
 */
function AryaAiTypingBubble({ botName }: { botName: string }) {
  return (
    <div className="flex items-end gap-2.5 max-w-md animate-in fade-in-50">
      <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
        <Bot className="h-4 w-4" />
      </div>
      <div className="px-4 py-2.5 rounded-2xl rounded-bl-xs bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs text-slate-500 font-medium shadow-2xs">
        <span>{botName} is thinking</span>
        <div className="flex items-center gap-1 pt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Suggestion Chips Bar for Arya AI (matching Flutter AryaAiChipBar)
 */
function AryaAiChipBar({
  suggestions,
  onSelected,
}: {
  suggestions: string[];
  onSelected: (text: string) => void;
}) {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="px-4 py-2 bg-white/95 backdrop-blur-xs border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
      <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Options:</span>
      {suggestions.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelected(chip)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/80 text-blue-700 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-2xs group"
        >
          <ArrowRight className="h-3 w-3 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          <span>{chip}</span>
        </button>
      ))}
    </div>
  );
}

function WorkspaceChatContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = (params?.workspace as string) || "techform";

  // URL Query Parameters for direct provider chat initiation
  const otherUserIdParam = searchParams.get("otherUserId");
  const otherUserNameParam = searchParams.get("otherUserName");
  const providerIdParam = searchParams.get("providerId");
  const isAvailableNowParam = searchParams.get("isAvailableNow");
  const specializationParam = searchParams.get("specialization");
  const appointmentIdParam = searchParams.get("appointmentId");
  const router = useRouter();

  const { user } = useAuthStore();
  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();
  const { initiateCall } = useCallStore();

  const [rooms, setRooms] = React.useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = React.useState<ChatRoom | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isLoadingRooms, setIsLoadingRooms] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  // Pagination & Scroll State
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // WebSocket Live Connection state
  const [isSocketConnected, setIsSocketConnected] = React.useState(false);
  const [typingIndicator, setTypingIndicator] = React.useState<string | null>(null);
  const socketClientRef = React.useRef<ChatWebSocketClient | null>(null);
  const typingTimeoutRef = React.useRef<any>(null);

  // New Chat Dialog
  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);
  const [collectionUsers, setCollectionUsers] = React.useState<CollectionUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [userSearchQuery, setUserSearchQuery] = React.useState("");

  // GIG Offline Provider & Inline AI Assistant State (matching Flutter chat_room_page.dart)
  const [isProviderOffline, setIsProviderOffline] = React.useState(false);
  const [providerHasBot, setProviderHasBot] = React.useState(false);
  const [providerBotName, setProviderBotName] = React.useState<string | null>(null);
  const [providerBotWelcomeMessage, setProviderBotWelcomeMessage] = React.useState<string | null>(null);
  const [providerBotAnswers, setProviderBotAnswers] = React.useState<Record<number, string[]> | null>(null);
  const [resolvedProviderId, setResolvedProviderId] = React.useState<number | null>(null);
  const [resolvedBotId, setResolvedBotId] = React.useState<number | null>(null);
  const [isAryaAiActive, setIsAryaAiActive] = React.useState(false);
  const [declinedBot, setDeclinedBot] = React.useState(false);
  const [isBotThinking, setIsBotThinking] = React.useState(false);
  const [botSessionMessages, setBotSessionMessages] = React.useState<
    Array<{
      id: number;
      sender: "user" | "bot";
      text: string;
      createdAt: string;
      action?: string | null;
    }>
  >([]);
  const [botSuggestions, setBotSuggestions] = React.useState<string[]>([]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  const decodedWorkspaceSlug = React.useMemo(() => {
    try {
      return decodeURIComponent(workspaceSlug);
    } catch {
      return workspaceSlug;
    }
  }, [workspaceSlug]);

  const formatCollectionName = React.useCallback((str: string) => {
    try {
      str = decodeURIComponent(str);
    } catch {}
    return str
      .split(/[\s_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }, []);

  const matchedBySlug =
    collections.find(
      (c) =>
        c.collectionName.toLowerCase().trim() === decodedWorkspaceSlug.toLowerCase().trim() ||
        c.collectionName.toLowerCase().trim() === workspaceSlug.toLowerCase().trim()
    ) ||
    (activeCollection &&
    (activeCollection.collectionName.toLowerCase().trim() === decodedWorkspaceSlug.toLowerCase().trim() ||
     activeCollection.collectionName.toLowerCase().trim() === workspaceSlug.toLowerCase().trim())
      ? activeCollection
      : null);

  const currentCollection =
    matchedBySlug || {
      id: 0,
      collectionName: formatCollectionName(decodedWorkspaceSlug),
      properties: ["Chat"],
    };

  // Strictly enforce that the collectionName used for chat API and socket calls
  const collectionName = matchedBySlug?.collectionName || decodedWorkspaceSlug;
  const collectionDisplayName = formatCollectionName(
    activeCollection?.collectionName || matchedBySlug?.collectionName || decodedWorkspaceSlug
  );

  const isGigCollection =
    decodedWorkspaceSlug.toLowerCase() === "gig" || collectionName.toLowerCase() === "gig";
  const isTechformCollection =
    decodedWorkspaceSlug.toLowerCase().includes("techform") ||
    collectionName.toLowerCase().includes("techform");

  const handleHeaderProfileClick = React.useCallback(() => {
    if (isAryaAiActive) return;

    // Resolve target other user's ID
    const targetUserId =
      otherUserIdParam
        ? parseInt(otherUserIdParam, 10)
        : activeRoom?.otherUserId
        ? Number(activeRoom.otherUserId)
        : activeRoom?.participants?.find((p) => p.userId !== user?.id && p.id !== user?.id)?.userId ||
          activeRoom?.participants?.find((p) => p.userId !== user?.id && p.id !== user?.id)?.id ||
          null;

    // 1. GIG Collection: Navigate to provider profile / dossier
    if (isGigCollection) {
      const pId = resolvedProviderId || (providerIdParam ? parseInt(providerIdParam, 10) : null);
      if (pId) {
        router.push(
          `/workspace/${workspaceSlug}/profile?providerId=${pId}${targetUserId ? `&userId=${targetUserId}` : ""}`
        );
      } else if (targetUserId) {
        router.push(`/workspace/${workspaceSlug}/profile?userId=${targetUserId}`);
      } else {
        router.push(`/workspace/${workspaceSlug}/profile`);
      }
      return;
    }

    // 2. Techform Collection: Navigate to candidate profile
    if (isTechformCollection) {
      if (targetUserId) {
        router.push(`/workspace/${workspaceSlug}/profile?userId=${targetUserId}`);
      } else {
        router.push(`/workspace/${workspaceSlug}/profile`);
      }
      return;
    }

    // 3. Other collections (Feeds, Company, Shalabam, Nexonetics, etc.): Navigate to member profile
    if (targetUserId) {
      router.push(`/workspace/${workspaceSlug}/profile?userId=${targetUserId}`);
    } else {
      router.push(`/workspace/${workspaceSlug}/profile`);
    }
  }, [
    isAryaAiActive,
    otherUserIdParam,
    activeRoom,
    user?.id,
    isGigCollection,
    resolvedProviderId,
    providerIdParam,
    router,
    workspaceSlug,
    isTechformCollection,
  ]);

  // Reset bot session state on active room switch
  React.useEffect(() => {
    setIsAryaAiActive(false);
    setDeclinedBot(false);
    setBotSessionMessages([]);
    setBotSuggestions([]);
    setResolvedProviderId(null);
    setResolvedBotId(null);
    setProviderBotWelcomeMessage(null);
    setProviderBotAnswers(null);
  }, [activeRoom?.id]);

  // Check if target provider is offline and if they have completed bot setup
  React.useEffect(() => {
    if (!isGigCollection || !activeRoom) {
      setIsProviderOffline(false);
      setProviderHasBot(false);
      setProviderBotName(null);
      setResolvedProviderId(null);
      setResolvedBotId(null);
      setProviderBotWelcomeMessage(null);
      setProviderBotAnswers(null);
      return;
    }

    let isMounted = true;

    const pId = providerIdParam ? parseInt(providerIdParam, 10) : null;
    const targetUserId = otherUserIdParam
      ? parseInt(otherUserIdParam, 10)
      : activeRoom.otherUserId ||
        activeRoom.participants?.find((p) => p.userId !== user?.id)?.userId ||
        null;

    const roomTitle =
      otherUserNameParam ||
      activeRoom.displayName ||
      activeRoom.channelName ||
      "";

    const isAryaDemo =
      targetUserId === 12 ||
      pId === 12 ||
      roomTitle.toLowerCase().includes("arya");

    const checkBot = async () => {
      let candidateProviderId = pId;

      // 1. If providerId was not passed in URL params, resolve candidate provider from gigApi.searchProviders()
      if (!candidateProviderId && targetUserId) {
        try {
          const providers = await gigApi.searchProviders();
          const match = providers.find(
            (p) => p.userId === targetUserId || p.id === targetUserId
          );
          if (match && isMounted) {
            candidateProviderId = match.id;
            if (isAvailableNowParam === null) {
              setIsProviderOffline(!match.isAvailableNow);
            }
          }
        } catch (_) {}
      }

      // 2. Resolve offline status
      if (isAvailableNowParam !== null) {
        setIsProviderOffline(isAvailableNowParam === "false");
      } else if (isAryaDemo) {
        setIsProviderOffline(true);
      } else if (candidateProviderId) {
        gigApi.fetchProviderDetails(candidateProviderId).then((pro) => {
          if (pro && isMounted) {
            setIsProviderOffline(!pro.isAvailableNow);
          }
        }).catch(() => {});
      }

      // 3. Resolve bot completion status (Local Storage -> Backend -> Arya Demo)
      const idsToCheck = Array.from(
        new Set([candidateProviderId, pId, targetUserId].filter(Boolean))
      ) as number[];

      for (const id of idsToCheck) {
        // A. Check local storage
        try {
          const local = await GigBoatQuestionsService.getBoatConfig(id, {
            providerName: roomTitle,
          });
          if (local && (local.isReady || local.isActive)) {
            if (isMounted) {
              setProviderHasBot(true);
              setProviderBotName(local.botName || local.boatName || `${roomTitle}'s AI Assistant`);
              setResolvedProviderId(id);
              if (local.botId) setResolvedBotId(local.botId);
              if (local.welcomeMessage) setProviderBotWelcomeMessage(local.welcomeMessage);
              if (local.answers) setProviderBotAnswers(local.answers);
            }
            return;
          }
        } catch (_) {}

        // B. Check backend
        try {
          const remote = await gigApi.fetchProviderBot(id);
          if (remote && remote.isActive) {
            if (isMounted) {
              setProviderHasBot(true);
              setProviderBotName(remote.botName || `${roomTitle}'s AI Assistant`);
              if (remote.providerId) setResolvedProviderId(remote.providerId);
              if (remote.botId) setResolvedBotId(remote.botId);
              if (remote.welcomeMessage) setProviderBotWelcomeMessage(remote.welcomeMessage);
              if (remote.answers) setProviderBotAnswers(remote.answers);
              if (remote.isAvailableNow !== undefined && isAvailableNowParam === null) {
                setIsProviderOffline(!remote.isAvailableNow);
              }
            }
            return;
          }
        } catch (_) {}
      }

      if (isMounted) {
        if (isAryaDemo) {
          setProviderHasBot(true);
          setProviderBotName("Arya AI");
          setResolvedProviderId(12);
        } else {
          setProviderHasBot(false);
          setProviderBotName(null);
        }
      }
    };

    checkBot();

    return () => {
      isMounted = false;
    };
  }, [
    isGigCollection,
    activeRoom,
    providerIdParam,
    otherUserIdParam,
    otherUserNameParam,
    isAvailableNowParam,
    user?.id,
  ]);

  const activeRoomRef = React.useRef<ChatRoom | null>(null);
  React.useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const roomsRef = React.useRef<ChatRoom[]>([]);
  React.useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // 1. Fetch conversations for this collection (silent = false on initial load, true for background sync)
  const loadConversations = React.useCallback(
    async (silent = false) => {
      if (!collectionName) return;
      if (!silent) setIsLoadingRooms(true);
      try {
        const fetchedRooms = await chatApi.listConversations(collectionName, user?.id);
        const sortedRooms = [...fetchedRooms].sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
        setRooms(sortedRooms);

        // If otherUserIdParam is given in URL, try to match or initiate room
        if (otherUserIdParam) {
          const targetUserId = parseInt(otherUserIdParam, 10);
          const matched = fetchedRooms.find((r) => {
            if (r.otherUserId && Number(r.otherUserId) === targetUserId) return true;
            if (
              r.participants?.some(
                (p) => Number(p.userId) === targetUserId || Number(p.id) === targetUserId
              )
            ) {
              return true;
            }
            if (r.channelName && r.channelName.startsWith("direct_")) {
              const parts = r.channelName
                .split("_")
                .map((p) => Number(p))
                .filter(Boolean);
              if (parts.includes(targetUserId)) return true;
            }
            if (
              otherUserNameParam &&
              r.displayName &&
              r.displayName.toLowerCase().trim() ===
                otherUserNameParam.toLowerCase().trim()
            ) {
              return true;
            }
            return false;
          });

          if (matched) {
            setActiveRoom(matched);
          } else {
            // Create or retrieve room with target user matching Flutter
            const newRoom = await chatApi.startChat(
              collectionName,
              targetUserId,
              otherUserNameParam || "Provider",
              specializationParam || null,
              user?.id
            );
            if (newRoom) {
              setRooms((prev) => [
                newRoom,
                ...prev.filter((r) => r.id !== newRoom.id),
              ]);
              setActiveRoom(newRoom);
            }
          }
        }
        // NOTE: We deliberately do NOT auto-open any chat by default!
        // The user decides when to open a conversation.
      } catch (err) {
        console.error("Failed to load chat rooms:", err);
      } finally {
        if (!silent) setIsLoadingRooms(false);
      }
    },
    [collectionName, otherUserIdParam, otherUserNameParam, specializationParam, user?.id]
  );

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 1a. FCM Web Push Registration & Foreground Push Listener
  React.useEffect(() => {
    requestFcmToken().catch(() => {});

    const unsubscribe = onFcmForegroundMessage((payload) => {
      const title =
        payload.notification?.title ||
        payload.data?.title ||
        payload.data?.sender_name ||
        "New Notification";

      const body =
        payload.notification?.body ||
        payload.data?.body ||
        payload.data?.message_text ||
        payload.data?.message ||
        "";

      const rawChatId =
        payload.data?.chat_id ||
        payload.data?.channel_id ||
        payload.data?.room_id;
      const incomingChatId = rawChatId ? parseInt(rawChatId, 10) : null;

      // Check if user is currently looking at this exact chat
      const isCurrentlyViewingThisChat =
        activeRoomRef.current !== null &&
        incomingChatId !== null &&
        activeRoomRef.current.id === incomingChatId;

      // Only show toast notifications when NOT on that chat!
      if (!isCurrentlyViewingThisChat && (title || body)) {
        toast.info(title, {
          description: body,
          action: incomingChatId
            ? {
                label: "Open",
                onClick: () => {
                  const target = roomsRef.current.find(
                    (r) => r.id === incomingChatId
                  );
                  if (target) setActiveRoom(target);
                },
              }
            : undefined,
        });
      }

      // Update room preview smoothly and move to top of conversations list
      if (incomingChatId) {
        setRooms((prev) => {
          const existing = prev.find((r) => r.id === incomingChatId);
          if (!existing) return prev;
          const updated = {
            ...existing,
            lastMessage: body || existing.lastMessage,
            lastMessageTime: new Date().toISOString(),
            unreadCount: isCurrentlyViewingThisChat
              ? 0
              : (existing.unreadCount || 0) + 1,
          };
          const others = prev.filter((r) => r.id !== incomingChatId);
          return [updated, ...others];
        });
      }

      // Silently sync from backend in the background without flipping isLoadingRooms
      loadConversations(true);
    });

    return () => {
      unsubscribe();
    };
  }, [loadConversations]);

  // 1b. Real-time WebSocket connection matching Flutter ChatSocketDataSource
  React.useEffect(() => {
    if (!collectionName) return;

    const socketClient = new ChatWebSocketClient(collectionName);
    socketClientRef.current = socketClient;

    const unsubStatus = socketClient.onStatusChange((connected) => {
      setIsSocketConnected(connected);
    });

    const unsubEvents = socketClient.subscribe((event: SocketEvent) => {
      if (event.type === "new_message") {
        const msg = (event as any).message;
        if (!msg) return;

        const incomingChatId = msg.chat_id || msg.channel_id;
        const incomingText = msg.message_text || msg.content || msg.text || "";

        // If message is for currently active room, append it live
        if (activeRoom && incomingChatId === activeRoom.id) {
          const isMe = (msg.sender_id || msg.user_id) === user?.id;
          const newMsg: ChatMessage = {
            id: msg.id || Date.now(),
            chatId: activeRoom.id,
            senderId: msg.sender_id || msg.user_id || 0,
            senderName: msg.sender_name || "Team Member",
            messageText: incomingText,
            messageType: msg.message_type || "text",
            createdAt: msg.created_at || new Date().toISOString(),
            isMe,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          const container = scrollContainerRef.current;
          if (container) {
            const isNearBottom =
              container.scrollHeight - container.scrollTop - container.clientHeight < 250;
            if (isNearBottom) {
              scrollToBottom("smooth");
            }
          }
        }

        // Update last message snippet in conversations list and move to top
        setRooms((prev) => {
          const existing = prev.find((r) => r.id === incomingChatId);
          if (!existing) {
            loadConversations(true);
            return prev;
          }
          const updated = {
            ...existing,
            lastMessage: incomingText || existing.lastMessage,
            lastMessageTime: new Date().toISOString(),
          };
          const others = prev.filter((r) => r.id !== incomingChatId);
          return [updated, ...others];
        });
      } else if (event.type === "typing_indicator") {
        const data = event as any;
        if (activeRoom && data.chat_id === activeRoom.id && data.user_id !== user?.id) {
          if (data.is_typing) {
            setTypingIndicator(`${data.username || "Participant"} is typing...`);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setTypingIndicator(null);
            }, 3000);
          } else {
            setTypingIndicator(null);
          }
        }
      }
    });

    socketClient.connect();

    return () => {
      unsubStatus();
      unsubEvents();
      socketClient.disconnect();
      socketClientRef.current = null;
    };
  }, [collectionName, activeRoom, user?.id]);

  // Join room on activeRoom change
  React.useEffect(() => {
    if (activeRoom && socketClientRef.current) {
      socketClientRef.current.joinRoom(activeRoom.id);
    }
  }, [activeRoom]);

  // Scroll to bottom helper
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  // 2. Fetch initial messages when active room changes
  React.useEffect(() => {
    if (!activeRoom || !collectionName) {
      setMessages([]);
      return;
    }
    let isMounted = true;
    setIsLoadingMessages(true);
    setCurrentPage(1);
    setHasMoreMessages(false);

    chatApi
      .getMessages(collectionName, activeRoom.id, 1, 50)
      .then(({ messages: fetchedMessages, hasMore }) => {
        if (isMounted) {
          setMessages(fetchedMessages);
          setHasMoreMessages(hasMore);
          setIsLoadingMessages(false);

          // Instantly scroll to bottom upon loading the room
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeRoom?.id, collectionName]);

  // 2b. Load older messages (Pagination)
  const handleLoadMoreMessages = React.useCallback(async () => {
    if (!activeRoom || !collectionName || isLoadingMore || !hasMoreMessages) return;

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const res = await chatApi.getMessages(collectionName, activeRoom.id, nextPage, 50);
      if (res.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOlder = res.messages.filter((m) => !existingIds.has(m.id));
          return [...newOlder, ...prev];
        });
        setCurrentPage(nextPage);
        setHasMoreMessages(res.hasMore);

        // Preserve scroll position so view doesn't jump
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeRoom, collectionName, currentPage, hasMoreMessages, isLoadingMore]);

  // Scroll handler to automatically trigger pagination when scrolling up to top
  const handleMessageScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (target.scrollTop <= 40 && hasMoreMessages && !isLoadingMore && !isLoadingMessages) {
        handleLoadMoreMessages();
      }
    },
    [handleLoadMoreMessages, hasMoreMessages, isLoadingMessages, isLoadingMore]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (activeRoom && socketClientRef.current && user) {
      socketClientRef.current.sendTyping(
        activeRoom.id,
        val.length > 0,
        user.id,
        user.fullName || user.username
      );
    }
  };

  // 3. Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // If AI Bot mode is active in GIG chat, route query directly to the Bot
    if (isGigCollection && isAryaAiActive) {
      const query = inputText.trim();
      setInputText("");
      handleSendBotQuery(query);
      return;
    }

    if (!activeRoom || !collectionName || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    const tempId = Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      chatId: activeRoom.id,
      senderId: user?.id || 0,
      senderName: user?.fullName || user?.username || "You",
      messageText,
      messageType: "text",
      createdAt: new Date().toISOString(),
      isMe: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom("smooth");

    const sent = await chatApi.sendMessage(collectionName, activeRoom.id, messageText);
    setIsSending(false);

    if (sent) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...sent, isMe: true } : m)));
      // Update room last message in sidebar and move to top
      setRooms((prev) => {
        const existing = prev.find((r) => r.id === activeRoom.id);
        const updated = existing
          ? { ...existing, lastMessage: messageText, lastMessageTime: new Date().toISOString() }
          : { ...activeRoom, lastMessage: messageText, lastMessageTime: new Date().toISOString() };
        const others = prev.filter((r) => r.id !== activeRoom.id);
        return [updated, ...others];
      });
    } else {
      toast.error("Failed to deliver message");
    }
  };

  // 4. Open "Start New Chat" modal & fetch users
  const handleOpenNewChat = async () => {
    setIsNewChatOpen(true);
    if (currentCollection.id) {
      setIsLoadingUsers(true);
      const users = await chatApi.getCollectionUsers(currentCollection.id);
      // Filter out self
      setCollectionUsers(users.filter((u) => u.id !== user?.id));
      setIsLoadingUsers(false);
    }
  };

  const handleStartChatWithUser = async (targetUser: CollectionUser) => {
    if (!collectionName) return;
    toast.info(`Starting conversation with ${targetUser.fullName}...`);

    const newRoom = await chatApi.startChat(
      collectionName,
      targetUser.id,
      targetUser.fullName,
      targetUser.specialization || targetUser.role
    );
    setIsNewChatOpen(false);

    if (newRoom) {
      toast.success(`Chat started with ${targetUser.fullName}`);
      setRooms((prev) => {
        const exists = prev.find((r) => r.id === newRoom.id);
        if (exists) return prev;
        return [newRoom, ...prev];
      });
      setActiveRoom(newRoom);
    } else {
      toast.error(`Could not start chat with ${targetUser.fullName}`);
    }
  };

  // 5. GIG AI Bot Session Handlers (matching Flutter _startAryaAi & _sendBotQuery)
  const handleStartBotChat = () => {
    setIsAryaAiActive(true);
    setIsBotThinking(true);

    const pName =
      otherUserNameParam ||
      activeRoom?.displayName ||
      activeRoom?.channelName ||
      "Provider";
    const pSpec = specializationParam || activeRoom?.specialization || "Service";
    const bName =
      providerBotName ||
      (pName.toLowerCase().includes("arya")
        ? "Arya AI"
        : `${pName}'s AI Assistant`);

    // Post user accepted prompt "Yes"
    const userMsg = {
      id: Date.now(),
      sender: "user" as const,
      text: "Yes",
      createdAt: new Date().toISOString(),
    };
    setBotSessionMessages([userMsg]);

    setTimeout(() => {
      const welcome =
        providerBotWelcomeMessage ||
        GigBotKnowledgeEngine.getWelcomeMessage(pName, pSpec, bName);
      const botMsg = {
        id: Date.now() + 1,
        sender: "bot" as const,
        text: welcome,
        createdAt: new Date().toISOString(),
      };
      setBotSessionMessages((prev) => [...prev, botMsg]);
      setBotSuggestions(GigBotKnowledgeEngine.getDefaultSuggestions(pSpec));
      setIsBotThinking(false);
      scrollToBottom("smooth");
    }, 600);
  };

  const handleSendBotQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isBotThinking) return;

    setInputText("");
    if (!isAryaAiActive) {
      setIsAryaAiActive(true);
    }

    const userMsg = {
      id: Date.now(),
      sender: "user" as const,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setBotSessionMessages((prev) => [...prev, userMsg]);
    setIsBotThinking(true);
    scrollToBottom("smooth");

    const pName =
      otherUserNameParam ||
      activeRoom?.displayName ||
      activeRoom?.channelName ||
      "Provider";
    const pSpec = specializationParam || activeRoom?.specialization || "Service";
    const bName =
      providerBotName ||
      (pName.toLowerCase().includes("arya")
        ? "Arya AI"
        : `${pName}'s AI Assistant`);
    const pId =
      resolvedProviderId ||
      (providerIdParam ? parseInt(providerIdParam, 10) : null) ||
      activeRoom?.otherUserId ||
      0;

    try {
      const reply: GigBotReply = await gigApi.queryProviderBot(
        pId,
        trimmed,
        {
          id: pId,
          userId: activeRoom?.otherUserId || 0,
          firstName: pName,
          lastName: "",
          specialization: pSpec,
          city: "Kochi",
          area: "Kaloor",
          rating: 5,
          reviewCount: 0,
          status: "active",
          isAvailableNow: false,
          availabilityStatus: "offline",
          isIdentityVerified: true,
          isSelfieVerified: true,
          isLocationVerified: true,
          hasRealAvatar: true,
          rewardPoints: 0,
          tierLevel: "Bronze",
          completedWorksCount: 0,
          canBookInstantly: true,
        },
        {
          botId: resolvedBotId || undefined,
          conversationHistory: botSessionMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
          answers: providerBotAnswers || undefined,
        }
      );

      const botMsg = {
        id: Date.now() + 2,
        sender: "bot" as const,
        text: reply.text,
        createdAt: new Date().toISOString(),
        action: reply.action || undefined,
      };

      setBotSessionMessages((prev) => [...prev, botMsg]);
      if (reply.suggestions && reply.suggestions.length > 0) {
        setBotSuggestions(reply.suggestions);
      }
    } catch {
      const fallback = GigBotKnowledgeEngine.generateAnswer(
        trimmed,
        pName,
        pSpec,
        undefined,
        providerBotAnswers,
        { city: "Kochi", area: "Kaloor" }
      );
      const botMsg = {
        id: Date.now() + 2,
        sender: "bot" as const,
        text: fallback.text,
        createdAt: new Date().toISOString(),
      };
      setBotSessionMessages((prev) => [...prev, botMsg]);
      if (fallback.suggestions) {
        setBotSuggestions(fallback.suggestions);
      }
    } finally {
      setIsBotThinking(false);
      scrollToBottom("smooth");
    }
  };

  // Sorted rooms: ensure most recent conversation is always at the top
  const sortedRooms = React.useMemo(() => {
    return [...rooms].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }, [rooms]);

  // Filtered rooms matching search
  const filteredRooms = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sortedRooms;
    return sortedRooms.filter(
      (r) =>
        (r.displayName && r.displayName.toLowerCase().includes(q)) ||
        (r.channelName && r.channelName.toLowerCase().includes(q)) ||
        (r.specialization && r.specialization.toLowerCase().includes(q)) ||
        (r.lastMessage && r.lastMessage.toLowerCase().includes(q))
    );
  }, [sortedRooms, searchQuery]);

  // Filtered collection users
  const filteredUsers = collectionUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-8.5rem)] flex flex-col bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xs overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT PANEL: Conversations List ────────────────────── */}
        <aside
          className={cn(
            "border-r border-slate-200 bg-white flex flex-col shrink-0",
            "w-full md:w-80 lg:w-92",
            activeRoom ? "hidden md:flex" : "flex flex-1"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                {collectionDisplayName} Chat
              </h2>
              <p className="text-[11px] text-slate-400">Direct messages & inquiries</p>
            </div>
            <Button
              size="sm"
              onClick={handleOpenNewChat}
              className="h-8 w-8 p-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
              title="Start New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Conversations scroll area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {isLoadingRooms ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs text-slate-400">Loading chats...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">No active conversations</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Click the + button above to initiate a chat with any member of {collectionDisplayName}.
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = activeRoom?.id === room.id;
                const roomTitle = room.displayName || room.channelName || "Chat";
                const initials =
                  roomTitle
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "NX";

                const roomRole =
                  room.specialization ||
                  room.role ||
                  (isGigCollection ? "Professional" : null);

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={cn(
                      "w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer",
                      isActive
                        ? "bg-indigo-50/60 border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200 overflow-hidden">
                        {room.avatarUrl ? (
                          <img
                            src={room.avatarUrl}
                            alt={roomTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {roomTitle}
                          </span>
                          {roomRole && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              {roomRole}
                            </span>
                          )}
                          {room.chatType === "channel" && (
                            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-slate-100 text-slate-500 shrink-0">
                              channel
                            </span>
                          )}
                        </div>
                        {room.lastMessageTime && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatChatListTime(room.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {room.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT PANEL: Active Chat Room / Empty Placeholder ─────────────── */}
        <main
          className={cn(
            "flex-1 flex flex-col bg-slate-50/50 min-w-0",
            activeRoom ? "flex w-full" : "hidden md:flex"
          )}
        >
          {activeRoom ? (
            (() => {
              const activeTitle =
                otherUserNameParam ||
                activeRoom.displayName ||
                activeRoom.channelName ||
                "Chat";

              const activeRole =
                specializationParam ||
                activeRoom.specialization ||
                activeRoom.role ||
                (isGigCollection ? "Professional" : null);

              const activeInitials =
                activeTitle
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "NX";

              const isOffline = isGigCollection && isProviderOffline;
              const hasActiveBot = providerHasBot;
              const showInviteCard = isOffline && !isAryaAiActive && !declinedBot && hasActiveBot;
              const showOfflineBanner = isOffline && !isAryaAiActive;

              const resolvedBotName =
                providerBotName ||
                (activeTitle.toLowerCase().includes("arya")
                  ? "Arya AI"
                  : `${activeTitle}'s AI Assistant`);
              const resolvedBotRole = `${activeRole || "Specialist"} Assistant`;

              const headerTitle = isAryaAiActive ? resolvedBotName : activeTitle;
              const headerRole = isAryaAiActive ? resolvedBotRole : activeRole;

              return (
                <>
                  {/* Room Header */}
                  <div className="h-16 px-3 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-2xs">
                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                      {/* Mobile Back Button to return to conversation list */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setActiveRoom(null);
                          router.replace(`/workspace/${workspaceSlug}/chat`);
                        }}
                        className="md:hidden h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 shrink-0 cursor-pointer -ml-1"
                        title="Back to conversations"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>

                      <div
                        onClick={handleHeaderProfileClick}
                        className={cn(
                          "flex items-center gap-2.5 sm:gap-3 min-w-0 transition-opacity text-left flex-1",
                          !isAryaAiActive && "cursor-pointer group hover:opacity-85"
                        )}
                        title={!isAryaAiActive ? `Click to view ${activeTitle}'s profile` : undefined}
                      >
                        {isAryaAiActive ? (
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            <Bot className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden group-hover:ring-2 group-hover:ring-indigo-400 transition-all">
                            {activeRoom.avatarUrl ? (
                              <img
                                src={activeRoom.avatarUrl}
                                alt={activeTitle}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              activeInitials
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {headerTitle}
                            </h3>
                            {headerRole && (
                              <span className={cn(
                                "px-2 py-0.5 text-[11px] font-bold rounded-md flex items-center gap-1 shadow-2xs",
                                isAryaAiActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              )}>
                                {isAryaAiActive ? <Bot className="h-3 w-3 text-emerald-600" /> : <Wrench className="h-3 w-3 text-blue-600" />}
                                <span>{headerRole}</span>
                              </span>
                            )}
                            {isGigCollection && !isAryaAiActive && (
                              <span title="Verified Professional" className="inline-flex items-center">
                                <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-50 shrink-0" />
                              </span>
                            )}
                            {appointmentIdParam && (
                              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Appointment #{appointmentIdParam}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {isAryaAiActive
                              ? `Smart Assistant for ${activeTitle} • Instant answers & bookings`
                              : isGigCollection
                              ? activeRole
                                ? `${activeRole} Specialist • Click to view profile`
                                : "GIG Service Provider • Click to view profile"
                              : `${collectionDisplayName} Workspace • Click to view profile`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-1.5">
                      {isAryaAiActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsAryaAiActive(false);
                            setDeclinedBot(true);
                          }}
                          className="h-9 px-3 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                        >
                          <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>Talk to {activeTitle} directly</span>
                        </Button>
                      ) : (
                        <>
                          {isOffline && hasActiveBot && declinedBot && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleStartBotChat}
                              className="h-9 px-3 text-xs gap-1.5 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/60 font-bold cursor-pointer"
                            >
                              <Bot className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Ask AI Assistant</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const targetUserId = otherUserIdParam
                                ? parseInt(otherUserIdParam, 10)
                                : (activeRoom.otherUserId ||
                                   activeRoom.otherUser?.userId ||
                                   activeRoom.otherUser?.id ||
                                   activeRoom.id);
                              initiateCall({
                                receiverId: targetUserId,
                                receiverName: activeTitle,
                                receiverAvatar: activeRoom.avatarUrl,
                                receiverRole: activeRole,
                                callType: "audio",
                                collectionName,
                                collectionId: currentCollection?.id?.toString(),
                              });
                            }}
                            className="h-9 px-3 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs font-medium"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-600" />
                            <span className="hidden sm:inline">Voice Call</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const targetUserId = otherUserIdParam
                                ? parseInt(otherUserIdParam, 10)
                                : (activeRoom.otherUserId ||
                                   activeRoom.otherUser?.userId ||
                                   activeRoom.otherUser?.id ||
                                   activeRoom.id);
                              initiateCall({
                                receiverId: targetUserId,
                                receiverName: activeTitle,
                                receiverAvatar: activeRoom.avatarUrl,
                                receiverRole: activeRole,
                                callType: "video",
                                collectionName,
                                collectionId: currentCollection?.id?.toString(),
                              });
                            }}
                            className="h-9 px-3 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs font-medium"
                          >
                            <Video className="h-3.5 w-3.5 text-slate-600" />
                            <span className="hidden sm:inline">Video Call</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Red Offline Banner when provider is away */}
                  {showOfflineBanner && (
                    <AryaOfflineBanner
                      message={
                        !hasActiveBot
                          ? `${activeTitle} is currently away. Leave a message below`
                          : "Not Available Now"
                      }
                    />
                  )}

                  {/* Body: 3 Modes matching Flutter chat_room_page.dart:
                      1. showInviteCard: AryaAiInviteCard
                      2. isAryaAiActive: Inline AI Bot Conversation
                      3. Normal: Regular human chat message stream
                  */}
                  {showInviteCard ? (
                    <AryaAiInviteCard
                      providerName={activeTitle}
                      boatName={resolvedBotName}
                      onAccept={handleStartBotChat}
                      onDecline={() => setDeclinedBot(true)}
                    />
                  ) : isAryaAiActive ? (
                    /* Inline AI Assistant Mode */
                    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60">
                      <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto p-6 space-y-3.5"
                      >
                        {botSessionMessages.map((msg) => {
                          const isUser = msg.sender === "user";
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex gap-2.5 max-w-[80%]",
                                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                              )}
                            >
                              {!isUser && (
                                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-2xs">
                                  <Bot className="h-4 w-4" />
                                </div>
                              )}
                              <div className="space-y-1.5">
                                <div
                                  className={cn(
                                    "p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-line",
                                    isUser
                                      ? "bg-slate-900 text-white rounded-tr-xs"
                                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                                  )}
                                >
                                  {msg.text}
                                </div>
                                {!isUser && (msg.action === "book_appointment" || msg.text.toLowerCase().includes("book") || msg.text.toLowerCase().includes("appointment")) && (
                                  <div className="pt-1">
                                    <Link href="/workspace/gig/appointments">
                                      <Button
                                        size="sm"
                                        className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
                                      >
                                        <Wrench className="h-3.5 w-3.5" />
                                        <span>Book Appointment with {activeTitle}</span>
                                      </Button>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {isBotThinking && <AryaAiTypingBubble botName={resolvedBotName} />}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Suggestion chips bar */}
                      <AryaAiChipBar
                        suggestions={botSuggestions}
                        onSelected={handleSendBotQuery}
                      />

                      {/* Bot Message Input Footer */}
                      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Ask ${resolvedBotName} about rates, availability, or booking...`}
                            value={inputText}
                            onChange={handleInputChange}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                          <Button
                            type="submit"
                            disabled={!inputText.trim() || isBotThinking}
                            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>Send</span>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    /* Normal Human Chat Mode */
                    <>
                      <div
                        ref={scrollContainerRef}
                        onScroll={handleMessageScroll}
                        className="flex-1 overflow-y-auto p-6 space-y-3"
                      >
                        {isLoadingMessages ? (
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
                            <span className="text-xs text-slate-400">Loading conversation history...</span>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-xs">
                              <MessageSquare className="h-7 w-7 text-slate-600" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-800">
                              Start of conversation with {activeTitle}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm">
                              {isOffline
                                ? `${activeTitle} is away right now. Leave a message and they will be notified.`
                                : "Send your message to begin the discussion."}
                            </p>
                          </div>
                        ) : (
                          <>
                            {hasMoreMessages && (
                              <div className="flex justify-center pt-1 pb-3">
                                {isLoadingMore ? (
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                                    <span>Loading older messages...</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleLoadMoreMessages}
                                    className="px-3.5 py-1 rounded-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                  >
                                    Load older messages
                                  </button>
                                )}
                              </div>
                            )}

                            {messages.map((msg, index) => {
                              const isMe = msg.isMe || msg.senderId === user?.id;
                              const showDate =
                                index === 0 || !isSameDay(messages[index - 1].createdAt, msg.createdAt);
                              const displayName = isMe
                                ? (user?.fullName || user?.username || "You")
                                : (msg.senderName && msg.senderName !== "User"
                                    ? msg.senderName
                                    : activeTitle);

                              return (
                                <React.Fragment key={msg.id}>
                                  {showDate && (
                                    <div className="flex justify-center my-3">
                                      <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/60 text-[11px] font-semibold text-slate-600 shadow-2xs">
                                        {formatDateSeparator(msg.createdAt)}
                                      </span>
                                    </div>
                                  )}

                                  <div
                                    className={`flex gap-3 max-w-[75%] ${
                                      isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                                    }`}
                                  >
                                    {!isMe && (
                                      <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs overflow-hidden mt-0.5">
                                        {activeRoom.avatarUrl ? (
                                          <img
                                            src={activeRoom.avatarUrl}
                                            alt={activeTitle}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          activeInitials
                                        )}
                                      </div>
                                    )}

                                    <div className={`space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                                      <div
                                        className={`flex items-center gap-2 text-[10px] text-slate-400 ${
                                          isMe ? "justify-end" : "justify-start"
                                        }`}
                                      >
                                        <span className="font-semibold text-slate-700">{displayName}</span>
                                        <span>·</span>
                                        <span>{formatMessageTime(msg.createdAt)}</span>
                                      </div>

                                      <div
                                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                          isMe
                                            ? "bg-slate-900 text-white rounded-tr-xs"
                                            : "bg-white border border-slate-200 text-slate-900 rounded-tl-xs"
                                        }`}
                                      >
                                        {msg.messageText}
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Typing indicator */}
                      {typingIndicator && (
                        <div className="px-6 py-1.5 text-[11px] text-slate-500 italic bg-white/50 border-t border-slate-100">
                          {typingIndicator}
                        </div>
                      )}

                      {/* Normal Message Input Footer */}
                      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={isOffline ? `Leave a message for ${activeTitle}...` : `Message ${activeTitle}...`}
                            value={inputText}
                            onChange={handleInputChange}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                          <Button
                            type="submit"
                            disabled={!inputText.trim() || isSending}
                            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
                          >
                            {isSending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <span>Send</span>
                                <Send className="h-3.5 w-3.5" />
                              </>
                            )}
                          </Button>
                        </form>
                      </div>
                    </>
                  )}
                </>
              );
            })()
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/40">
          <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs flex flex-col items-center text-center animate-in fade-in-50">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-5 shadow-xs">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3 border border-slate-200/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{collectionDisplayName} Chat Workspace</span>
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
              {isGigCollection ? "GIG Direct Conversations" : `${collectionDisplayName} Messages`}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {isGigCollection
                ? "Connect directly with verified service professionals, inquire about service quotes, or select an active conversation from the left."
                : "Select a conversation from the left sidebar to resume discussion, or start a new message directly."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 w-full">
              <Button
                size="sm"
                onClick={handleOpenNewChat}
                className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Conversation</span>
              </Button>
              {isGigCollection && (
                <Link href="/workspace/gig/gigs">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Wrench className="h-3.5 w-3.5 text-slate-500" />
                    <span>Browse Services & Pros</span>
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 w-full grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600" />
                  Live Sync
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Real-time WebSocket & desktop push alerts</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Bot className="h-3 w-3 text-indigo-600" />
                  Smart AI Support
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Instant booking answers when pros are away</p>
              </div>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>

      {/* ── START NEW CHAT MODAL ────────────────────────────────────────────── */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1.5 border border-slate-200 w-fit">
              <Users className="h-3 w-3" />
              <span>Workspace Directory</span>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              New Message in {collectionDisplayName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select a member of this workspace to begin direct messaging.
            </DialogDescription>
          </DialogHeader>

          {/* User Search Input */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search members by name or role..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Users List */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 py-2">
            {isLoadingUsers ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs text-slate-400">Loading workspace directory...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {userSearchQuery ? "No members match your search" : "No other members found in this collection"}
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleStartChatWithUser(u)}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center font-bold text-xs transition-colors">
                      {u.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {u.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        @{u.username} {u.role ? `· ${u.role}` : ""}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="h-7 text-[11px] px-2.5 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Chat
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}
