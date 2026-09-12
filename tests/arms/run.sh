#!/usr/bin/env bash
# Arms register battery (extractor-gateway plan, step 2) — the executable contract of
# _a3_stacks.REGISTER and _a3_code.probe().
#
# The register exists so a later census can tell "this app has none" apart from "nobody wrote a
# detector for this app's idiom". That only holds if the register REPORTS and never SELECTS, so the
# load-bearing assertion here is the mutation one: force every probe to zero and the emitted feeds
# must not move by a byte. A register that could gate a producer would be a new failure mode, not a
# new honesty.
# Also pinned: the concept vocabulary is closed, declared archmap keys are real, probe never raises,
# and the center's OWN machinery is never mistaken for the project (the generators under scripts/
# are full of APIRouter/Depends/table=True — scanning them probed a Next.js app positive for
# FastAPI on all nine concepts before the skip roster was aligned).
# Hermetic: synthetic trees + one lab build. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

# ── 1 · the register itself ──────────────────────────────────────────────────
if (cd "$GEN" && python3 - <<'PY'
import sys
import _a3_stacks as S
import _a3_code as C

assert S.REGISTER, "register is empty"
# the vocabulary is CLOSED: a row may not invent a concept the census cannot name
vocab = set(S.CONCEPTS)
for row in S.REGISTER:
    assert row.concepts, f"{row.name} claims nothing"
    unknown = set(row.concepts) - vocab
    assert not unknown, f"{row.name} claims unknown concept(s) {unknown}"
    assert row.lang in ("py", "ts", "*"), f"{row.name} has odd lang {row.lang!r}"
# resolve() returns EVERY claimant, never one winner — the refusal of winner-take-all
assert len(S.resolve("request_roots")) >= 2, "request_roots must have several arms"
assert S.resolve("no_such_concept") == (), "an unclaimed concept resolves empty, not to a default"
# a concept with no row is the state the census reports; today every declared one has an arm
for c in S.CONCEPTS:
    assert S.resolve(c), f"{c} is in the vocabulary with no arm — declare it or drop it"
# PSEUDO_ROOTS are the non-URL methods; they must not collide with HTTP verbs
assert S.PSEUDO_ROOTS.isdisjoint({"GET","POST","PUT","PATCH","DELETE"}), "pseudo-root shadows a verb"
# the helpers every consumer uses INSTEAD of a literal roster — the literals are what silently
# excluded ACTION from five sites written before it existed
assert S.is_pseudo("ACTION") and S.is_pseudo("task") and not S.is_pseudo("GET")
assert not S.path_is_url("ACTION"), "a server action's path is a NAME, never a URL"
assert S.path_is_url("POST") and S.node_is_pseudo("endpoint:ACTION login")
assert not S.node_is_pseudo("endpoint:GET /login")
# a SKILL cannot import a generator across the install boundary, so draft-workflows MIRRORS the
# roster. Drift between the two is exactly how ACTION got excluded from five sites — pin it.
# The path is derived from this module's own location, never written out: a shipped surface that
# names one machine is a portability failure (suite-doctor P6).
import re as _re, pathlib as _pl
_p = _pl.Path.cwd().parents[2] / "skills" / "gabe-cc-update" / "scripts" / "draft-workflows.py"
assert _p.exists(), f"draft-workflows.py not where expected: {_p}"
_m = _re.search(r'PSEUDO_ROOTS = frozenset\(\{([^}]*)\}\)', _p.read_text())
assert _m, "draft-workflows lost its mirrored roster"
_mirror = {x.strip().strip('"\'') for x in _m.group(1).split(",") if x.strip()}
assert _mirror == set(S.PSEUDO_ROOTS), f"roster drift: {_mirror} vs {set(S.PSEUDO_ROOTS)}"
# what _a3_code claims it can probe must match what it declares
assert set(C.CONCEPTS) <= vocab, "module CONCEPTS drifted from the register vocabulary"
for c in C.CONCEPTS:
    assert any(r.module == "_a3_code" and c in r.concepts for r in S.REGISTER), \
        f"_a3_code probes {c} but no register row says so"
print("ok")
PY
) >/dev/null 2>&1; then ok; else bad "register: vocabulary/claims contract"; fi

