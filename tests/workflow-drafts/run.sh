#!/usr/bin/env bash
# draft-workflows.py fixture battery — the curate-workflows DRAFTER's executable contract
# (operator ruling 2026-09-04: journey creation becomes a suite step). Proves, hermetically on a
# synthetic center (c4-graph.json + workflows.js in a temp dir):
#   * FIRE      — uncovered endpoints reached from a screen become ONE draft per entity·screen cluster,
#                 steps ordered read→write, level SUGGESTED (no writes → 1 · single-entity writes → 2 ·
#                 cross-entity → 3), `draft:true`, named from the screen + verb phrase.
#   * SILENT    — every endpoint covered by workflows.js → zero drafts (an EMPTY draft file, so a stale
#                 draft never lingers).
#   * HONEST-EMPTY — no center config → the reason printed, NOTHING written, exit 0; no c4 → same.
#   * UNREACHED — an uncovered endpoint no screen calls is REPORTED, never drafted (a bridge gap or a
#                 dead endpoint is the human's call).
#   * INFRA     — BOOT events and `/_…` paths are skipped by idiom, counted, never drafted.
#   * DETERMINISM — a second run on an unchanged input writes nothing and is byte-identical.
#   * MUTATION  — remove the write op → the suggested level drops 2→1 (the level is READ from the graph).
#   * TOLERANT PARSE — a `{param}` inside a curated step label does not break coverage.
# Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
D="$REPO/skills/gabe-cc-update/scripts/draft-workflows.py"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok(){ pass=$((pass+1)); }
bad(){ fail=$((fail+1)); echo "  FAIL: $1"; }

mkcenter() { local r="$T/$1"; mkdir -p "$r/docs/site/center"; printf '{}' > "$r/docs/site/center/center.config.json"; echo "$r"; }
# a synthetic c4: pantry (2 endpoints, one write) + cooking (1 read endpoint) + an infra endpoint + BOOT;
# fe: PantryRoute renders usePantry (the screen that fetches both pantry endpoints), CookingRoute renders useCooking.
c4() { cat <<'JSON'
{"head":"abc1234","l2":{
 "pantry":{"nodes":[
   {"id":"endpoint:GET /pantry/history","kind":"endpoint","label":"GET /pantry/history","slug":"pantry","access":{"ops":[{"model":"PantryItem","rw":"r"}]}},
   {"id":"endpoint:POST /pantry/reset","kind":"endpoint","label":"POST /pantry/reset","slug":"pantry","access":{"ops":[{"model":"PantryItem","rw":"r"},{"model":"PantryItem","rw":"w"}]}},
   {"id":"model:PantryItem","kind":"model","label":"PantryItem","slug":"pantry"}]},
 "cooking":{"nodes":[
   {"id":"endpoint:GET /cooking/active","kind":"endpoint","label":"GET /cooking/active","slug":"cooking","access":{"ops":[{"model":"CookingSession","rw":"r"}]}},
   {"id":"endpoint:POST /_e2e/seed","kind":"endpoint","label":"POST /_e2e/seed","slug":"cooking","access":{"ops":[{"model":"CookingSession","rw":"w"}]}},
   {"id":"model:CookingSession","kind":"model","label":"CookingSession","slug":"cooking"}]},
 "__unclaimed__":{"nodes":[{"id":"endpoint:BOOT lifespan","kind":"endpoint","label":"BOOT lifespan","slug":"__unclaimed__","access":{"ops":[]}}]}},
 "cross_edges":[
   {"kind":"bridge","from":"web:src/features/pantry/usePantry","to":"endpoint:GET /pantry/history"},
   {"kind":"bridge","from":"web:src/features/pantry/usePantry","to":"endpoint:POST /pantry/reset"},
   {"kind":"bridge","from":"web:src/features/cooking/useCooking","to":"endpoint:GET /cooking/active"}],
 "fe":{"pieces":[
   {"id":"fe:src/routes/PantryRoute.tsx#PantryRoute","name":"PantryRoute","kind":"route","file":"src/routes/PantryRoute.tsx"},
   {"id":"fe:src/features/pantry/usePantry.ts#usePantry","name":"usePantry","kind":"hook","file":"src/features/pantry/usePantry.ts","screen":"web:src/features/pantry/usePantry"},
   {"id":"fe:src/routes/CookingRoute.tsx#CookingRoute","name":"CookingRoute","kind":"route","file":"src/routes/CookingRoute.tsx"},
   {"id":"fe:src/features/cooking/useCooking.ts#useCooking","name":"useCooking","kind":"hook","file":"src/features/cooking/useCooking.ts","screen":"web:src/features/cooking/useCooking"}],
  "edges":[[0,1,"uses-hook"],[2,3,"uses-hook"]]}}
JSON
}

