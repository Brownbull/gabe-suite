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
}
# the transaction verbs an effect scan looks for (dependency forms; the effects arm widens the family)
TX_CALLS = frozenset({"commit"})

# ── the GENERATION ARMS (amendment 1, docs/design/element-forms/amendment-1.md) ────────────────────────
# Each arm is one switch — center.config.json `forms_arms: {"paths": true, …}` or GABE_FORMS_ARMS=paths,effects|all|none —
# and every arm defaults OFF. The ids (Slice 2) are no switch: they are written whenever any arm is on.
ARMS = {
    "kinds": {"slice": 3, "parts": ("middleware", "dependencies", "functions", "tasks", "handlers"),
              "part_slices": {"functions": 8, "tasks": 8, "handlers": 8}},
    "short": {"slice": 4, "parts": ("schema", "model", "migration", "setting", "mirror"),
              "part_slices": {"model": 10, "migration": 10, "setting": 10, "mirror": 10}},
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
    "kinds.functions": ("effects",), "short.model": ("effects",),
}
# soft needs — used only when the other arm is also selected
ARM_SOFT = {"paths": ("switches", "short.schema")}
# paths order by where they happen; PHASES (above) stays as it is so P.build's row sort never moves
PATH_PHASES = ("middleware", "body-parse", "security", "dependency", "validation", "handler", "uncaught")