# ── 2 · probe is honest and never raises ─────────────────────────────────────
mkdir -p "$T/empty" "$T/py/app" "$T/center/scripts" "$T/center/docs/site/center"
printf 'from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/x")\ndef x(): ...\n' > "$T/py/app/api.py"
# a repo that ADOPTED the center: its only .py files are the generators themselves
printf 'from fastapi import APIRouter\nDepends(\ntable=True\n' > "$T/center/scripts/_a3_code.py"
printf 'APIRouter Depends( table=True\n' > "$T/center/docs/site/center/x.py"
if (cd "$GEN" && python3 - "$T" <<'PY'
import sys, pathlib
import _a3_code as C
T = pathlib.Path(sys.argv[1])

C.reset_caches()
e = C.probe("request_roots", T / "empty")
assert e["scanned"] == 0 and e["matched"] == 0, e
assert e["reason"], "an empty tree must SAY why it found nothing"

C.reset_caches()
p = C.probe("request_roots", T / "py")
assert p["scanned"] == 1 and p["matched"] == 1, p
assert p["evidence"] == ["app/api.py"], p
assert p["reason"] == "", "a match needs no excuse"

# the center's own machinery is NOT the project
C.reset_caches()
c = C.probe("request_roots", T / "center")
assert c["scanned"] == 0 and c["matched"] == 0, f"center machinery counted as project code: {c}"
assert "no .py file" in c["reason"], c

# an unclaimed concept says so rather than guessing
C.reset_caches()
u = C.probe("fe_structure", T / "py")
assert u["matched"] == 0 and "not claimed" in u["reason"], u

# a missing tree does not raise
C.reset_caches()
m = C.probe("tables", T / "nope")
assert m["scanned"] == 0 and isinstance(m["reason"], str), m

# evidence is capped
C.reset_caches()
big = T / "big"; big.mkdir()
for i in range(9):
    (big / f"m{i}.py").write_text("from fastapi import APIRouter\n@router.get('/')\ndef f(): ...\n")
b = C.probe("request_roots", big)
assert b["matched"] == 9 and len(b["evidence"]) == 5, b
print("ok")
PY
) >/dev/null 2>&1; then ok; else bad "probe: honest-empty · skip roster · cap · never raises"; fi

# ── 3 · the census: every state word, on a tree built to earn it ─────────────
mkdir -p "$T/c/py" "$T/c/ts"
printf 'from fastapi import APIRouter\nrouter = APIRouter()\n' > "$T/c/py/api.py"
printf 'const sql = "CREATE TABLE users (id int)";\nexport const x = sql;\n' > "$T/c/ts/schema.ts"
printf 'export const y = 1;\n' > "$T/c/ts/other.ts"   # a SECOND file, so a cap of 1 can actually truncate
if (cd "$GEN" && python3 - "$T" <<'CENSUSPY'
import sys, pathlib
import _a3_arms as A
import _a3_code as C
T = pathlib.Path(sys.argv[1])

def ents(**kw): return {"entities": {"e": {"endpoints": [], "models": [], "schemas": [], **kw}}}

# PRESENT — produced records, whatever the probe thinks
C.reset_caches()
o = A.census({"entities": {"e": {"endpoints": [{"method": "GET", "path": "/x"}],
                                 "models": [], "schemas": []}}}, T / "c" / "py")
assert o["concepts"]["request_roots"]["state"] == "present", o["concepts"]["request_roots"]

# UNMATCHED via SENTINEL — the concept is plainly in the tree, in an idiom no arm reads.
# This is the keypro state: CREATE TABLE inside a string literal, 0 tables drawn.
C.reset_caches()
o = A.census(ents(), T / "c" / "ts")
t = o["concepts"]["tables"]
assert t["state"] == "unmatched", t
assert t["sentinel"]["hits"] == 1 and t["sentinel"]["files"] == ["schema.ts"], t
assert "no registered arm reads that idiom" in t["reason"], t

# UNSUPPORTED_LANGUAGE — arms cover py, the tree is ts, so nothing COULD be read
C.reset_caches()
o = A.census(ents(), T / "c" / "ts")
assert o["concepts"]["mounts"]["state"] == "unsupported_language", o["concepts"]["mounts"]
assert "nothing here could be read" in o["concepts"]["mounts"]["reason"]

# EMPTY — the honest zero: the arm ran over real py, its idiom is absent, no sentinel
C.reset_caches()
o = A.census(ents(), T / "c" / "py")
q = o["concepts"]["queues"]
assert q["state"] == "empty", q
assert q["reason"], "even an honest zero states what it looked for"

# UNMATCHED via a BROKEN ARM — the arm's own idiom is right there and it produced nothing.
# tier3 reads pydantic in 366 files and emits 0 schemas; that must not render as a clean zero.
C.reset_caches()
(T / "c" / "py" / "schema.py").write_text("from pydantic import BaseModel\nclass S(BaseModel): pass\n")
o = A.census(ents(), T / "c" / "py")
sc = o["concepts"]["schemas"]
assert sc["state"] == "unmatched", sc
assert "EMPTY arm, not a clean one" in sc["reason"], sc

# IMPLIES — one arm works, its dependent silently does not
C.reset_caches()
o = A.census({"entities": {"e": {"endpoints": [], "schemas": [],
                                 "models": [{"cls": "W", "table": "w"}]}}}, T / "c" / "py")
assert any("access produced none" in n for n in o.get("implies", [])), o.get("implies")

# the c4-side arms are POINTED AT, never duplicated — one truth, one place
assert set(A.ELSEWHERE) == {"call_graph", "fetch_bridge", "fe_structure"}
assert not (set(o["concepts"]) & set(A.ELSEWHERE)), "a c4 arm was measured twice"

# a capped walk must never yield a confident unsupported_language
C.reset_caches()
old = A._SENTINEL_FILE_CAP
try:
    A._SENTINEL_FILE_CAP = 1
    o = A.census(ents(), T / "c" / "ts")
    assert o["capped"] is True, o
    assert o["concepts"]["mounts"]["state"] != "unsupported_language", \
        "a partial language census must not declare a concept unsupported"
finally:
    A._SENTINEL_FILE_CAP = old

# a census failure must never raise into the build
C.reset_caches()
o = A.census({}, T / "nope")
assert isinstance(o, dict) and o["concepts"], o
print("ok")
CENSUSPY
) >/dev/null 2>&1; then ok; else bad "census: state words · sentinel · implies · cap safety"; fi

