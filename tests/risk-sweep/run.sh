#!/usr/bin/env bash
# risk-sweep battery — the post-generation ladder collector (slice 3).
#
# Proves the sweep surfaces the RIGHT flags per the P0–P3 ladder from a card's
# authored # RISKS + the deterministic detectors, respects the cap and the P3
# collapse (anti-flood), and reports a detector it cannot run as `unavailable`
# rather than a false all-clear. Hermetic: a synthetic center under a temp dir.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
RS="$REPO/templates/center/generators/risk_sweep.py"

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
CEN="$T/docs/site/center"; mkdir -p "$CEN/cards" "$T/src"
python3 -c 'open("'"$T"'/src/big.py","w").write("x = 1\n"*900)'   # a real 800+ file for P3
cat > "$CEN/cards/widget.md" <<'EOF'
# HANDLE
A widget.
# RISKS
- HIGH · exposed, untested · Security · an unauthenticated caller can mutate another scope's widgets · no ownership filter on the write path
- GAP · priced at mvp · Coverage · the widget↔ledger reconciliation is proven elsewhere, not here · owed e2e journey
- LOW · mitigated · Money integrity · a benign rounding drift · covered by unit tests
EOF
cat > "$CEN/archmap.json" <<EOF
{"entities":{"widget":{"files":[["Widget","src/big.py",900]]}}}
EOF
cat > "$CEN/center.config.json" <<'EOF'
{"entities":{"widget":{"test_rx":"widget"}}}
EOF
# size-budget.sh needs a git repo with the file tracked (it inspects first-party lines)
git -C "$T" init -q
git -C "$T" add -A 2>/dev/null
git -C "$T" -c user.email=t@t -c user.name=t commit -q -m init 2>/dev/null

j() { python3 "$RS" "$T" widget --json 2>/dev/null; }

# ---- P0 security (HIGH) surfaces, tackle-now tier ----
j | python3 -c 'import json,sys;d=json.load(sys.stdin);assert any(f["tier"]=="P0" and f["dimension"]=="security" for f in d["flags"]),d' \
  && ok || bad "P0: a HIGH Security # RISKS line surfaces a security flag"

# ---- P2 e2e gap (GAP coverage + empty proofs) surfaces ----
j | python3 -c 'import json,sys;d=json.load(sys.stdin);assert any(f["tier"]=="P2" and f["dimension"]=="testing" for f in d["flags"]),d' \
  && ok || bad "P2: a GAP coverage risk with empty proofs surfaces an e2e flag"

# ---- LOW risks do NOT surface (Money integrity LOW) ----
j | python3 -c 'import json,sys;d=json.load(sys.stdin);assert not any("Money" in f["description"] for f in d["flags"]),"LOW risk leaked"' \
  && ok || bad "ladder: a LOW risk must NOT surface"

# ---- P3 code: size breach collapses to ONE flag ----
out=$(python3 "$RS" "$T" widget --json 2>/dev/null)
echo "$out" | python3 -c 'import json,sys;d=json.load(sys.stdin);p3=[f for f in d["flags"] if f["tier"]=="P3"];assert len(p3)==1 and p3[0]["dimension"]=="code",p3' \
  && ok || bad "P3: a size breach collapses to exactly one code flag"

# ---- P2 does NOT fire once a proof set exists ----
cat > "$CEN/center.config.json" <<'EOF'
{"entities":{"widget":{"test_rx":"widget","proofs":["widget-journey"]}}}
EOF
python3 "$RS" "$T" widget --json 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);assert not any(f["tier"]=="P2" for f in d["flags"]),"P2 fired with proofs present"' \
  && ok || bad "P2: no e2e flag once the entity has a proof set"

# ---- unavailable: evidence has no census → named, not a false all-clear ----
python3 "$RS" "$T" widget --json 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);assert any("evidence" in u for u in d["unavailable"]),d["unavailable"]' \
  && ok || bad "unavailable: a missing census is named, not silently clean"

