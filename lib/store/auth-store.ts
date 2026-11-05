import { create } from "zustand";
import { User } from "@/lib/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for session expiration events dispatched by apiClient
  if (typeof window !== "undefined") {
    window.addEventListener("nexo:session-expired", () => {
      set({ user: null, isAuthenticated: false, isLoading: false });
      window.location.href = "/login?expired=1";
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setUser: (user) => {
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    },

    clearError: () => set({ error: null }),

    checkAuth: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      } catch (err) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
    },

    logout: async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (e) {
        console.warn("Logout request failed:", e);
      } finally {
        set({ user: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    },
  };
});
