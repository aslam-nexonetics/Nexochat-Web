"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Headphones,
  Search,
  Plus,
  Send,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  UserCheck,
  CheckCheck,
  ShieldAlert,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { guestChatApi, GuestQueueItem, GuestMessage } from "@/lib/api/guest-chat";
import { cn, formatMessageTime, formatChatListTime } from "@/lib/utils";
import { toast } from "sonner";

export default function WorkspaceSupportPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace as string) || "techform";

  const { user } = useAuthStore();
  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();

  const [queue, setQueue] = React.useState<GuestQueueItem[]>([]);
  const [activeItem, setActiveItem] = React.useState<GuestQueueItem | null>(null);
  const [messages, setMessages] = React.useState<GuestMessage[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [inputText, setInputText] = React.useState("");

  const [isLoadingQueue, setIsLoadingQueue] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isEnding, setIsEnding] = React.useState(false);

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

  const collectionName = matchedBySlug?.collectionName || decodedWorkspaceSlug;
  const collectionDisplayName =
    activeCollection?.collectionName ||
    matchedBySlug?.collectionName ||
    decodedWorkspaceSlug
      .split(/[\s_]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // 1. Fetch guest queue
  const loadQueue = React.useCallback(async () => {
    if (!collectionName) return;
    setIsLoadingQueue(true);
    try {
      const filter = statusFilter === "all" ? undefined : statusFilter;
      const items = await guestChatApi.getQueue(collectionName, 1, 30, filter);
      setQueue(items);
      if (items.length > 0 && !activeItem && typeof window !== "undefined" && window.innerWidth >= 768) {
        setActiveItem(items[0]);
      }
    } catch (err) {
      console.error("Failed to load queue:", err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, [collectionName, statusFilter, activeItem]);

  React.useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Periodic Queue Polling (every 10 seconds, matching Flutter _periodicRefreshTimer)
  React.useEffect(() => {
    if (!collectionName) return;
    const interval = setInterval(() => {
      const filter = statusFilter === "all" ? undefined : statusFilter;
      guestChatApi.getQueue(collectionName, 1, 30, filter).then((items) => {
        if (items.length > 0) {
          setQueue(items);
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [collectionName, statusFilter]);

  // 2. Fetch session messages & run 3-second live stream polling (matching Flutter _messagePollingTimer)
  React.useEffect(() => {
    if (!activeItem?.sessionId || !collectionName) return;

    let isMounted = true;
    setIsLoadingMessages(true);

    const fetchSessionMsgs = async () => {
      const msgs = await guestChatApi.getSessionMessages(collectionName, activeItem.sessionId);
      if (isMounted) {
        setMessages(msgs);
        setIsLoadingMessages(false);
      }
    };

    fetchSessionMsgs();

    // 3-second live stream timer
    const streamInterval = setInterval(() => {
      guestChatApi.getSessionMessages(collectionName, activeItem.sessionId).then((msgs) => {
        if (isMounted && msgs.length > 0) {
          setMessages(msgs);
        }
      });
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(streamInterval);
    };
  }, [activeItem?.sessionId, collectionName]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Assign Guest to Current Agent
  const handleAssignToMe = async () => {
    if (!activeItem || !collectionName) return;
    setIsAssigning(true);
    toast.info(`Assigning ${activeItem.guestName} to your support desk...`);

    const result = await guestChatApi.assignToCurrentUser(collectionName, activeItem.id);
    setIsAssigning(false);

    if (result && result.sessionId) {
      toast.success("Guest assigned to you! Live support session opened.");
      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              sessionId: result.sessionId,
              sessionToken: result.sessionToken,
              queueStatus: "assigned",
              assignedUserId: user?.id,
            }
          : prev
      );
      loadQueue();
    } else {
      toast.error("Could not assign guest session. Please try again.");
    }
  };

  // 4. Send Message to Guest
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeItem || !collectionName || isSending) return;

    const text = inputText.trim();
    setInputText("");
    setIsSending(true);

    const tempMsg: GuestMessage = {
      id: Date.now(),
      sessionId: activeItem.sessionId,
      senderType: "agent",
      senderName: user?.fullName || "Support Desk",
      messageText: text,
      messageType: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    const sent = await guestChatApi.sendGuestMessage(
      collectionName,
      activeItem.sessionId,
      activeItem.sessionToken,
      text
    );
    setIsSending(false);

    if (sent) {
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? sent : m)));
    } else {
      toast.error("Failed to send message to applicant");
    }
  };

  // 5. End Session
  const handleEndSession = async () => {
    if (!activeItem || !collectionName || isEnding) return;
    setIsEnding(true);
    toast.info("Concluding customer support session...");

    const success = await guestChatApi.endGuestSession(collectionName, activeItem.sessionId);
    setIsEnding(false);

    if (success) {
      toast.success("Guest session resolved and closed successfully.");
      setActiveItem((prev) => (prev ? { ...prev, queueStatus: "completed" } : prev));
      loadQueue();
    } else {
      toast.error("Failed to conclude session.");
    }
  };

  const filteredQueue = queue.filter(
    (item) =>
      item.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.initialMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guestIdentifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-8.5rem)] flex flex-col bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xs overflow-hidden font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT PANEL: Helpdesk Queue (width: 380px) ───────────────────────── */}
        <aside
          className={cn(
            "border-r border-slate-200 bg-white flex flex-col shrink-0 w-full md:w-80 lg:w-96",
            activeItem ? "hidden md:flex" : "flex flex-1"
          )}
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                  {collectionDisplayName} Helpdesk
                </h2>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Customer care & live applicant queue</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadQueue}
              className="h-8 w-8 p-0 border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
              title="Refresh queue"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Filter Pills */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto">
            {["all", "waiting", "assigned", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize border transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket queue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Queue scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {isLoadingQueue ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs text-slate-400">Loading guest queue...</span>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-8 text-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Headphones className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">No tickets in this state</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Queue is clear for {collectionDisplayName}.
                </p>
              </div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = activeItem?.id === item.id;
                const isWaiting = item.queueStatus === "waiting";
                const isAssigned = item.queueStatus === "assigned";

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className={`w-full p-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/70 border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {item.guestName}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-semibold uppercase py-0 ${
                          isWaiting
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : isAssigned
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        }`}
                      >
                        {item.queueStatus}
                      </Badge>
                    </div>

                    <p className="font-medium text-xs text-slate-700 line-clamp-1 mb-1">
                      {item.initialMessage}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.guestIdentifier.slice(0, 16)}</span>
                      <span>{formatChatListTime(item.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT PANEL: Customer Care Room ────────────────────────────────── */}
        <main
          className={cn(
            "flex-1 flex flex-col bg-slate-50/50 min-w-0 overflow-hidden",
            !activeItem ? "hidden md:flex" : "flex"
          )}
        >
          {activeItem ? (
            <>
              {/* Header */}
              <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setActiveItem(null)}
                    className="md:hidden p-1.5 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                    title="Back to queue"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {activeItem.guestName}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border-indigo-200 py-0">
                        Session #{activeItem.sessionId || activeItem.id}
                      </Badge>
                      <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 py-0 gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>3s Live Stream</span>
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Identifier: {activeItem.guestIdentifier} · {activeItem.initialMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeItem.queueStatus === "waiting" ? (
                    <Button
                      size="sm"
                      onClick={handleAssignToMe}
                      disabled={isAssigning}
                      className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-2xs"
                    >
                      {isAssigning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      <span>Assign to Me</span>
                    </Button>
                  ) : activeItem.queueStatus !== "completed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEndSession}
                      disabled={isEnding}
                      className="h-8 px-3 text-xs border-slate-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                    >
                      {isEnding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>Resolve & End Session</span>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      Session Completed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                    <span className="text-xs text-slate-400">Connecting to session stream...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                      <Headphones className="h-7 w-7" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800">
                      Customer Session Opened
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Initial Request: &ldquo;{activeItem.initialMessage}&rdquo;
                    </p>
                    {activeItem.queueStatus === "waiting" && (
                      <Button
                        size="sm"
                        onClick={handleAssignToMe}
                        className="mt-4 text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Claim Ticket to Reply
                      </Button>
                    )}
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAgent = m.senderType === "agent";

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-end gap-2 max-w-[70%]">
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-2xs text-xs leading-relaxed ${
                              isAgent
                                ? "bg-indigo-600 text-white rounded-br-xs"
                                : "bg-white border border-slate-200 text-slate-900 rounded-bl-xs"
                            }`}
                          >
                            <span
                              className={`block font-bold text-[10px] mb-1 ${
                                isAgent ? "text-indigo-200" : "text-indigo-600"
                              }`}
                            >
                              {m.senderName}
                            </span>
                            <p className="whitespace-pre-wrap">{m.messageText}</p>
                            <span
                              className={`mt-1 block text-right text-[9px] ${
                                isAgent ? "text-indigo-200" : "text-slate-400"
                              }`}
                            >
                              {formatMessageTime(m.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${activeItem.guestName}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={activeItem.queueStatus === "completed"}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputText.trim() || isSending || activeItem.queueStatus === "completed"}
                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Reply</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Headphones className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">Select a ticket from the queue to start</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
