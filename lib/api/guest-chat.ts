import { apiClient } from "@/lib/api/client";

export interface GuestQueueItem {
  id: number;
  sessionId: number;
  sessionToken: string;
  guestIdentifier: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string | null;
  initialMessage: string;
  priority: number;
  queueStatus: "waiting" | "assigned" | "completed" | string;
  assignedUserId?: number | null;
  assignedUser?: {
    id: number;
    username: string;
    fullName: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuestMessage {
  id: number;
  sessionId: number;
  senderType: "guest" | "agent" | "system";
  senderName: string;
  messageText: string;
  messageType: "text" | "image" | "file";
  createdAt: string;
}

export const guestChatApi = {
  async getQueue(collectionName: string, page = 1, size = 20, status?: string): Promise<GuestQueueItem[]> {
    try {
      const statusParam = status ? `&status=${status}` : "";
      const res = await apiClient.get<any>(
        `/guest-chat/${collectionName}/guest/queue?page=${page}&size=${size}${statusParam}`
      );

      const rawList = res?.data || (Array.isArray(res) ? res : []);
      if (!Array.isArray(rawList)) return [];

      return rawList.map((item: any) => ({
        id: item.id,
        sessionId: item.session_id,
        sessionToken: item.session_token || "",
        guestIdentifier: item.guest_identifier || "",
        guestName: item.guest_name || "Guest Applicant",
        guestEmail: item.guest_email || "",
        guestPhone: item.guest_phone,
        initialMessage: item.initial_message || "Inquiry regarding application",
        priority: item.priority || 1,
        queueStatus: item.queue_status || "waiting",
        assignedUserId: item.assigned_user_id,
        assignedUser: item.assigned_user
          ? {
              id: item.assigned_user.id,
              username: item.assigned_user.username || "",
              fullName: item.assigned_user.full_name || item.assigned_user.display_name || "",
              displayName: item.assigned_user.display_name || item.assigned_user.full_name || "",
              avatarUrl: item.assigned_user.avatar_url,
            }
          : null,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn(`Failed to fetch guest chat queue for ${collectionName}:`, err);
      return [];
    }
  },

  async assignToCurrentUser(collectionName: string, queueId: number): Promise<{ sessionId: number; sessionToken: string } | null> {
    try {
      const res = await apiClient.post<any>(
        `/guest-chat/${collectionName}/guest/queue/${queueId}/assign`,
        {}
      );
      return {
        sessionId: res?.session_id || res?.data?.session_id || 0,
        sessionToken: res?.session_token || res?.data?.session_token || "",
      };
    } catch (err) {
      console.error(`Failed to assign guest queue item ${queueId}:`, err);
      return null;
    }
  },

  async getSessionMessages(collectionName: string, sessionId: number): Promise<GuestMessage[]> {
    try {
      const res = await apiClient.get<any>(
        `/guest-chat/${collectionName}/guest/sessions/${sessionId}/messages?page=1&size=50`
      );
      const rawList = res?.messages || res?.data || (Array.isArray(res) ? res : []);
      if (!Array.isArray(rawList)) return [];

      return rawList.map((m: any) => ({
        id: m.id || m.message_id || Date.now(),
        sessionId: m.session_id || sessionId,
        senderType: m.sender_type || (m.is_agent ? "agent" : "guest"),
        senderName: m.sender_name || (m.sender_type === "agent" ? "Support Agent" : "Guest"),
        messageText: m.message_text || m.content || m.text || "",
        messageType: m.message_type || "text",
        createdAt: m.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn(`Failed to fetch messages for session ${sessionId}:`, err);
      return [];
    }
  },

  async sendGuestMessage(
    collectionName: string,
    sessionId: number,
    sessionToken: string,
    messageText: string
  ): Promise<GuestMessage | null> {
    try {
      const res = await apiClient.post<any>(
        `/guest-chat/${collectionName}/guest/sessions/${sessionId}/message`,
        {
          message_text: messageText,
          message_type: "text",
          session_token: sessionToken,
          attachments: [],
          message_metadata: {},
        }
      );

      const m = res?.data || res;
      return {
        id: m.id || Date.now(),
        sessionId,
        senderType: "agent",
        senderName: "Support Agent",
        messageText,
        messageType: "text",
        createdAt: m.created_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error(`Failed to send guest message to session ${sessionId}:`, err);
      return null;
    }
  },

  async endGuestSession(collectionName: string, sessionId: number, endReason = "Resolved by agent"): Promise<boolean> {
    try {
      await apiClient.post(`/guest-chat/${collectionName}/guest/sessions/${sessionId}/end`, {
        end_reason: endReason,
        feedback_request: false,
      });
      return true;
    } catch (err) {
      console.error(`Failed to end session ${sessionId}:`, err);
      return false;
    }
  },
};
