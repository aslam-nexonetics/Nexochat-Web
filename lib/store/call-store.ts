import { create } from "zustand";
import { callApi } from "@/lib/api/call";
import { agoraRtcService } from "@/lib/services/agora-rtc";
import { agoraRtmService, RtmCallMessage } from "@/lib/services/agora-rtm";
import { callSoundService } from "@/lib/services/call-sound";
import { toast } from "sonner";

export type CallStatus = "idle" | "calling" | "incoming" | "connected" | "ending";

export interface CallStoreState {
  status: CallStatus;
  callId: number | null;
  channelName: string | null;
  callType: "audio" | "video";
  collectionName: string;
  collectionId: string | null;
  otherUserId: number | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserRole: string | null;
  rtcToken: string | null;
  appId: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isMinimized: boolean;
  callDuration: number;
  hasRemoteUser: boolean;
  remoteUid: number | null;
  remoteHasVideo: boolean;

  // Actions
  initiateCall: (params: {
    receiverId: number;
    receiverName: string;
    receiverAvatar?: string | null;
    receiverRole?: string | null;
    callType: "audio" | "video";
    collectionName: string;
    collectionId?: string;
  }) => Promise<void>;

  handleIncomingCall: (message: RtmCallMessage) => void;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: (reason?: string) => Promise<void>;
  cancelOutgoingCall: () => Promise<void>;
  endActiveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleMinimize: () => void;
  setIsMinimized: (val: boolean) => void;
  setRemoteHasVideo: (val: boolean) => void;
}

let callTimerInterval: NodeJS.Timeout | null = null;
let noAnswerTimeout: NodeJS.Timeout | null = null;

const DEFAULT_AGORA_APP_ID =
  process.env.NEXT_PUBLIC_AGORA_APP_ID || "6e2f5d3409d7453589014015a008273e";

