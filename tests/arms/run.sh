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

# ── 3 · THE LOAD-BEARING ONE: the register cannot select ─────────────────────
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
  d=0
  for f in $(cd "$A" && find . -type f | sort); do
    diff -q <(sed -E "$NORM" "$A/$f") <(sed -E "$NORM" "$B/$f") >/dev/null 2>&1 || { d=$((d+1)); echo "    moved: $f"; }
  done
  if [ "$d" = 0 ]; then ok; echo "  cannot-select: $nA file(s) compared, 0 moved with every probe forced to zero"
  else bad "REGISTER SELECTED: $d of $nA file(s) moved when every probe was forced to zero"; fi
else
  echo "  note: no tests/arms/_fixture — the cannot-select proof is covered by scripts/map-baseline.sh check"
  ok
fi

echo "arms: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
