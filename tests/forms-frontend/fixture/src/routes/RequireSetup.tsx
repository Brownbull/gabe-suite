import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../lib/useAuth";
import { useMe } from "../lib/useMe";
import { useUiStore } from "../store/ui";
import { PATHS } from "./paths";
import { Splash } from "./screens";

export function RequireSetup() {
  const { signOut } = useAuth();
  const pushToast = useUiStore((s) => s.pushToast);
  const { data, isPending, isError, error } = useMe();

  useEffect(() => {
    if (isError && error && (error as { status?: number }).status === 401) {
      void signOut();
    } else if (isError) {
      pushToast("retrying");
    }
  }, [isError, error, signOut, pushToast]);

  if (isPending) {
    return <Splash />;
  }
  if (isError) {
    return <Splash />;
  }
  if (data.setup_required) {
    return <Navigate to={PATHS.setup} replace />;
  }
  return <Outlet />;
}
