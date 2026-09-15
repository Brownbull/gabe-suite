import { ApiError } from "./errors";

export async function apiFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let response = await fetch(path, { method: options.method ?? "GET" }).then((r) => {
    if (r.status === 503) {
      throw new ApiError(503);
    }
    return r;
  });
  if (response.status === 401) {
    response = await fetch(path, { method: options.method ?? "GET" });
  }
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return (await response.json()) as T;
}