export const useCallStore = create<CallStoreState>((set, get) => ({
  status: "idle",
  callId: null,
  channelName: null,
  callType: "audio",
  collectionName: "general",
  collectionId: null,
  otherUserId: null,
  otherUserName: "",
  otherUserAvatar: null,
  otherUserRole: null,
  rtcToken: null,
  appId: DEFAULT_AGORA_APP_ID,
  isMuted: false,
  isVideoOff: false,
  isMinimized: false,
  callDuration: 0,
  hasRemoteUser: false,
  remoteUid: null,
  remoteHasVideo: false,

  setRemoteHasVideo: (val: boolean) => set({ remoteHasVideo: val }),
  setIsMinimized: (val: boolean) => set({ isMinimized: val }),

  initiateCall: async (params) => {
    const currentStatus = get().status;
    if (currentStatus !== "idle") {
      toast.warning("Another call is currently active or ringing");
      return;
    }

    set({
      status: "calling",
      callId: null,
      channelName: null,
      callType: params.callType,
      collectionName: params.collectionName,
      collectionId: params.collectionId || null,
      otherUserId: params.receiverId,
      otherUserName: params.receiverName,
      otherUserAvatar: params.receiverAvatar || null,
      otherUserRole: params.receiverRole || null,
      isMuted: false,
      isVideoOff: false,
      isMinimized: false,
      callDuration: 0,
      hasRemoteUser: false,
      remoteUid: null,
      remoteHasVideo: false,
    });

    // Start outgoing ringback audio tone
    callSoundService.startOutgoingRinging();

    // 45 seconds timeout if no answer
    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    noAnswerTimeout = setTimeout(() => {
      if (get().status === "calling") {
        toast.info(`${params.receiverName} is unavailable`);
        get().cancelOutgoingCall();
      }
    }, 45000);

    try {
      // 1. Call backend to initiate call session
      const initiateRes = await callApi.initiateCall({
        receiverId: params.receiverId,
        callType: params.callType,
        collectionName: params.collectionName,
        collectionId: params.collectionId,
      });

      const callId = initiateRes.call_id || initiateRes.id || 0;
      const channelName =
        initiateRes.channel_name ||
        initiateRes.notification_data?.channel_name ||
        `call_${params.collectionName}_${callId}`;
      const appId =
        initiateRes.app_id ||
        initiateRes.notification_data?.app_id ||
        DEFAULT_AGORA_APP_ID;

      let rtcToken =
        initiateRes.token ||
        initiateRes.rtc_token ||
        initiateRes.notification_data?.token ||
        initiateRes.notification_data?.rtc_token ||
        "";

      // If token not directly returned, request from /rtc/token
      const currentUidStr = agoraRtmService.getCurrentUserId() || "0";
      const currentNumericUid = parseInt(currentUidStr, 10) || 0;

      if (!rtcToken) {
        try {
          const tokenRes = await callApi.generateRtcToken(
            channelName,
            currentNumericUid,
            "publisher"
          );
          rtcToken = tokenRes.token;
        } catch (tErr) {
          console.warn("RTC token fetch error:", tErr);
        }
      }

      set({
        callId,
        channelName,
        rtcToken,
        appId,
      });

      // 2. Send RTM peer message to receiver (matching Flutter's incoming_call event)
      await agoraRtmService.sendPeerMessage(params.receiverId, {
        type: "incoming_call",
        call_id: callId,
        channel_name: channelName,
        call_type: params.callType,
        caller_id: currentNumericUid,
        caller_name: "Me",
        token: rtcToken,
        app_id: appId,
        collection_name: params.collectionName,
        collection_id: params.collectionId,
      });

      // 3. Join the Agora RTC channel in background to be ready when remote answers
      await agoraRtcService.join({
        appId,
        channelName,
        token: rtcToken,
        uid: currentNumericUid,
        callType: params.callType,
        onRemoteUserJoined: (remoteUid) => {
          set({ hasRemoteUser: true, remoteUid });
        },
        onRemoteUserLeft: () => {
          set({ hasRemoteUser: false, remoteUid: null, remoteHasVideo: false });
        },
        onRemoteVideoTrack: (track) => {
          set({ remoteHasVideo: !!track });
        },
      });
    } catch (err: any) {
      console.error("Failed to initiate call:", err);
      toast.error(err?.message || "Failed to start call");
      callSoundService.stopAll();
      set({ status: "idle" });
      if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    }
  },

  handleIncomingCall: (message: RtmCallMessage) => {
    const state = get();
    // If already in a call, notify caller that line is busy
    if (state.status !== "idle") {
      agoraRtmService.sendPeerMessage(message.caller_id, {
        type: "call_declined",
        call_id: message.call_id,
        channel_name: message.channel_name,
        call_type: message.call_type,
        caller_id: Number(agoraRtmService.getCurrentUserId() || 0),
        caller_name: "User",
        decline_reason: "busy",
      });
      return;
    }

    set({
      status: "incoming",
      callId: message.call_id,
      channelName: message.channel_name,
      callType: message.call_type,
      collectionName: message.collection_name || "general",
      collectionId: message.collection_id || null,
      otherUserId: message.caller_id,
      otherUserName: message.caller_name || "Incoming Caller",
      rtcToken: message.token || message.rtc_token || null,
      appId: message.app_id || DEFAULT_AGORA_APP_ID,
      isMuted: false,
      isVideoOff: false,
      isMinimized: false,
      callDuration: 0,
      hasRemoteUser: false,
      remoteUid: message.caller_id,
      remoteHasVideo: false,
    });

    // Start incoming ringtone
    callSoundService.startIncomingRinging();

    // Browser Notification if supported and permitted
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(`Incoming ${message.call_type} call`, {
          body: `${message.caller_name || "Someone"} is calling you`,
          icon: "/icon.png",
        });
      }
    }
  },

  acceptIncomingCall: async () => {
    const state = get();
    if (state.status !== "incoming" || !state.callId || !state.channelName) {
      return;
    }

    callSoundService.stopAll();
    callSoundService.playCallConnected();

    set({ status: "connected" });

    const currentUidStr = agoraRtmService.getCurrentUserId() || "0";
    const currentNumericUid = parseInt(currentUidStr, 10) || 0;

    // 1. Notify caller via RTM
    if (state.otherUserId) {
      await agoraRtmService.sendPeerMessage(state.otherUserId, {
        type: "call_accepted",
        call_id: state.callId,
        channel_name: state.channelName,
        call_type: state.callType,
        caller_id: currentNumericUid,
        caller_name: "Me",
        agora_uid: currentNumericUid,
      });
    }

    // 2. Notify backend of acceptance
    try {
      await callApi.respondToCall({
        callId: state.callId,
        action: "accept",
      });
    } catch (bErr) {
      console.warn("Backend accept response error (continuing RTC):", bErr);
    }

    // 3. Ensure we have RTC token
    let rtcToken = state.rtcToken;
    if (!rtcToken) {
      try {
        const tokenRes = await callApi.generateRtcToken(
          state.channelName,
          currentNumericUid,
          "publisher"
        );
        rtcToken = tokenRes.token;
        set({ rtcToken });
      } catch (tErr) {
        console.warn("Failed to generate RTC token for incoming call:", tErr);
      }
    }

    // 4. Join Agora RTC channel
    try {
      await agoraRtcService.join({
        appId: state.appId || DEFAULT_AGORA_APP_ID,
        channelName: state.channelName,
        token: rtcToken || "",
        uid: currentNumericUid,
        callType: state.callType,
        onRemoteUserJoined: (uid) => {
          set({ hasRemoteUser: true, remoteUid: uid });
        },
        onRemoteUserLeft: () => {
          set({ hasRemoteUser: false, remoteUid: null, remoteHasVideo: false });
        },
        onRemoteVideoTrack: (track) => {
          set({ remoteHasVideo: !!track });
        },
      });

      // 5. Start call timer
      if (callTimerInterval) clearInterval(callTimerInterval);
      callTimerInterval = setInterval(() => {
        set((s) => ({ callDuration: s.callDuration + 1 }));
      }, 1000);
    } catch (rtcErr: any) {
      console.error("Failed to join Agora channel on accept:", rtcErr);
      toast.error("Could not establish media stream");
      get().endActiveCall();
    }
  },

  declineIncomingCall: async (reason = "declined") => {
    const state = get();
    const callId = state.callId;
    const callerId = state.otherUserId;

    callSoundService.stopAll();
    set({ status: "idle" });

    if (callerId && callId) {
      const currentUidStr = agoraRtmService.getCurrentUserId() || "0";
      agoraRtmService.sendPeerMessage(callerId, {
        type: "call_declined",
        call_id: callId,
        channel_name: state.channelName || "",
        call_type: state.callType,
        caller_id: parseInt(currentUidStr, 10) || 0,
        caller_name: "Me",
        decline_reason: reason,
      });
    }

    if (callId) {
      try {
        await callApi.respondToCall({
          callId,
          action: "decline",
          declineReason: reason,
        });
      } catch (err) {
        console.warn("Decline API call returned:", err);
      }
    }
  },

  cancelOutgoingCall: async () => {
    const state = get();
    const callId = state.callId;
    const receiverId = state.otherUserId;

    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    callSoundService.stopAll();

    if (receiverId && callId) {
      const currentUidStr = agoraRtmService.getCurrentUserId() || "0";
      agoraRtmService.sendPeerMessage(receiverId, {
        type: "call_cancelled",
        call_id: callId,
        channel_name: state.channelName || "",
        call_type: state.callType,
        caller_id: parseInt(currentUidStr, 10) || 0,
        caller_name: "Me",
      });
    }

    if (callId) {
      callApi.cancelCall(callId);
    }

    await agoraRtcService.leave();
    set({ status: "idle", callId: null, channelName: null });
  },

  endActiveCall: async () => {
    const state = get();
    const callId = state.callId;
    const otherUserId = state.otherUserId;
    const channelName = state.channelName;

    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
    }

    callSoundService.stopAll();
    callSoundService.playCallEnded();

    set({ status: "ending" });

    if (otherUserId && callId) {
      const currentUidStr = agoraRtmService.getCurrentUserId() || "0";
      agoraRtmService.sendPeerMessage(otherUserId, {
        type: "call_ended",
        call_id: callId,
        channel_name: channelName || "",
        call_type: state.callType,
        caller_id: parseInt(currentUidStr, 10) || 0,
        caller_name: "Me",
      });
    }

    if (callId) {
      callApi.endCall(callId);
    }
    if (channelName) {
      callApi.leaveCall(channelName);
    }

    await agoraRtcService.leave();

    set({
      status: "idle",
      callId: null,
      channelName: null,
      rtcToken: null,
      otherUserId: null,
      otherUserName: "",
      otherUserAvatar: null,
      isMuted: false,
      isVideoOff: false,
      isMinimized: false,
      callDuration: 0,
      hasRemoteUser: false,
      remoteUid: null,
      remoteHasVideo: false,
    });
  },

  toggleMute: () => {
    const currentMuted = get().isMuted;
    const nextMuted = !currentMuted;
    agoraRtcService.setMuted(nextMuted);
    set({ isMuted: nextMuted });
  },

  toggleVideo: () => {
    const currentOff = get().isVideoOff;
    const nextOff = !currentOff;
    agoraRtcService.setVideoEnabled(!nextOff);
    set({ isVideoOff: nextOff });
  },

  toggleMinimize: () => {
    set((s) => ({ isMinimized: !s.isMinimized }));
  },
}));

