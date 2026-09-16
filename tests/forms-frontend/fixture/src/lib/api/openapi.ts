export const apiClient = {
  GET(path: string, opts?: { params?: unknown }): Promise<unknown> {
    return fetch(path, { method: "GET" }).then((r) => r.json());
  },
  PATCH(path: string, opts?: { body?: unknown }): Promise<unknown> {
    return fetch(path, { method: "PATCH", body: JSON.stringify(opts?.body) }).then((r) => r.json());
  },
};
