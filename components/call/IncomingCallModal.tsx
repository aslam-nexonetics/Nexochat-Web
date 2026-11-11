"use client";

import React from "react";
import { useCallStore } from "@/lib/store/call-store";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IncomingCallModal() {
  const {
    status,
    otherUserName,
    otherUserAvatar,
    callType,
    acceptIncomingCall,
    declineIncomingCall,
  } = useCallStore();

  if (status !== "incoming") return null;

  const initials =
    otherUserName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NX";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center text-white shadow-2xl flex flex-col items-center">
        {/* Pulsing ring around avatar */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="absolute h-24 w-24 rounded-full bg-indigo-500/30 animate-pulse" />
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-slate-800 overflow-hidden">
            {otherUserAvatar ? (
              <img
                src={otherUserAvatar}
                alt={otherUserName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>

        {/* Caller Info */}
        <div className="space-y-1 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {callType === "video" ? (
              <>
                <Video className="h-3.5 w-3.5 text-indigo-400" />
                <span>Incoming Video Call</span>
              </>
            ) : (
              <>
                <Phone className="h-3.5 w-3.5 text-indigo-400" />
                <span>Incoming Voice Call</span>
              </>
            )}
          </span>
          <h3 className="text-xl font-bold tracking-tight text-white pt-2">
            {otherUserName}
          </h3>
          <p className="text-xs text-slate-400 animate-pulse">
            Calling you right now...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => declineIncomingCall("declined")}
              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/30 cursor-pointer active:scale-95 transition-transform"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </Button>
            <span className="text-[11px] font-medium text-slate-400">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <Button
              size="icon"
              onClick={() => acceptIncomingCall()}
              className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 ring-4 ring-emerald-500/20 cursor-pointer active:scale-95 transition-transform animate-bounce"
            >
              {callType === "video" ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <Phone className="h-6 w-6 text-white" />
              )}
            </Button>
            <span className="text-[11px] font-medium text-emerald-400">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
