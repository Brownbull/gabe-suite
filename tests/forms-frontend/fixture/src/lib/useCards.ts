import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api/openapi";

export function useCards() {
  return useQuery({ queryKey: ["cards"], queryFn: () => apiClient.GET("/api/v1/cards") });
}

export function usePatchCard() {
  const qc = useQueryClient();
  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["cards"] });
  };
  return useMutation({
    mutationFn: (body: unknown) => apiClient.PATCH("/api/v1/cards/1", { body }),
    onSuccess: handleSaved,
  });
}

export function useCardsInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["cards"] });
  };
}

export function usePatchCardTwo() {
  const invalidate = useCardsInvalidate();
  return useMutation({
    mutationFn: (body: unknown) => apiClient.PATCH("/api/v1/cards/2", { body }),
    onSuccess: invalidate,
  });
}
