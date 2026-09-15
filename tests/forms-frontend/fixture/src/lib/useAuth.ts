export function useAuth() {
  return { status: "authed" as "pending" | "anon" | "authed", signOut: async () => {} };
}
