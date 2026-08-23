export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> { const r = await fetch(path, init); return r.json(); }
