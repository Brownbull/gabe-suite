#!/usr/bin/env bash
# write-inflight.py fixture battery — the in-flight projection's executable
# contract (ruling 2026-08-07, ask A). Proves FIRE (writes the projection) and
# SILENT (no center → no file, no output), plus the honesty and determinism
# laws: declared null vs [] vs slugs, path-derived touched (bookkeeping commits
# skipped), no wallclock (unchanged tree ⇒ byte-identical, second run writes
# nothing). Hermetic: temp git repos. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
W="$REPO/skills/gabe-cc-update/scripts/write-inflight.py"

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok(){ pass=$((pass+1)); }
bad(){ fail=$((fail+1)); echo "FAIL: $1"; }

mkrepo() { local r="$T/$1"; mkdir -p "$r"; (cd "$r" && git init -q . \
  && git config user.email t@t && git config user.name t \
  && echo seed > seed.txt && git add -A && git commit -qm seed); echo "$r"; }
mkcenter() { mkdir -p "$1/docs/site/center"
  cat > "$1/docs/site/center/center.config.json" <<'JSON'
{"entities":{"transaction":{"code":{"api":["api/*.py"],"web":["web/*.tsx"]}},"pantry":{"code":{"api":["pantry/*.py"]}}}}
JSON
}
J() { python3 -c "import json;p=json.load(open('$1/docs/site/center/inflight.json'));print($2)"; }

# ── SILENT: no center → no file, no output ─────────────────────────────────
r=$(mkrepo nocenter)
out=$(python3 "$W" "$r"); rc=$?
[ "$rc" = 0 ] && [ -z "$out" ] && [ ! -f "$r/docs/site/center/inflight.json" ] \
  && ok || bad "no center must be fully silent (rc=$rc out='$out')"

# ── FIRE: active plan + declared entities + dirty touched files ────────────
r=$(mkrepo live); mkcenter "$r"; mkdir -p "$r/.kdbp" "$r/api" "$r/web"
cat > "$r/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":"7","phases":[
 {"id":"7","name":"F6 backend","tier":"mvp","complexity":"low","types":["persistence"],
  "cells":{"exec":"in_progress"},"cases":null,"entities":["pantry"],"scope":["api/*.py"]}]}
JSON
(cd "$r" && git add -A && git commit -qm "center + plan")
echo x > "$r/api/tx.py"; echo x > "$r/api/tx2.py"   # dirty, matches transaction glob
out=$(python3 "$W" "$r")
[ -f "$r/docs/site/center/inflight.json" ] && ok || bad "active plan must write inflight.json"
[ -f "$r/docs/site/center/inflight.js" ] && ok || bad "writer must emit the inflight.js script sibling (file:// kills fetch)"
head -c 23 "$r/docs/site/center/inflight.js" | grep -q "window.GABE_INFLIGHT = " \
  && ok || bad "inflight.js must be the window-assignment form"
python3 -c "
import json
j = json.load(open('$r/docs/site/center/inflight.json'))
js = open('$r/docs/site/center/inflight.js').read().strip()
assert js.startswith('window.GABE_INFLIGHT = ') and js.endswith(';')
assert json.loads(js[len('window.GABE_INFLIGHT = '):-1]) == j
" && ok || bad "inflight.js payload must equal inflight.json byte-for-semantics"
echo "$out" | grep -q "inflight: 7" && ok || bad "write must print its one line (got '$out')"
[ "$(J "$r" "p['active']")" = "True" ] && ok || bad "active flag"
[ "$(J "$r" "p['phase']['name']")" = "F6 backend" ] && ok || bad "phase payload carried"
[ "$(J "$r" "p['declared']")" = "['pantry']" ] && ok || bad "declared entities carried from the plan record"
[ "$(J "$r" "p['touched']")" = "[{'files': 2, 'slug': 'transaction'}]" ] \
  && ok || bad "touched must be path-derived from the dirty diff (got $(J "$r" "p['touched']"))"
[ "$(J "$r" "p['work_source']")" = "dirty" ] && ok || bad "work_source dirty"

# ── determinism: second run on an unchanged tree writes nothing, bytes equal ─
cp "$r/docs/site/center/inflight.json" "$T/before.json"   # cmp, not md5sum (BSD ships no md5sum)
out2=$(python3 "$W" "$r")
[ -z "$out2" ] && cmp -s "$T/before.json" "$r/docs/site/center/inflight.json" \
  && ok || bad "unchanged tree must be a silent no-op with identical bytes"
grep -qE '"(generated|ts|time)' "$r/docs/site/center/inflight.json" \
  && bad "projection must carry NO wallclock field" || ok

# ── honest blanks: no entities key → declared null; none-declaration → [] ──
r=$(mkrepo blanks); mkcenter "$r"; mkdir -p "$r/.kdbp"
cat > "$r/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":"1","phases":[
 {"id":"1","name":"A","cells":{"exec":"todo"}}]}
