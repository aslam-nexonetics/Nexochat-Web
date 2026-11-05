import { apiClient } from "@/lib/api/client";

export interface FeedAuthor {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface FeedPost {
  id: number;
  collectionId: number;
  author: FeedAuthor;
  type: "announcement" | "quote" | "image" | string;
  title?: string;
  content: string;
  imageUrl?: string | null;
  backgroundColor?: string;
  textColor?: string;
  iconName?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface FeedComment {
  id: number;
  postId: number;
  author: FeedAuthor;
  comment: string;
  createdAt: string;
}

export const feedsApi = {
  async getPosts(collectionName: string, category = "all", page = 1, limit = 20): Promise<FeedPost[]> {
    try {
      const typeParam = category && category !== "all" ? `&type=${category}` : "";
      const res = await apiClient.get<any>(`/feeds/${collectionName}/posts?page=${page}&limit=${limit}${typeParam}`);
      
      let rawList: any[] = [];
      if (Array.isArray(res)) {
        rawList = res;
      } else if (res?.data?.posts && Array.isArray(res.data.posts)) {
        rawList = res.data.posts;
      } else if (res?.data && Array.isArray(res.data)) {
        rawList = res.data;
      } else if (res?.posts && Array.isArray(res.posts)) {
        rawList = res.posts;
      }

      return rawList.map((p: any) => ({
        id: p.id,
        collectionId: p.collection_id || 0,
        author: {
          id: p.author?.id || 0,
          username: p.author?.username || "",
          fullName: p.author?.full_name || p.author?.username || "Colleague",
          avatarUrl: p.author?.avatar_url || null,
          role: p.author?.role || "Member",
        },
        type: p.type || "announcement",
        title: p.title || "",
        content: p.content || "",
        imageUrl: p.image_url || null,
        backgroundColor: p.background_color,
        textColor: p.text_color,
        iconName: p.icon_name,
        likesCount: p.likes_count || 0,
        commentsCount: p.comments_count || 0,
        isLiked: p.is_liked ?? false,
        createdAt: p.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn(`Failed to fetch feeds for ${collectionName}:`, err);
      return [];
    }
  },

  async createPost(
    collectionName: string,
    post: {
      type: string;
      title?: string;
      content: string;
      imageUrl?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: string;
    }
  ): Promise<FeedPost | null> {
    try {
      const res = await apiClient.post<any>(`/feeds/${collectionName}/posts`, {
        type: post.type,
        ...(post.title ? { title: post.title } : {}),
        content: post.content,
        ...(post.imageUrl ? { image_url: post.imageUrl } : {}),
        ...(post.backgroundColor ? { background_color: post.backgroundColor } : {}),
        ...(post.textColor ? { text_color: post.textColor } : {}),
        ...(post.iconName ? { icon_name: post.iconName } : {}),
      });

      const p = res?.data || res;
      return {
        id: p.id || Date.now(),
        collectionId: p.collection_id || 0,
        author: {
          id: p.author?.id || 0,
          username: p.author?.username || "",
          fullName: p.author?.full_name || "You",
          avatarUrl: p.author?.avatar_url || null,
          role: p.author?.role || "Member",
        },
        type: p.type || post.type,
        title: p.title || post.title,
        content: p.content || post.content,
        imageUrl: p.image_url || post.imageUrl,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        createdAt: p.created_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error("Failed to create post:", err);
      return null;
    }
  },

  async toggleLike(collectionName: string, postId: number): Promise<{ isLiked: boolean; likesCount: number } | null> {
    try {
      const res = await apiClient.post<any>(`/feeds/${collectionName}/posts/${postId}/like`, {});
      return {
        isLiked: res?.is_liked ?? true,
        likesCount: res?.likes_count ?? 1,
      };
    } catch (err) {
      console.error(`Failed to like post ${postId}:`, err);
      return null;
    }
  },

  async getComments(collectionName: string, postId: number): Promise<FeedComment[]> {
    try {
      const res = await apiClient.get<any>(`/feeds/${collectionName}/posts/${postId}/comments?page=1&limit=50`);
      const rawList = res?.data || (Array.isArray(res) ? res : []);
      if (!Array.isArray(rawList)) return [];

      return rawList.map((c: any) => ({
        id: c.id,
        postId,
        author: {
          id: c.author?.id || 0,
          username: c.author?.username || "",
          fullName: c.author?.full_name || c.author?.username || "Colleague",
          avatarUrl: c.author?.avatar_url || null,
        },
        comment: c.comment || "",
        createdAt: c.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn(`Failed to fetch comments for post ${postId}:`, err);
      return [];
    }
  },

  async addComment(collectionName: string, postId: number, comment: string): Promise<FeedComment | null> {
    try {
      const res = await apiClient.post<any>(`/feeds/${collectionName}/posts/${postId}/comments`, {
        comment,
      });
      const c = res?.data || res;
      return {
        id: c.id || Date.now(),
        postId,
        author: {
          id: c.author?.id || 0,
          username: c.author?.username || "",
          fullName: c.author?.full_name || "You",
          avatarUrl: c.author?.avatar_url || null,
        },
        comment,
        createdAt: c.created_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error(`Failed to add comment to post ${postId}:`, err);
      return null;
    }
  },
};
