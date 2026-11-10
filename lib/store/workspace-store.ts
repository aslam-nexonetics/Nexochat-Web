import { create } from "zustand";
import { Collection } from "@/lib/types/collection";
import { apiClient } from "@/lib/api/client";

interface WorkspaceState {
  collections: Collection[];
  availableCollections: Collection[];
  activeCollection: Collection | null;
  pendingCollectionName: string | null;
  isLoading: boolean;
  sidebarCollapsed: boolean;
  isMobileNavOpen: boolean;

  loadCollections: () => Promise<void>;
  selectCollectionByName: (name: string) => void;
  selectCollectionById: (id: number) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  joinCollection: (collectionId: number, userId: number) => Promise<boolean>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  collections: [],
  availableCollections: [],
  activeCollection: null,
  pendingCollectionName: null,
  isLoading: false,
  sidebarCollapsed: false,
  isMobileNavOpen: false,

  loadCollections: async () => {
    set({ isLoading: true });
    try {
      // 1. Fetch joined collections
      const myRes = await apiClient.get<unknown[]>("/user-collections/my-collections/");
      const parsedJoined: Collection[] = Array.isArray(myRes)
        ? myRes.map((item: any) => {
            const rawCol = item.collection || item;
            return {
              id: rawCol.id,
              collectionName: rawCol.collection_name,
              collectionType: rawCol.collection_type || "general",
              description: rawCol.description || "",
              status: rawCol.status || "active",
              properties: Array.isArray(rawCol.properties) ? rawCol.properties : ["Chat", "Profile"],
              collectionTables: rawCol.collection_tables || [],
              isMuted: item.is_muted ?? false,
              createdAt: rawCol.created_at,
              updatedAt: rawCol.updated_at,
            };
          })
        : [];

      // 2. Fetch all available collections
      const availRes = await apiClient.get<unknown[]>("/user-collections/available-collections/");
      const parsedAvail: Collection[] = Array.isArray(availRes)
        ? availRes.map((rawCol: any) => ({
            id: rawCol.id,
            collectionName: rawCol.collection_name,
            collectionType: rawCol.collection_type || "general",
            description: rawCol.description || "",
            status: rawCol.status || "active",
            properties: Array.isArray(rawCol.properties) ? rawCol.properties : ["Chat", "Profile"],
            collectionTables: rawCol.collection_tables || [],
            isMuted: rawCol.is_muted ?? false,
            createdAt: rawCol.created_at,
            updatedAt: rawCol.updated_at,
          }))
        : [];

      // Determine active collection in priority order:
      // 1. Explicit pending collection request (e.g., from the active route being mounted)
      // 2. URL slug parsed directly from window.location.pathname
      // 3. Stored collection from localStorage (nexo_last_active_collection)
      // 4. Current active collection if already set and still valid
      // 5. First joined collection, or first available collection
      let targetSlug = get().pendingCollectionName?.toLowerCase().trim() || null;

      if (!targetSlug && typeof window !== "undefined") {
        const path = window.location.pathname;
        const match = path.match(/^\/workspace\/([^\/]+)/);
        if (match && match[1] && match[1].toLowerCase() !== "workspace") {
          targetSlug = match[1].toLowerCase().trim();
        }
      }

      if (!targetSlug && typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("nexo_last_active_collection");
          if (saved) {
            targetSlug = saved.toLowerCase().trim();
          }
        } catch {
          // ignore localStorage access issues
        }
      }

      let nextActive: Collection | null = null;
      if (targetSlug) {
        nextActive =
          parsedJoined.find((c) => c.collectionName.toLowerCase().trim() === targetSlug) ||
          parsedAvail.find((c) => c.collectionName.toLowerCase().trim() === targetSlug) ||
          null;
      }

      if (!nextActive) {
        const currentActive = get().activeCollection;
        if (currentActive && parsedJoined.some((c) => c.id === currentActive.id)) {
          nextActive = currentActive;
        } else if (parsedJoined.length > 0) {
          nextActive = parsedJoined[0];
        } else if (parsedAvail.length > 0) {
          nextActive = parsedAvail[0];
        }
      }

      // Persist chosen active collection
      if (nextActive && typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "nexo_last_active_collection",
            nextActive.collectionName.toLowerCase().trim()
          );
        } catch {
          // ignore
        }
      }

      set({
        collections: parsedJoined,
        availableCollections: parsedAvail,
        activeCollection: nextActive,
        pendingCollectionName: null,
        isLoading: false,
      });
    } catch (err: any) {
      if (err?.status !== 401 && err?.status !== 403) {
        console.error("Failed to load collections:", err);
      }
      set({ isLoading: false });
    }
  },

  selectCollectionByName: (name: string) => {
    if (!name) return;
    const normalized = name.toLowerCase().trim();

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nexo_last_active_collection", normalized);
      } catch {
        // ignore
      }
    }

    const { collections, availableCollections } = get();
    const found =
      collections.find((c) => c.collectionName.toLowerCase().trim() === normalized) ||
      availableCollections.find((c) => c.collectionName.toLowerCase().trim() === normalized);

    if (found) {
      set({ activeCollection: found, pendingCollectionName: null });
    } else {
      // Collections might not be loaded yet; store as pending so loadCollections picks it up
      set({ pendingCollectionName: normalized });
    }
  },

  selectCollectionById: (id: number) => {
    const { collections, availableCollections } = get();
    const found =
      collections.find((c) => c.id === id) ||
      availableCollections.find((c) => c.id === id);

    if (found) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "nexo_last_active_collection",
            found.collectionName.toLowerCase().trim()
          );
        } catch {
          // ignore
        }
      }
      set({ activeCollection: found, pendingCollectionName: null });
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  setMobileNavOpen: (open: boolean) => set({ isMobileNavOpen: open }),

  joinCollection: async (collectionId: number, userId: number) => {
    try {
      await apiClient.post(`/user-collections/collections/${collectionId}/users/`, {
        collection_id: String(collectionId),
        role: "viewer",
        permissions: { additionalProp1: {} },
        user_id: String(userId),
      });
      // Reload collections to update state
      await get().loadCollections();
      return true;
    } catch (err) {
      console.error("Failed to join collection:", err);
      return false;
    }
  },
}));