JSON
(cd "$r" && git add -A && git commit -qm "wire")
python3 "$W" "$r" >/dev/null
[ "$(J "$r" "p['declared']")" = "None" ] && ok || bad "no entities key must render declared null (never a guess)"
python3 - "$r" <<'PY'
import json, sys
p = json.load(open(sys.argv[1] + "/.kdbp/PLAN.json"))
p["phases"][0]["entities"] = []
json.dump(p, open(sys.argv[1] + "/.kdbp/PLAN.json", "w"))
PY
python3 "$W" "$r" >/dev/null
[ "$(J "$r" "p['declared']")" = "[]" ] && ok || bad "explicit none-declaration must render declared []"

# ── bookkeeping blindness: clean tree, kdbp commit on top — touched sees work ─
r=$(mkrepo walkback); mkcenter "$r"; mkdir -p "$r/.kdbp" "$r/api"
cat > "$r/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":"1","phases":[{"id":"1","name":"A","cells":{"exec":"done"}}]}
JSON
(cd "$r" && git add -A && git commit -qm "wire" \
  && for f in a b c; do echo x > api/$f.py; done && git add -A && git commit -qm "feat: work" \
  && echo tick > .kdbp/LEDGER.md && git add -A && git commit -qm "chore(kdbp): tick")
python3 "$W" "$r" >/dev/null
[ "$(J "$r" "p['touched'][0]['slug']")" = "transaction" ] \
  && ok || bad "clean tree must walk past the .kdbp bookkeeping commit to the work commit"
[ "$(J "$r" "p['work_source']")" != "dirty" ] && ok || bad "work_source must name the commit, not dirty"

# ── archived plan → active:false with the reason ───────────────────────────
r=$(mkrepo archived); mkcenter "$r"; mkdir -p "$r/.kdbp"
printf '{"version":1,"status":"none","phases":[]}' > "$r/.kdbp/PLAN.json"
(cd "$r" && git add -A && git commit -qm "wire")
python3 "$W" "$r" >/dev/null
[ "$(J "$r" "p['active']")" = "False" ] && ok || bad "archived plan must render active:false"
[ "$(J "$r" "p['reason']")" = "plan status: none" ] && ok || bad "inactive carries its reason"

# ── null current_phase → active:false, NOT a declared phase mispublished ────
# (regen-mirror writes current_phase:null when PLAN.md's Current Phase line
# doesn't parse; str(None)=="None" would look up nothing and print declared:null
# for a phase that DID declare entities)
r=$(mkrepo nullphase); mkcenter "$r"; mkdir -p "$r/.kdbp"
cat > "$r/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":null,"phases":[{"id":"1","name":"A","cells":{"exec":"todo"},"entities":["pantry"]}]}
JSON
(cd "$r" && git add -A && git commit -qm wire)
python3 "$W" "$r" >/dev/null
[ "$(J "$r" "p['active']")" = "False" ] && ok || bad "null current_phase must render active:false, never publish a phase as never-declared"
[ "$(J "$r" "'current_phase' not in p")" = "True" ] && ok || bad "null current_phase must be omitted, never the literal 'None'"

# ── suite center layout (docs/center/suite-center.config.json) must be found ──
# (the single-path probe produced nothing on a suite-shaped center while pulse fired)
r=$(mkrepo suitelayout); mkdir -p "$r/docs/center" "$r/.kdbp" "$r/api"
cat > "$r/docs/center/suite-center.config.json" <<'JSON'
{"entities":{"pantry":{"code":{"api":["api/*.py"]}}}}
JSON
cat > "$r/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":"1","phases":[{"id":"1","name":"A","cells":{"exec":"in_progress"},"entities":["pantry"]}]}
JSON
(cd "$r" && git add -A && git commit -qm wire && echo x > api/x.py)
out=$(python3 "$W" "$r")
[ -f "$r/docs/center/inflight.json" ] && ok || bad "suite-layout center must produce inflight.json (two-layout probe)"
[ -n "$out" ] && ok || bad "suite-layout center must not fall to the silent no-center path"

# ── shared resolver parity: board's touched agrees with the pulse S6 resolver ─
# both must call work_scope; a glob-declared entity that S6 sees, the board sees too
r=$(mkrepo parity); mkdir -p "$r/docs/site/center" "$r/.kdbp" "$r/api"
cat > "$r/docs/site/center/center.config.json" <<'JSON'
{"entities":{"pantry":{"code":{"api":["api/*.py"]}}}}
JSON
cat > "$r/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":"1","phases":[{"id":"1","name":"A","cells":{"exec":"in_progress"}}]}
JSON
(cd "$r" && git add -A && git commit -qm wire && for f in a b c; do echo x > api/$f.py; done)
python3 "$W" "$r" >/dev/null
[ "$(J "$r" "p['touched'][0]['slug']")" = "pantry" ] && ok || bad "board resolver must match glob-declared entities (shared work_scope)"
[ "$(J "$r" "p['touched'][0]['files']")" = "3" ] && ok || bad "board resolver must count 3 glob-matched files"

echo "inflight battery: $pass passed, $fail failed"
[ "$fail" = 0 ]
