# B14 census — the wiring fingerprint of four applications, read from the arms-on element forms

Read-only over `~/.cache/gabe-map-baselines/.check/<target>/forms.json` (the §A4 dry-run feeds, every arm on; heads gustify 05007957 · gastify bcaea22c · tier3 483d7f896b · keypro 1e27ee4). 
Nothing here is a verdict: it is the data the operator asked for first (backlog B14) — which STATIONS each app fills, with which idioms, so that 'common' and 'specialist' can be read off before any lens is chosen. `not measured` = the generator could not read it there (a closed gate, no junit, no backend), never a zero.


## size

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| endpoints (FastAPI) | 80 | 49 | 499 | none: no FastAPI endpoints in the archmap |
| functions carrying a fact | 101 | 71 | 997 | 0 |
| models · schemas · settings | 57 · 127 · 45 | 28 · 85 · 38 | 155 · 184 · 0 | 0 · 0 · 0 |
| migration trees · revisions | 1 · 63 | 1 · 52 | 2 · 452 | — · — |
| test cases read (junit) | 1157 | 1090 | absent: no pytest junit under the results directory | absent: no endpoint forms to build on |
| frontend pieces with a form | 309 | 152 | 101 | 12 |

## edge

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| middleware stack (runs order · class · kind) | CORSMiddleware (third-party) → RateLimitMiddleware (project) → IdempotencyMiddleware (project) | CORSMiddleware (third-party) → RequestIdMiddleware (project) → AccessLogMiddleware (project) | ClientIPMiddleware (project) → LoginCaptchaMiddleware (project) → CaptchaCookieMiddleware (project) → CORSMiddleware (third-party) | not measured |
| middleware with exits (refuses requests itself) | RateLimitMiddleware | none | none | not measured |
| dependencies (name ✚commits ×endpoints) | _require_seed_controls ×2, _resolve_verifier ×79, bearer_scheme ×78, get_auth_context ✚commits ×78, get_auth_context_from_query ✚commits ×1, get_session ×79, get_settings ×12 | get_auth_context ✚commits ×47, get_current_user ×47, get_db ×47 | _check_bot_config_api_access ×3, _require_debug_enabled ×1, check_api_key_usage ✚commits ×1, check_token_rate_limits ×2, current_chat_accessible_user ×10, current_limited_user ×1, current_user ×1, get_async_session ×21, get_authorize_session ×1, get_current_tenant_id ×4, get_session ×438, get_user_db ×21, get_user_manager ×21, optional_fastapi_current_user ×15, optional_user ×15, redirect_sso_errors_to_web ×4, require_permission ×470, require_vector_db ×8, scope_exempt ×1 | not measured |
| auth (K2): schemes · gate deps · provisions | schemes {'HTTPBearer': 78} · gates {'get_auth_context': 78, '_require_seed_controls': 2, 'get_auth_context_from_query': 1} · provisions 79 | schemes — · gates {'get_auth_context': 47} · provisions 188 | schemes — · gates {'require_permission(Permission.BASIC_ACCESS)': 193, 'require_permission(Permission.FULL_ADMIN_PANEL_ACCESS)': 116, 'require_permission(Permission.MANAGE_LLMS)': 25, 'require_permission(Permission.MANAGE_ACTIONS, allow_scope=True)': 22} · provisions 0 | not measured |
| rate limit (K3): state per endpoint · limiter class | {'defined': 79, 'missing': 1} · limiter {'SlidingWindowLimiter': 102} | {'missing': 33, 'unknown': 16} · limiter {'limiter.limit': 21, 'limiter.shared_limit': 6} | {'missing': 499} · limiter — | not measured |
| idempotency (U12): state per endpoint · key carrier · claim idioms | {'missing': 45, 'n/a': 29, 'defined': 6} · key carrier {'header': 6} · idioms {'begin_nested': 4, 'get-or-create': 3} | {'missing': 31, 'n/a': 18} · key carrier — · idioms — | {'missing': 294, 'n/a': 205} · key carrier — · idioms — | not measured |

