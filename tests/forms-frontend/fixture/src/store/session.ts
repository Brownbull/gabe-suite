import { create } from "zustand";
import { persist } from "zustand/middleware";

type Session = { token: string | null; signOut: () => void; expire: (e: { status: number }) => void };

export const useSessionStore = create<Session>()(
  persist(
    (set) => ({
      token: null,
      signOut: () => set({ token: null }),
      expire: (e) => set({ token: e.status === 401 ? null : "kept" }),
    }),
    { name: "session" },
  ),
);