# ---- P1 evidence: census capture-debt collapses to ONE flag (not a flood) ----
mkdir -p "$CEN/workflows"
printf '{"entity":"widget","start":"main","states":{"a":{"l":"a","st":"ghost","role":"principal","uc":"x"},"b":{"l":"b","st":"ghost","role":"edge","uc":"y"}},"workflows":{"main":{"label":"m","nodes":["a","b"],"tree":[["a",210,42],["b",210,98]],"edges":[["a","b"]]}}}\n' > "$CEN/workflows/widget.json"
python3 "$RS" "$T" widget --json 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);p1=[f for f in d["flags"] if f["tier"]=="P1"];assert len(p1)==1 and "capture" in p1[0]["description"],p1' \
  && ok || bad "P1: census capture-debt collapses to one evidence flag (2 ghost steps → 1 flag)"
rm -f "$CEN/workflows/widget.json"

# ---- CAP: many P0/P1/P2 flags are capped; P3 always survives ----
# add several GAP risks so non-P3 exceeds a cap of 1
cat > "$CEN/cards/widget.md" <<'EOF'
# HANDLE
A widget.
# RISKS
- GAP · mvp · Coverage · gap one · owed
- GAP · mvp · Security · gap two · owed
- GAP · mvp · Correctness · gap three · owed
EOF
cat > "$CEN/center.config.json" <<'EOF'
{"entities":{"widget":{"test_rx":"widget"}}}
EOF
python3 "$RS" "$T" widget --json --cap 1 2>/dev/null | python3 -c '
import json,sys
d=json.load(sys.stdin)
nonp3=[f for f in d["flags"] if f["tier"]!="P3"]
assert len(nonp3)==1, ("cap not applied", len(nonp3))
assert d["dropped"]>=1, "dropped count not reported"
assert any(f["tier"]=="P3" for f in d["flags"]), "P3 must survive the cap"
' && ok || bad "cap: non-P3 flags capped + dropped reported, P3 survives"

# ---- CRASH → unavailable, never a silent all-clear ----
mkdir -p "$CEN/workflows"; printf 'not json{' > "$CEN/workflows/widget.json"
python3 "$RS" "$T" widget --json 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);assert any("drift" in u and "fail" in u for u in d["unavailable"]),d["unavailable"]' \
  && ok || bad "crash: a malformed census → evidence named unavailable, not a false all-clear"
rm -f "$CEN/workflows/widget.json"

# ---- NO DOUBLE-FIRE: a Security GAP surfaces ONE flag (P2), not P0+P2 ----
printf '# HANDLE\nw\n# RISKS\n- GAP · unbuilt · Security · an unauth caller can mutate another scope · no ownership filter\n' > "$CEN/cards/widget.md"
printf '{"entities":{"widget":{"test_rx":"widget"}}}\n' > "$CEN/center.config.json"
python3 "$RS" "$T" widget --json 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);n=len([f for f in d["flags"] if f["tier"] in("P0","P2")]);assert n==1,("double-fire",d["flags"])' \
  && ok || bad "no-double-fire: a Security GAP surfaces one flag (P2), not P0+P2"

# ---- P3 SEAM-SAFE: a RULES.md seam line must not inflate the breach count ----
printf '# HANDLE\nw\n# RISKS\n- LOW · x · Coverage · y · z\n' > "$CEN/cards/widget.md"
mkdir -p "$T/.kdbp"; printf -- '- src/big.py: split the model at line 450 and the view at line 600\n' > "$T/.kdbp/RULES.md"
git -C "$T" add -A 2>/dev/null; git -C "$T" -c user.email=t@t -c user.name=t commit -q -m r 2>/dev/null
python3 "$RS" "$T" widget --json 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);p3=[f for f in d["flags"] if f["tier"]=="P3"];assert p3 and p3[0]["description"].startswith("1 file"),("seam inflated",p3)' \
  && ok || bad "P3 seam-safe: only real WARN lines counted (1 file, not inflated by a RULES.md seam)"

echo "=================================="
echo "risk-sweep battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
