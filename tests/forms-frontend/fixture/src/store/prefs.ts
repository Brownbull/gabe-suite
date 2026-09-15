import { create } from "zustand";

type PrefsState = { theme: string; items: string[]; open: boolean };

type Prefs = PrefsState & {
  setTheme: (theme: string) => void;
  add: (item: string) => void;
  remove: (item: string) => void;
  clear: () => void;
  toggle: () => void;
  saveTheme: (theme: string) => void;
  unused: () => void;
  resetAll: () => void;
  wipe: () => void;
  noop: () => void;
};

const INITIAL: PrefsState = { theme: "light", items: [], open: false };

function storeTheme(theme: string): void {
  localStorage.setItem("theme", theme);
}

export const usePrefsStore = create<Prefs>()((set) => ({
  ...INITIAL,
  setTheme: (theme) => set({ theme }),
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  remove: (item) => set((s) => ({ items: s.items.filter((i) => i !== item) })),
  clear: () => set({ items: [] }),
  toggle: () => set((s) => ({ open: !s.open })),
  saveTheme: (theme) => {
    storeTheme(theme);
    set({ theme: "dark" });
  },
  unused: () => set({ open: true }),
  resetAll: () => set(INITIAL),
  wipe: () => set({ ...INITIAL }),
  noop: () => set((s) => s),
}));
