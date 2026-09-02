#!/usr/bin/env bash
# reach-emit.py fixture battery — the mechanized red emit's executable contract.
#
# Proves FIRE (arm-difference deltas emitted through map-deltas.py append, Reach
# line printed) and SILENT (no graft index → `no index`, no write), plus the
# honesty laws the audit's fix depends on: def-site excluded (grep matching the
# symbol's own `def` never false-fires), build-output/generated noise filtered,
# word-boundary-captured grep-only files that survive become deltas, dry-run writes
# nothing, usage error exits 1. Hermetic: synthetic graft-output fixtures + temp
# git repos (the REAL-gustify numbers live in the commit message). Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
RE="${RE_OVERRIDE:-$REPO/skills/gabe-red/scripts/reach-emit.py}"  # override for mutation proof

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

FX="$T/fx"; mkdir -p "$FX"
mkrepo() { local r="$1"; mkdir -p "$r"; (cd "$r" && git init -q && git config user.email t@t \
  && git config user.name t && printf '.kdbp/map-deltas.jsonl\n.kdbp/map-deltas-rollup.jsonl\n' > .gitignore \
  && git add .gitignore && git commit -q -m base && mkdir -p .kdbp); }   # the accumulator MUST be gitignored (emit gate d)

# ── synthetic graft output ─────────────────────────────────────────────────
# callers: HouseholdThing calls thing() from other.py; def lives in thing.py.
cat > "$FX/fire.callers.json" <<'JSON'
{"query":"thing","matches":[{"symbol":{"id":"apps/api/thing.py#thing","name":"thing","kind":"function","path":"apps/api/thing.py","span":"L10-L20"},
 "hits":[{"id":"apps/api/other.py#Caller","relation":"calls","depth":1,"name":"Caller","kind":"class","path":"apps/api/other.py","span":"L5-L9"}]}]}
JSON
# grep (\bthing\b): the def site, the known caller, TWO grep-only source files, and
# THREE noise files (a minified bundle, a storybook asset, generated center data).
cat > "$FX/fire.grep.json" <<'JSON'
{"pattern":"\\bthing\\b","filesSearched":9,"totalHits":7,"groups":[
 {"symbol":{"path":"apps/api/thing.py"},"path":"apps/api/thing.py","hits":[{"line":10,"text":"def thing():"}]},
 {"symbol":null,"path":"apps/api/other.py","hits":[{"line":6,"text":"thing()"}]},
 {"symbol":null,"path":"apps/api/tests/test_thing.py","hits":[{"line":114,"text":"assert thing()"}]},
 {"symbol":null,"path":"apps/api/services/downstream.py","hits":[{"line":42,"text":"return thing()"}]},
 {"symbol":null,"path":"apps/web/storybook-static/x.min.js","hits":[{"line":1,"text":"thing"}]},
 {"symbol":null,"path":"docs/site/center/c4-graph.js","hits":[{"line":2,"text":"thing"}]},
 {"symbol":null,"path":"apps/web/dist/bundle.js","hits":[{"line":3,"text":"thing"}]}]}
JSON
# no-delta: grep finds only the def site + the known caller → nothing new.
cat > "$FX/nod.callers.json" <<'JSON'
{"query":"solo","matches":[{"symbol":{"path":"apps/api/solo.py"},"hits":[{"path":"apps/api/uses.py"}]}]}
JSON
cat > "$FX/nod.grep.json" <<'JSON'
{"pattern":"\\bsolo\\b","groups":[
 {"symbol":{"path":"apps/api/solo.py"},"path":"apps/api/solo.py","hits":[{"line":1,"text":"def solo"}]},
 {"symbol":null,"path":"apps/api/uses.py","hits":[{"line":5,"text":"solo()"}]}]}
JSON

R="$T/repo"; mkrepo "$R"
LIVE="$R/.kdbp/map-deltas.jsonl"
run() { python3 "$RE" "$@" >"$T/out" 2>"$T/err"; echo $?; }

