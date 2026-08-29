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

# a REVIEW commit mentioning "adversarial" is not a roast — it must NOT reset the
# counter (measured false reset: "4-lens adversarial pass" silenced a whole cycle)
r=$(repo s1c); plan "$r" "$DONE4"; commits "$r" 5 "review: 4-lens adversarial pass verified"
run "$r" | grep -q "no adversarial pass" && ok "S1 not silenced by review prose saying 'adversarial'" || bad "S1 reset by a review commit — reviews are not roasts"

# the emitted command is pasteable VERBATIM: perspective present, quote closed,
# goal clipped at a word boundary (the 60-char mid-word clip once shipped
# '/gabe-roast "…and the myopi' — pasted, it BLOCKED)
LONGGOAL='{"goal":"Pay down the 3-month deferred-findings backlog and the myopic walkthrough debt","phases":[
 {"id":"1","cells":{"exec":"done"}},{"id":"2","cells":{"exec":"done"}},
 {"id":"3","cells":{"exec":"done"}},{"id":"4","cells":{"exec":"done"}}]}'
r=$(repo s1d); plan "$r" "$LONGGOAL"; commits "$r" 5 "feat: work"
line=$(run "$r" | grep "gabe-roast")
if echo "$line" | grep -q '/gabe-roast Sweeper "' && echo "$line" | grep -q '"$' && ! echo "$line" | grep -q 'myopi'; then
  ok "S1 command carries a perspective, closes its quote, clips at a word boundary"
else bad "S1 command is not pasteable verbatim: $line"; fi

# ── S2 · structural ────────────────────────────────────────────────────────
r=$(repo s2a); commits "$r" 30 "feat: work"
run "$r" | grep -q "since the last structural scan" && ok "S2 fires: 30 commits, no health scan" || bad "S2 did not fire"

r=$(repo s2b); commits "$r" 30 "feat: work"; commits "$r" 1 "chore: gabe-health scan clean"
run "$r" | grep -q "since the last structural scan" && bad "S2 fired right after a health scan" || ok "S2 silent right after a scan"

# ordinary prose containing "churning" is not a scan record — it must NOT reset
# (measured: "archmap.json stops churning on every regen" silenced S2 for a
# 100+-commit cycle in which no scan had run)
r=$(repo s2c); commits "$r" 30 "feat: work"; commits "$r" 1 "refactor: archmap stops churning on every regen"
run "$r" | grep -q "since the last structural scan" && ok "S2 not silenced by prose saying 'churning'" || bad "S2 reset by incidental commit prose"

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

# clean tree + a .kdbp bookkeeping commit on top must not blind the signal — the
# fallback walks back to the newest WORK commit (measured: 15 beat-end
# invocations, 0 lines, every HEAD~1..HEAD diff was bookkeeping-only)
r=$(repo s6c); mkcenter "$r"
cd "$r" && for f in a.py b.py c.tsx; do echo x >> $f; done && git add -A && git commit -qm "feat: entity work" \
  && mkdir -p .kdbp && echo tick > .kdbp/LEDGER.md && git add -A && git commit -qm "chore(kdbp): tick" && cd - >/dev/null
run "$r" | grep -q "belong to the transaction code map" && ok "S6 sees past the .kdbp bookkeeping commit" || bad "S6 blinded by the bookkeeping-commit-last pattern"

# ── S7 · explanation ───────────────────────────────────────────────────────
r=$(repo s7a); mkcenter "$r"; cd "$r"; for f in a.py b.py c.tsx; do echo x >> $f; done; git add -A; cd - >/dev/null
run "$r" | grep -q "the diff spans 2 layers" && ok "S7 fires: diff spans two layers" || bad "S7 did not fire"

r=$(repo s7b); mkcenter "$r"; cd "$r"; for f in a.py b.py; do echo x >> $f; done; git add -A; cd - >/dev/null
run "$r" | grep -q "the diff spans" && bad "S7 fired within one layer" || ok "S7 silent within one layer"

