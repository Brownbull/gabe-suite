"""Element forms — the slot REGISTRY. Data only; `_a3_paths.py` is the code that fills it.

Every kind of piece gets a FORM: the slots it must define, read in the order a call lives. A filled
slot shows what the piece decided; an empty slot is a finding — the credit-scorecard idea, where a
model with no capping rule or no adverse-action code was a finding before anyone looked at a score.
The draft and the 19-piece sweep behind it: docs/design/logic-map/element-forms.html; the build
plan: docs/design/element-forms/plan.md.

FLAT and a `.py` on purpose: bootstrap_center.sh and propagate.sh copy `*.py *.mjs *.sh` only, so a
JSON registry would never reach a twin. `_a3_paths.py` imports it at column 0, which is how
propagate.sh learns a twin needs it.

Framework rules cite the installed package they were read from (FastAPI 0.136.3). A rule that cannot
be proven for a project — its framework version cannot be read — yields `unknown`, never a guess.
A new slot, a new framework rule or a new finding is an edit HERE, not in the walker.
"""
from __future__ import annotations

VERSION = 2   # 2 (amendment 1, Slice 1): the envelope carries `head` and, when any arm is selected, `arms`

# ── the five states a slot or a row can be in ──────────────────────────────────────────────────────
#   defined  a fact found in the project's source
#   default  a framework rule stands in; nothing in the project says so
#   missing  the slot applies, the pass ran, nothing defines it
#   n/a      this kind has no such slot here
#   unknown  the source cannot tell (a dynamic status, an unreadable framework version)
STATES = ("defined", "default", "missing", "n/a", "unknown", "external")   # `external` — a setting's value lives outside the tree (D23)

# ── slots per kind (slice 1: FastAPI endpoints) ────────────────────────────────────────────────────
KINDS: dict[str, dict[str, dict]] = {
    "endpoint": {
        "U3": {"name": "Preconditions", "question": "the guards in the body whose branch ends in a refusal"},
        "U7": {"name": "Refusal reasons", "question": "does each refusal carry a stable code, or only text"},
        "K1": {"name": "Status contract", "question": "declared responses vs the exits the code produces"},
        # §A4 V32 — the nine slots the arms fill; each names the block that IS the slot (the endpoint's `slots{}` carries U3 U7 K1 only)
        "U6": {"name": "Paths", "question": "one ordered path per exit, in request order", "block": "paths[]", "arm": "paths"},
        "U8": {"name": "Switches & flags", "question": "which binding, value or flag changes the exit this request meets", "block": "switches[]", "arm": "switches"},
        "U9": {"name": "Effects", "question": "what each path writes, commits and rolls back", "block": "paths[].effects", "arm": "effects"},
        "U11": {"name": "Failure handling", "question": "every try on a path and what its handler does", "block": "failure{}", "arm": "effects"},
        "U12": {"name": "Repeat safety", "question": "the idempotency key it reads and the unique claims it makes", "block": "repeat{}", "arm": "contract"},
        "U14": {"name": "Tests per path", "question": "which test proves which exit and path", "block": "tests{}", "arm": "tests"},
        "K2": {"name": "Auth scope", "question": "schemes, carriers, gates and what their commits provision", "block": "auth{}", "arm": "contract"},
        "K3": {"name": "Rate limit", "question": "each limiter, its key, its switch and the paths it exempts", "block": "rate{}", "arm": "contract"},
        "K4": {"name": "Response per exit", "question": "each exit's media type, body and headers", "block": "responses{}", "arm": "contract"},
        "U15": {"name": "In-flight state", "question": "what is alive while this request runs — where it is set, where it is read, whether it goes with the answer",
                "block": "inflight[]", "arm": "kinds"},
    },
    # the kinds the arms wrote (§A4 V32): slot ids are scoped per kind and name the block as built
    "middleware": {"stack": {"name": "Stack order", "block": "middleware{}.runs"}, "exits": {"name": "Exits", "block": "middleware{}.exits"},
                   "applies": {"name": "Applies to", "block": "middleware{}.applies_to · exempt"},
                   "memory": {"name": "Kept in memory", "block": "inflight.process"}},
    "dependency": {"exits": {"name": "Own and inherited exits", "block": "dependencies{}.exits · inherited_exits"},
                   "commits": {"name": "Commits", "block": "dependencies{}.effects"}, "teardown": {"name": "Teardown", "block": "dependencies{}.teardown"}},
    "service": {"raises": {"name": "Raises and where they surface", "block": "functions{}.raises"}, "refusals": {"name": "Refusals", "block": "functions{}.refusals"},
                "commits": {"name": "Commits and savepoints", "block": "functions{}.commits · savepoints"}, "swallows": {"name": "Broad swallows", "block": "functions{}.swallows"}},
    "task": {"retry": {"name": "Retry", "block": "tasks{}.retry"}, "triggers": {"name": "Dispatch and beat", "block": "tasks{}.dispatch · beat"}, "locks": {"name": "Locks", "block": "tasks{}.locks"}},
    "handler": {"publisher": {"name": "Publisher", "block": "handlers{}.publisher"}, "isolation": {"name": "Bus isolation", "block": "handlers{}.isolation · catch"}},
    "schema": {"cases": {"name": "422 cases", "block": "schemas{}.fields[].cases"}, "extra": {"name": "Extra fields", "block": "schemas{}.extra"}},
    "model": {"constraints": {"name": "Constraints", "block": "models{}.constraints"}, "columns": {"name": "Columns", "block": "models{}.columns"},
              "drift": {"name": "Migration drift", "block": "models{}.drift"}, "writers": {"name": "Writers", "block": "models{}.writers"}},
    "migration": {"schema": {"name": "Schema it leaves", "block": "migrations{}"}, "heads": {"name": "Heads", "block": "migrations{}.heads"}},
    "setting": {"declaration": {"name": "Declaration and bounds", "block": "settings{}.field"}, "readers": {"name": "Readers", "block": "settings{}.readers"},
                "environment": {"name": "Environment", "block": "settings{}.environment"}, "tests": {"name": "Values tested", "block": "settings{}.tests"}},
    "mirror": {"pairs": {"name": "Pairs", "block": "mirrors{}.pairs"}, "rows": {"name": "Rule agreement", "block": "mirrors{}.rows"}},
    "guard": {"exits": {"name": "Exits and what decides them", "block": "frontend.pieces[guard].exits"}, "chain": {"name": "Chain", "block": "frontend.pieces[guard].chain"},
              "k3": {"name": "Router topology", "block": "frontend.pieces[guard].k3"}},
    "hook": {"calls": {"name": "Query and mutation calls", "block": "frontend.pieces[hook].calls"}, "reason": {"name": "Reason sites", "block": "frontend.reasons"}},
    "component": {"controls": {"name": "Controls", "block": "frontend.pieces[component].controls"}},
    "store_action": {"transitions": {"name": "Transitions", "block": "frontend.stores{}.actions[].transitions"}, "called": {"name": "Called", "block": "frontend.stores{}.actions[].called"}},
}