# ── FIRE: only the cooking read is curated → the two pantry endpoints draft as ONE cluster ──
r=$(mkcenter fire); c4 > "$r/docs/site/center/c4-graph.json"
printf 'window.GABE_WORKFLOWS = [\n  { name: "Cook", level: 2, steps: ["GET /cooking/active", "GET /recipes/{recipe_id}"] }\n];\n' > "$r/docs/site/center/workflows.js"
out=$(python3 "$D" "$r" --json); echo "$out" > "$T/fire.json"
python3 - "$T/fire.json" <<'PY' && ok || bad "FIRE: one pantry·PantryRoute draft, steps read→write, level 2, draft:true"
import json,sys; r=json.load(open(sys.argv[1])); d=r["drafts"]
assert len(d)==1, d
x=d[0]; assert x["draft"] is True and x["cluster"]=={"entity":"pantry","screen":"PantryRoute"}, x
assert x["steps"]==["GET /pantry/history","POST /pantry/reset"], x["steps"]
assert x["level"]==2 and x["why"]["writes"]==1 and x["name"].startswith("Pantry · add"), x
assert r["endpoints"]==5 and r["covered"]==1 and r["uncovered"]==2 and r["skipped_infra"]==["BOOT lifespan","POST /_e2e/seed"], r
PY
grep -q 'window.GABE_WORKFLOWS_DRAFT = \[' "$r/docs/site/center/workflows.draft.js" && grep -q '"name": "Pantry · add (2 endpoints)"' "$r/docs/site/center/workflows.draft.js" \
  && ok || bad "FIRE: the draft file carries window.GABE_WORKFLOWS_DRAFT with the named draft"
grep -q '"steps": \[' "$r/docs/site/center/workflows.draft.js" && ! grep -q '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]' "$r/docs/site/center/workflows.draft.js" \
  && ok || bad "FIRE: no wallclock in the draft file (the c4 head is the only stamp)"
grep -q 'head abc1234' "$r/docs/site/center/workflows.draft.js" && ok || bad "FIRE: the c4 head sha stamps the draft's provenance"

# ── TOLERANT PARSE: the curated `{recipe_id}` label above did not break coverage (covered==1 asserted) — and a
#    curated label WITH a param covering an endpoint is honoured ──
r=$(mkcenter tol); c4 > "$r/docs/site/center/c4-graph.json"
printf '/* curated */\nwindow.GABE_WORKFLOWS = [\n  // reset first\n  { name: "Pantry", level: 1, steps: ["POST /pantry/reset", "GET /pantry/history"] },\n  { name: "Cook", steps: ["GET /cooking/active"] }\n];\n' > "$r/docs/site/center/workflows.js"
python3 "$D" "$r" --json > "$T/tol.json"
python3 - "$T/tol.json" <<'PY' && ok || bad "SILENT: every endpoint covered → zero drafts, an EMPTY draft list, 2 workflows counted"
import json,sys; r=json.load(open(sys.argv[1])); assert r["drafts"]==[] and r["covered"]==3 and r["uncovered"]==0 and r["workflows"]==2, r
PY
grep -q 'window.GABE_WORKFLOWS_DRAFT = \[\];' "$r/docs/site/center/workflows.draft.js" && ok || bad "SILENT: the draft file is written EMPTY (no stale drafts linger)"

