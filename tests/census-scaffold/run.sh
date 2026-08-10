#!/usr/bin/env bash
# census-scaffold battery — the workflow-census skeleton seeder.
#
# Proves the scaffold emits a census BOTH consumers accept: check_workflow_drift.py
# (prices owed captures, not fake coverage) AND the evidence-nav.js mount() contract
# (`start` names a WORKFLOW key, every node resolves to a state). It derives one
# state per flow, orders the golden ★ flow first, dedups repeated keys, refuses to
# overwrite an existing census, and fires on a missing / flow-less card. Hermetic.
#
# The mount contract is asserted STRUCTURALLY (start ∈ workflows · nodes ⊆ states),
# because the adversarial review caught a start-key that crashed mount() while
# passing the drift checker — the battery must guard both seams, not one.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SC="$REPO/templates/center/generators/scaffold_census.py"
DRIFT="$REPO/templates/center/generators/check_workflow_drift.py"

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
CARDS="$T/docs/site/center/cards"; mkdir -p "$CARDS"
cat > "$CARDS/widget.md" <<'EOF'
# HANDLE
A widget.
# FLOWS
- list ★ → returns the widgets
- create → make a widget
- archive → soft-archive it
EOF

# ---- VALID: well-formed census honoring BOTH consumer contracts ----
out=$(python3 "$SC" "$T" widget --stdout); rc=$?
echo "$out" | python3 -c '
import json,sys
d=json.load(sys.stdin)
assert d["entity"]=="widget", d.get("entity")
# evidence-nav mount contract: start is a WORKFLOW key (WFK=data.start; WF[WFK].nodes[0]), NOT a state
assert d["start"]=="main", d["start"]
assert d["start"] in d["workflows"], "start must be a workflow key"
assert len(d["states"])==3, len(d["states"])
assert all(s["st"]=="ghost" for s in d["states"].values())        # honest — nothing captured
nodes=d["workflows"]["main"]["nodes"]
assert set(nodes) <= set(d["states"]), "every node must resolve to a state"
assert nodes[0]=="list", nodes[0]                                  # golden ★ ordered first (the entry)
assert d["states"]["list"]["role"]=="principal", "golden → principal"
assert d["states"]["create"]["role"]=="edge" and d["states"]["archive"]["role"]=="edge"
assert d["workflows"]["main"]["edges"]==[["list","create"],["create","archive"]]
' && [ "$rc" = 0 ] && ok || bad "valid: census honors mount contract (start=main, nodes⊆states, golden-first, roles, edges)"

# ---- VALID: the drift checker accepts it and prices owed capture (report-never) ----
echo "$out" > "$T/wf.json"
python3 "$DRIFT" "$T/wf.json" >/dev/null 2>&1 \
  && ok || bad "valid: drift checker must accept the scaffold (exit 0)"
python3 "$DRIFT" "$T/wf.json" 2>&1 | grep -q "capture-debt (3)" \
  && ok || bad "valid: 3 ghost states must price as capture-debt, not clean"

# ---- --stdout must NOT write the workflows file ----
[ ! -e "$T/docs/site/center/workflows/widget.json" ] \
  && ok || bad "--stdout: must print only, never write the census file"

# ---- NO-GOLDEN card: start still 'main', every role edge, first flow is the entry ----
cat > "$CARDS/edgy.md" <<'EOF'
# FLOWS
- alpha → first
- beta → second
EOF
out=$(python3 "$SC" "$T" edgy --stdout)
echo "$out" | python3 -c '
import json,sys
d=json.load(sys.stdin)
assert d["start"]=="main", d["start"]                              # start never depends on a golden flow
assert d["workflows"]["main"]["nodes"][0]=="alpha"                 # fallback entry = first flow
assert all(s["role"]=="edge" for s in d["states"].values()), "no golden → all edge"
' && ok || bad "no-golden: start=main, first-flow entry, all roles edge"

# ---- DUPLICATE key: no dropped state, no self-edge, nodes == states ----
cat > "$CARDS/dup.md" <<'EOF'
# FLOWS
- list ★ → first
- list → duplicate key
- save → third
EOF
out=$(python3 "$SC" "$T" dup --stdout)
echo "$out" | python3 -c '
import json,sys
d=json.load(sys.stdin)
nodes=d["workflows"]["main"]["nodes"]
assert len(nodes)==len(set(nodes)), "duplicate node ids"
assert set(nodes)==set(d["states"]), "nodes and states diverged on a duplicate key"
assert all(a!=b for a,b in d["workflows"]["main"]["edges"]), "self-edge from a duplicate key"
' && ok || bad "dedup: duplicate flow key must not drop a state or spawn a self-edge"

# ---- FIRE: no card ----
python3 "$SC" "$T" ghostly --stdout >/dev/null 2>&1
[ "$?" = 1 ] && ok || bad "fire: missing card → exit 1"

# ---- FIRE: a card with no parseable FLOWS ----
printf '# HANDLE\nx\n' > "$CARDS/noflow.md"
python3 "$SC" "$T" noflow --stdout >/dev/null 2>&1
[ "$?" = 1 ] && ok || bad "fire: card without # FLOWS → exit 1"

# ---- REFUSE: an existing census is not overwritten without --force ----
mkdir -p "$T/docs/site/center/workflows"
echo '{"entity":"widget","start":"main","states":{},"workflows":{"main":{}}}' \
  > "$T/docs/site/center/workflows/widget.json"
python3 "$SC" "$T" widget >/dev/null 2>&1
[ "$?" = 1 ] && ok || bad "refuse: existing census without --force → exit 1 (accumulator law)"

# ---- FORCE: --force overwrites, and the result is the scaffold (start=main workflow key) ----
python3 "$SC" "$T" widget --force >/dev/null 2>&1 \
  && grep -q '"start": "main"' "$T/docs/site/center/workflows/widget.json" \
  && ok || bad "force: --force overwrites with the scaffold"

echo "=================================="
echo "census-scaffold battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