# ── S9 · entity-shape drift — orphan domain + aspect entity (reads the archmap) ──
mkarchmap() { mkdir -p "$1/docs/site/center"
  printf '%s' '{"entities":{"cooking":{"code":{"api":["a.py"]}}}}' > "$1/docs/site/center/center.config.json"
  printf '%s' "$2" > "$1/docs/site/center/archmap.json"
  cd "$1" && git add -A && git commit -qm "center+archmap" && cd - >/dev/null; }
# 'shared' co-claims 3 domains + solely owns /admin (orphan); cooking/pantry/recipe own their own
r=$(repo s9a); mkarchmap "$r" '{"entities":{"cooking":{"endpoints":[{"path":"/cooking","method":"GET"}]},"pantry":{"endpoints":[{"path":"/pantry","method":"GET"}]},"recipe":{"endpoints":[{"path":"/recipes","method":"GET"}]},"shared":{"endpoints":[{"path":"/cooking","method":"GET"},{"path":"/pantry","method":"GET"},{"path":"/recipes","method":"GET"},{"path":"/admin","method":"GET"}]}}}'
run "$r" | grep -q "entity-shape drift" && ok "S9 fires: an orphan domain + an aspect entity" || bad "S9 did not fire on a drifted model"
# clean model — every domain owned by a distinct entity, no aspect → silent
r=$(repo s9b); mkarchmap "$r" '{"entities":{"cooking":{"endpoints":[{"path":"/cooking","method":"GET"}]},"pantry":{"endpoints":[{"path":"/pantry","method":"GET"}]},"recipe":{"endpoints":[{"path":"/recipes","method":"GET"}]}}}'
run "$r" | grep -q "entity-shape drift" && bad "S9 fired on a clean entity model" || ok "S9 silent on a clean model"
# no center config → honest unavailable, never a guess
r=$(repo s9c); commits "$r" 1 "feat: work"
run "$r" | grep -q "entity-shape drift" && bad "S9 fired without a center" || ok "S9 silent with no center config"

# ── S10 · web→API bridge drift — reads the committed c4-graph.json stats.web ──
mkc4() { mkdir -p "$1/docs/site/center"
  printf '%s' "$2" > "$1/docs/site/center/c4-graph.json"
  printf '{}' > "$1/docs/site/center/center.config.json"
  cd "$1" && git add -A && git commit -qm "center+c4" && cd - >/dev/null; }

# FIRES: >=2 unmatched fetches named in stats.web.unmatched
r=$(repo s10a); mkc4 "$r" '{"stats":{"web":{"present":true,"unmatched":[{"m":"GET","p":"/api/v1/equipment","from":"web:useEquip"},{"m":"GET","p":"/api/v1/notifications","from":"web:useNotifs"}]}}}'
run "$r" | grep -q "web-bridge drift" && ok "S10 fires: >=2 fetches hit no declared endpoint" || bad "S10 did not fire on unmatched fetches"

# SILENT below threshold (1 < 2) — the mutation of the fire case: one stray is not a pattern
r=$(repo s10b); mkc4 "$r" '{"stats":{"web":{"present":true,"unmatched":[{"m":"GET","p":"/api/v1/equipment","from":"web:useEquip"}]}}}'
run "$r" | grep -q "web-bridge drift" && bad "S10 fired on a single stray fetch (below threshold)" || ok "S10 silent below the >=2 threshold"

# SILENT when the web arm is absent (backend-only / no REST idiom → present:false)
r=$(repo s10c); mkc4 "$r" '{"stats":{"web":{"present":false,"reason":"no web source"}}}'
run "$r" | grep -q "web-bridge drift" && bad "S10 fired when the web arm is absent" || ok "S10 silent when web arm absent"

# SILENT with no center at all
r=$(repo s10d); commits "$r" 1 "feat: work"
run "$r" | grep -q "web-bridge drift" && bad "S10 fired without a center" || ok "S10 silent with no center config"