# ── HONEST-EMPTY: no center config → reason, nothing written, exit 0; no c4 → same ──
r="$T/nocenter"; mkdir -p "$r"
o=$(python3 "$D" "$r"); rc=$?
[ "$rc" = 0 ] && echo "$o" | grep -q "no center" && [ ! -e "$r/docs/site/center/workflows.draft.js" ] && ok || bad "HONEST-EMPTY: no center → reason + nothing written + exit 0 ($o)"
r=$(mkcenter noc4); o=$(python3 "$D" "$r"); rc=$?
[ "$rc" = 0 ] && echo "$o" | grep -q "no c4-graph" && [ ! -e "$r/docs/site/center/workflows.draft.js" ] && ok || bad "HONEST-EMPTY: no c4 → reason + nothing written ($o)"

# ── UNREACHED: drop the pantry bridge → the pantry endpoints have no screen → reported, not drafted ──
r=$(mkcenter unr); c4 | python3 -c "import json,sys; j=json.load(sys.stdin); j['cross_edges']=[e for e in j['cross_edges'] if 'pantry' not in e['to']]; print(json.dumps(j))" > "$r/docs/site/center/c4-graph.json"
printf 'window.GABE_WORKFLOWS = [{ name: "Cook", steps: ["GET /cooking/active"] }];\n' > "$r/docs/site/center/workflows.js"
python3 "$D" "$r" --json > "$T/unr.json"
python3 - "$T/unr.json" <<'PY' && ok || bad "UNREACHED: no-screen endpoints are reported, never drafted"
import json,sys; r=json.load(open(sys.argv[1])); assert r["drafts"]==[] and sorted(u["label"] for u in r["unreached"])==["GET /pantry/history","POST /pantry/reset"], r
PY

# ── DETERMINISM: a second run on an unchanged input writes nothing and the file is byte-identical ──
r=$(mkcenter det); c4 > "$r/docs/site/center/c4-graph.json"; printf 'window.GABE_WORKFLOWS = [];\n' > "$r/docs/site/center/workflows.js"
python3 "$D" "$r" >/dev/null; h1=$(md5sum "$r/docs/site/center/workflows.draft.js" | cut -d' ' -f1)
o=$(python3 "$D" "$r"); h2=$(md5sum "$r/docs/site/center/workflows.draft.js" | cut -d' ' -f1)
[ "$h1" = "$h2" ] && echo "$o" | grep -q "(unchanged)" && ok || bad "DETERMINISM: unchanged input → byte-identical + '(unchanged)' ($o)"

# ── MUTATION: remove the write op → the pantry draft's suggested level drops 2→1 and the phrase reads 'browse'? (POST stays) ──
r=$(mkcenter mut); c4 | python3 -c "
import json,sys; j=json.load(sys.stdin)
for n in j['l2']['pantry']['nodes']:
    if n.get('kind')=='endpoint': n['access']['ops']=[o for o in n['access']['ops'] if o['rw']!='w']
print(json.dumps(j))" > "$r/docs/site/center/c4-graph.json"
printf 'window.GABE_WORKFLOWS = [{ name: "Cook", steps: ["GET /cooking/active"] }];\n' > "$r/docs/site/center/workflows.js"
python3 "$D" "$r" --json > "$T/mut.json"
python3 - "$T/mut.json" <<'PY' && ok || bad "MUTATION: no write ops → level 1 (the level is read from the graph, not assumed)"
import json,sys; r=json.load(open(sys.argv[1])); d=r["drafts"]; assert len(d)==1 and d[0]["level"]==1 and d[0]["why"]["writes"]==0, d
PY

# ── --min: a cluster below the minimum is not drafted ──
r=$(mkcenter mn); c4 > "$r/docs/site/center/c4-graph.json"; printf 'window.GABE_WORKFLOWS = [];\n' > "$r/docs/site/center/workflows.js"
python3 "$D" "$r" --json --min 2 > "$T/mn.json"
python3 - "$T/mn.json" <<'PY' && ok || bad "--min 2: the 1-endpoint cooking cluster is dropped, the 2-endpoint pantry cluster stays"
import json,sys; r=json.load(open(sys.argv[1])); assert [d["cluster"]["entity"] for d in r["drafts"]]==["pantry"], r["drafts"]
PY

echo "workflow-drafts battery: $pass passed, $fail failed"
exit $(( fail > 0 ))
