import { useQuery } from "@tanstack/react-query";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => fetch("/api/v1/me").then((r) => r.json()) });
}
