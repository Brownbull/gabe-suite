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
STATES = ("defined", "default", "missing", "n/a", "unknown")

# ── slots per kind (slice 1: FastAPI endpoints) ────────────────────────────────────────────────────
KINDS: dict[str, dict[str, dict]] = {
    "endpoint": {
        "U3": {"name": "Preconditions", "question": "the guards in the body whose branch ends in a refusal"},
        "U7": {"name": "Refusal reasons", "question": "does each refusal carry a stable code, or only text"},
        "K1": {"name": "Status contract", "question": "declared responses vs the exits the code produces"},
    },
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
                        "says": "a model and the schema its migrations leave disagree — the code trusts a column the database does not have"},
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

# ── the GENERATION ARMS (amendment 1, docs/design/element-forms/amendment-1.md) ────────────────────────
# Each arm is one switch — center.config.json `forms_arms: {"paths": true, …}` or GABE_FORMS_ARMS=paths,effects|all|none —
# and every arm defaults OFF. The ids (Slice 2) are no switch: they are written whenever any arm is on.
ARMS = {
    "kinds": {"slice": 3, "parts": ("middleware", "dependencies", "functions", "tasks", "handlers"),
              "part_slices": {}},
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
    ("kinds", ("middleware", "dependencies")), ("paths", ("returns", "conditions")), ("short", ("schema",)),
    ("paths", ("framework",)), ("switches", ()), ("paths", ("paths",)), ("effects", ()), ("contract", ()),
    ("kinds", ("functions", "tasks", "handlers")), ("tests", ()), ("short", ("model", "migration", "setting", "mirror")),
)
# hard needs, unit → units ("arm" or "arm.part"); a needed unit runs in memory and is not written unless its arm is selected
ARM_NEEDS = {                                   # paths walks the middleware stack only in its `paths` part (Slice 5)
    "paths.paths": ("kinds.middleware",), "effects": ("paths",), "contract": ("effects",), "tests": ("paths",),
    "kinds.functions": ("effects",), "kinds.handlers": ("effects",), "short.model": ("effects",),
}
# soft needs — used only when the other arm is also selected
ARM_SOFT = {"paths": ("switches", "short.schema")}
# paths order by where they happen; PHASES (above) stays as it is so P.build's row sort never moves
PATH_PHASES = ("middleware", "body-parse", "security", "dependency", "validation", "handler", "uncaught")