## decides

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| produced exits per endpoint | median 7 · max 21 | median 6 · max 14 | median 5 · max 16 | not measured |
| produced exits by phase | {'middleware': 103, 'security': 78, 'dependency': 81, 'validation': 57, 'handler': 178, 'uncaught': 80} | {'dependency': 47, 'validation': 44, 'handler': 161, 'uncaught': 49} | {'dependency': 902, 'validation': 489, 'handler': 604, 'uncaught': 497} | not measured |
| refusal statuses (top) | {401: 157, 429: 110, 500: 80, 422: 65, 409: 61, 400: 55, 404: 33, 403: 6} | {422: 65, 404: 64, 500: 50, 401: 49, 409: 27, 429: 27, 403: 11, 402: 3} | {400: 674, 500: 528, 422: 491, 403: 455, 'dynamic (OnyxError)': 198, 404: 112, 401: 13, 501: 9} | not measured |
| endpoints declaring any refusal (K1) | 0 (0%) | 0 (0%) | 0 (0%) | not measured |
| paths per endpoint (U6) | median 9 · max 22 | median 7 · max 17 | median 8 · max 41 | not measured |
| steps per path (chain length) | median 10 · max 22 | median 8 · max 24 | median 9 · max 30 | not measured |
| path endings by kind | {'refusal': 440, 'framework': 128, 'success': 95, 'uncaught': 80} | {'refusal': 208, 'framework': 80, 'success': 54, 'uncaught': 49} | {'framework': 1266, 'refusal': 1567, 'success': 607, 'uncaught': 497} | not measured |
| deciding branches (callees whose arms change the exit) | 38 | 0 | 104 | not measured |
| switches (U8): binding · value · flag | {'binding': 79, 'flag': 82, 'value': 11} | {'flag': 1} | {'binding': 11} | not measured |
| collapsed calls, by reason | {'arms change neither exit nor commit': 40, 'arms differ only in the value returned': 2, 'constructor: builds a value': 50, 'generator: runs after the response line': 2, 'no value return': 7, 'one return': 149, 'swallowed by the caller': 2} | {'arms change neither exit nor commit': 27, 'arms differ only in the value returned': 2, 'constructor: builds a value': 31, 'no value return': 42, 'one return': 72} | {'arms change neither exit nor commit': 259, 'arms differ only in the value returned': 102, 'constructor: builds a value': 307, 'generator: runs after the response line': 3, 'no value return': 359, 'one return': 788, 'swallowed by the caller': 41, 'unresolved': 3} | not measured |

## effects

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| effects arm (U9 · U11) | commit sites 53 · catches 161 · races handled 4 / uncaught 20 · widenings {'W1': 1, 'W2': 54, 'W3': 5, 'W4': 2} · dependency gate open | commit sites 39 · catches 116 · races handled 1 / uncaught 8 · widenings {'W2': 25, 'W3': 2} · dependency gate open | commit sites 293 · catches 367 · races handled 3 / uncaught 17 · widenings {'W2': 51, 'W3': 6} · dependency gate closed: fastapi 0.133.1 < 0.136.1 | not measured |
| write steps on paths by bucket | {'committed': 625, 'maybe_committed': 8, 'rolled_back': 5, 'uncommitted': 188} | {'committed': 204, 'maybe_committed': 1244, 'rolled_back': 18, 'uncommitted': 6} | {'committed': 483, 'maybe_committed': 307, 'rolled_back': 3, 'uncommitted': 25} | not measured |
| catches on endpoint paths, by outcome | {'translate': 142, 'swallow': 7, 'pass-through': 12} | {'swallow': 51, 'translate': 54, 'pass-through': 11} | {'pass-through': 43, 'translate': 104, 'rethrow': 67, 'swallow': 136} | not measured |

