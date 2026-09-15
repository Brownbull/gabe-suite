"""Element forms — FRONTEND rosters (amendment 1 §A2 Slice 11). Data only: the library idioms the frontend forms read from
the extractor's raw flow rows (`_a3_fe_extract.mjs`, GABE_FE_FLOW=1) — which element or thrown call navigates, which
component is an outlet, which hook member is a query state, which hook runs an effect. The extractor carries no roster;
a new idiom is an edit HERE, never in `_a3_fe_forms`. FLAT and a `.py` for the generator copy glob.
"""
from __future__ import annotations

NAV_ELEMENTS = frozenset({"Navigate", "Redirect"})           # react-router v6 `<Navigate to>` · v5 `<Redirect to>`
NAV_THROWS = frozenset({"redirect", "notFound"})              # TanStack Router beforeLoad / loader: `throw redirect({ to })`
OUTLETS = frozenset({"Outlet"})                               # react-router · TanStack Router: the matched child renders here
# a query hook's members (TanStack Query · SWR spellings) → the state class a guard's condition reads
QUERY_STATE = {
    "isPending": "pending", "isLoading": "pending", "isInitialLoading": "pending", "isFetching": "fetching",
    "isError": "error", "error": "error", "isLoadingError": "error", "isRefetchError": "error",
    "isSuccess": "success", "data": "data", "status": "status",
}
EFFECT_HOSTS = frozenset({"useEffect", "useLayoutEffect"})     # a call inside their callback runs after render
FLOW_TIMEOUT = 300                                            # the flow run's own timeout, seconds (D21)
