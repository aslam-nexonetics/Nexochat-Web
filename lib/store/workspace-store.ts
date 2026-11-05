import { create } from "zustand";
import { Collection } from "@/lib/types/collection";
import { apiClient } from "@/lib/api/client";

interface WorkspaceState {
  collections: Collection[];
  availableCollections: Collection[];
  activeCollection: Collection | null;
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

      const currentActive = get().activeCollection;
      let nextActive = currentActive;

      // Default to first collection if none selected or if previously selected is no longer valid
      if (parsedJoined.length > 0) {
        if (!currentActive || !parsedJoined.some((c) => c.id === currentActive.id)) {
          nextActive = parsedJoined[0];
        }
      } else if (parsedAvail.length > 0) {
        nextActive = parsedAvail[0];
      }

      set({
        collections: parsedJoined,
        availableCollections: parsedAvail,
        activeCollection: nextActive,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to load collections:", err);
      set({ isLoading: false });
    }
  },

  selectCollectionByName: (name: string) => {
    const { collections, availableCollections } = get();
    const normalized = name.toLowerCase().trim();
    const found =
      collections.find((c) => c.collectionName.toLowerCase().trim() === normalized) ||
      availableCollections.find((c) => c.collectionName.toLowerCase().trim() === normalized);

    if (found) {
      set({ activeCollection: found });
    }
  },

  selectCollectionById: (id: number) => {
    const { collections, availableCollections } = get();
    const found =
      collections.find((c) => c.id === id) ||
      availableCollections.find((c) => c.id === id);

    if (found) {
      set({ activeCollection: found });
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
