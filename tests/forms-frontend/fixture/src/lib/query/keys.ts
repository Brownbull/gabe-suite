export const queryKeys = {
  me: () => ["me"] as const,
  settings: () => ["settings"] as const,
  things: {
    all: ["things"] as const,
    list: () => [...queryKeys.things.all, "list"] as const,
  },
  recipes: {
    all: ["recipes"] as const,
    detail: (id: string) => ["recipes", "detail", id] as const,
  },
};

export const INVALIDATIONS = {
  setupComplete: [queryKeys.me(), queryKeys.settings(), queryKeys.recipes.all],
};