# ── options: choices built, not decided — flip them here ───────────────────────────────────────────
OPTIONS = {
    # an endpoint with no in-body guard reads "n/a" (a read needs none) or "missing-on-mutating"
    "u3_empty": "n/a",
    # how far the shared reach walk reads (amendment 1 D17): discovery only, never a row
    "reach_depth": 4,
    # a middleware row a path condition proves off stays in `produced` with `applies: false` (D19) — "annotate" is the
    # only form built; the conditions part refuses any other value rather than claim it
    "exempt_rows": "annotate",
    # which called functions become `branches[]`: "deciding" (D14) · "all" (every callee with two value returns) · "none"
    "expand_branches": "deciding",
    # the effects arm's four named widenings (EFFECTS["widenings"]) — off, its (model, rw) pairs and commit flag per
    # function are `_a3_code._orm_access`'s
    "effects_widenings": True,
    # the inflight part (Slice 12): how far it reads — "one-level" is the only form built, the part refuses any other value rather
    # than claim it; and whether what a dependency hands the handler is a row (the operator's ruling R3: in — the first thing cut)
    "inflight_scope": "one-level",
    "inflight_dep_values": True,
    # which reached functions get a form (Slice 8): "facts" (a commit, raise, refusal, swallow or savepoint) · "all"
    "function_scope": "facts",
    # how far a raise is joined to the endpoint that translates it: "one-level" (the endpoint pass reads one call level;
    # a deeper raise reads "beyond one level") · "all"
    "k2_climb": "one-level",
    # which module constants the setting part forms (Slice 10b): "paired" — a constant appears only inside the setting it is
    # read beside (`effective[]`); the part refuses any other value rather than claim it
    "setting_constants": "paired",
    # how the mirror part pairs copies of a rule (Slice 10c): "flow+orm" — constructor keyword flow, sibling rebuilds,
    # from_attributes response schemas, a setting's paired and same-named constants; the part refuses any other value
    "mirror_pairing": "flow+orm",
}
MUTATING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

