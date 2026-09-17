#!/usr/bin/env python3
"""B14 census — READ-ONLY over the four arms-on feeds in the baseline cache; prints the markdown census-b14.md holds.

    python3 docs/design/element-forms/census-b14.py > docs/design/element-forms/census-b14.md

The feeds: `scripts/forms-dryrun.sh --arms all` writes ~/.cache/gabe-map-baselines/.check/<target>/forms.json. Nothing generated changes."""

import json, collections, statistics
from pathlib import Path
C = Path.home() / ".cache/gabe-map-baselines/.check"
T = ["gustify", "gastify", "tier3", "keypro"]
F = {t: json.loads((C / t / "forms.json").read_text()) for t in T}
NM = "not measured"

def n(x): return len(x) if isinstance(x, (dict, list)) else (x if x is not None else 0)
def pct(a, b): return f"{a} ({round(100*a/b)}%)" if b else "—"

rows = []   # (section, feature, {t: value}, note)
def add(sec, feat, vals, note=""): rows.append((sec, feat, vals, note))

# ── 1 · size ──
for t in T:
    f = F[t]
add("size", "endpoints (FastAPI)", {t: n(F[t].get("endpoints")) or ("none: " + F[t].get("reason", "") if not F[t].get("present") else 0) for t in T})
add("size", "functions carrying a fact", {t: n(F[t].get("functions")) for t in T})
add("size", "models · schemas · settings", {t: f"{n(F[t].get('models'))} · {n(F[t].get('schemas'))} · {n(F[t].get('settings'))}" for t in T})
add("size", "migration trees · revisions", {t: (lambda m: f"{m.get('trees','—')} · {m.get('revisions','—')}")(((F[t].get('arms') or {}).get('short') or {}).get('stats', {}).get('migration', {})) for t in T})
add("size", "test cases read (junit)", {t: (n(F[t].get("test_cases")) if F[t].get("test_cases") else (((F[t].get('arms') or {}).get('tests') or {}).get('reason') or NM)) for t in T})
add("size", "frontend pieces with a form", {t: n((F[t].get("frontend") or {}).get("pieces")) for t in T})

# ── 2 · the request edge: middleware · deps · auth · rate · idempotency ──
for t in T:
    mw = F[t].get("middleware") or {}
add("edge", "middleware stack (runs order · class · kind)", {t: " → ".join(f"{v.get('cls')} ({v.get('kind','?')})" for k, v in sorted((F[t].get("middleware") or {}).items(), key=lambda kv: (kv[1].get('order') or {}).get('runs', 0))) or ("—" if F[t].get("present") else NM) for t in T})
add("edge", "middleware with exits (refuses requests itself)", {t: ", ".join(v.get('cls') for v in (F[t].get("middleware") or {}).values() if v.get("exits")) or ("none" if F[t].get("present") else NM) for t in T})
def deps(t):
    d = F[t].get("dependencies") or {}
    return ", ".join(sorted(k.split("::")[-1] + (" ✚commits" if v.get("effects") else "") + (f" ×{v.get('applies_to')}" if v.get('applies_to') else "") for k, v in d.items())) or ("—" if F[t].get("present") else NM)
add("edge", "dependencies (name ✚commits ×endpoints)", {t: deps(t) for t in T})
def auth(t):
    eps = F[t].get("endpoints") or {}
    sch = collections.Counter(); gates = collections.Counter(); prov = 0
    for e in eps.values():
        a = e.get("auth") or {}
        for s in a.get("schemes") or []: sch[s.get("scheme") or s.get("name")] += 1
        for g in a.get("gates") or []: gates[g.get("name")] += 1
        prov += len(a.get("provisions") or [])
    if not eps: return NM
    return f"schemes {dict(sch) or '—'} · gates {dict(gates.most_common(4)) or '—'} · provisions {prov}"
add("edge", "auth (K2): schemes · gate deps · provisions", {t: auth(t) for t in T})
def rate(t):
    eps = F[t].get("endpoints") or {}
    if not eps: return NM
    cls = collections.Counter(); st = collections.Counter()
    for e in eps.values():
        r = e.get("rate") or {}
        st[r.get("state") or ("defined" if r.get("limits") else "missing")] += 1
        for l in r.get("limits") or []: cls[l.get("class") or l.get("idiom") or l.get("via") or "?"] += 1
    return f"{dict(st)} · limiter {dict(cls) or '—'}"
