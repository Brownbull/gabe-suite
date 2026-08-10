#!/usr/bin/env bash
# center_status.py battery — the deterministic status-actionables emitter
# (operator ruling 2026-08-10: links + next-steps must be machine-emitted, not
# model-composed).
#
# Proves the emitter both FIRES (a card mid-ritual, a cardless entity, a config
# marker each surface as a LINKED action with a → step) and stays SILENT (a
# fully reviewed center prints "clean — nothing owed"). Hermetic: a synthetic
# fixture project under a temp dir, driven read-only via GABE_REPO_ROOT — no real
# project touched.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$REPO/templates/center/generators/center_status.py"

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
CEN="$T/docs/site/center"
mkdir -p "$CEN/cards"

# a valid card the parser accepts — every CARD_SECTION present, FLOWS line parses
# (`- <one-word-key> [★] → <desc>`). Diagram set is a caller-chosen subset.
write_card() {  # $1=path  $2=extra-lines (diagrams / REVIEWED)
  cat > "$1" <<EOF
# HANDLE
A widget is a thing.
# WHAT & WHY
Before, chaos; after, a widget. It matters because it matters.
# FOR WHOM
Someone who needs a widget.
# FLOWS
- list ★ → returns the widgets
# IS
- a thing
# IS NOT
- not another thing
# DECIDED
- D1 — widgets exist
# DIAGRAM USERFLOW
flowchart TD
    A --> B
# DIAGRAM DATAFLOW
flowchart LR
    X --> Y
$2
EOF
}

run() { GABE_REPO_ROOT="$T" python3 "$SCRIPT" > "$T/out" 2>&1; }

# ===================== FIRE =====================
cat > "$CEN/center.config.json" <<'EOF'
{ "entities": { "widget": { "test_rx": "widget", "code": { "api": ["TODO(verify-glob)"] } } } }
EOF
cat > "$CEN/adoption.json" <<'EOF'
{ "sections": [
  { "entity": "widget",  "status": "pending"  },
  { "entity": "gadget",  "status": "approved" },
  { "entity": "sprocket","status": "pending"  }
] }
EOF
# 2 diagrams + the withheld-review placeholder (the real mid-ritual shape,
# card-alias.md:90) → review + diagrams fire; parse_card strips the comment so
# the card still reads as NOT reviewed, and _line_of finds the placeholder line.
write_card "$CEN/cards/widget.md" '<!-- # REVIEWED withheld — stamped after THE operator review -->'
run

grep -q 'ACTIONS' "$T/out"                        && ok || bad "fire: an ACTIONS section must print"
grep -q 'review · widget' "$T/out"                && ok || bad "fire: a card on disk mid-ritual (pending+card) must surface as a review action"
grep -q 'diagrams · widget' "$T/out"              && ok || bad "fire: a sub-canon card must surface a diagrams action"
grep -q 'missing WORKFLOW' "$T/out"               && ok || bad "fire: the diagrams action must name the missing canonical diagram"
grep -q 'group\|gadget — adopted, no card' "$T/out" && ok || bad "fire: an approved cardless entity must queue as backfill"
grep -q 'sprocket — pending, no card' "$T/out"    && ok || bad "fire: a pending cardless entity must queue as shortlisted"
grep -q 'TODO(verify-glob)' "$T/out"              && ok || bad "fire: a config verify-glob marker must warn"

# THE contract: every action carries a workspace-relative LINK and a → step
links=$(grep -c '](docs/site/center/' "$T/out")
steps=$(grep -c '→' "$T/out")
[ "$links" -ge 3 ] && ok || bad "fire: actions/queued must each carry a clickable local link (got $links)"
[ "$steps" -ge 2 ] && ok || bad "fire: every action must carry a → next step (got $steps)"
# a review action must link BOTH the card line and the built page
grep -Eq 'cards/widget\.md#L[0-9]+\)' "$T/out"    && ok || bad "fire: the card link must carry the marker line (#L<n>)"

# ===================== SILENT =====================
rm -f "$CEN/cards/widget.md"
cat > "$CEN/center.config.json" <<'EOF'
{ "entities": { "widget": { "test_rx": "widget" } } }
EOF
cat > "$CEN/adoption.json" <<'EOF'
{ "sections": [ { "entity": "widget", "status": "approved" } ] }
EOF
# reviewed + all 3 canonical diagrams → nothing owed
write_card "$CEN/cards/widget.md" $'# DIAGRAM WORKFLOW\nflowchart TD\n    P --> Q\n# REVIEWED\n2026-08-10 · tester'
run

grep -q '0 action(s) · 0 queued · 0 warn(s)' "$T/out" \
  && ok || { bad "silent: a fully reviewed center must report 0/0/0"; cat "$T/out"; }
grep -q 'clean — every adopted entity has a reviewed card' "$T/out" \
  && ok || bad "silent: the clean line must print when nothing is owed"
grep -q 'ACTIONS' "$T/out" && bad "silent: no ACTIONS section when nothing is owed" || ok

echo "=================================="
echo "center-status battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
