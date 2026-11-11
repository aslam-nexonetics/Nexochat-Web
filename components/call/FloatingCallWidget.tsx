"use client";

import React from "react";
import { useCallStore } from "@/lib/store/call-store";
import { Mic, MicOff, PhoneOff, Maximize2, Video, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function FloatingCallWidget() {
  const {
    status,
    callType,
    otherUserName,
    otherUserAvatar,
    isMuted,
    isMinimized,
    callDuration,
    toggleMute,
    toggleMinimize,
    endActiveCall,
    cancelOutgoingCall,
  } = useCallStore();

  if ((status !== "calling" && status !== "connected") || !isMinimized) {
    return null;
  }

  const isCalling = status === "calling";
  const initials =
    otherUserName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NX";

  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-white ring-1 ring-white/10">
        {/* Avatar */}
        <div className="relative h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow">
          {otherUserAvatar ? (
            <img
              src={otherUserAvatar}
              alt={otherUserName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
          {status === "connected" && (
            <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          )}
        </div>

        {/* Info & Timer */}
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            {callType === "video" ? (
              <Video className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            ) : (
              <Phone className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            )}
            <h4 className="font-bold text-xs text-white truncate max-w-[120px]">
              {otherUserName}
            </h4>
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            {isCalling ? (
              <span className="text-amber-400 animate-pulse">Ringing...</span>
            ) : (
              <span className="text-emerald-400">{formatSeconds(callDuration)}</span>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={`h-8 w-8 rounded-full ${
              isMuted
                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMinimize}
            className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
            title="Maximize call window"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={isCalling ? cancelOutgoingCall : endActiveCall}
            className="h-8 w-8 rounded-full bg-red-600 hover:bg-red-700 text-white shadow"
            title="End Call"
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