# ── produced exits are ordered by where they happen in a request's life ────────────────────────────
PHASES = {"middleware": 0, "security": 1, "dependency": 2, "validation": 3, "handler": 4, "uncaught": 5}

# ── what a refusal looks like in source ────────────────────────────────────────────────────────────
HTTP_EXCEPTIONS = frozenset({"HTTPException"})       # fastapi.HTTPException · starlette.exceptions.HTTPException
STATUS_NAME_RX = r"^HTTP_(\d{3})(?:_|$)"              # status.HTTP_409_CONFLICT → 409
CODE_KEYS = ("code", "error_code", "reason", "type")  # a detail carrying one of these is a stable machine code
ENUM_BASES = frozenset({"Enum", "StrEnum", "IntEnum"})
RESPONSE_CLASSES = frozenset({"Response", "JSONResponse", "PlainTextResponse", "HTMLResponse",
                              "ORJSONResponse", "UJSONResponse"})
# the status a RETURNED response sends when the call names none — FastAPI sends a Response it is handed as built, so the
# route decorator's status_code never applies to it (starlette/responses.py: RedirectResponse defaults to 307)
RESPONSE_DEFAULTS = {**{c: 200 for c in RESPONSE_CLASSES}, "RedirectResponse": 307, "StreamingResponse": 200,
                     "FileResponse": 200, "EventSourceResponse": 200}
DETAIL_CAP = 120

# ── framework rules: FastAPI ───────────────────────────────────────────────────────────────────────
FRAMEWORK = "fastapi"
LOCK_FILES = ("uv.lock", "poetry.lock", "requirements.txt")
# Every security class answers 401 "Not authenticated" while auto_error is true (its default) — read
# from fastapi 0.136.3; older FastAPI answered 403, and the cut-over version is not verified on this
# machine, so the rule is gated at the lowest version it was READ on. Below it → unknown.
_SEC_SRC = {
    "HTTPBearer": "fastapi/security/http.py:87-92", "HTTPBasic": "fastapi/security/http.py:87-92",
    "HTTPDigest": "fastapi/security/http.py:87-92", "APIKeyHeader": "fastapi/security/api_key.py:40-45",
    "APIKeyQuery": "fastapi/security/api_key.py:40-45", "APIKeyCookie": "fastapi/security/api_key.py:40-45",
    "OAuth2PasswordBearer": "fastapi/security/oauth2.py:416-421",
    "OAuth2AuthorizationCodeBearer": "fastapi/security/oauth2.py:416-421",
    "OpenIdConnect": "fastapi/security/open_id_connect_url.py:80-85",
}
SECURITY_CLASSES = {name: {"status": 401, "detail": "Not authenticated", "auto_error_kw": "auto_error",
                           "min_version": "0.135.3", "source": src} for name, src in _SEC_SRC.items()}
DEPENDS = frozenset({"Depends", "Security"})
# a parameter FastAPI injects rather than validates — every OTHER parameter can answer 422
INJECTED_TYPES = frozenset({"Request", "Response", "WebSocket", "BackgroundTasks", "SecurityScopes",
                            "HTTPConnection"})
VALIDATION = {"status": 422, "form": "object", "code": "pydantic error type",
              "source": "fastapi/exception_handlers.py:20-26"}
UNCAUGHT = {"status": 500, "source": "starlette ServerErrorMiddleware"}
MIDDLEWARE_METHODS = ("dispatch", "__call__")
# third-party middleware: what each can refuse on a route's own request
THIRD_PARTY_MIDDLEWARE = {
    "CORSMiddleware": {},                                    # 400 on a bad OPTIONS preflight only — not the route's request
    "GZipMiddleware": {}, "SessionMiddleware": {}, "HTTPSRedirectMiddleware": {},
    "TrustedHostMiddleware": {"status": 400, "detail": "Invalid host header"},
}