add("edge", "rate limit (K3): state per endpoint · limiter class", {t: rate(t) for t in T})
def repeat(t):
    eps = F[t].get("endpoints") or {}
    if not eps: return NM
    st = collections.Counter(); idi = collections.Counter(); carriers = collections.Counter()
    for e in eps.values():
        r = e.get("repeat") or {}
        st[r.get("state") or ("defined" if r.get("claims") or r.get("key") else "missing")] += 1
        for c in r.get("claims") or []:
            for i in c.get("idioms") or []: idi[i] += 1
        if (r.get("key") or {}).get("carrier"): carriers[r["key"]["carrier"]] += 1
    return f"{dict(st)} · key carrier {dict(carriers) or '—'} · idioms {dict(idi) or '—'}"
add("edge", "idempotency (U12): state per endpoint · key carrier · claim idioms", {t: repeat(t) for t in T})

# ── 3 · what the door decides: exits · paths · branches · switches ──
def decide(t):
    eps = F[t].get("endpoints") or {}
    if not eps: return {}
    prod = [len(e.get("produced") or []) for e in eps.values()]
    paths = [len(e.get("paths") or []) for e in eps.values()]
    steps = [len(p.get("chain") or []) for e in eps.values() for p in (e.get("paths") or [])]
    kinds = collections.Counter((p.get("exit") or {}).get("kind") for e in eps.values() for p in (e.get("paths") or []))
    br = sum(len(e.get("branches") or []) for e in eps.values())
    sw = collections.Counter(w.get("kind") for e in eps.values() for w in (e.get("switches") or []))
    decl = sum(1 for e in eps.values() if (e.get("declared") or {}).get("refusals"))
    st = collections.Counter((r.get("status") if r.get("status") is not None else "dynamic (" + (r.get("detail") or "app handler").replace(" handler", "") + ")") for e in eps.values() for r in (e.get("produced") or []))
    phases = collections.Counter(r.get("phase") for e in eps.values() for r in (e.get("produced") or []))
    return {"prod": prod, "paths": paths, "steps": steps, "kinds": dict(kinds), "branches": br, "switches": dict(sw), "declared_refusals": decl,
            "statuses": dict(sorted(st.items(), key=lambda kv: -kv[1])[:8]), "phases": dict(phases)}
D = {t: decide(t) for t in T}
def stat(xs): return f"median {statistics.median(xs):g} · max {max(xs)}" if xs else "—"
add("decides", "produced exits per endpoint", {t: stat(D[t].get("prod", [])) if D[t] else NM for t in T})
add("decides", "produced exits by phase", {t: D[t].get("phases") if D[t] else NM for t in T})
add("decides", "refusal statuses (top)", {t: D[t].get("statuses") if D[t] else NM for t in T})
add("decides", "endpoints declaring any refusal (K1)", {t: pct(D[t]["declared_refusals"], n(F[t].get("endpoints"))) if D[t] else NM for t in T})
add("decides", "paths per endpoint (U6)", {t: stat(D[t].get("paths", [])) if D[t] else NM for t in T})
add("decides", "steps per path (chain length)", {t: stat(D[t].get("steps", [])) if D[t] else NM for t in T})
add("decides", "path endings by kind", {t: D[t].get("kinds") if D[t] else NM for t in T})
add("decides", "deciding branches (callees whose arms change the exit)", {t: D[t].get("branches") if D[t] else NM for t in T})
add("decides", "switches (U8): binding · value · flag", {t: D[t].get("switches") or "none" if D[t] else NM for t in T})
add("decides", "collapsed calls, by reason", {t: ((F[t].get("arms") or {}).get("paths") or {}).get("stats", {}).get("collapsed") or NM for t in T})

# ── 4 · effects · failure ──
def eff(t):
    a = ((F[t].get("arms") or {}).get("effects") or {}); s = a.get("stats") or {}
    if not a.get("present"): return NM
    return f"commit sites {s.get('commit_sites')} · catches {s.get('catches')} · races handled {s.get('races',{}).get('handled',0)} / uncaught {s.get('races',{}).get('uncaught',0)} · widenings {s.get('widenings')} · dependency gate {s.get('dependency_gate')}"
add("effects", "effects arm (U9 · U11)", {t: eff(t) for t in T})
def buckets(t):
    eps = F[t].get("endpoints") or {}
    if not eps: return NM
    b = collections.Counter()
    for e in eps.values():
        for p in e.get("paths") or []:
            ef = p.get("effects") or {}
            for k in ("committed", "maybe_committed", "rolled_back", "uncommitted"): b[k] += len(ef.get(k) or [])
    return dict(b)
