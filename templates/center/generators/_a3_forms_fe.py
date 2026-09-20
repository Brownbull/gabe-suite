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
HTTP_VERBS = frozenset({"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"})   # a generated client names the verb as the callee: `apiClient.PATCH(path)`
CLIENT_HOOKS = frozenset({"useQueryClient"})                  # the value a helper is handed when it writes the cache
MUTATE_CALLS = frozenset({"mutate", "mutateAsync"})           # `m.mutate(body, { onError })` — the callback's error is m's request
REASON_MEMBERS = ("detail", "code")                             # what a client reads to tell two refusals of one status apart (Slice 11c)
# ── what a reason branch does (Slice 11e) ────────────────────────────────────────────────────────────�
# A class comes from a library BINDER or a library callee SHAPE, never from a local name: `navigate`, `t`, `refetch`, `setX` are just locals.
DOES_CLASSES = ("navigate", "throw", "render", "return", "retry", "refresh", "request", "message", "surface", "state", "log", "other")   # ladder order
DOES_STATES = ("read", "mixed", "empty", "beyond one level", "no-rows", "unread")     # `beyond one level`: the comparison is handed back, the caller decides (the estate's phrase, D29)
DOES_CAP = 24
NAV_BINDERS = frozenset({"useNavigate"})                    # react-router v6/v7 · @tanstack/react-router: const navigate = useNavigate(); navigate("/x") · navigate({ to })
NAV_ROUTER_BINDERS = frozenset({"useRouter"})               # next/navigation · next/router · @tanstack/react-router
NAV_ROUTER_METHODS = frozenset({"push", "replace", "navigate"})   # next: router.push/replace · TanStack: router.navigate({ to })
NAV_CALLS = frozenset({"redirect", "permanentRedirect"})    # next/navigation: CALLED, not thrown; the thrown TanStack redirect stays NAV_THROWS
NAV_STATIC = frozenset({"NextResponse.redirect", "Response.redirect"})   # next/server route handlers · the Fetch API static
NAV_PLATFORM = r"(?:window\.)?location\.(?:assign|replace|reload)"       # DOM Location (`location.href = …` is an assignment: no flow row)
REFETCH_MEMBERS = frozenset({"refetch"})                    # @tanstack/query-core QueryObserverResult.refetch
MESSAGE_BINDERS = {"useTranslations": None}                 # next-intl: the bound value IS t. react-i18next's useTranslation waits for a target that installs it (D29)
SURFACE_CALLS = frozenset({"toast"})                         # the export sonner · react-hot-toast · react-toastify share: toast(msg) and toast.<level>(msg); the row's `from` says library or project
SURFACE_LEVELS = frozenset({"error", "success", "warning", "warn", "info", "message", "loading"})   # sonner levels + react-toastify's warn
STATE_BINDERS = frozenset({"useState", "useReducer"})        # react: index 1 of the bound pair is the setter / dispatch
LOG_CALLS = r"console\.(?:error|warn|info|log|debug)"       # the Console API
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