# ── findings: each names its slot and how pulse S20 treats it ──────────────────────────────────────
#   nag    counts toward S20 firing — the refusal a client cannot handle correctly
#   count  rides the S20 line — a convention to set once, not per-endpoint debt
FINDINGS = {
    "text-only": {"arm": "endpoint", "slot": "U7", "pulse": "count",
                  "says": "refusals carry text only — no stable code a client can branch on"},
    "shared-status": {"arm": "endpoint", "slot": "U7", "pulse": "nag",
                      "says": "one status carries different text-only refusals — a client must compare strings"},
    "reason-lost": {"arm": "endpoint", "slot": "U7", "pulse": "nag",
                    "says": "a service's reason is replaced by other text on the way out"},
    "escape-500": {"arm": "endpoint", "slot": "U7", "pulse": "nag",
                   "says": "a project exception escapes untranslated and answers 500"},
    "http-swallowed": {"arm": "endpoint", "slot": "U7", "pulse": "nag",
                       "says": "a refusal raised inside a broad except never reaches the client"},
    "undeclared": {"arm": "endpoint", "slot": "K1", "pulse": "count",
                   "says": "produces statuses the endpoint does not declare"},
    "declared-unproduced": {"arm": "endpoint", "slot": "K1", "pulse": "count",
                            "says": "declares a status no path produces"},
    "indistinct-exits": {"arm": "kinds", "slot": "K3", "pulse": "count",
                         "says": "one response builder answers several refusals — a client cannot tell which limit or rule fired"},
    "dependency-commits": {"arm": "kinds", "slot": "K3", "pulse": "count",
                           "says": "a dependency commits a transaction before the handler runs — a later refusal cannot undo it"},
    "extra-ignored": {"arm": "short", "slot": "S6", "pulse": "count",
                      "says": "a request schema ignores unknown keys — a misspelt field is dropped silently instead of refused"},
    "refusal-writes": {"arm": "effects", "slot": "U9", "pulse": "count",
                       "says": "a refusal leaves the endpoint's own writes committed — the client hears no, the database kept a yes"},
    "safe-method-commits": {"arm": "effects", "slot": "U9", "pulse": "count",
                            "says": "a GET, HEAD or OPTIONS endpoint commits — a retry or a prefetch changes data"},
    "swallows-broad": {"arm": "kinds", "slot": "B-fn", "pulse": "count",
                       "says": "a broad except returns normally — whatever failed is logged or nothing, never surfaced"},
    "untranslated-raise": {"arm": "kinds", "slot": "B-fn", "pulse": "count",
                           "says": "a raise reaches an endpoint that does not translate it — the endpoint's escape-500"},
    "retry-unbounded": {"arm": "kinds", "slot": "B-task", "pulse": "nag",
                        "says": "a task retries with no max_retries and no last-failure branch — a poisoned message retries forever"},
    "handler-dropped": {"arm": "kinds", "slot": "B-evt", "pulse": "count",
                        "says": "the publish loop swallows a handler's failure — the handler's work is dropped, never retried"},
    "test-detail-unmatched": {"arm": "tests", "slot": "U14", "pulse": "count",
                              "says": "a test asserts a detail no candidate exit says — the test and the code disagree on the words"},
    "asserted-unproduced": {"arm": "tests", "slot": "U14", "pulse": "count",
                            "says": "a test asserts a status the endpoint never produces"},
    "untested-exit": {"arm": "tests", "slot": "U14", "pulse": "count",
                      "says": "a tested endpoint has exits no test asserts"},
    "migration-drift": {"arm": "short", "slot": "M8", "pulse": "nag",
                        "says": "a model and the schema its migrations leave disagree — on a column, its type, its nullability, its server default or a check; `fields` says which"},
    "default-overridden": {"arm": "short", "slot": "M6", "pulse": "count",
                           "says": "a constructor sets a defaulted column to another literal — the default is not the value that ships"},
    "unbounded-number": {"arm": "short", "slot": "F2", "pulse": "count",
                         "says": "a numeric setting takes any value — no Field bound and no validator comparison, so 0, a negative or a huge value boots"},
    "startup-unchecked": {"arm": "short", "slot": "F7", "pulse": "count",
                          "says": "a setting that decides a refusal or caps a number has no validator — a wrong value surfaces at request time, not at boot"},
    "env-unset": {"arm": "short", "slot": "F4", "pulse": "count",
                  "says": "the repo expects a value from outside (a required field, a commented-out value, the declaration naming its variable) and no tracked file sets it"},
    "one-value-tested": {"arm": "short", "slot": "F8", "pulse": "count",
                         "says": "tests give a setting, or the constant it pairs with, one value only — the other branch never runs"},
    "mirror-disagree": {"arm": "short", "slot": "MR", "pulse": "nag",
                        "says": "two copies of one rule disagree — a schema and its table, or two sibling schemas, accept different values"},
    "schema-only-bound": {"arm": "short", "slot": "MR", "pulse": "count",
                          "says": "a bound only the schema enforces while a writer sets the column without the schema — the table takes what the API refuses"},
    "redirect-loop": {"arm": "frontend", "slot": "K3", "pulse": "nag",
                      "says": "a guard redirects into its own route subtree — the page it sends the user to runs the same guard again"},
    "reason-collapsed": {"arm": "frontend", "slot": "U7", "pulse": "nag",
                         "says": "a client branch reads only the status of a refusal whose status another refusal shares — two reasons show one message"},
    "branch-unproduced": {"arm": "frontend", "slot": "U7", "pulse": "count",
                          "says": "a client branches on a status no endpoint it calls produces — the branch never runs"},
    "client-detail-unmatched": {"arm": "frontend", "slot": "U7", "pulse": "count",
                                "says": "a client compares a detail or code no exit of the endpoint says — the branch never matches"},
    "dead-control": {"arm": "frontend", "slot": "K2", "pulse": "nag",
                     "says": "a button or link has no handler — the user presses it and nothing happens"},
    "action-uncalled": {"arm": "frontend", "slot": "K1", "pulse": "count",
                        "says": "a store action nothing outside the store calls — its transition never runs"},
    "no-rollback": {"arm": "frontend", "slot": "K2", "pulse": "nag",
                    "says": "a mutation writes the cache before the server answers and nothing undoes it on error — a refused change stays on screen"},
    "race-500": {"arm": "contract", "slot": "U12", "pulse": "nag",
                 "says": "a retry races its own first try on a unique key nothing catches — the loser answers 500, not the first result"},
}
# the transaction verbs an effect scan looks for (dependency forms; the effects arm widens the family)
TX_CALLS = frozenset({"commit"})

