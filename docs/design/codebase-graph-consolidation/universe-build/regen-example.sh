#!/usr/bin/env bash
# regen-example.sh — ONE command regenerates (or drift-checks) the ENTIRE committed
# codebase-graph-station example estate from scratch. No session memory required.
#
#   bash regen-example.sh              # rebuild everything, land it, run the batteries
#   bash regen-example.sh --check      # byte-compare a fresh regen vs the committed estate (writes nothing)
#   GABE_TWIN=<repo> bash regen-example.sh   # default twin: /home/khujta/projects/apps/gustify
#
# WHAT THE ESTATE IS (templates/center/shell/example/codebase-graph-station/):
#   c4-graph.js · levels.js · levels.json · sim-archive.js   ← emitted by ONE twin-read-only build
#   sim.data.js                                              ← FROZEN-SEEDED (arch-graph-lab fixture;
#                                                              the build emits the null stub — NEVER ship it:
#                                                              commit 77fe3cd shipped the stub by mistake)
#   gabe-universe.html                                       ← assemble.py + fill-example.py (parts/ are source)
#   codebase-graph.html                                      ← $TMP page with assets rehomed ../../assets/
#   + templates/center/shell/gabe-universe.html              ← the LANDED station (same assembled page, shell tokens)
#
# A fresh machine additionally needs the proof workspace once:
#   docs/design/graft-adoption/spike/README.md §"Rebuild the bundle" (playwright-core + system chrome).
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd ../../../.. && pwd)"
TWIN="${GABE_TWIN:-/home/khujta/projects/apps/gustify}"
EX="$ROOT/templates/center/shell/example/codebase-graph-station"
CHECK=0; [ "${1:-}" = "--check" ] && CHECK=1
[ -d "$TWIN" ] || { echo "FAIL: twin not found at $TWIN (set GABE_TWIN)"; exit 1; }

# 1 · the twin-read-only build → every data feed, in one pass (the twin's tree is never written)
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
echo "── build (twin-read-only, GABE_GRAFT_BUILD=0 → twin tree untouched): $TWIN → $TMP"
GABE_GRAFT_BUILD=0 \
GABE_REPO_ROOT="$TWIN" \
GABE_CONFIG="$TWIN/docs/site/center/center.config.json" \
GABE_SHELL_SRC="$ROOT/templates/center/shell" \
GABE_CENTER_OUT="$TMP" \
python3 "$ROOT/templates/center/generators/build_center_a3.py" >/dev/null

# 2 · the station page: parts/ → assemble → fill (writes the example page itself)
echo "── assemble + fill"
python3 assemble.py >/dev/null
if [ "$CHECK" = 1 ]; then
  python3 fill-example.py >/dev/null      # fill-example writes $EX directly — under --check we
  RESTORE=1                               # compare and RESTORE from git afterwards
else
  python3 fill-example.py >/dev/null; RESTORE=0
fi

# 3 · land / compare each artifact. Volatile stamps (twin HEAD sha · regen date ·
#     graft index_hash) are NORMALIZED under --check — the no-wallclock law: content
#     must reproduce byte-identically, stamps churn by design.
FEEDS="c4-graph.js levels.js levels.json sim-archive.js"
fail=0
# Provenance stamps are volatile w.r.t. CONTENT: `head` = which twin commit the feed was
# built from (moves on ANY twin commit), `index_hash` = graft's index state, wallclock date.
# Content is what must reproduce; these three churn by design. Normalize all three.
# Volatile w.r.t. CONTENT (all reproduce; these track twin/graft STATE, not the graph):
#   head = which twin commit · date = wallclock · stats.graft.{index_hash,reason,dropped}
#   = graft-INDEX state (dropped counts shift ±when the index is rebuilt vs read as-found;
#   the graft arm is an inferred FLOOR by design — CLAUDE.md). Content = nodes/edges/fe/
#   cross_edges = must be byte-identical.
norm() { sed -E '
    s/"head": *"[0-9a-f]+"/"head":"H"/g;
    s/"index_hash": *"[0-9a-f]+"/"index_hash":"X"/g;
    s/"reason": *"(as-found[^"]*|rebuilt)"/"reason":"R"/g;
    s/"(intra_entity|noise|unmapped_file|unresolved_target)": *[0-9]+/"\1":N/g;
    s/regen [0-9TZ: -]+Z<br>HEAD [0-9a-f]+/regen R<br>HEAD H/g;
    s/regen [0-9TZ: -]+Z<br>/regen R<br>/g' "$1"; }
land() { # $1=src $2=dst $3=label
  if [ "$CHECK" = 1 ]; then
    if diff -q <(norm "$1") <(norm "$2") >/dev/null 2>&1; then echo "  OK   $3"; else echo "  DRIFT $3"; fail=1; fi
  else cp "$1" "$2"; echo "  landed $3"; fi
}
for f in $FEEDS; do land "$TMP/$f" "$EX/$f" "$f"; done
# codebase-graph.html: rehome assets/ → ../../assets/ exactly as the README prescribes
sed 's#src="assets/#src="../../assets/#g; s#href="assets/#href="../../assets/#g' "$TMP/codebase-graph.html" > "$TMP/codebase-graph.rehomed.html"
land "$TMP/codebase-graph.rehomed.html" "$EX/codebase-graph.html" "codebase-graph.html (assets rehomed)"
# sim.data.js: DERIVED from a real twin commit (regenerable; NEVER the build's null stub,
#   which renders the change-graph blank — the 77fe3cd defect). derive-seeded-sim.py is pure.
if [ "$CHECK" = 1 ]; then
  python3 derive-seeded-sim.py "$TWIN" "$TMP" "$TMP/sim.seed.js" >/dev/null
  if diff -q <(grep -v '^//' "$TMP/sim.seed.js") <(grep -v '^//' "$EX/sim.data.js") >/dev/null 2>&1; then echo "  OK   sim.data.js (derived seed)"; else echo "  DRIFT sim.data.js (derived seed) — re-run without --check to refresh"; fail=1; fi
else
  python3 derive-seeded-sim.py "$TWIN" "$TMP" "$EX/sim.data.js"
fi
# the landed shell station (the assembled page with shell tokens intact)
land "gabe-universe.html" "$ROOT/templates/center/shell/gabe-universe.html" "shell/gabe-universe.html"
# the example page itself: fill-example already wrote it; in --check, diff vs git HEAD
if [ "$CHECK" = 1 ]; then
  if git -C "$ROOT" diff --quiet -- "templates/center/shell/example/codebase-graph-station/gabe-universe.html"; then
    echo "  OK   example gabe-universe.html"; else echo "  DRIFT example gabe-universe.html"; fail=1; fi
  git -C "$ROOT" checkout -q -- "templates/center/shell/example/codebase-graph-station/gabe-universe.html"
fi

# 4 · proof (skipped under --check; --check IS the proof of reproducibility)
if [ "$CHECK" = 1 ]; then
  [ $fail = 0 ] && echo "REGEN CHECK: CLEAN — the committed estate reproduces byte-identically" \
               || { echo "REGEN CHECK: DRIFT above — a generator or source changed without a re-land"; exit 1; }
else
  echo "── batteries"
  ( cd "$ROOT" && bash tests/gabe-universe/run.sh ) | tail -1
  echo "Estate landed. Solo proofs: node verify-{panels,search,walk,clustering,explore,routes,ctrl,d2w,dblclick}.mjs (SOLO-sequential; fleet detached)."
fi