## kinds

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| functions arm: forms · raises · refusals · roots | {'forms': 101, 'pairs': 635, 'raises': 45, 'reached': 381, 'refusals': 121, 'roots': 88, 'swallows': 4, 'translation': {'beyond one level': 9, 'mixed': 1, 'not joined': 5, 'translated': 24, 'untranslated': 6}, 'truncated': 13} | {'forms': 71, 'pairs': 259, 'raises': 13, 'reached': 168, 'refusals': 94, 'roots': 52, 'swallows': 1, 'translation': {'beyond one level': 9, 'translated': 1, 'untranslated': 3}, 'truncated': 2} | {'forms': 997, 'pairs': 7406, 'raises': 1027, 'reached': 2625, 'refusals': 330, 'roots': 575, 'swallows': 288, 'translation': {'after the response line': 2, 'beyond one level': 270, 'mixed': 2, 'not joined': 399, 'not reached by an endpoint': 77, 'translated': 260, 'untranslated': 17}, 'truncated': 1312} | not measured |
| background tasks | none | none | 46 tasks · {'celery': 46} · with a retry rule 2 · beat-triggered 25 | not measured |
| event handlers (bus) | 2 | 0 | 0 | not measured |

## short

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| schema/model/migration/setting/mirror | mirror pairs {'flag-pair': 1, 'flow': 48, 'orm': 83, 'sibling': 17} · verdicts {'agree': 195, 'disagree': 3, 'model-only': 6, 'schema-only': 11} · migrations raw_ops 7 · settings 45 (BaseSettings) | mirror pairs {'flow': 47, 'orm': 31} · verdicts {'agree': 91, 'disagree': 0, 'model-only': 4, 'schema-only': 14} · migrations raw_ops 82 · settings 38 (BaseSettings) | mirror pairs {'flow': 20, 'sibling': 24} · verdicts {'agree': 64, 'disagree': 2, 'model-only': 0, 'schema-only': 2} · migrations raw_ops 316 · settings 0 (partial — setting: no BaseSettings class in the project) | not measured |

## tests

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| tests arm (U14) | cases 1172 · act calls 332 · exits tested 122 of 576 · joins single 268 / ambiguous 34 | cases 1125 · act calls 403 · exits tested 96 of 301 · joins single 225 / ambiguous 52 | absent: no pytest junit under the results directory | absent: no endpoint forms to build on |

## frontend

| feature | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| frontend arm | query client @tanstack/query-core@5.100.6 · router createBrowserRouter · fetch hooks 57 · guards 4 · stores 1 {'memory': 1} · controls 480 (dead 27) · reason sites 12 · idioms unknown none | query client @tanstack/query-core@5.101.0 · router none · fetch hooks 57 · guards 3 · stores 4 {'memory': 3, 'partial': 1} · controls 200 (dead 0) · reason sites 3 · idioms unknown none | query client none · router none · fetch hooks 0 · guards 0 · stores 2 {'memory': 2} · controls 130 (dead 0) · reason sites 45 · idioms unknown none | query client none · router none · fetch hooks 0 · guards 0 · stores 0  · controls 29 (dead 5) · reason sites 1 · idioms unknown none |
| frontend findings | {'action-uncalled': 4, 'dead-control': 27, 'reason-collapsed': 2} | {'action-uncalled': 2} | {'action-uncalled': 8} | {'dead-control': 5} |

## slot fill — how many endpoints fill each station (the scorecard's empty-slot reading)

| slot | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| U3 guards | 62 (78%) | 43 (88%) | 446 (89%) | not measured |
| U7 refusals | 65 (81%) | 43 (88%) | 200 (40%) | not measured |
| K1 declares refusals | 0 (0%) | 0 (0%) | 0 (0%) | not measured |
| U6 paths | 80 (100%) | 49 (100%) | 497 (100%) | not measured |
| U8 switches | 79 (99%) | 1 (2%) | 9 (2%) | not measured |
| U9 writes on a path | 79 (99%) | 23 (47%) | 115 (23%) | not measured |
| U11 catches | 79 (99%) | 47 (96%) | 187 (37%) | not measured |
| U12 idempotency | 6 (8%) | 0 (0%) | 0 (0%) | not measured |
| K2 auth | 79 (99%) | 47 (96%) | 476 (95%) | not measured |
| K3 rate | 79 (99%) | 16 (33%) | 0 (0%) | not measured |
| K4 responses | 80 (100%) | 49 (100%) | 497 (100%) | not measured |
| U14 tests join | 60 (75%) | 43 (88%) | 0 (0%) | not measured |

## shared or unique — the categorical stations


By STATION KIND (a name-pattern grouping of the raw names listed further down — the grouping is the census author's, the counts are the feed's):


