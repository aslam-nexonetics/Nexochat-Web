import { create } from "zustand";

export interface ActiveCall {
  channelName: string;
  callType: "audio" | "video";
  collectionName: string;
  calleeId: number;
  calleeName: string;
  startedAt: string;
  status: "calling" | "connected" | "ended";
}

interface CallState {
  activeCall: ActiveCall | null;
  isMuted: boolean;
  isVideoOff: boolean;

  startCall: (call: {
    channelName: string;
    callType: "audio" | "video";
    collectionName: string;
    calleeId: number;
    calleeName: string;
  }) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  isMuted: false,
  isVideoOff: false,

  startCall: (call) =>
    set({
      activeCall: {
        ...call,
        startedAt: new Date().toISOString(),
        status: "calling",
      },
    }),

  endCall: () => set({ activeCall: null, isMuted: false, isVideoOff: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
}));
