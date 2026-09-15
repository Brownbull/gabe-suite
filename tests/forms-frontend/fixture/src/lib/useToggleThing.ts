import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "./api/client";
import { queryKeys } from "./query/keys";

function writeThings(client: unknown, done: boolean): void {
  void client;
  void done;
}

function restore(context: unknown): void {
  void context;
}

export function useToggleThing() {
  const queryClient = useQueryClient();
  const optimistic = useMutation({
    mutationFn: (done: boolean) => apiFetch("/api/v1/things/toggle", { method: "POST", body: done }),
    onMutate: (done) => writeThings(queryClient, done),
    onError: (_error, done) => writeThings(queryClient, !done),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.things.list() }),
  });
  const careless = useMutation({
    mutationFn: (done: boolean) => apiFetch("/api/v1/things/flag", { method: "POST", body: done }),
    onMutate: (done) => queryClient.setQueryData(["things", "flag"], done),
  });
  const contextual = useMutation({
    mutationFn: (done: boolean) => apiFetch("/api/v1/things/pin", { method: "POST", body: done }),
    onMutate: (done) => { queryClient.setQueryData(["things", "pin"], done); return { previous: !done }; },
    onError: (_error, _done, context) => restore(context),
  });
  return { optimistic, careless, contextual };
}
