import { Navigate, Outlet } from "react-router-dom";

import { useMe } from "../lib/useMe";

export function GuardP() {
  const { data } = useMe();
  if (data.wants_q) {
    return <Navigate to="/q" />;
  }
  return <Outlet />;
}

export function GuardQ() {
  const { data } = useMe();
  if (data.wants_p) {
    return <Navigate to="/p" />;
  }
  return <Outlet />;
}
