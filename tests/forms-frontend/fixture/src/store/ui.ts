type Ui = { pushToast: (message: string) => void };

export const useUiStore = <T,>(select: (s: Ui) => T): T => select({ pushToast: () => {} });
