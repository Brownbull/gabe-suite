import { create } from "zustand";
export const useUiStore = create<{ dense: boolean }>()(() => ({ dense: false }));
