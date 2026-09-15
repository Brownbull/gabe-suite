import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./api/client";
import { queryKeys } from "./query/keys";

export function useMe() {
  return useQuery({ queryKey: queryKeys.me(), queryFn: () => apiFetch<{ setup_required: boolean }>("/api/v1/me") });
}
