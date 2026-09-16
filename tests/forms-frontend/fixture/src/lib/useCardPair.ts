import { useQueries } from "@tanstack/react-query";

import { apiClient } from "./api/openapi";

export function useCardPair(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({ queryKey: ["cards", id], queryFn: () => apiClient.GET("/api/v1/cards/" + id) })),
  });
}

export function useCardTwo() {
  return useQueries({
    queries: [
      { queryKey: ["cards", "a"], queryFn: () => apiClient.GET("/api/v1/cards/a") },
      { queryKey: ["cards", "b"], queryFn: () => apiClient.GET("/api/v1/cards/b") },
    ],
  });
}
