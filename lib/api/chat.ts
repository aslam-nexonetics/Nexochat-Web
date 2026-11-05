import { apiClient } from "@/lib/api/client";

export interface ChatParticipant {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string | null;
  specialization?: string | null;
  isOnline?: boolean;
}

export interface ChatRoom {
  id: number;
  channelName: string;
  displayName: string;
  chatType: "direct" | "group" | "channel";
  description?: string;
  specialization?: string | null;
  role?: string | null;
  otherUserId?: number | null;
  avatarUrl?: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  participants: ChatParticipant[];
  otherUser?: ChatParticipant;
  isBlocked?: boolean;
  blockedByOther?: boolean;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string | null;
  messageText: string;
  messageType: "text" | "image" | "file" | "meeting";
  createdAt: string;
  isMe?: boolean;
  status?: "sent" | "delivered" | "read";
  metadata?: Record<string, any>;
}

export interface CollectionUser {
  id: number;
  username: string;
  email?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  role?: string | null;
  specialization?: string | null;
}

export const chatApi = {
  async listConversations(
    collectionName: string,
    currentUserId?: number,
    page = 1,
    size = 20
  ): Promise<ChatRoom[]> {
    try {
      const res = await apiClient.get<any>(
        `/chat/${collectionName}/chat/list/?page=${page}&size=${size}`
      );
      const rawList = res?.data || res || [];
      if (!Array.isArray(rawList)) return [];

      return rawList.map((item: any) => {
        const rawParticipants = Array.isArray(item.participants) ? item.participants : [];
        const participants: ChatParticipant[] = rawParticipants.map((p: any) => ({
          id: p.id ?? p.user_id,
          userId: p.user_id ?? p.id,
          username: p.username || "",
          fullName:
            p.full_name ||
            `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
            p.username ||
            "Team Member",
          avatarUrl: p.avatar_url || null,
          role: p.role || p.specialization || null,
          specialization: p.specialization || p.role || null,
          isOnline: p.is_online === true,
        }));

        // Find the counterpart user (not current user)
        const otherParticipant = currentUserId
          ? participants.find((p) => p.userId !== currentUserId)
          : participants[0];

        const otherUserObj = item.other_user || null;

        // Resolve display name matching Flutter ChatRoomModel
        let resolvedName =
          item.display_name?.trim() ||
          item.displayName?.trim() ||
          otherUserObj?.full_name?.trim() ||
          otherUserObj?.username?.trim() ||
          otherParticipant?.fullName?.trim() ||
          otherParticipant?.username?.trim() ||
          "";

        // Clean technical internal channel names like direct_12_34 or chat_42
        if (
          !resolvedName ||
          resolvedName.startsWith("direct_") ||
          resolvedName.startsWith("chat_") ||
          resolvedName.startsWith("room_")
        ) {
          if (otherParticipant?.fullName && !otherParticipant.fullName.startsWith("direct_")) {
            resolvedName = otherParticipant.fullName;
          } else if (item.channel_name && !item.channel_name.startsWith("direct_")) {
            resolvedName = item.channel_name;
          } else {
            resolvedName = item.chat_type === "direct" ? "Direct Chat" : "Team Channel";
          }
        }

        // Specialization or role resolution (GIG & professional roles)
        const specialization =
          item.specialization?.trim() ||
          item.role?.trim() ||
          otherUserObj?.specialization?.trim() ||
          otherUserObj?.role?.trim() ||
          otherParticipant?.specialization?.trim() ||
          otherParticipant?.role?.trim() ||
          null;

        const otherUserId =
          item.other_user_id ||
          otherUserObj?.id ||
          otherParticipant?.userId ||
          null;

        const avatarUrl =
          item.avatar_url ||
          otherUserObj?.avatar_url ||
          otherParticipant?.avatarUrl ||
          null;

        return {
          id: item.id ?? item.chat_id,
          channelName: item.channel_name || item.name || resolvedName,
          displayName: resolvedName,
          chatType: item.chat_type || "direct",
          description: item.description || "",
          specialization,
          role: specialization,
          otherUserId,
          avatarUrl,
          lastMessage:
            typeof item.last_message === "object"
              ? item.last_message?.message_text || item.last_message?.content || ""
              : item.last_message || "",
          lastMessageTime:
            item.last_message?.created_at ||
            item.last_activity ||
            item.updated_at ||
            item.created_at,
          unreadCount: item.unread_count || 0,
          participants,
          otherUser: otherUserObj
            ? {
                id: otherUserObj.id,
                userId: otherUserObj.id,
                username: otherUserObj.username || "",
                fullName: otherUserObj.full_name || otherUserObj.username || "",
                avatarUrl: otherUserObj.avatar_url,
                role: otherUserObj.role || otherUserObj.specialization,
                specialization: otherUserObj.specialization || otherUserObj.role,
              }
            : otherParticipant,
          isBlocked: item.is_blocked === true,
          blockedByOther: item.blocked_by_other === true,
        };
      });
    } catch (err) {
      console.warn(`Failed to list conversations for ${collectionName}:`, err);
      return [];
    }
  },

  async getMessages(
    collectionName: string,
    chatId: number,
    page = 1,
    size = 50
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    try {
      const res = await apiClient.get<any>(
        `/chat/${collectionName}/chat/${chatId}/messages/?page=${page}&size=${size}`
      );
      const rawList =
        res?.data || res?.messages || (Array.isArray(res) ? res : []);
      if (!Array.isArray(rawList)) {
        return { messages: [], hasMore: false };
      }

      const mapped: ChatMessage[] = rawList.map((m: any) => ({
        id: m.id || m.message_id,
        chatId: m.chat_id || chatId,
        senderId: m.sender_id || m.user_id || m.author?.id,
        senderName:
          m.sender_name ||
          m.author?.full_name ||
          m.author?.username ||
          "",
        senderAvatar: m.sender_avatar || m.author?.avatar_url || null,
        messageText: m.message_text || m.content || m.text || "",
        messageType: m.message_type || "text",
        createdAt: m.created_at || new Date().toISOString(),
      }));

      // The backend returns messages sorted newest-first (descending).
      // Sort chronologically ascending (oldest first, newest at the bottom):
      const chronological = [...mapped].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
          return timeA - timeB;
        }
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      });

      const hasMore =
        res?.has_more !== undefined
          ? Boolean(res.has_more)
          : rawList.length >= size;

      return {
        messages: chronological,
        hasMore,
      };
    } catch (err) {
      console.warn(`Failed to load messages for chat ${chatId}:`, err);
      return { messages: [], hasMore: false };
    }
  },

  async sendMessage(
    collectionName: string,
    chatId: number,
    messageText: string,
    messageType: "text" | "image" | "file" = "text"
  ): Promise<ChatMessage | null> {
    try {
      const res = await apiClient.post<any>(`/chat/${collectionName}/chat/send/`, {
        chat_id: chatId,
        message_text: messageText,
        message_type: messageType,
      });

      const raw = res?.data || res;
      return {
        id: raw.id || Date.now(),
        chatId,
        senderId: raw.sender_id || 0,
        senderName: raw.sender_name || "You",
        messageText,
        messageType,
        createdAt: raw.created_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error(`Failed to send message to chat ${chatId}:`, err);
      return null;
    }
  },

  async startChat(
    collectionName: string,
    participantId: number,
    participantName: string,
    specialization?: string | null
  ): Promise<ChatRoom | null> {
    try {
      const res = await apiClient.post<any>(`/chat/${collectionName}/chat/start/`, {
        chat_type: "direct",
        participant_ids: [participantId],
        channel_name: participantName,
        description: "Direct conversation",
      });

      const rawChannel = res?.channel || res?.data || res;
      return {
        id: rawChannel.id,
        channelName: rawChannel.channel_name || participantName,
        displayName: participantName,
        chatType: "direct",
        description: rawChannel.description || "",
        specialization: specialization || null,
        role: specialization || null,
        otherUserId: participantId,
        participants: [
          {
            id: participantId,
            userId: participantId,
            username: participantName,
            fullName: participantName,
            role: specialization,
            specialization,
          },
        ],
      };
    } catch (err) {
      console.error(`Failed to start chat with participant ${participantId}:`, err);
      return null;
    }
  },

  async getCollectionUsers(collectionId: number): Promise<CollectionUser[]> {
    try {
      const res = await apiClient.get<any[]>(
        `/user-collections/collections/${collectionId}/users/`
      );
      if (!Array.isArray(res)) return [];

      return res.map((u: any) => ({
        id: u.id,
        username: u.username || "",
        email: u.email || "",
        fullName:
          u.full_name ||
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          u.username,
        firstName: u.first_name,
        lastName: u.last_name,
        avatarUrl: u.avatar_url,
        role: u.role || u.specialization || null,
        specialization: u.specialization || u.role || null,
      }));
    } catch (err) {
      console.warn(`Failed to fetch collection users for ${collectionId}:`, err);
      return [];
    }
  },
};