# S10 DIFF-ARM: the review side (diff_new_fetches) must also price a NEW literal SSE fetch,
# so review flags exactly what the standing S10 nags after regen (the two arms stay in sync).
if python3 - "$REPO/skills/gabe-pulse/scripts/fetch_bridge.py" <<'PY'
import importlib.util, sys
spec = importlib.util.spec_from_file_location("fb", sys.argv[1])
fb = importlib.util.module_from_spec(spec); spec.loader.exec_module(fb)
d = ('+  const es = new EventSource("/api/v1/recipe-creation/gustify/stream");\n'
     '+  fetchEventSource("/api/v1/recipe-creation/gustify", { method: "POST" });\n'
     '+  apiFetch("/api/v1/orders");')
got = set(fb.diff_new_fetches(d))
assert ("GET", "/api/v1/recipe-creation/gustify/stream") in got, got   # EventSource → GET
assert ("POST", "/api/v1/recipe-creation/gustify") in got, got         # fetchEventSource → options method
assert ("GET", "/api/v1/orders") in got, got                           # apiFetch still works
assert fb.diff_new_fetches(' new EventSource("/api/v1/ctx");') == []    # a non-added (+) line is ignored
PY
then ok "S10 diff-arm prices a new literal SSE fetch (review ↔ pulse consistency)"; else bad "diff_new_fetches missed an SSE call"; fi

# ── S11 · model-census drift — table classes no entity's config allowlist claims (reads archmap.model_census) ──
r=$(repo s11a); mkarchmap "$r" '{"entities":{"pantry":{"endpoints":[]}},"model_census":{"scanned_dirs":["app/models"],"claimed":9,"unclaimed":[{"cls":"ShoppingItem","table":"shopping_items","file":"app/models/shopping.py","reason":"file not in any entity'"'"'s models list"},{"cls":"IdempotencyKey","table":"idempotency_keys","file":"app/models/idempotency.py","reason":"file not in any entity'"'"'s models list"}]}}'
run "$r" | grep -q "model-census drift — 2 table class(es).*ShoppingItem" && ok "S11 fires: unclaimed table classes named" || bad "S11 did not fire on unclaimed table classes"
# SILENT: the census is present and empty
r=$(repo s11b); mkarchmap "$r" '{"entities":{"pantry":{"endpoints":[]}},"model_census":{"scanned_dirs":["app/models"],"claimed":9,"unclaimed":[]}}'
run "$r" | grep -q "model-census drift" && bad "S11 fired on an empty unclaimed list" || ok "S11 silent when every table class is claimed"
# SILENT + honest: an archmap that predates the census never fabricates a count
r=$(repo s11c); mkarchmap "$r" '{"entities":{"pantry":{"endpoints":[]}}}'
run "$r" | grep -q "model-census drift" && bad "S11 fired on an archmap without a census" || ok "S11 silent (unavailable) on a pre-census archmap"
# SILENT: no center at all
r=$(repo s11d); commits "$r" 1 "feat: work"
run "$r" | grep -q "model-census drift" && bad "S11 fired without a center" || ok "S11 silent with no center config"