# ── the EFFECTS arm (amendment 1 §A2 Slice 6) ─────────────────────────────────────────────────────────
EFFECTS = {
    "depth": 4,                                 # callees read below a path; one level deeper counts into `floor`
    "write_m": {"add": "add", "add_all": "add", "merge": "merge", "delete": "delete",       # session.<m>(obj) (_a3_code._ORM_WRITE_M)
                "bulk_save_objects": "add", "bulk_insert_mappings": "insert"},
    "write_core": {"insert": "insert", "update": "update", "delete": "delete"},             # <core>(Model) (_ORM_WRITE_CORE)
    "tx": {"flush": "flush", "commit": "commit", "rollback": "rollback", "begin_nested": "savepoint"},
    "writes": ("add", "merge", "delete", "insert", "update"),
    "safe_methods": ("GET", "HEAD", "OPTIONS"),
    # a transaction verb, or a write whose object binds no model, counts only on a receiver named like a session or a
    # parameter annotated `…Session` — `seen.add(x)` and `cache.delete(k)` are not database writes
    "session_names": r"(?i)(^|_)(session|db|conn|connection|tx|uow)$",
    "column_calls": ("Column", "mapped_column", "Field"),
    # a method resolved on a class with one of these bases reaches an implementation the source does not name: `unresolved`
    "abstract_bases": ("Protocol", "ABC"),
    "widenings": {
        "W1": "a tuple unpacked from a call whose return annotation names models",
        "W2": "a name bound from a query of one model — select(Model)… or an awaited session.get(Model, …)",
        "W3": "a model named anywhere inside a select, not as its argument",
        "W4": "every element of session.add_all([...])",
    },
}
SUPPRESSORS = frozenset({"suppress"})           # contextlib.suppress — an exception inside the block never leaves it
# which dependencies ran before an exit, verified at fastapi ≥ _a3_forms_short.FRAMEWORK_MIN; below it every path reads unknown
DEPENDENCY_ORDER = {
    "not-run": {
        "middleware": "a middleware answers before routing reaches the endpoint",
        "body-parse": "fastapi/routing.py:427-457 — the body is read and parsed before solve_dependencies",
        "security": "the security scheme is the first leaf dependency; its 401 stops the solve",
        "dependency-params": "fastapi/dependencies/utils.py:628-663 — a dependency whose own parameters fail is never called",
    },
    "ran": {
        "own-params": "fastapi/dependencies/utils.py:685-712, raised at fastapi/routing.py:723 — endpoint parameters validate after every dependency",
        "handler": "the handler runs after the solve", "success": "the handler returned", "uncaught": "the handler was running",
        "dependency": "a verified raise inside a dependency: those before it ran, it ran to its raise",
    },
    "unknown": "a refusal raised inside a dependency whose raise site is unverified",
}