# ── FIRE: two real deltas, def + noise excluded ────────────────────────────
: > "$LIVE"
rc=$(run thing --dir "$R" --callers-json "$FX/fire.callers.json" --grep-json "$FX/fire.grep.json")
[ "$rc" = 0 ] && ok || bad "fire run should exit 0 (got $rc)"
n=$(wc -l < "$LIVE")
[ "$n" = 2 ] && ok || bad "fire must emit exactly 2 deltas (got $n): $(cat "$LIVE")"
grep -q '"found":"apps/api/tests/test_thing.py:114"' "$LIVE" && ok || bad "missed test-caller delta not emitted"
grep -q '"found":"apps/api/services/downstream.py:42"' "$LIVE" && ok || bad "missed source-caller delta not emitted"
grep -q '"subject":"callers(thing)"' "$LIVE" && ok || bad "delta subject wrong"
grep -q '"gen":"_a3_graft.calls"' "$LIVE" && ok || bad "delta gen wrong"
grep -q 'apps/api/thing.py' "$LIVE" && bad "def site must NOT be emitted as a delta" || ok
grep -qE 'min\.js|storybook-static|c4-graph|dist/bundle' "$LIVE" && bad "noise files must NOT be emitted" || ok
grep -q "^- \*\*Reach:\*\* .* (graft@" "$T/out" && ok || bad "Reach line not printed in the record format: $(cat "$T/out")"
grep -qE 'min\.js|storybook-static|c4-graph' "$T/out" && bad "Reach line must be noise-filtered too" || ok

# ── NO-DELTA: grep adds nothing beyond def + known caller ──────────────────
: > "$LIVE"
run solo --dir "$R" --callers-json "$FX/nod.callers.json" --grep-json "$FX/nod.grep.json" >/dev/null
[ "$(wc -l < "$LIVE")" = 0 ] && ok || bad "no-delta case must emit 0 (got $(cat "$LIVE"))"

# ── DRY-RUN: prints, writes nothing ────────────────────────────────────────
: > "$LIVE"
run thing --dir "$R" --dry-run --callers-json "$FX/fire.callers.json" --grep-json "$FX/fire.grep.json" >/dev/null
grep -q "DELTA thing" "$T/out" && ok || bad "dry-run must print the deltas it would emit"
[ "$(wc -l < "$LIVE")" = 0 ] && ok || bad "dry-run must NOT write the accumulator"

# ── SILENT: no graft/ index → `no index`, no write ─────────────────────────
NOIDX="$T/noidx"; mkrepo "$NOIDX"
rc=$(run foo --dir "$NOIDX")
[ "$rc" = 0 ] && ok || bad "no-index run should exit 0 (got $rc)"
grep -qx "no index" "$T/out" && ok || bad "no-index must print exactly 'no index': $(cat "$T/out")"
[ ! -s "$NOIDX/.kdbp/map-deltas.jsonl" ] 2>/dev/null && ok || bad "no-index must not write a delta"

# ── EMPTY ARM: graft resolved nothing → NO map claim → 0 emits (a delta needs a claim to diverge from) ──
cat > "$FX/empty.callers.json" <<'JSON'
{"query":"thing","matches":[]}
JSON
: > "$LIVE"
run thing --dir "$R" --callers-json "$FX/empty.callers.json" --grep-json "$FX/fire.grep.json" >/dev/null
[ "$(wc -l < "$LIVE")" = 0 ] && ok || bad "empty callers arm must emit NOTHING (got $(cat "$LIVE"))"
grep -q "emit skipped: no map claim" "$T/out" && ok || bad "empty arm must say why it skipped: $(cat "$T/out")"
grep -q "grep-only@" "$T/out" && ok || bad "Reach line must not claim graft when the arm resolved nothing: $(cat "$T/out")"

# ── NOT GITIGNORED: a repo without the accumulator seed → emit skipped, named ──
NOIGN="$T/noign"; mkdir -p "$NOIGN"; (cd "$NOIGN" && git init -q && git config user.email t@t && git config user.name t \
  && git commit -q --allow-empty -m base && mkdir -p .kdbp)
run thing --dir "$NOIGN" --callers-json "$FX/fire.callers.json" --grep-json "$FX/fire.grep.json" >/dev/null
[ ! -s "$NOIGN/.kdbp/map-deltas.jsonl" ] && ok || bad "un-ignored accumulator must NOT be written"
grep -q "not gitignored" "$T/out" && ok || bad "un-ignored accumulator must be named as the reason: $(cat "$T/out")"

# ── ONCE: the same run twice → still exactly 2 lines (the writer's --once dedupe) ──
: > "$LIVE"
run thing --dir "$R" --callers-json "$FX/fire.callers.json" --grep-json "$FX/fire.grep.json" >/dev/null
run thing --dir "$R" --callers-json "$FX/fire.callers.json" --grep-json "$FX/fire.grep.json" >/dev/null
[ "$(wc -l < "$LIVE")" = 2 ] && ok || bad "repeating the run must not duplicate edges (--once) (got $(wc -l < "$LIVE"))"

# ── USAGE: no symbol → exit 1 ──────────────────────────────────────────────
rc=$(run --dir "$R"); [ "$rc" = 1 ] && ok || bad "missing symbol should exit 1 (got $rc)"

echo "reach-emit battery: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
