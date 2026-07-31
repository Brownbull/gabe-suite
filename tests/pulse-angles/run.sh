#!/usr/bin/env bash
# ANGLE-signal battery — the executable contract of
# skills/gabe-pulse/scripts/angles.py.
#
# This mechanism exists to stop fifteen manual-only skills from being buried by
# the operator's own habits, and it is worth exactly as much as its triggers are
# trustworthy. A signal that fires on a clean repo trains the reader to ignore
# the line; a signal that stays quiet on a dirty one is why the satellite got
# buried in the first place. So every live signal is pinned BOTH ways against a
# synthetic repo, plus the three rules the mechanism lives or dies on:
#   · at most ONE line in --one-line mode
#   · SILENCE when nothing fires (no "all clear" reassurance)
#   · DECAY actually silences a repeated offer
#
# Hermetic: builds throwaway git repos in a temp dir. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
ANGLES="$REPO/skills/gabe-pulse/scripts/angles.py"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok(){ echo "  ok: $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL: $1"; fail=$((fail+1)); }

[ -f "$ANGLES" ] || { echo "⛔ missing: $ANGLES"; exit 2; }

# repo <name> — a git repo with one commit, ready to be dressed
repo() {
  local r="$TMP/$1"
  mkdir -p "$r" && cd "$r" || exit 2
  git init -q . && git config user.email t@t && git config user.name t
  echo seed > seed.txt && git add -A && git commit -qm "seed"
  cd - >/dev/null || exit 2
  echo "$r"
}
commits() { local r=$1 n=$2 msg=$3; cd "$r" || exit 2;
  for i in $(seq 1 "$n"); do echo "$i" >> log.txt; git add -A; git commit -qm "$msg $i"; done
  cd - >/dev/null || exit 2; }
plan() {  # plan <repo> <json>
  mkdir -p "$1/.kdbp"; printf '%s' "$2" > "$1/.kdbp/PLAN.json"; }
run() { python3 "$ANGLES" "$1" --no-record "${@:2}" 2>&1; }

DONE4='{"goal":"the merge","phases":[
 {"id":"1","cells":{"exec":"done"}},{"id":"2","cells":{"exec":"done"}},
 {"id":"3","cells":{"exec":"done"}},{"id":"4","cells":{"exec":"done"}}]}'

echo "pulse-angles battery"

# ── S1 · adversarial ───────────────────────────────────────────────────────
r=$(repo s1a); plan "$r" "$DONE4"; commits "$r" 5 "feat: work"
run "$r" | grep -q "no adversarial pass" && ok "S1 fires: phases done, no roast" || bad "S1 did not fire"

r=$(repo s1b); plan "$r" "$DONE4"; commits "$r" 2 "feat: work"; commits "$r" 1 "chore: roast findings triaged"
run "$r" | grep -q "no adversarial pass" && bad "S1 fired despite a roast in history" || ok "S1 silent once a roast is on record"

# ── S2 · structural ────────────────────────────────────────────────────────
r=$(repo s2a); commits "$r" 30 "feat: work"
run "$r" | grep -q "since the last structural scan" && ok "S2 fires: 30 commits, no health scan" || bad "S2 did not fire"

r=$(repo s2b); commits "$r" 30 "feat: work"; commits "$r" 1 "chore: gabe-health scan clean"
run "$r" | grep -q "since the last structural scan" && bad "S2 fired right after a health scan" || ok "S2 silent right after a scan"

# ── S3 · journey proof ─────────────────────────────────────────────────────
r=$(repo s3a); plan "$r" '{"goal":"g","phases":[{"id":"7","proof_type":"journey","cells":{"exec":"done","review":"done"},"proof":null}]}'
run "$r" | grep -q "owe journey/visual proof" && ok "S3 fires: reviewed journey phase with no proof" || bad "S3 did not fire"

r=$(repo s3b); plan "$r" '{"goal":"g","phases":[{"id":"7","proof_type":"journey","cells":{"exec":"done","review":"done"},"proof":"shots/7.png"}]}'
run "$r" | grep -q "owe journey/visual proof" && bad "S3 fired though proof is recorded" || ok "S3 silent when the proof is recorded"

# ── S4 · published docs ────────────────────────────────────────────────────
mkdocs() { mkdir -p "$1/scripts/checkers" "$1/docs/src" "$1/docs/site/center"
  cp "$REPO/scripts/checkers/docsite-staleness.sh" "$1/scripts/checkers/"
  printf '# a\n' > "$1/docs/src/a.md"; printf '# hub\n' > "$1/docs/src/hub.md"
  sleep 0.02
  printf 'x' > "$1/docs/site/center/a.html"; printf 'x' > "$1/docs/site/center/docs.html"; }