# ── the CONTRACT arm (amendment 1 §A2 Slice 7) ────────────────────────────────────────────────────────
CONTRACT = {
    "key_name": r"(?i)idempot",                 # a header or request.state attribute named like an idempotency key (U12)
    "follow_depth": 2,                          # the key argument followed into callees, by position or keyword
    "claim_idioms": {"on_conflict_do_nothing": "an insert that skips a duplicate", "on_conflict_do_update": "an upsert",
                     "with_for_update": "a row lock before the write", "begin_nested": "the insert inside a savepoint",
                     "get-or-create": "a select of the model before its constructor"},
    "rate_idioms": {"limit": r"^\s*(\d+)\s*/\s*(second|minute|hour|day)\s*$",       # slowapi · `@limiter.limit("5/minute")`
                    "shared_limit": r"^\s*(\d+)\s*/\s*(second|minute|hour|day)\s*$"},   # · `@limiter.shared_limit("10/minute", scope=…)`
    "rate_refusal": {"status": 429, "form": "object", "detail": "{'error': 'Rate limit exceeded: {spec}'}"},   # slowapi's
                                                    # _rate_limit_exceeded_handler: JSONResponse({"error": f"Rate limit exceeded: {exc.detail}"}, 429)
    "carriers": {"HTTPBearer": ["header", "Authorization"], "HTTPBasic": ["header", "Authorization"],
                 "OAuth2PasswordBearer": ["header", "Authorization"], "APIKeyHeader": ["header", None],
                 "APIKeyQuery": ["query", None], "APIKeyCookie": ["cookie", None]},
    "www_authenticate": {"HTTPBearer": "Bearer"},    # fastapi/security/http.py:84-92 — read for HTTPBearer only
    "media": {"JSONResponse": "application/json", "ORJSONResponse": "application/json", "UJSONResponse": "application/json",
              "PlainTextResponse": "text/plain", "HTMLResponse": "text/html", "RedirectResponse": "n/a", "Response": "unknown",
              "StreamingResponse": "n/a", "EventSourceResponse": "n/a", "FileResponse": "n/a"},
    "bodies": {
        "http-exception": {"media": "application/json", "body": {"detail": "…"}, "source": "fastapi/exception_handlers.py:11-17"},
        "validation": {"media": "application/json", "body": {"detail": "list"}, "source": "fastapi/exception_handlers.py:20-26"},
        "security": {"media": "application/json", "body": {"detail": "…"}, "source": "fastapi/security/http.py:84-92"},
        "uncaught": {"media": "text/plain", "body": "Internal Server Error", "source": "starlette ServerErrorMiddleware"},
        "stream": {"media": "n/a"},
    },
}

# ── the KINDS arm's function, task and handler parts (amendment 1 §A2 Slice 8) ───────────────────────
TASK_KW = ("name", "bind", "max_retries", "default_retry_delay", "autoretry_for", "retry_backoff", "retry_backoff_max",
           "retry_jitter", "soft_time_limit", "time_limit", "acks_late", "reject_on_worker_lost", "rate_limit", "queue",
           "ignore_result", "expires")                  # Celery task options a task form reads (celery/app/task.py)
TASK_CONCURRENCY_KW = ("rate_limit", "acks_late", "queue", "soft_time_limit", "time_limit")
RETRY_CALLS = frozenset({"retry"})                      # self.retry(exc=…, countdown=…) — raises Retry
LOCK_CALLS = frozenset({"lock", "acquire", "Lock", "RedisLock", "advisory_lock", "try_advisory_lock"})
BUS_PUBLISH = frozenset({"publish", "emit"})
BUS_REGISTER = frozenset({"register", "register_once", "subscribe", "add_handler"})   # `_a3_code._DISPATCH_REG` minus `on`
CONCURRENT_CALLS = frozenset({"gather", "create_task", "TaskGroup", "start_soon"})