add("effects", "write steps on paths by bucket", {t: buckets(t) for t in T})
def catches(t):
    eps = F[t].get("endpoints") or {}
    if not eps: return NM
    o = collections.Counter(c.get("outcome") for e in eps.values() for c in ((e.get("failure") or {}).get("catches") or []))
    return dict(o) or "none"
add("effects", "catches on endpoint paths, by outcome", {t: catches(t) for t in T})

# ── 5 · services · tasks · handlers ──
def fns(t):
    s = ((F[t].get("arms") or {}).get("kinds") or {}).get("stats", {}).get("functions")
    return s or NM
add("kinds", "functions arm: forms · raises · refusals · roots", {t: fns(t) for t in T})
def tasks(t):
    tk = F[t].get("tasks") or {}
    if not tk: return "none" if F[t].get("present") else NM
    def lib_of(v): at = str((v.get("decorator") or {}).get("at") or v.get("at") or ""); return "celery" if "celery" in at else "arq" if "arq" in at else "taskiq" if "taskiq" in at else "?"
    lib = collections.Counter(lib_of(v) for v in tk.values())
    retry = sum(1 for v in tk.values() if (v.get("retry") or {}).get("sites") or (v.get("retry") or {}).get("max_retries") is not None)
    beat = sum(1 for v in tk.values() if any((tr.get("kind") or "") == "beat" for tr in (v.get("triggers") or [])))
    return f"{len(tk)} tasks · {dict(lib)} · with a retry rule {retry} · beat-triggered {beat}"
add("kinds", "background tasks", {t: tasks(t) for t in T})
add("kinds", "event handlers (bus)", {t: n(F[t].get("handlers")) if F[t].get("present") else NM for t in T})

# ── 6 · short forms ──
def short(t):
    a = ((F[t].get("arms") or {}).get("short") or {}); s = a.get("stats") or {}
    if not a.get("present"): return NM
    mi = s.get("mirror", {}); mg = s.get("migration", {})
    return f"mirror pairs {mi.get('pairs')} · verdicts {mi.get('verdicts')} · migrations raw_ops {mg.get('raw_ops')} · settings {n(F[t].get('settings'))} ({a.get('reason') or 'BaseSettings'})"
add("short", "schema/model/migration/setting/mirror", {t: short(t) for t in T})

# ── 7 · tests ──
def tests(t):
    a = ((F[t].get("arms") or {}).get("tests") or {}); s = a.get("stats") or {}
    if not a.get("present"): return a.get("reason") or NM
    return f"cases {s.get('cases')} · act calls {s.get('calls',{}).get('act')} · exits tested {s.get('exits',{}).get('tested')} of {s.get('exits',{}).get('total')} · joins single {s.get('joins',{}).get('single')} / ambiguous {s.get('joins',{}).get('ambiguous')}"
add("tests", "tests arm (U14)", {t: tests(t) for t in T})

# ── 8 · frontend ──
def fe(t):
    f = F[t].get("frontend") or {}; s = ((F[t].get("arms") or {}).get("frontend") or {}).get("stats") or {}
    if not f: return NM
    cl = (f.get("client") or {}).get("clients") or []
    lib = ", ".join(sorted({((c.get("library") or {}).get("package") or "?") + "@" + str((c.get("library") or {}).get("version") or "?") for c in cl})) or "none"
    routers = ", ".join(sorted({r.get("callee") or "?" for r in (f.get("routers") or [])})) or "none"
    stores = f.get("stores") or {}
    pers = collections.Counter(((v.get("persist") or {}).get("state") if isinstance(v.get("persist"), dict) else v.get("persist")) for v in stores.values()) if isinstance(stores, dict) else {}
    hk = s.get("hooks") or {}
    return f"query client {lib} · router {routers} · fetch hooks {hk.get('fetches', 0)} · guards {s.get('guards', 0)} · stores {len(stores)} {dict(pers) or ''} · controls {s.get('controls',{}).get('controls')} (dead {s.get('controls',{}).get('dead')}) · reason sites {len((f.get('reasons') or {}).get('sites') or [])} · idioms unknown {list((f.get('idioms') or {}).get('unknown') or {}) or 'none'}"
add("frontend", "frontend arm", {t: fe(t) for t in T})
def fefind(t):
    a = ((F[t].get("arms") or {}).get("frontend") or {}).get("stats", {})
    return a.get("findings") or ("none" if a else NM)
add("frontend", "frontend findings", {t: fefind(t) for t in T})

