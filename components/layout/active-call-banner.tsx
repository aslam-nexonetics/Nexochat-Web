"use client";

import * as React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveCallBannerProps {
  channelName?: string;
  duration?: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isActive?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
  onEndCall?: () => void;
  onExpand?: () => void;
}

export function ActiveCallBanner({
  channelName = "Team Meeting",
  duration = "00:00",
  isMuted = false,
  isVideoEnabled = true,
  isActive = false,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onExpand,
}: ActiveCallBannerProps) {
  if (!isActive) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-slate-800 shadow-md animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{channelName}</span>
          <span className="text-slate-400">({duration})</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleMute}
          className={`h-7 px-2 text-xs rounded-md ${
            isMuted ? "bg-rose-500/20 text-rose-300" : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleVideo}
          className={`h-7 px-2 text-xs rounded-md ${
            !isVideoEnabled ? "bg-rose-500/20 text-rose-300" : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          {!isVideoEnabled ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onExpand}
          className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={onEndCall}
          className="h-7 px-2.5 text-xs rounded-md bg-rose-600 hover:bg-rose-700 text-white"
        >
          <PhoneOff className="h-3.5 w-3.5 mr-1" />
          End
        </Button>
      </div>
    </div>
  );
}
