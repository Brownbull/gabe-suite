import { Navigate, Outlet } from "react-router-dom";

import { useMe } from "../lib/useMe";
import { PATHS } from "./paths";

export function RequireAdmin() {
  const { data } = useMe();
  if (!data.is_admin) {
    return <Navigate to={PATHS.admin} />;
  }
  return <Outlet />;
}
