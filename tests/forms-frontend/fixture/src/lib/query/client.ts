import { QueryClient } from "@tanstack/react-query";

import { isClientError } from "../api/errors";

const MAX_RETRIES = 1;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isClientError(error)) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000, refetchOnReconnect: true },
      mutations: { retry: false },
    },
  });
}
