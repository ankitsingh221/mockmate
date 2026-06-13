import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cookie is handled by the browser automatically.
// We only store the user object client-side (no token needed).
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      // Call after successful login/signup — store user info only
      setAuth: (user) => set({ user, isAuthenticated: true }),

      // Update user fields
      setUser: (user) => set({ user }),

      // Clear client state on logout (cookie is cleared by backend)
      logout: () => set({ user: null, isAuthenticated: false }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth", // localStorage key (only stores user + isAuthenticated)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);


// onRehydrateStorage can fail silently if localStorage is empty or slow.
// This guarantees isHydrated becomes true within 100ms no matter what
setTimeout(() => {
  const { isHydrated, setHydrated } = useAuthStore.getState();
  if (!isHydrated) setHydrated();
}, 100);