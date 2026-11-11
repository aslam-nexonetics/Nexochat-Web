"use client";

import React, { useEffect, useRef } from "react";
import { useCallStore } from "@/lib/store/call-store";
import { agoraRtcService } from "@/lib/services/agora-rtc";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Minus,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ActiveCallModal() {
  const {
    status,
    callType,
    otherUserName,
    otherUserAvatar,
    otherUserRole,
    isMuted,
    isVideoOff,
    isMinimized,
    callDuration,
    hasRemoteUser,
    remoteHasVideo,
    toggleMute,
    toggleVideo,
    toggleMinimize,
    endActiveCall,
    cancelOutgoingCall,
  } = useCallStore();

  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  // Attach local and remote video tracks to DOM elements
  useEffect(() => {
    if (status === "calling" || status === "connected") {
      if (localVideoRef.current && callType === "video" && !isVideoOff) {
        agoraRtcService.attachLocalVideo(localVideoRef.current);
      }
      if (remoteVideoRef.current && callType === "video") {
        agoraRtcService.attachRemoteVideo(remoteVideoRef.current);
      }
    }
  }, [status, callType, isVideoOff, hasRemoteUser, remoteHasVideo]);

  if ((status !== "calling" && status !== "connected") || isMinimized) {
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
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 p-2 sm:p-6">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[720px] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Floating Bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/80 flex items-center justify-center font-bold text-sm shadow-md overflow-hidden">
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{otherUserName}</h3>
                {otherUserRole && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {otherUserRole}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {isCalling ? (
                  <span className="animate-pulse text-amber-400">Ringing...</span>
                ) : (
                  <span className="text-emerald-400 font-mono">
                    {formatSeconds(callDuration)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimize button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMinimize}
              className="h-9 w-9 rounded-full bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer shadow-sm"
              title="Minimize call to floating widget"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Video / Audio Canvas */}
        <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {callType === "video" && remoteHasVideo ? (
            /* Remote Video Track View */
            <div
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              style={{ minHeight: "100%", minWidth: "100%" }}
            />
          ) : (
            /* Audio Call / Remote Camera Off Avatar View */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="relative">
                {status === "connected" && (
                  <div className="absolute -inset-4 rounded-full bg-emerald-500/10 animate-ping" />
                )}
                {isCalling && (
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-pulse" />
                )}
                <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-2xl ring-4 ring-slate-800 overflow-hidden">
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

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {otherUserName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {isCalling
                    ? "Calling..."
                    : callType === "video"
                    ? "Camera is turned off"
                    : "Audio Call in Progress"}
                </p>
              </div>

              {/* Acoustic Wave Animation when Connected */}
              {status === "connected" && (
                <div className="flex items-center gap-1.5 h-6 pt-2">
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_100ms] h-3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] h-6" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_400ms] h-5" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_150ms] h-3" />
                </div>
              )}
            </div>
          )}

          {/* Local Camera Picture-in-Picture Preview (for video calls) */}
          {callType === "video" && (
            <div
              className={`absolute bottom-24 right-4 z-20 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl overflow-hidden transition-all ${
                isVideoOff ? "flex items-center justify-center" : ""
              }`}
            >
              {isVideoOff ? (
                <div className="flex flex-col items-center text-slate-400 gap-1">
                  <VideoOff className="h-6 w-6" />
                  <span className="text-[10px]">Camera Off</span>
                </div>
              ) : (
                <div
                  ref={localVideoRef}
                  className="w-full h-full object-cover -scale-x-100"
                />
              )}
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-white">
                You
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex items-center justify-center gap-4 sm:gap-6">
          {/* Mute Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className={`h-12 w-12 rounded-full cursor-pointer transition-colors shadow-md ${
              isMuted
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
                : "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          {/* Toggle Camera Button (Video Calls only) */}
          {callType === "video" && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVideo}
              className={`h-12 w-12 rounded-full cursor-pointer transition-colors shadow-md ${
                isVideoOff
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
                  : "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700"
              }`}
              title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
            >
              {isVideoOff ? (
                <VideoOff className="h-5 w-5" />
              ) : (
                <VideoIcon className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* End / Hang Up Call */}
          <Button
            variant="destructive"
            size="icon"
            onClick={isCalling ? cancelOutgoingCall : endActiveCall}
            className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-xl shadow-red-950/40 cursor-pointer active:scale-95 transition-transform"
            title={isCalling ? "Cancel Call" : "End Call"}
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
