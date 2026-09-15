import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./api/client";
import { queryKeys } from "./query/keys";

export function useThings() {
  return useQuery({ queryKey: queryKeys.things.list(), queryFn: () => apiFetch("/api/v1/things") });
}
