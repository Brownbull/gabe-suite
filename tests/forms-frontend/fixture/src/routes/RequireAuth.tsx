import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../lib/useAuth";
import { PATHS } from "./paths";
import { Splash } from "./screens";

export function RequireAuth() {
  const { status } = useAuth();
  if (status === "pending") {
    return <Splash />;
  }
  if (status === "anon") {
    return <Navigate to={`${PATHS.login}?next=1`} replace />;
  }
  return <Outlet />;
}
