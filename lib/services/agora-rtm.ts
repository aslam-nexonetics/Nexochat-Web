import { callApi } from "@/lib/api/call";

export interface RtmCallMessage {
  type:
    | "incoming_call"
    | "call_accepted"
    | "call_declined"
    | "call_ended"
    | "call_cancelled"
    | "call_invite";
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
  decline_reason?: string;
  timestamp?: string;
}

type MessageHandler = (msg: RtmCallMessage, rawPublisher: string) => void;

class AgoraRtmService {
  private rtmClient: any = null;
  private currentUserId: string | null = null;
  private isLoggedIn = false;
  private isConnecting = false;
  private messageHandlers: Set<MessageHandler> = new Set();
  private appId: string =
    process.env.NEXT_PUBLIC_AGORA_APP_ID || "6e2f5d3409d7453589014015a008273e";

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  public getIsReady(): boolean {
    return this.isLoggedIn && this.rtmClient !== null;
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Initialize and log in to Agora RTM v2
   */
  async initialize(userId: number, customAppId?: string): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const uidStr = userId.toString();
    if (this.isLoggedIn && this.currentUserId === uidStr) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;
    this.currentUserId = uidStr;
    const appId = customAppId || this.appId;

    try {
      // 1. Fetch RTM token from backend
      const rtmToken = await callApi.getRtmToken();

      // 2. Dynamically import Agora RTM
      const AgoraRTM = (await import("agora-rtm-sdk")).default;

      // Clean previous instance if any
      if (this.rtmClient) {
        try {
          await this.rtmClient.logout();
        } catch {
          // ignore
        }
        this.rtmClient = null;
        this.isLoggedIn = false;
      }

      // 3. Create RTM instance matching Flutter's useStringUserId: true
      const client = new AgoraRTM.RTM(appId, uidStr, {
        useStringUserId: true,
        logLevel: "warn",
      });

      // 4. Attach event listeners
      client.addEventListener("message", (event: any) => {
        this.handleRawMessage(event);
      });

      client.addEventListener("linkState", (event: any) => {
        if (event.currentState === "CONNECTED") {
          this.isLoggedIn = true;
          console.log("[Agora RTM] Connection link state: CONNECTED");
        } else if (event.currentState === "DISCONNECTED") {
          this.isLoggedIn = false;
          if (event.reason === "SAME_UID_LOGIN" || event.reason === "KICKED_OUT_BY_SERVER") {
            console.warn("[Agora RTM] Session disconnected: logged in on another client/device.");
          } else {
            console.warn(`[Agora RTM] Session disconnected: ${event.reason || "network dropped"}`);
          }
        }
      });

      client.addEventListener("token", () => {
        console.warn("Agora RTM token will expire, renewing...");
        this.renewToken();
      });

      // 5. Login
      await client.login({ token: rtmToken });

      this.rtmClient = client;
      this.isLoggedIn = true;
      console.log(`[Agora RTM] Logged in successfully as user ${uidStr}`);
      return true;
    } catch (err) {
      console.warn("[Agora RTM] Initialization failed:", err);
      this.isLoggedIn = false;
      this.rtmClient = null;
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  private async renewToken() {
    try {
      const newToken = await callApi.getRtmToken();
      if (this.rtmClient) {
        await this.rtmClient.renewToken(newToken);
      }
    } catch (e) {
      console.warn("[Agora RTM] Failed to renew token:", e);
    }
  }

  private handleRawMessage(event: any) {
    try {
      let rawText = "";
      if (typeof event.message === "string") {
        rawText = event.message;
      } else if (event.message instanceof Uint8Array) {
        rawText = new TextDecoder().decode(event.message);
      } else {
        return;
      }

      if (!rawText.trim()) return;

      const parsed = JSON.parse(rawText);
      const data = parsed.data || parsed;
      const type = parsed.type || data.type;

      if (!type) return;

      const callMsg: RtmCallMessage = {
        type,
        call_id: Number(data.call_id || data.callId || 0),
        channel_name: data.channel_name || data.channelName || "",
        call_type: data.call_type || data.callType || "audio",
        caller_id: Number(data.caller_id || data.callerId || event.publisher || 0),
        caller_name: data.caller_name || data.callerName || "User",
        token: data.token || data.rtc_token || data.rtcToken,
        rtc_token: data.rtc_token || data.token,
        app_id: data.app_id || data.appId || this.appId,
        collection_id: (data.collection_id || data.collectionId)?.toString(),
        collection_name: data.collection_name || data.collectionName,
        agora_uid: data.agora_uid ? Number(data.agora_uid) : undefined,
        decline_reason: data.decline_reason || data.declineReason,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      // Notify all registered handlers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(callMsg, event.publisher);
        } catch (hErr) {
          console.error("[Agora RTM] Error in message handler:", hErr);
        }
      });
    } catch (err) {
      console.warn("[Agora RTM] Failed to parse message:", err);
    }
  }

  /**
   * Send a peer-to-peer signaling message to another user
   */
  async sendPeerMessage(receiverId: number, message: Partial<RtmCallMessage>): Promise<boolean> {
    if (!this.rtmClient || !this.isLoggedIn) {
      if (this.currentUserId) {
        console.log("[Agora RTM] Attempting quick session restore before sending message...");
        try {
          await this.initialize(Number(this.currentUserId));
        } catch {
          // ignore
        }
      }
    }

    if (!this.rtmClient || !this.isLoggedIn) {
      console.warn("[Agora RTM] Cannot send peer message: client not logged in");
      return false;
    }

    try {
      const payload: Record<string, any> = {
        type: message.type,
        call_id: message.call_id,
        channel_name: message.channel_name,
        call_type: message.call_type,
        caller_id: message.caller_id,
        caller_name: message.caller_name,
        timestamp: message.timestamp || new Date().toISOString(),
      };

      if (message.token) payload.token = message.token;
      if (message.app_id) payload.app_id = message.app_id;
      if (message.collection_id) payload.collection_id = message.collection_id;
      if (message.collection_name) payload.collection_name = message.collection_name;
      if (message.agora_uid) payload.agora_uid = message.agora_uid;
      if (message.decline_reason) payload.decline_reason = message.decline_reason;

      // Wrap in { type, data } structure for full mobile parity
      const fullMessage = JSON.stringify({
        type: message.type,
        data: payload,
      });

      const peerChannel = receiverId.toString();

      await this.rtmClient.publish(peerChannel, fullMessage, {
        channelType: "USER",
        customType: "call_notification",
      });

      return true;
    } catch (err) {
      console.warn(`[Agora RTM] Failed to send peer message to ${receiverId}:`, err);
      return false;
    }
  }

  /**
   * Cleanly logout from Agora RTM
   */
  async logout(): Promise<void> {
    try {
      if (this.rtmClient && this.isLoggedIn) {
        await this.rtmClient.logout();
      }
    } catch (e) {
      console.warn("[Agora RTM] Error during logout:", e);
    } finally {
      this.rtmClient = null;
      this.isLoggedIn = false;
      this.currentUserId = null;
    }
  }
}

export const agoraRtmService = new AgoraRtmService();