r=$(repo s4a); mkdocs "$r"; sleep 0.02; touch "$r/docs/src/a.md"
run "$r" | grep -q "older than the markdown" && ok "S4 fires: markdown newer than its page" || bad "S4 did not fire"

r=$(repo s4b); mkdocs "$r"
run "$r" | grep -q "older than the markdown" && bad "S4 fired on a current site" || ok "S4 silent on a current site"

# ── S6 · entity context ────────────────────────────────────────────────────
mkcenter() { mkdir -p "$1/docs/site/center"
  cat > "$1/docs/site/center/center.config.json" <<JSON
{"entities":{"transaction":{"code":{"api":["a.py","b.py"],"web":["c.tsx","d.tsx"]}}}}
JSON
  cd "$1" && git add -A && git commit -qm "center config" && cd - >/dev/null; }
r=$(repo s6a); mkcenter "$r"; cd "$r"; for f in a.py b.py c.tsx; do echo x >> $f; done; git add -A; cd - >/dev/null
run "$r" | grep -q "belong to the transaction code map" && ok "S6 fires: 3 files of one entity touched" || bad "S6 did not fire"

r=$(repo s6b); mkcenter "$r"; cd "$r"; echo x >> a.py; git add -A; cd - >/dev/null
run "$r" | grep -q "belong to the transaction code map" && bad "S6 fired on a single file" || ok "S6 silent below the threshold"

# ── S7 · explanation ───────────────────────────────────────────────────────
r=$(repo s7a); mkcenter "$r"; cd "$r"; for f in a.py b.py c.tsx; do echo x >> $f; done; git add -A; cd - >/dev/null
run "$r" | grep -q "the diff spans 2 layers" && ok "S7 fires: diff spans two layers" || bad "S7 did not fire"

r=$(repo s7b); mkcenter "$r"; cd "$r"; for f in a.py b.py; do echo x >> $f; done; git add -A; cd - >/dev/null
run "$r" | grep -q "the diff spans" && bad "S7 fired within one layer" || ok "S7 silent within one layer"

# ── S5 · scope — NOT COMPUTABLE, and must say so rather than guess ─────────
r=$(repo s5); plan "$r" "$DONE4"
out=$(run "$r" --why)
if echo "$out" | grep -q "S5  UNAVAILABLE" && echo "$out" | grep -q "no per-phase scope"; then
  ok "S5 reports unavailable with what would unlock it"
else bad "S5 must name its missing source, never fake a proxy"; fi

# ── the three rules the mechanism lives or dies on ─────────────────────────
r=$(repo cap); plan "$r" "$DONE4"; commits "$r" 30 "feat: work"; mkcenter "$r"
cd "$r"; for f in a.py b.py c.tsx; do echo x >> $f; done; git add -A; cd - >/dev/null
n=$(run "$r" --one-line | wc -l)
[ "$n" = "1" ] && ok "--one-line prints exactly one line when several signals fire" \
                || bad "--one-line printed $n lines — the cap is the whole point"

r=$(repo silent); commits "$r" 2 "feat: work"
out=$(run "$r" --one-line)
[ -z "$out" ] && ok "--one-line prints NOTHING when nothing fires" \
              || bad "printed a reassurance line: $out"

# ── decay: the same evidence twice, then silence ───────────────────────────
r=$(repo decay); plan "$r" "$DONE4"; commits "$r" 5 "feat: work"
python3 "$ANGLES" "$r" --one-line >/dev/null 2>&1
python3 "$ANGLES" "$r" --one-line >/dev/null 2>&1
third=$(python3 "$ANGLES" "$r" --one-line 2>&1)
if [ -z "$third" ]; then ok "decay silences an offer repeated on the same evidence"
else bad "still offering after $DECAY_AFTER declines: $third"; fi

if [ -f "$r/.kdbp/PULSE.jsonl" ]; then ok "the decay record is written where .kdbp exists"
else bad "no .kdbp/PULSE.jsonl written"; fi

# ── a repo with no .kdbp degrades statelessly, and still works ─────────────
r=$(repo nokdbp); commits "$r" 30 "feat: work"
out=$(python3 "$ANGLES" "$r" --one-line 2>&1)
if echo "$out" | grep -q "structural scan" && [ ! -e "$r/.kdbp" ]; then
  ok "no .kdbp ⇒ stateless mode still surfaces the signal"
else bad "stateless mode broke: $out"; fi

echo "pulse-angles: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