# ── S12 · schema-homing residue — ambiguous / unwired-in-live-file schemas (reads archmap.schema_homing); dormant never nags ──
r=$(repo s12a); mkarchmap "$r" '{"entities":{"pantry":{"endpoints":[]}},"schema_homing":{"moved":[{"cls":"MeResponse","from":"progression","to":"auth","why":"consumed-by:GET /me"}],"ambiguous":[{"cls":"DietaryBlock","home":"progression","consumers":["auth","settings"]}],"unwired":[{"cls":"Ghost","home":"cooking","file":"s/g.py","dormant":false},{"cls":"ReceiptIngestRequest","home":"pantry","file":"s/gastify.py","dormant":true}],"fn_wires":[]}}'
out=$(run "$r"); echo "$out" | grep -q "schema homing — 1 unwired in live files (Ghost) · 1 multi-consumer · 1 dormant" && ok "S12 fires: live-unwired named; multi-consumer + dormant counted as context" || bad "S12 did not fire / wrong line: $out"
# SILENT: only dormant / multi-consumer shapes — neither is an action (a contract lane wakes itself; shared Blocks stay by ruling)
r=$(repo s12b); mkarchmap "$r" '{"entities":{"pantry":{"endpoints":[]}},"schema_homing":{"moved":[],"ambiguous":[{"cls":"DietaryBlock","home":"progression","consumers":["auth","settings"]}],"unwired":[{"cls":"ReceiptIngestRequest","home":"pantry","file":"s/gastify.py","dormant":true}],"fn_wires":[]}}'
run "$r" | grep -q "schema homing" && bad "S12 nagged on dormant + multi-consumer shapes" || ok "S12 silent when only dormant / multi-consumer shapes remain"
# SILENT: moves alone are the rule working, not residue
r=$(repo s12c); mkarchmap "$r" '{"entities":{"pantry":{"endpoints":[]}},"schema_homing":{"moved":[{"cls":"X","from":"a","to":"b","why":"consumed-by:GET /x"}],"ambiguous":[],"unwired":[],"fn_wires":[]}}'
run "$r" | grep -q "schema homing" && bad "S12 fired on moves alone" || ok "S12 silent when every schema homed cleanly"
# SILENT + honest: a pre-homing archmap never fabricates
r=$(repo s12d); mkarchmap "$r" '{"entities":{"pantry":{"endpoints":[]}}}'
run "$r" | grep -q "schema homing" && bad "S12 fired on an archmap without the homing block" || ok "S12 silent (unavailable) on a pre-homing archmap"
r=$(repo s12e); commits "$r" 1 "feat: work"
run "$r" | grep -q "schema homing" && bad "S12 fired without a center" || ok "S12 silent with no center config"

# ── S13 · route/file-census drift — route + backend files no entity claims (reads archmap.route_census + file_census; non-empty-only keys; version≥2 gates predates) ──
# FIRE: route + file census both present (archmap version 2) → both counts named
r=$(repo s13a); mkarchmap "$r" '{"version":2,"entities":{"pantry":{"endpoints":[]}},"route_census":{"scanned_dirs":["api"],"claimed":5,"unclaimed":[{"file":"api/equipment.py","routes":2,"methods":["GET","POST"],"reason":"unclaimed route file"}]},"file_census":{"scanned_dirs":["api","svc"],"claimed":10,"unclaimed":[{"file":"svc/ownership.py","routes":0,"fns":3,"tables":1,"reason":"unclaimed backend file","reach":1}]}}'
run "$r" | grep -q "route/file census drift — 1 route file(s) + 1 backend file(s) no entity claims" && ok "S13 fires: route + file census both named" || bad "S13 did not fire on route + file census"
# FIRE: file-only census, reach-nearest file LEADS the list (near reach 1 before far reach 5, though 'far' < 'near' alphabetically)
r=$(repo s13b); mkarchmap "$r" '{"version":2,"entities":{"pantry":{"endpoints":[]}},"file_census":{"scanned_dirs":["svc"],"claimed":10,"unclaimed":[{"file":"svc/far.py","routes":0,"fns":2,"tables":0,"reason":"unclaimed backend file","reach":5},{"file":"svc/near.py","routes":0,"fns":2,"tables":0,"reason":"unclaimed backend file","reach":1}]}}'
run "$r" | grep -q "route/file census drift — 2 backend file(s) no entity claims (svc/near.py, svc/far.py)" && ok "S13 fires file-only, reach-nearest file first" || bad "S13 did not fire file-only / wrong reach order"
# QUIET (not unavailable): a version-2 archmap with the census keys ABSENT is genuine full coverage
r=$(repo s13c); mkarchmap "$r" '{"version":2,"entities":{"pantry":{"endpoints":[]}}}'
run "$r" --why | grep -qE "S13 +quiet" && ok "S13 quiet (full coverage) when a v2 archmap has no census keys" || bad "S13 not quiet on a v2 full-coverage archmap"
# UNAVAILABLE (honest, never a false all-clear): a pre-census archmap (version<2) cannot prove coverage
r=$(repo s13e); mkarchmap "$r" '{"version":1,"entities":{"pantry":{"endpoints":[]}}}'
run "$r" --why | grep -qE "S13 +UNAVAILABLE.*predates the route/file census" && ok "S13 unavailable (not silent) on a pre-census archmap — the false-clean guard" || bad "S13 reported clean on a pre-census archmap (silent-signal bug)"
run "$r" | grep -q "route/file census drift" && bad "S13 nagged on a pre-census archmap" || ok "S13 does not NAG on a pre-census archmap (unavailable ≠ fire)"
# SILENT: no center config
r=$(repo s13d); commits "$r" 1 "feat: work"
run "$r" | grep -q "route/file census" && bad "S13 fired without a center" || ok "S13 silent with no center config"