# ── 9 · slot fill per endpoint ──
SLOTS = [("U3 guards", lambda e: bool(e.get("preconditions"))), ("U7 refusals", lambda e: any(r.get("status", 0) and r["status"] >= 400 and r.get("phase") == "handler" for r in e.get("produced") or [])),
         ("K1 declares refusals", lambda e: bool((e.get("declared") or {}).get("refusals"))), ("U6 paths", lambda e: bool(e.get("paths"))),
         ("U8 switches", lambda e: bool(e.get("switches"))), ("U9 writes on a path", lambda e: any((p.get("effects") or {}).get("committed") or (p.get("effects") or {}).get("uncommitted") for p in e.get("paths") or [])),
         ("U11 catches", lambda e: bool((e.get("failure") or {}).get("catches"))), ("U12 idempotency", lambda e: (e.get("repeat") or {}).get("state") == "defined" or bool((e.get("repeat") or {}).get("claims"))),
         ("K2 auth", lambda e: (e.get("auth") or {}).get("state") == "defined" or bool((e.get("auth") or {}).get("schemes"))), ("K3 rate", lambda e: bool((e.get("rate") or {}).get("limits"))),
         ("K4 responses", lambda e: bool(e.get("responses"))), ("U14 tests join", lambda e: bool((e.get("tests") or {}).get("act")))]
fill = {}
for t in T:
    eps = F[t].get("endpoints") or {}
    fill[t] = {name: (sum(1 for e in eps.values() if fn(e)), len(eps)) for name, fn in SLOTS} if eps else None

# ── print ──
print("# B14 census — the wiring fingerprint of four applications, read from the arms-on element forms\n")
print("Read-only over `~/.cache/gabe-map-baselines/.check/<target>/forms.json` (the §A4 dry-run feeds, every arm on; heads " + " · ".join(f"{t} {F[t].get('head')}" for t in T) + "). ")
print("Nothing here is a verdict: it is the data the operator asked for first (backlog B14) — which STATIONS each app fills, with which idioms, so that 'common' and 'specialist' can be read off before any lens is chosen. `not measured` = the generator could not read it there (a closed gate, no junit, no backend), never a zero.\n")
sec = None
for s, feat, vals, note in rows:
    if s != sec:
        sec = s; print(f"\n## {s}\n\n| feature | " + " | ".join(T) + " |\n|---|" + "---|" * len(T))
    print(f"| {feat} | " + " | ".join(str(vals.get(t, '—')).replace('|', '¦') for t in T) + " |" + (f" {note}" if note else ""))
print("\n## slot fill — how many endpoints fill each station (the scorecard's empty-slot reading)\n")
print("| slot | " + " | ".join(T) + " |\n|---|" + "---|" * len(T))
for name, _ in SLOTS:
    print(f"| {name} | " + " | ".join((pct(*fill[t][name]) if fill[t] else NM) for t in T) + " |")
# ── common vs unique: categorical features ──
print("\n## shared or unique — the categorical stations\n")
cat = {}
for t in T:
    f = F[t]; s = set()
    for v in (f.get("middleware") or {}).values(): s.add("middleware:" + str(v.get("cls")))
    for k in (f.get("dependencies") or {}): s.add("dependency:" + k.split("::")[-1])
    for e in (f.get("endpoints") or {}).values():
        for sc in (e.get("auth") or {}).get("schemes") or []: s.add("auth scheme:" + str(sc.get("scheme")))
        for l in (e.get("rate") or {}).get("limits") or []: s.add("rate limiter:" + str(l.get("class") or l.get("idiom") or "?"))
        for c in (e.get("repeat") or {}).get("claims") or []:
            for i in c.get("idioms") or []: s.add("idempotency idiom:" + i)
        for w in e.get("switches") or []: s.add("switch:" + str(w.get("kind")) + (":" + str(w.get("port")) if w.get("port") else ""))
    st = ((f.get("arms") or {}).get("effects") or {}).get("stats", {})
    for w in (st.get("widenings") or {}): s.add("effects widening:" + w)
    for i in (((f.get("arms") or {}).get("contract") or {}).get("stats", {}).get("idioms") or {}): s.add("contract idiom:" + i)
    fe_ = f.get("frontend") or {}
    for c in (fe_.get("client") or {}).get("clients") or []: s.add("query client:" + str((c.get("library") or {}).get("package")))
    for r in fe_.get("routers") or []: s.add("router:" + str(r.get("callee")))
    for v in (fe_.get("stores") or {}).values() if isinstance(fe_.get("stores"), dict) else []: s.add("store persistence:" + str((v.get("persist") or {}).get("state") if isinstance(v.get("persist"), dict) else v.get("persist")))
    if f.get("tasks"): s.add("background tasks (celery/arq/taskiq)")
    if f.get("handlers"): s.add("event bus handlers")
    cat[t] = s
