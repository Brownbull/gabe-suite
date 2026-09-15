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

# ── client policy (Slice 11b) ────────────────────────────────────────────────────────────────────────
# the packages a client policy's library defaults are read for, and the lock file entry that pins each version
QUERY_PACKAGES = {"@tanstack/query-core": "tanstack-query"}
CACHE_QUERY_CALLS = frozenset({"useQuery", "useSuspenseQuery", "useInfiniteQuery", "useSuspenseInfiniteQuery", "useQueries"})
CACHE_MUTATION_CALLS = frozenset({"useMutation"})
CLIENT_CLASSES = frozenset({"QueryClient"})
INVALIDATE_CALLS = frozenset({"invalidateQueries", "refetchQueries", "resetQueries", "removeQueries"})
SEED_CALLS = frozenset({"setQueryData"})
POLICY_KEYS = ("retry", "retryDelay", "staleTime", "gcTime", "refetchOnWindowFocus", "refetchOnReconnect", "refetchOnMount", "networkMode")
# ── controls · stores · optimistic (Slice 11d) ─────────────────────────────────────────────────────────
CONTROL_TAGS = frozenset({"button", "a"})                    # host elements a user acts on; a component wrapping one is a control too
HANDLER_PROPS = ("onClick", "onPress", "onSubmit", "onChange", "onSelect", "onPointerDown", "onMouseDown", "onKeyDown", "href", "to")
CLICK_PROPS = frozenset({"onClick", "onPress", "onPointerDown", "onMouseDown", "onKeyDown"})   # a wrapper's click reaches a nested control
PERSIST_CALLS = frozenset({"persist", "atomWithStorage"})    # zustand `persist(…, { name })` · jotai `atomWithStorage`
STORAGE_WRITES = r"(?:window\.)?(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)"
CACHE_WRITE_CALLS = frozenset({"setQueryData", "setQueriesData"})
CLIENT_HOOKS = frozenset({"useQueryClient"})                  # the value a helper is handed when it writes the cache
MUTATE_CALLS = frozenset({"mutate", "mutateAsync"})           # `m.mutate(body, { onError })` — the callback's error is m's request
REASON_MEMBERS = ("detail", "code")                             # what a client reads to tell two refusals of one status apart (Slice 11c)
# the defaults a query client uses when nothing sets them, READ from the installed package — each value names its source
# and the lowest version it was read on; a lock file below that version (or none) reads `unknown`, never a guess
LIBRARY_DEFAULTS = {
    "tanstack-query": {
        "min_version": "5.100.6",
        "queries": {
            "retry": {"value": 3, "source": "@tanstack/query-core/src/retryer.ts:170", "note": "0 when rendering on the server"},
            "staleTime": {"value": 0, "source": "@tanstack/query-core/src/query.ts:316"},
            "gcTime": {"value": 300000, "source": "@tanstack/query-core/src/removable.ts:28", "note": "Infinity on the server"},
            "refetchOnWindowFocus": {"value": True, "source": "@tanstack/query-core/src/queryObserver.ts:786"},
            "refetchOnReconnect": {"value": True, "source": "@tanstack/query-core/src/queryObserver.ts:786"},
        },
        "mutations": {
            "retry": {"value": 0, "source": "@tanstack/query-core/src/mutation.ts:199"},
        },
    },
}
