#!/usr/bin/env bash
# entity_shape battery — the URL-domain ↔ entity-model cross-tab (pure function).
# Hermetic (synthetic endpoints, no project, python-stdlib only), zero-arg. Proves
# the two defects the tracing tool cares about are DETECTED and their absence stays
# silent: an ORPHAN domain (a URL surface only an aspect claims) and an ASPECT
# entity (co-claims many domains, solely-owns almost none). Mutation-proven — a
# checker that cannot fail is non-evidence. Doctor auto-runs it.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
SCR="$DIR/../../skills/gabe-pulse/scripts"
python3 - "$SCR" <<'PY'
import sys
sys.path.insert(0, sys.argv[1])
import json
from entity_shape import entity_shape, one_line, diff_new_routes, classify_new_routes
p = f = 0
def ck(c, m):
    global p, f
    if c: p += 1
    else: f += 1; print("  FAIL:", m)

# CLEAN model — three domains, each solely owned by a distinct DOMAIN entity
CLEAN = [
    {"path": "/orders",        "entity": "orders"},
    {"path": "/orders/{id}",   "entity": "orders"},
    {"path": "/users",         "entity": "users"},
    {"path": "/carts",         "entity": "carts"},
]
c = entity_shape(CLEAN)
ck(c["orphans"] == [], "clean model has NO orphan domains")
ck(c["aspects"] == [], "clean model has NO aspect entities")
ck(one_line(c) == "", "clean model: the pulse line stays SILENT")
ck(c["coverage"]["domains"] == 3, "coverage counts the 3 domains")

# ASPECT — 'audit' co-claims orders/users/carts (3) and solely-owns nothing
ASPECT = CLEAN + [
    {"path": "/orders", "entity": "audit"},
    {"path": "/users",  "entity": "audit"},
    {"path": "/carts",  "entity": "audit"},
]
a = entity_shape(ASPECT)
_asp = [x for x in a["aspects"] if x["entity"] == "audit"]
ck(len(_asp) == 1 and set(_asp[0]["co_claims"]) == {"orders", "users", "carts"} and _asp[0]["sole_owns"] == [],
   "an entity co-claiming 3 domains / solely-owning 0 is flagged ASPECT")
ck(a["orphans"] == [], "an aspect that co-claims real domains creates no orphan on its own")

# ORPHAN — '/secrets' is claimed ONLY by the aspect => no domain entity owns it;
# the url_domain_map groups the naked segment into a nicer candidate
ORPHAN = ASPECT + [{"path": "/secrets", "entity": "audit"}]
o = entity_shape(ORPHAN, url_domain_map={"secrets": "vault"})
_orph = [x for x in o["orphans"] if x["domain"] == "secrets"]
ck(len(_orph) == 1 and _orph[0]["claimed_by"] == ["audit"] and _orph[0]["candidate"] == "vault",
   "a domain only an aspect claims is an ORPHAN; the map names its candidate")
ck("/secrets orphaned" in one_line(o) and "audit is an aspect" in one_line(o),
   "the pulse line names both the orphan and the aspect")

# verbatim fallback — a domain absent from the map keeps its own segment
o2 = entity_shape(ORPHAN)   # no map
ck([x for x in o2["orphans"] if x["domain"] == "secrets"][0]["candidate"] == "secrets",
   "candidate falls back to the verbatim segment when the map has no entry")

# COVERAGE — an unclaimed route (entity None) is counted, never crashes
COV = CLEAN + [{"path": "/loose", "entity": None}, {"path": "/loose2", "entity": ""}]
cov = entity_shape(COV)
ck(cov["coverage"]["unclaimed_endpoints"] == 2, "unclaimed routes are counted in coverage")

# DETERMINISM — byte-identical across two independent computes
ck(json.dumps(entity_shape(ORPHAN), sort_keys=True) == json.dumps(entity_shape(ORPHAN), sort_keys=True),
   "deterministic (byte-identical output)")

# MUTATION — drop the aspect's co-claims (audit now solely-owns /secrets only):
# it is no longer an aspect, so /secrets is owned by a domain entity => NO orphan.
MUT = CLEAN + [{"path": "/secrets", "entity": "audit"}]
m = entity_shape(MUT, url_domain_map={"secrets": "vault"})
ck(m["aspects"] == [] and "audit" not in {x["entity"] for x in m["aspects"]},
   "MUTATION: without ≥3 co-claims, the entity is NOT an aspect")
ck(m["orphans"] == [],
   "MUTATION: a domain owned by a NON-aspect entity is not an orphan")
ck(len([x for x in o["orphans"] if x["domain"] == "secrets"]) == 1,
   "MUTATION control: the same domain WAS an orphan while audit was an aspect")

# OWNED — the complement of orphans: domains a real domain entity holds
ck(set(entity_shape(CLEAN)["owned"]) == {"orders", "users", "carts"},
   "owned = every domain a domain entity holds (clean model)")
ck("secrets" not in entity_shape(ORPHAN, url_domain_map={"secrets": "vault"})["owned"],
   "an orphan domain is NOT in owned")

# DIFF MODE — new routes on added (+) lines; a route in an UNOWNED domain drifts
DIFF = "\n".join([
    "+++ b/api/x.py",
    '+@router.post("/secrets/rotate")',       # unowned domain -> drift
    '+    @app.get("/orders/{id}/audit")',    # owned domain -> silent
    '-@router.get("/old/removed")',           # a REMOVED route is not new
])
routes = diff_new_routes(DIFF)
ck(("POST", "/secrets/rotate") in routes and ("GET", "/orders/{id}/audit") in routes,
   "diff_new_routes extracts added route decorators (method + path)")
ck(("GET", "/old/removed") not in routes, "a REMOVED (-) route is not counted as new")
_sh = entity_shape(ORPHAN, url_domain_map={"secrets": "vault"})
drift = classify_new_routes(routes, _sh["owned"], _sh["orphans"], {"secrets": "vault"})
ck(len(drift) == 1 and drift[0]["path"] == "/secrets/rotate" and drift[0]["candidate"] == "vault",
   "classify_new_routes flags ONLY the route in an unowned domain, with its candidate")
ck(all(d["domain"] != "orders" for d in drift),
   "a new route in an OWNED domain (/orders) is silent — it has a home")

print(f"entity-drift battery: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
