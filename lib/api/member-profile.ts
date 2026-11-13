import { apiClient } from "@/lib/api/client";

export interface MemberProfile {
  id: number;
  userId: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  isActive: string;
  isPublic: string;
  bio: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const memberProfileApi = {
  async getMyProfile(collectionName: string, currentUser?: { id: number; username: string; fullName: string; role?: string }): Promise<MemberProfile | null> {
    try {
      const res = await apiClient.get<any>(`/profile/${collectionName}/profile/me/`);
      if (res && (res.id || res.user_id)) {
        return {
          id: res.id,
          userId: res.user_id,
          displayName: res.display_name || res.username || "Team Member",
          username: res.username || "",
          avatarUrl: res.avatar_url || "",
          isActive: res.is_active?.toString() ?? "true",
          isPublic: res.is_public?.toString() ?? "true",
          bio: res.bio || res.role || "",
          metadata: res.metadata || {},
          createdAt: res.created_at || new Date().toISOString(),
          updatedAt: res.updated_at || new Date().toISOString(),
        };
      }
      return null;
    } catch (err: any) {
      // If 404, auto-create profile matching Flutter's ProfileCubit logic
      if (currentUser && (err?.status === 404 || err?.statusCode === 404 || String(err).includes("404"))) {
        return await this.createProfile(collectionName, {
          userId: currentUser.id,
          displayName: currentUser.fullName || currentUser.username,
          username: currentUser.username,
          bio: currentUser.role || "Member",
        });
      }
      return null;
    }
  },

  async createProfile(
    collectionName: string,
    data: { userId: number; displayName: string; username: string; bio: string }
  ): Promise<MemberProfile | null> {
    try {
      const res = await apiClient.post<any>(`/profile/${collectionName}/profile/`, {
        user_id: data.userId,
        display_name: data.displayName,
        username: data.username,
        avatar_url: "",
        is_active: "true",
        is_public: "true",
        bio: data.bio,
        metadata: {},
      });

      const raw = res?.data || res;
      return {
        id: raw.id || data.userId,
        userId: data.userId,
        displayName: raw.display_name || data.displayName,
        username: raw.username || data.username,
        avatarUrl: raw.avatar_url || "",
        isActive: "true",
        isPublic: "true",
        bio: raw.bio || data.bio,
        metadata: {},
        createdAt: raw.created_at || new Date().toISOString(),
        updatedAt: raw.updated_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error(`Failed to create profile for ${collectionName}:`, err);
      return null;
    }
  },

  async updateProfile(
    collectionName: string,
    profileId: number,
    data: { displayName: string; bio: string; isPublic: boolean; isActive: boolean }
  ): Promise<boolean> {
    try {
      await apiClient.put(`/profile/${collectionName}/profile/me/`, {
        display_name: data.displayName,
        bio: data.bio,
        is_public: data.isPublic ? "true" : "false",
        is_active: data.isActive ? "true" : "false",
      });
      return true;
    } catch (err) {
      console.error(`Failed to update profile for ${collectionName}:`, err);
      return false;
    }
  },

  async uploadAvatar(
    collectionName: string,
    profileId: number,
    file: File
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `/api/proxy/profile/${collectionName}/profile/${profileId}/avatar/?type=profile`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || err?.detail || "Failed to upload avatar");
    }

    const data = await res.json();
    return data?.avatar_url || data?.data?.avatar_url || data?.data?.url || "";
  },

  async getUserProfile(collectionName: string, userId: number): Promise<MemberProfile | null> {
    try {
      const res = await apiClient.get<any>(
        `/profile/${collectionName}/profiles/users/?user_ids=${userId}`
      );
      const list = res?.data || res;
      const item = Array.isArray(list) ? list[0] : (list?.data?.[0] || list);
      if (item) {
        return {
          id: item.id || userId,
          userId: item.user_id || userId,
          displayName: item.display_name || item.username || "Team Member",
          username: item.username || "",
          avatarUrl: item.avatar_url || "",
          isActive: item.is_active?.toString() ?? "true",
          isPublic: item.is_public?.toString() ?? "true",
          bio: item.bio || item.role || "",
          metadata: item.metadata || {},
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
        };
      }
      return null;
    } catch (err) {
      console.warn(`[memberProfileApi.getUserProfile] Failed for user ${userId}:`, err);
      return null;
    }
  },
};