import re
KIND_RX = [("session dependency", r"dependency:(get_session|get_db|get_async_session|get_user_db)$"),
           ("auth gate dependency", r"dependency:(get_auth_context|get_current_user|current_user|current_limited_user|current_chat_accessible_user|optional_user|optional_fastapi_current_user|get_user_manager|bearer_scheme|_resolve_verifier|get_auth_context_from_query|get_authorize_session)$"),
           ("permission-scoped gate", r"dependency:require_permission$"), ("tenant dependency", r"dependency:get_current_tenant_id$"),
           ("settings dependency", r"dependency:get_settings$"), ("usage / token limits dependency", r"dependency:(check_api_key_usage|check_token_rate_limits)$"),
           ("debug / seed controls", r"dependency:(_require_seed_controls|_require_debug_enabled|_check_bot_config_api_access|scope_exempt)$"),
           ("vector-db precondition", r"dependency:require_vector_db$"), ("sso redirect dependency", r"dependency:redirect_sso_errors_to_web$"),
           ("CORS middleware", r"middleware:CORSMiddleware$"), ("rate-limit middleware", r"middleware:RateLimitMiddleware$"), ("idempotency middleware", r"middleware:IdempotencyMiddleware$"),
           ("request-id middleware", r"middleware:RequestIdMiddleware$"), ("access-log middleware", r"middleware:AccessLogMiddleware$"), ("captcha middleware", r"middleware:(LoginCaptcha|CaptchaCookie)Middleware$"),
           ("client-ip middleware", r"middleware:ClientIPMiddleware$"),
           ("bearer auth scheme", r"auth scheme:HTTPBearer$"), ("rate limiter (middleware class)", r"rate limiter:SlidingWindowLimiter$"), ("rate limiter (decorator idiom)", r"rate limiter:limiter\.(limit|shared_limit)$"),
           ("idempotency claim (savepoint)", r"idempotency idiom:begin_nested$"), ("idempotency claim (get-or-create)", r"idempotency idiom:get-or-create$"),
           ("contract idiom", r"contract idiom:"), ("effects widening", r"effects widening:"),
           ("binding switch (a port with implementations)", r"switch:binding"), ("value switch (a setting chooses a value)", r"switch:value$"), ("flag switch (a setting gates a middleware)", r"switch:flag$"),
           ("background tasks", r"background tasks"), ("event bus handlers", r"event bus handlers"),
           ("query client (TanStack)", r"query client:@tanstack"), ("query client: none read", r"query client:None"), ("router: createBrowserRouter", r"router:createBrowserRouter"),
           ("store persistence: memory", r"store persistence:memory"), ("store persistence: partial", r"store persistence:partial")]
def kind_of(feat):
    for k, rx in KIND_RX:
        if re.match(rx, feat): return k
    return "other: " + feat
catk = {t: {kind_of(f) for f in cat[t]} for t in T}
allk = sorted(set().union(*catk.values()))
print("\nBy STATION KIND (a name-pattern grouping of the raw names listed further down — the grouping is the census author's, the counts are the feed's):\n")
gk = collections.OrderedDict((k, []) for k in ("in all three backends", "in two", "only in one"))
for feat in allk:
    who = [t for t in T if feat in catk[t]]
    key = "in all three backends" if all(t in who for t in ("gustify", "gastify", "tier3")) else ("in two" if len(who) >= 2 else "only in one")
    gk[key].append((feat, who))
for g, items in gk.items():
    print(f"\n**{g}** ({len(items)})\n")
    for feat, who in items: print(f"- {feat} — {', '.join(who)}")
print("\n### the raw names behind the kinds\n")
allf = sorted(set().union(*cat.values()))
groups = collections.OrderedDict((k, []) for k in ("in all three backends", "in two", "only in one"))
for feat in allf:
    who = [t for t in T if feat in cat[t]]
    key = "in all three backends" if all(t in who for t in ("gustify", "gastify", "tier3")) else ("in two" if len(who) >= 2 else "only in one")
    groups[key].append((feat, who))
for g, items in groups.items():
    print(f"\n**{g}** ({len(items)})\n")
    for feat, who in items: print(f"- {feat} — {', '.join(who)}")
