/**
 * Real-time WebSocket Client for Nexonetics Collection Chat
 * Matches Flutter's ChatSocketDataSourceImpl
 */

export interface SocketMessageEvent {
  type: "new_message";
  message: {
    id: number;
    chat_id?: number;
    channel_id?: number;
    sender_id?: number;
    user_id?: number;
    sender_name?: string;
    sender_avatar?: string | null;
    message_text?: string;
    content?: string;
    text?: string;
    message_type?: "text" | "image" | "file";
    created_at?: string;
  };
}

export interface SocketTypingEvent {
  type: "typing_indicator";
  chat_id: number;
  user_id: number;
  username: string;
  is_typing: boolean;
}

export type SocketEvent = SocketMessageEvent | SocketTypingEvent | { type: string; [key: string]: any };

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private activeRoomId: number | null = null;
  private listeners: Set<(event: SocketEvent) => void> = new Set();
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  private isExplicitlyClosed = false;
  private currentUrl = "";

  constructor(private collectionName: string) {}

  public subscribe(listener: (event: SocketEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onStatusChange(listener: (connected: boolean) => void) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((l) => l(connected));
  }

  public async connect(): Promise<void> {
    if (typeof window === "undefined") return;

    this.isExplicitlyClosed = false;

    try {
      // 1. Fetch live WebSocket URL from backend
      const res = await fetch(`/api/proxy/chat/${this.collectionName}/chat/websocket/url/`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.warn(`[ChatSocket] Could not obtain WebSocket URL for ${this.collectionName}`);
        this.scheduleReconnect();
        return;
      }

      const data = await res.json();
      const rawWsUrl = data.websocket_url;
      if (!rawWsUrl) {
        this.scheduleReconnect();
        return;
      }

      // Convert https to wss per Flutter implementation
      const wsUrl = rawWsUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
      this.currentUrl = wsUrl;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[ChatSocket] Connected to ${this.collectionName} WebSocket`);
        this.reconnectAttempts = 0;
        this.notifyStatus(true);
        this.startHeartbeat();

        // Rejoin active room if set
        if (this.activeRoomId !== null) {
          this.joinRoom(this.activeRoomId);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as SocketEvent;
          this.listeners.forEach((l) => l(parsed));
        } catch (err) {
          console.warn("[ChatSocket] Failed to parse message:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[ChatSocket] WebSocket encountered error:", err);
        this.notifyStatus(false);
      };

      this.ws.onclose = () => {
        console.log("[ChatSocket] WebSocket closed");
        this.notifyStatus(false);
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.warn("[ChatSocket] Connection error:", err);
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  public joinRoom(roomId: number) {
    this.activeRoomId = roomId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "join_room", room_id: String(roomId) }));
    }
  }

  public leaveRoom(roomId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "leave_room", room_id: String(roomId) }));
    }
    if (this.activeRoomId === roomId) {
      this.activeRoomId = null;
    }
  }

  public sendTyping(roomId: number, isTyping: boolean, userId: number, username: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "typing_indicator",
          chat_id: roomId,
          user_id: userId,
          username,
          is_typing: isTyping,
        })
      );
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString(),
          })
        );
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isExplicitlyClosed) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }
}
