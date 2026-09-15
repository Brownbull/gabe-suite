import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./api/client";
import { queryKeys } from "./query/keys";

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings(), queryFn: () => apiFetch("/api/v1/settings"), staleTime: 0 });
}