# ── S5 · scope drift — computable since the scope mirror (ruling 2026-08-07) ──
# no scope field on the current phase → honest unavailable, never a proxy guess
r=$(repo s5a); plan "$r" '{"goal":"g","current_phase":"1","phases":[{"id":"1","cells":{"exec":"done"}}]}'
out=$(run "$r" --why)
if echo "$out" | grep -q "S5  UNAVAILABLE" && echo "$out" | grep -q "no .*scope.* field"; then
  ok "S5 unavailable (honestly) when the current phase declares no scope"
else bad "S5 must name its missing source when scope is absent"; fi
# scope declared + a changed file outside it → fires
r=$(repo s5b); plan "$r" '{"goal":"g","current_phase":"1","phases":[{"id":"1","cells":{"exec":"done"},"scope":["api/*.py"]}]}'
cd "$r"; mkdir -p api web; echo x > api/in.py; echo x > web/out.tsx; git add -A; cd - >/dev/null
run "$r" | grep -q "outside phase 1's declared scope" && ok "S5 fires: a file changed outside declared scope" || bad "S5 did not fire on out-of-scope change"
# scope declared + all changes inside it → silent
r=$(repo s5c); plan "$r" '{"goal":"g","current_phase":"1","phases":[{"id":"1","cells":{"exec":"done"},"scope":["api/*.py"]}]}'
cd "$r"; mkdir -p api; echo x > api/one.py; echo x > api/two.py; git add -A; cd - >/dev/null
run "$r" | grep -q "outside phase" && bad "S5 fired though every change is in scope" || ok "S5 silent when all changes are in scope"
# glob semantics: api/*.py must NOT match a nested file (else 'in scope' silently over-claims)
r=$(repo s5d); plan "$r" '{"goal":"g","current_phase":"1","phases":[{"id":"1","cells":{"exec":"done"},"scope":["api/*.py"]}]}'
cd "$r"; mkdir -p api/deep; echo x > api/deep/nested.py; git add -A; cd - >/dev/null
run "$r" | grep -q "outside phase 1's declared scope" && ok "S5 counts a nested file as out-of-scope (glob * does not cross /)" || bad "S5 glob crossed a directory boundary"

# ── S6 with a GLOB-declared entity (the literal-only resolver made these invisible) ──
r=$(repo s6glob); mkdir -p "$r/docs/site/center"
cat > "$r/docs/site/center/center.config.json" <<'JSON'
{"entities":{"pantry":{"code":{"api":["api/*.py"]}}}}
JSON
cd "$r"; git add -A; git commit -qm cfg; mkdir -p api; for f in a b c; do echo x > api/$f.py; done; git add -A; cd - >/dev/null
run "$r" | grep -q "belong to the pantry code map" && ok "S6 fires on a glob-declared entity" || bad "S6 blind to glob code maps (literal-only resolver bug)"

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
