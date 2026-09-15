import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "./api/client";
import { INVALIDATIONS, queryKeys } from "./query/keys";

export function useCompleteSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => apiFetch("/api/v1/setup/complete", { method: "POST", body }),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKeys.me(), data);
      await Promise.all(INVALIDATIONS.setupComplete.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}