# ── the KINDS arm's inflight part (amendment 1 §A2 Slice 12 · U15) — what is alive while a request runs ─────────
# Cites read on this machine 2026-09-20: fastapi 0.136.3 · starlette 1.3.1 · uvicorn 0.48.0 · slowapi 0.1.9 · structlog 25.5.0 ·
# CPython 3.12 functools. A rule marked `gate` opens only at `_a3_forms_short.FRAMEWORK_MIN`; the starlette lines ride FastAPI's
# gate (no starlette floor of their own exists). `dies` is the CARRIER's lifetime — the slot that holds the value — never the
# object behind it (D31, the operator's ruling); only a rule here may say it.
_GONE, _STAYS, _UNK = "with the answer", "with the server process", "unknown"
INFLIGHT = {
    "request_types": ("Request", "HTTPConnection", "WebSocket"),       # starlette/requests.py:189-195 — `.state` is a State over scope["state"]
    "app_receivers": ("app",),                                         # starlette/applications.py:51 — one State per application
    "contextvar_ctors": ("ContextVar",), "contextvar_ops": ("set", "reset", "get"),          # PEP 567
    "contextvar_binders": {"bind_contextvars": "set", "bound_contextvars": "scoped", "clear_contextvars": "clear",
                           "unbind_contextvars": "reset"},             # structlog/contextvars.py:96 · :112 · :170
    "cache_decorators": {"lru_cache": 128, "cache": None},             # Lib/functools.py — the cache lives on the wrapper; cached_property is instance-scoped, absent
    "background_types": ("BackgroundTasks",), "background_calls": ("add_task",), "background_kw": ("background",),   # starlette/background.py:26-34
    "lock_methods": ("with_for_update",),                              # SELECT … FOR UPDATE, held to the end of the transaction
    "lock_sql": r"(?i)\bpg_(try_)?advisory_(xact_)?lock(_shared)?\b",   # PostgreSQL 9.28.10 — xact locks end with the transaction
    "lock_not_receivers": r"(?i)(^|_)(pool|engine)$",                  # `pool.acquire()` is a connection checkout, not a lock
    "release_calls": ("release", "unlock"),
    "containers": ("dict", "list", "set", "deque", "defaultdict", "OrderedDict", "Counter", "TTLCache", "LRUCache", "Lock", "RLock", "Semaphore"),
    "read_cap": 8,
    "unplaced_cap": 8,                                                 # how many unwalked `@<x>.middleware("http")` functions — and unresolved dependencies — are NAMED beside the count
    "test_files": r"(^|/)tests?/|(^|/)conftest\.py$|(^|/)test_[^/]*\.py$|_test\.py$",
    "rules": {
        "request-state": {"scope": "request", "dies": _GONE, "gate": True, "source": "starlette/requests.py:189-195",
                          "says": "a value kept on the request itself — it is gone once the answer has been sent"},
        "app-state": {"scope": "process", "dies": _STAYS, "gate": True, "source": "starlette/applications.py:51",
                      "says": "a value kept on the application — one copy for every request, alive as long as the server runs"},
        "no-write-found": {"scope": "request", "dies": _UNK, "source": "uvicorn/protocols/http/h11_impl.py:217 · starlette/routing.py:638-642",
                           "says": "read here, and nothing in this endpoint's scope writes it — it is set beyond one call, by a registration that is not read, or copied in from startup state"},
        "receiver-unproven": {"scope": "unknown", "dies": _UNK, "says": "something called `state` is touched here, and the code does not show that it is the request's"},
        "cv-reset": {"scope": "request", "dies": _GONE, "source": "PEP 567", "says": "a context variable set for this request and put back before the answer leaves"},
        "cv-scoped": {"scope": "request", "dies": _GONE, "source": "structlog/contextvars.py:170", "says": "context values bound for the length of a `with` block"},
        "cv-no-reset": {"scope": "request", "dies": _UNK, "says": "a context variable set here and never put back in this function — the code does not say how long it lasts"},
        "cv-get-only": {"scope": "unknown", "dies": _UNK, "says": "a context variable read here; nothing in this endpoint's scope sets it"},
        "dep-unresolved": {"scope": "request", "dies": _UNK, "says": "read here; one of this endpoint's dependencies could not be resolved, so a write may sit behind it"},
        "cv-dep-unresolved": {"scope": "unknown", "dies": _UNK, "says": "a context variable read here; one of this endpoint's dependencies could not be resolved, so a set may sit behind it"},
        "dep-solved": {"scope": "request", "dies": _GONE, "gate": True, "source": "fastapi/dependencies/utils.py:598-684",
                       "says": "a value FastAPI builds for this request and hands to the handler"},
        "dep-teardown": {"scope": "request", "dies": _GONE, "gate": True, "source": "fastapi/dependencies/utils.py:578-591 · :667-672",
                         "says": "a value opened for this request and closed when the request ends"},
        "dep-cached": {"scope": "process", "dies": _STAYS, "source": "Lib/functools.py lru_cache · cache",
                       "says": "the function that builds it is cached, so every request is handed the same object"},
        "dep-module-object": {"scope": "process", "dies": _STAYS, "says": "the dependency hands back an object built once, when its module loads"},
        "after-the-answer": {"scope": "request", "dies": _UNK, "gate": True, "source": "starlette/responses.py:170 · fastapi/routing.py:680-681",
                             "says": "work queued to run after the answer is sent — when it ends cannot be read from the code"},
        "lock-with-block": {"scope": "request", "dies": _GONE, "says": "a lock held for the length of a `with` block"},
        "lock-released": {"scope": "request", "dies": _GONE, "says": "a lock released in a `finally` of the same function"},
        "lock-transaction": {"scope": "request", "dies": _UNK, "says": "a database lock — it is released when its transaction ends"},
        "lock-open": {"scope": "request", "dies": _UNK, "says": "a lock taken here; no release is seen in this function"},
        "functools-cache": {"scope": "process", "dies": _STAYS, "source": "Lib/functools.py lru_cache · cache",
                            "says": "a cached function — its results are kept on the function for as long as the server runs"},
        "middleware-init": {"scope": "process", "dies": _STAYS, "gate": True, "source": "starlette/applications.py:57-89",
                            "says": "built once when the middleware is created, then shared by every request"},
        "setting-at-init": {"scope": "process", "dies": _STAYS, "gate": True, "source": "starlette/applications.py:57-89",
                            "says": "a setting read once when the middleware is created — a change to it needs a restart"},
        "framework-gate-closed": {"scope": None, "dies": _UNK, "says": "the rule is read for FastAPI 0.136.1 and later; this app pins an older one"},
    },
}