# ── 4 · THE LOAD-BEARING ONE: the register cannot select ─────────────────────
# Build a real project twice — once normally, once with EVERY probe forced to zero. If a probe
# could ever gate a producer, the feeds would move. They must not.
SRC="$REPO/tests/arms/_fixture"
if [ -d "$SRC" ]; then
  # the fixture ships WITHOUT a .git (a nested repo inside the suite reads as a submodule);
  # the build needs one, so it is created here, in the temp copy
  LAB="$T/lab"; mkdir -p "$LAB"; cp -r "$SRC"/. "$LAB"/
  ( cd "$LAB" && git init -q && git config user.email t@t && git config user.name t \
      && git add -A && git commit -q -m fixture )
  A="$T/outA"; B="$T/outB"
  ( cd "$GEN" && GABE_REPO_ROOT="$LAB" GABE_CENTER_OUT="$A" GABE_GRAFT_BUILD=0 python3 build_center_a3.py ) >"$T/buildA.log" 2>&1
  mkdir -p "$T/gz"; cp "$GEN"/*.py "$T/gz/" 2>/dev/null
  python3 - "$T/gz/_a3_code.py" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
s = s.replace('def probe(concept: str, repo: Path) -> dict:',
              'def probe(concept: str, repo: Path) -> dict:\n'
              '    return {"scanned": 0, "matched": 0, "evidence": [], "reason": "forced"}\n'
              'def _probe_real(concept: str, repo: Path) -> dict:', 1)
open(p, "w").write(s)
PY
  ( cd "$T/gz" && GABE_REPO_ROOT="$LAB" GABE_CENTER_OUT="$B" GABE_GRAFT_BUILD=0 python3 build_center_a3.py ) >"$T/buildB.log" 2>&1
  NORM='s/[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?Z?//g'
  # a build that emitted NOTHING would make the loop below vacuous and the proof a false green
  nA=$(find "$A" -type f 2>/dev/null | wc -l); nB=$(find "$B" -type f 2>/dev/null | wc -l)
  if [ "$nA" -lt 10 ] || [ "$nB" -lt 10 ]; then
    bad "cannot-select proof is VACUOUS — builds emitted $nA / $nB files (see $A/.build.log)"
  fi
  # archmap.json carries the arms block, which REFLECTS the probes by design — strip it, or this
  # test would demand that the census have no effect, which is the opposite of the point. Every
  # other byte of every other file must be untouched.
  strip_arms() { python3 -c 'import json,sys
d=json.load(open(sys.argv[1])); d.pop("arms", None)
print(json.dumps(d, sort_keys=True, indent=1))' "$1" 2>/dev/null || cat "$1"; }
  d=0
  for f in $(cd "$A" && find . -type f | sort); do
    if [ "$f" = "./archmap.json" ]; then
      diff -q <(strip_arms "$A/$f" | sed -E "$NORM") <(strip_arms "$B/$f" | sed -E "$NORM") >/dev/null 2>&1 \
        || { d=$((d+1)); echo "    moved: $f (outside the arms block)"; }
    else
      diff -q <(sed -E "$NORM" "$A/$f") <(sed -E "$NORM" "$B/$f") >/dev/null 2>&1 || { d=$((d+1)); echo "    moved: $f"; }
    fi
  done
  if [ "$d" = 0 ]; then ok; echo "  cannot-select: $nA file(s) compared, 0 moved with every probe forced to zero"
  else bad "REGISTER SELECTED: $d of $nA file(s) moved when every probe was forced to zero"; fi
else
  echo "  note: no tests/arms/_fixture — the cannot-select proof is covered by scripts/map-baseline.sh check"
  ok
fi

# ── 5 · derivations declare what they NEED (step 7) ──────────────────────────
# Three graft derivations return {} when the ORM access map is empty. That is correct and was
# indistinguishable from "nothing here writes" — on a raw-SQL app the station painted a FLAT
# write-heat gradient that read as a finding. Each now records what it lacked.
if (cd "$GEN" && python3 - <<'NEEDSPY'
import _a3_graft as G
assert set(G.DERIVED_NEEDS) == {"endpoint_access", "fn_roles", "distance_to_write"}
for name, needs in G.DERIVED_NEEDS.items():
    assert needs == ("access",), f"{name} declares {needs}"
# the three still return {} with no access map — the BEHAVIOUR is unchanged, only the record is new
assert G.derive_fn_roles({}, None) == {}
assert G.derive_distance_to_write({}, None) == {}
print("ok")
NEEDSPY
) >/dev/null 2>&1; then ok; else bad "derivations: DERIVED_NEEDS contract"; fi


# ── SELF-EDGES never enter the behind/d2w/roles substrate (phase 1) ───────────────────────────
# graft's same-file resolver takes the first match with no not-the-caller guard, so
# `return (await this.pool()).query(sql)` inside `query` resolves to `query` itself — 979 such
# edges across the four study repos, all at `extracted`, its HIGHEST confidence. The three
# call-edge builders already filtered them; _behind_context did not, and each one minted a
# `behind` record of {fns: 0, depth: 0} — an empty entry where honest-empty says there is none.
if (cd "$GEN" && python3 - <<'SLPY'
import _a3_graft as G
W = {"nodes": [{"id": "a.py#f", "kind": "function", "path": "a.py", "span": "L1-L9"},
               {"id": "a.py#g", "kind": "function", "path": "a.py", "span": "L10-L19"}],
     "edges": [{"source": "a.py#f", "target": "a.py#f", "relation": "calls", "confidence": "extracted"},
               {"source": "a.py#f", "target": "a.py#g", "relation": "calls", "confidence": "extracted"}]}
ids, adj = G._behind_context(W)
assert adj.get("a.py#f") == ["a.py#g"], f"a self-edge entered the adjacency: {adj}"
b = G.derive_fn_behind(W)
assert "a.py#g" not in b, "a leaf must carry NO behind record"
assert b.get("a.py#f", {}).get("fns") == 1, f"the real callee still counts: {b.get('a.py#f')}"
# a self-edge ALONE must mint nothing — the empty {fns:0, depth:0} record is the defect
W2 = {"nodes": [{"id": "a.py#f", "kind": "function", "path": "a.py", "span": "L1-L9"}],
      "edges": [{"source": "a.py#f", "target": "a.py#f", "relation": "calls", "confidence": "extracted"}]}
assert G.derive_fn_behind(W2) == {}, f"a self-edge alone minted a behind record: {G.derive_fn_behind(W2)}"
print("ok")
SLPY
) >/dev/null 2>&1; then ok; else bad "self-edges must not enter the behind/d2w/roles substrate"; fi


# ── PHASE 2 · the op record, and the two consumers a None broke ──────────────────────────────
if (cd "$GEN" && python3 - <<'P2PY'
import pathlib, tempfile
import _a3_stacks_sql as S
import _a3_graft as G

T = pathlib.Path(tempfile.mkdtemp()) / "r"; (T / "db").mkdir(parents=True)
(T / "db" / "s.ts").write_text(
    'export const A = `CREATE TABLE users (id TEXT);`;\n'
    'export const B = `CREATE TABLE sessions (id TEXT);`;\n'
    'export async function w() {\n'
    '  await pool.query("INSERT INTO users (id) VALUES ($1)");\n'
    '  await pool.query("INSERT INTO sessions (id) VALUES ($1)");\n'
    '}\n')
ops = S.parse(T)["access"]["db/s.ts"]
# `model` carries the TABLE, never None: 81 consumers read it as a string and three crashed on None
assert all(o["model"] == o["table"] for o in ops), ops
assert all(o["model"] for o in ops), "a None model collapses every raw-SQL op into one key"
# two tables, two ops — keyed apart
assert {(o["table"], o["rw"]) for o in ops} == {("users", "w"), ("sessions", "w")}, ops

# the endpoint rollup must key on the TABLE, so two tables do not collapse into one write
W = {"nodes": [{"id": "h.py#handler", "kind": "function", "path": "h.py", "span": "L1-L9"},
               {"id": "h.py#writer", "kind": "function", "path": "h.py", "span": "L10-L19"}],
     "edges": [{"source": "h.py#handler", "target": "h.py#writer", "relation": "calls",
                "confidence": "extracted"}]}
ents = {"e": {"files": [["api", "h.py", 20]],
              "endpoints": [{"method": "GET", "path": "/x", "fn": "handler", "file": "h.py"}]}}
# a tree MIXING an ORM row (model set) with a raw-SQL row at the same rw — the sort used to raise
fa = {"h.py::writer": {"ops": [{"model": "Order", "table": "orders", "rw": "w"},
                               {"model": None, "table": "users", "rw": "w"}], "commits": True}}
ea = G.derive_endpoint_access(W, ents, fa)
rec = ea["h.py#handler"]
assert len(rec["ops"]) == 2, f"two tables collapsed into one op: {rec['ops']}"
assert {o["table"] for o in rec["ops"]} == {"orders", "users"}, rec["ops"]
print("ok")
P2PY
) >/dev/null 2>&1; then ok; else bad "phase 2: op record carries its table · two tables never collapse · mixed rows sort"; fi

# a CLAIMED root must fold into ITS OWN entity, or the endpoint rollup never runs for it
if (cd "$GEN" && python3 - <<'P2BPY'
import _a3_graft as G
W = {"nodes": [{"id": "t.py#task_a", "kind": "function", "path": "t.py", "span": "L1-L9"},
               {"id": "t.py#inner", "kind": "function", "path": "t.py", "span": "L10-L19"}],
     "edges": [{"source": "t.py#task_a", "target": "t.py#inner", "relation": "calls",
                "confidence": "extracted"}]}
ents = {"owned": {"files": [["api", "t.py", 30]], "endpoints": []}}
roots = [{"method": "TASK", "path": "a", "fn": "task_a", "file": "t.py",
          "touches": [], "touches_x": [], "doc": "", "resp": "-", "status": "-"}]
arm = G.graft_arm.__wrapped__ if hasattr(G.graft_arm, "__wrapped__") else None
# exercise the fold the way graft_arm does, then prove the rollup reaches the claimed root
f2s = G._file2slug(ents)
b = dict(ents)
for r in roots:
    sl = f2s.get(r["file"])
    if sl and b.get(sl):
        e = dict(b[sl]); eps = list(e.get("endpoints") or [])
        if not any((x or {}).get("fn") == r.get("fn") for x in eps):
            e["endpoints"] = eps + [r]; b[sl] = e
assert b["owned"]["endpoints"], "a claimed root was left out of its own entity"
bh = G.derive_behind(W, b)
assert "t.py#task_a" in bh, f"no behind rollup for the claimed root: {bh}"
assert bh["t.py#task_a"]["fns"] == 1, bh["t.py#task_a"]
print("ok")
P2BPY
) >/dev/null 2>&1; then ok; else bad "phase 2: a CLAIMED root folds into its own entity so its rollup runs"; fi

echo "arms: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