**in all three backends** (5)

- CORS middleware — gustify, gastify, tier3
- auth gate dependency — gustify, gastify, tier3
- effects widening — gustify, gastify, tier3
- session dependency — gustify, gastify, tier3
- store persistence: memory — gustify, gastify, tier3

**in two** (4)

- binding switch (a port with implementations) — gustify, tier3
- debug / seed controls — gustify, tier3
- flag switch (a setting gates a middleware) — gustify, gastify
- query client (TanStack) — gustify, gastify

**only in one** (23)

- access-log middleware — gastify
- background tasks — tier3
- bearer auth scheme — gustify
- captcha middleware — tier3
- client-ip middleware — tier3
- contract idiom — gustify
- event bus handlers — gustify
- idempotency claim (get-or-create) — gustify
- idempotency claim (savepoint) — gustify
- idempotency middleware — gustify
- permission-scoped gate — tier3
- rate limiter (decorator idiom) — gastify
- rate limiter (middleware class) — gustify
- rate-limit middleware — gustify
- request-id middleware — gastify
- router: createBrowserRouter — gustify
- settings dependency — gustify
- sso redirect dependency — tier3
- store persistence: partial — gastify
- tenant dependency — tier3
- usage / token limits dependency — tier3
- value switch (a setting chooses a value) — gustify
- vector-db precondition — tier3

### the raw names behind the kinds


**in all three backends** (4)

- effects widening:W2 — gustify, gastify, tier3
- effects widening:W3 — gustify, gastify, tier3
- middleware:CORSMiddleware — gustify, gastify, tier3
- store persistence:memory — gustify, gastify, tier3

**in two** (4)

- dependency:get_auth_context — gustify, gastify
- dependency:get_session — gustify, tier3
- query client:@tanstack/query-core — gustify, gastify
- switch:flag — gustify, gastify

**only in one** (51)

- auth scheme:HTTPBearer — gustify
- background tasks (celery/arq/taskiq) — tier3
- contract idiom:begin_nested — gustify
- contract idiom:get-or-create — gustify
- dependency:_check_bot_config_api_access — tier3
- dependency:_require_debug_enabled — tier3
- dependency:_require_seed_controls — gustify
- dependency:_resolve_verifier — gustify
- dependency:bearer_scheme — gustify
- dependency:check_api_key_usage — tier3
- dependency:check_token_rate_limits — tier3
- dependency:current_chat_accessible_user — tier3
- dependency:current_limited_user — tier3
- dependency:current_user — tier3
- dependency:get_async_session — tier3
- dependency:get_auth_context_from_query — gustify
- dependency:get_authorize_session — tier3
- dependency:get_current_tenant_id — tier3
- dependency:get_current_user — gastify
- dependency:get_db — gastify
- dependency:get_settings — gustify
- dependency:get_user_db — tier3
- dependency:get_user_manager — tier3
- dependency:optional_fastapi_current_user — tier3
- dependency:optional_user — tier3
- dependency:redirect_sso_errors_to_web — tier3
- dependency:require_permission — tier3
- dependency:require_vector_db — tier3
- dependency:scope_exempt — tier3
- effects widening:W1 — gustify
- effects widening:W4 — gustify
- event bus handlers — gustify
- idempotency idiom:begin_nested — gustify
- idempotency idiom:get-or-create — gustify
- middleware:AccessLogMiddleware — gastify
- middleware:CaptchaCookieMiddleware — tier3
- middleware:ClientIPMiddleware — tier3
- middleware:IdempotencyMiddleware — gustify
- middleware:LoginCaptchaMiddleware — tier3
- middleware:RateLimitMiddleware — gustify
- middleware:RequestIdMiddleware — gastify
- rate limiter:SlidingWindowLimiter — gustify
- rate limiter:limiter.limit — gastify
- rate limiter:limiter.shared_limit — gastify
- router:createBrowserRouter — gustify
- store persistence:partial — gastify
- switch:binding:CacheBackend — tier3
- switch:binding:FileStore — tier3
- switch:binding:LLM — tier3
- switch:binding:TokenVerifier — gustify
- switch:value — gustify
