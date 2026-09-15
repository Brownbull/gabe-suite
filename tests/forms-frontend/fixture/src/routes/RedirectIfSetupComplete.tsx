import { Navigate, Outlet } from "react-router-dom";

import { useMe } from "../lib/useMe";
import { PATHS } from "./paths";

export function RedirectIfSetupComplete() {
  const { data, isError } = useMe();
  if (!isError && data && !data.setup_required) {
    return <Navigate to={PATHS.home} replace />;
  }
  return <Outlet />;
}
