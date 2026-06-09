import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cookie is handled by the browser automatically.
// We only store the user object client-side (no token needed).
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // Call after successful login/signup — store user info only
      setAuth: (user) =>
        set({ user, isAuthenticated: true }),

      // Update user fields 
      setUser: (user) => set({ user }),

      // Clear client state on logout (cookie is cleared by backend)
      logout: () =>
        set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth", // localStorage key (only stores user + isAuthenticated)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);