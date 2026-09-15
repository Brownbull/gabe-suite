import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "./api/client";

export function useSaveSettings() {
  return useMutation({ mutationFn: (body: unknown) => apiFetch("/api/v1/settings", { method: "PATCH", body }) });
}