# ── the GENERATION ARMS (amendment 1, docs/design/element-forms/amendment-1.md) ────────────────────────
# Each arm is one switch — center.config.json `forms_arms: {"paths": true, …}` or GABE_FORMS_ARMS=paths,effects|all|none —
# and every arm defaults OFF. The ids (Slice 2) are no switch: they are written whenever any arm is on.
ARMS = {
    "kinds": {"slice": 3, "parts": ("middleware", "dependencies", "inflight", "functions", "tasks", "handlers"),
              "part_slices": {"inflight": 12}},
    "short": {"slice": 4, "parts": ("schema", "model", "migration", "setting", "mirror"),
              "part_slices": {}},
    "switches": {"slice": 5, "parts": ()},
    "paths": {"slice": 3, "parts": ("returns", "conditions", "framework", "paths"), "part_slices": {"framework": 4, "paths": 5}},
    "effects": {"slice": 6, "parts": ()},
    "contract": {"slice": 7, "parts": ()},
    "tests": {"slice": 9, "parts": ()},
    "frontend": {"slice": 11, "parts": ("guards", "hooks", "client", "reason", "controls", "stores")},
}
ARM_ORDER = ("kinds", "short", "switches", "paths", "effects", "contract", "tests", "frontend")
# the BACKEND run order is per PART (amendment §A2 Slice 1 step 3) — returns/conditions read the middleware and
# dependency forms, framework exits read the schema form, paths read the switches, kinds.functions and short.model read
# the effects; the frontend arm runs later, beside the fe structure arm (`extend_frontend`)
ARM_STAGES = (
    ("kinds", ("middleware", "dependencies")), ("kinds", ("inflight",)),   # its OWN stage (D32): a raise in it never takes middleware{} · dependencies{} down
    ("paths", ("returns", "conditions")), ("short", ("schema",)),
    ("paths", ("framework",)), ("switches", ()), ("paths", ("paths",)), ("effects", ()), ("contract", ()),
    ("kinds", ("functions", "tasks", "handlers")), ("tests", ()), ("short", ("model", "migration", "setting", "mirror")),
)
# hard needs, unit → units ("arm" or "arm.part"); a needed unit runs in memory and is not written unless its arm is selected
ARM_NEEDS = {                                   # paths walks the middleware stack only in its `paths` part (Slice 5)
    "paths.paths": ("kinds.middleware",), "effects": ("paths",), "contract": ("effects",), "tests": ("paths",),
    "kinds.functions": ("effects",), "kinds.handlers": ("effects",), "short.model": ("effects",),
    "kinds.inflight": ("kinds.middleware", "kinds.dependencies"),
}
# soft needs — used only when the other arm is also selected
ARM_SOFT = {"paths": ("switches", "short.schema")}
# paths order by where they happen; PHASES (above) stays as it is so P.build's row sort never moves
PATH_PHASES = ("middleware", "body-parse", "security", "dependency", "validation", "handler", "uncaught")