// Setup global RTM message listener to dispatch call events into useCallStore
if (typeof window !== "undefined") {
  agoraRtmService.onMessage((msg, publisher) => {
    const store = useCallStore.getState();

    switch (msg.type) {
      case "incoming_call":
      case "call_invite":
        store.handleIncomingCall(msg);
        break;

      case "call_accepted":
        if (store.status === "calling") {
          if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
          callSoundService.stopAll();
          callSoundService.playCallConnected();
          useCallStore.setState({ status: "connected" });

          if (callTimerInterval) clearInterval(callTimerInterval);
          callTimerInterval = setInterval(() => {
            useCallStore.setState((s) => ({ callDuration: s.callDuration + 1 }));
          }, 1000);
        }
        break;

      case "call_declined":
        if (store.status === "calling") {
          if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
          callSoundService.stopAll();
          callSoundService.playCallEnded();
          toast.info(
            msg.decline_reason === "busy"
              ? "User is currently busy on another call"
              : "Call declined"
          );
          agoraRtcService.leave();
          useCallStore.setState({ status: "idle" });
        }
        break;

      case "call_cancelled":
        if (store.status === "incoming") {
          callSoundService.stopAll();
          toast.info("Caller cancelled the call");
          useCallStore.setState({ status: "idle" });
        }
        break;

      case "call_ended":
        if (store.status === "connected" || store.status === "calling" || store.status === "incoming") {
          if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
          if (callTimerInterval) {
            clearInterval(callTimerInterval);
            callTimerInterval = null;
          }
          callSoundService.stopAll();
          callSoundService.playCallEnded();
          toast.info("Call ended");
          agoraRtcService.leave();
          useCallStore.setState({
            status: "idle",
            callId: null,
            channelName: null,
            isMinimized: false,
            callDuration: 0,
            hasRemoteUser: false,
            remoteUid: null,
            remoteHasVideo: false,
          });
        }
        break;

      default:
        break;
    }
  });
}
