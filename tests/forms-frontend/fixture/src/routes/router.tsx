import { createBrowserRouter } from "react-router-dom";

import { GuardP, GuardQ } from "./Pair";
import { PATHS } from "./paths";
import { RedirectIfSetupComplete } from "./RedirectIfSetupComplete";
import { RequireAdmin } from "./RequireAdmin";
import { RequireAuth } from "./RequireAuth";
import { RequireSetup } from "./RequireSetup";
import { Home, Splash } from "./screens";

export const router = createBrowserRouter([
  { path: PATHS.login, element: <Splash /> },
  {
    element: <RequireAuth />,
    children: [
      { element: <RedirectIfSetupComplete />, children: [{ path: PATHS.setup, element: <Home /> }] },
      {
        element: <RequireSetup />,
        children: [
          { path: PATHS.home, element: <Home /> },
          { element: <RequireAdmin />, children: [{ path: PATHS.admin, element: <Home /> }] },
        ],
      },
      { element: <GuardP />, children: [{ path: "/p", element: <Home /> }] },
      { element: <GuardQ />, children: [{ path: "/q", element: <Home /> }] },
    ],
  },
]);
