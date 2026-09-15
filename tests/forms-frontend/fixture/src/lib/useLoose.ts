import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./api/client";

function makeKey() {
  return Math.random() > 0.5 ? ["a"] : ["b"];
}

const KEY = makeKey();

export function useLoose() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch("/api/v1/loose") });
}
