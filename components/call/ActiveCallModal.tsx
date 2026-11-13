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
  PictureInPicture2,
  SwitchCamera,
  Loader2,
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
    facingMode,
    isSwitchingCamera,
    switchCamera,
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
  }, [status, callType, isVideoOff, hasRemoteUser, remoteHasVideo, isMinimized]);

  if (status !== "calling" && status !== "connected") {
    return null;
  }

  const isCalling = status === "calling";
  const hasLocalMic = !!agoraRtcService.getLocalAudioTrack();

  const handlePictureInPicture = async () => {
    if (typeof document === "undefined") return;
    try {
      const videoEl = remoteVideoRef.current?.querySelector("video") ||
                      localVideoRef.current?.querySelector("video");
      if (videoEl && "requestPictureInPicture" in videoEl) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoEl.requestPictureInPicture();
        }
      }
    } catch (e) {
      console.warn("Picture-in-Picture error:", e);
    }
  };

  const initials =
    otherUserName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NX";

  return (
    <div
      className={`fixed inset-0 z-[95] items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-6 ${
        isMinimized ? "hidden" : "flex animate-in fade-in duration-200"
      }`}
    >
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
            {/* Picture-in-Picture button (video calls) */}
            {callType === "video" && (
              <Button
                variant="outline"
                size="icon"
                onClick={handlePictureInPicture}
                className="h-9 w-9 rounded-full bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer shadow-sm"
                title="Pop out into Picture-in-Picture window"
              >
                <PictureInPicture2 className="h-4 w-4" />
              </Button>
            )}

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
          {/* Remote Video Track View - permanently mounted to preserve WebRTC stream */}
          <div
            ref={remoteVideoRef}
            className={`w-full h-full object-cover ${
              callType === "video" && remoteHasVideo ? "block" : "hidden"
            }`}
            style={{ minHeight: "100%", minWidth: "100%" }}
          />

          {/* Audio Call / Remote Camera Off Avatar View */}
          {(!remoteHasVideo || callType !== "video") && (
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
              {isVideoOff && (
                <div className="flex flex-col items-center text-slate-400 gap-1">
                  <VideoOff className="h-6 w-6" />
                  <span className="text-[10px]">Camera Off</span>
                </div>
              )}
              <div
                ref={localVideoRef}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  facingMode === "user" ? "-scale-x-100" : ""
                } ${isVideoOff ? "hidden" : "block"}`}
              />
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-white">
                You
              </div>
              {!isVideoOff && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    switchCamera();
                  }}
                  disabled={isSwitchingCamera}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90 cursor-pointer shadow-md"
                  title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
                >
                  {isSwitchingCamera ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SwitchCamera className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex items-center justify-center gap-3 sm:gap-5">
          {/* Mute Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={hasLocalMic ? toggleMute : undefined}
            className={`h-12 w-12 rounded-full transition-colors shadow-md ${
              !hasLocalMic
                ? "bg-slate-800/40 border-slate-700/60 text-slate-500 cursor-not-allowed"
                : isMuted
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30 cursor-pointer"
                : "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 cursor-pointer"
            }`}
            title={
              !hasLocalMic
                ? "No microphone detected on this device (listening only)"
                : isMuted
                ? "Unmute Microphone"
                : "Mute Microphone"
            }
          >
            {!hasLocalMic || isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
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

          {/* Switch Camera Button (Video Calls only) */}
          {callType === "video" && (
            <Button
              variant="outline"
              size="icon"
              onClick={switchCamera}
              disabled={isVideoOff || isSwitchingCamera}
              className={`h-12 w-12 rounded-full cursor-pointer transition-colors shadow-md ${
                isVideoOff
                  ? "bg-slate-800/40 border-slate-700/60 text-slate-600 cursor-not-allowed"
                  : "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 active:scale-95"
              }`}
              title={
                isVideoOff
                  ? "Turn on video to switch camera"
                  : facingMode === "user"
                  ? "Switch to back camera"
                  : "Switch to front camera"
              }
            >
              {isSwitchingCamera ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
              ) : (
                <SwitchCamera className="h-5 w-5" />
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
