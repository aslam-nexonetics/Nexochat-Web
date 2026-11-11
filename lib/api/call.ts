import { apiClient } from "@/lib/api/client";

export interface AgoraTokenResponse {
  token: string;
  channel_name: string;
  uid: number;
  expires_at?: string;
  app_id?: string;
}

export interface RtmTokenResponse {
  token: string;
  app_id?: string;
  user_id?: string;
}

export interface InitiateCallResponse {
  call_id?: number;
  id?: number;
  channel_name: string;
  call_type: "audio" | "video";
  status: string;
  notification_data?: {
    call_id: number;
    channel_name: string;
    call_type: "audio" | "video";
    caller_id: number;
    caller_name: string;
    token?: string;
    rtc_token?: string;
    app_id?: string;
    collection_id?: string;
    collection_name?: string;
    agora_uid?: number;
    timestamp?: string;
  };
  token?: string;
  rtc_token?: string;
  app_id?: string;
}

export interface CallRecord {
  id: number;
  channel_name: string;
  call_type: string;
  host_id: number;
  status: string;
  created_at: string;
  ended_at?: string | null;
  participants?: number[];
}

export const callApi = {
  /**
   * Generate an Agora RTC token for joining an audio/video channel
   */
  async generateRtcToken(
    channelName: string,
    uid: number,
    role: "publisher" | "subscriber" = "publisher"
  ): Promise<AgoraTokenResponse> {
    const res = await apiClient.post<AgoraTokenResponse>("/agora-router/rtc/token", {
      channel_name: channelName,
      uid,
      role,
    });
    return res;
  },

  /**
   * Get an Agora RTM token for signaling and call invitations
   */
  async getRtmToken(): Promise<string> {
    const res = await apiClient.get<{ token: string; app_id?: string }>("/agora-router/rtm/token");
    return res.token;
  },

  /**
   * Initiate a call with another user
   */
  async initiateCall(params: {
    receiverId: number;
    callType: "audio" | "video";
    collectionName: string;
    collectionId?: string;
  }): Promise<InitiateCallResponse> {
    const query = new URLSearchParams({ collection_name: params.collectionName });
    const payload: Record<string, any> = {
      receiver_id: params.receiverId,
      call_type: params.callType,
    };
    if (params.collectionId) {
      payload.collection_id = params.collectionId;
    }

    const res = await apiClient.post<InitiateCallResponse>(
      `/agora-router/call/initiate?${query.toString()}`,
      payload
    );
    return res;
  },

  /**
   * Respond to an incoming call (accept or decline)
   */
  async respondToCall(params: {
    callId: number;
    action: "accept" | "decline";
    declineReason?: string;
  }): Promise<void> {
    await apiClient.post("/agora-router/call/respond", {
      call_id: params.callId,
      action: params.action,
      ...(params.declineReason ? { decline_reason: params.declineReason } : {}),
    });
  },

  /**
   * End an active call session
   */
  async endCall(callId: number): Promise<void> {
    try {
      await apiClient.post(`/agora-router/call/${callId}/end`);
    } catch (e: any) {
      if (e?.status === 404) return;
      console.warn("Call end notification returned an error:", e);
    }
  },

  /**
   * Cancel an outgoing call before the receiver answers
   */
  async cancelCall(callId: number): Promise<void> {
    try {
      await apiClient.post(`/agora-router/call/${callId}/cancel`);
    } catch (e: any) {
      if (e?.status === 404) return;
      console.warn("Call cancel notification returned an error:", e);
    }
  },

  /**
   * Join an Agora call session on the backend
   */
  async joinCall(channelName: string): Promise<CallRecord> {
    return apiClient.post<CallRecord>("/agora-router/call/join", {
      channel_name: channelName,
    });
  },

  /**
   * Leave an Agora call session on the backend
   */
  async leaveCall(channelName: string): Promise<void> {
    try {
      await apiClient.post(`/agora-router/call/leave?channel_name=${encodeURIComponent(channelName)}`);
    } catch (e: any) {
      if (e?.status === 404) return;
      console.warn("Call leave notification returned an error:", e);
    }
  },

  /**
   * Fetch active calls for the current user
   */
  async getActiveCalls(): Promise<CallRecord[]> {
    const res = await apiClient.get<{ calls: CallRecord[] }>("/agora-router/call/active");
    return res.calls || [];
  },

  /**
   * Fetch call metadata by channel name
   */
  async getCallInfo(channelName: string): Promise<CallRecord> {
    return apiClient.get<CallRecord>(`/agora-router/call/${encodeURIComponent(channelName)}`);
  },
};
