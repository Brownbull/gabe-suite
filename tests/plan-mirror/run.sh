#!/usr/bin/env bash
# PLAN.md → PLAN.json mirror-producer fixture battery (2026-07-22 alignment review M26).
#
# regen-mirror.py is the ONE deterministic producer of .kdbp/PLAN.json — the mirror that
# plan-proof-guard.sh, gabe-next's next.mjs, and the session hooks all consume — yet the
# hooks battery hand-builds PLAN.json and never exercises the producer (M26). This battery
# runs the producer itself against fixture PLAN.md files: the Phases-table parse (mixed
# glyphs incl. ⏸/⚰️, escaped \| cell content, blank-cell warn→todo, "—" column omission,
# tier override notation, in-table Types fallback), Phase Details single + grouped-range
# headings (YAML types / proof_type, Proof/Cases bullets), the preservation rule
# ("regeneration must never wipe recorded evidence into null"), both documented BREAK
# exits plus the untouched-mirror-on-BREAK property, drift/warn reporting, and
# byte-identical idempotency. Hermetic: temp fixture dirs only, no network, no repo
# writes, cleans up after itself. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$REPO/skills/gabe-plan/scripts/regen-mirror.py"

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

run() { # $1 = fixture dir; echoes exit code; stdout -> $T/out, stderr -> $T/err
  (cd "$1" && python3 "$SCRIPT" >"$T/out" 2>"$T/err"; echo $?)
}
J() { # $1 = fixture dir, $2 = python expr over the emitted plan `p`; prints the value
  python3 -c "
import json
p = json.load(open('$1/.kdbp/PLAN.json'))
print($2)"
}

# --- case 1+2: full-shape fixture (mixed glyphs, escaped pipe, grouped details) --------
H="$T/happy"; mkdir -p "$H/.kdbp"
cat > "$H/.kdbp/PLAN.md" <<'MD'
# Plan — Battery Fixture

<!-- status: active -->
<!-- project_type: code -->

## Context

- **Maturity:** mvp
- **Created:** 2026-07-22
- **Last Updated:** 2026-07-22 (battery)

## Goal

Prove the mirror producer
against fixtures.

Second paragraph stays out of the goal.

## Current Phase

Phase 2 — parser hardening.

## Phases

| # | Phase | Tier | Complexity | Types | Red | Exec | Review | Commit | Push | Center |
|---|-------|------|------------|-------|-----|------|--------|--------|------|--------|
| 1 | Bootstrap | mvp (obs→ent) | S | `code`, `test` | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 2 | Guard \| Rails | mvp | M | | 🔄 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | Polish | enterprise | L | | — | ⬜ | ⬜ | | ⏸ | ⚰️ |
| 4 | Tail | scale | S | `data` | — | ⬜ | ⬜ | ⬜ | ⬜ | — |

## Phase Details

### Phase 1 — Bootstrap

- **Proof:** PROOF: fixture -> battery -> green
- **Cases:** NEW C1 · NEW C2

types: [code, test]
proof_type: test

### Phases 2–3 — Hardening arc

- **Types:** `guard`
MD

[ "$(run "$H")" = 0 ] && ok || { bad "happy: must exit 0"; cat "$T/err"; }
grep -q "wrote .kdbp/PLAN.json: 4 phases, current_phase='2'" "$T/out" \
  && ok || bad "happy: wrote-line reports 4 phases + current_phase 2"
[ "$(grep -c 'is BLANK' "$T/out")" = 1 ] && grep -q 'phase 3 commit cell is BLANK' "$T/out" \
  && ok || bad "happy: exactly the blank commit cell warns (recorded as todo)"
grep -q 'drift:' "$T/out" && bad "happy: first run has no old mirror — no drift line" || ok
[ "$(J "$H" "[ph['id'] for ph in p['phases']]")" = "['1', '2', '3', '4']" ] \
  && ok || bad "happy: phase ids"
[ "$(J "$H" "p['current_phase']")" = "2" ] \
  && ok || bad "happy: current_phase parsed out of narrative"
[ "$(J "$H" "(p['status'], p['project_type'], p['maturity'], p['created'], p['last_updated'])")" \
  = "('active', 'code', 'mvp', '2026-07-22', '2026-07-22')" ] \
  && ok || bad "happy: comment tags + context fields (Last Updated date-trimmed)"
[ "$(J "$H" "p['goal']")" = "Prove the mirror producer against fixtures." ] \
  && ok || bad "happy: goal = first paragraph, newline-joined"
[ "$(J "$H" "p['phases'][0]['cells']")" \
  = "{'red': 'done', 'exec': 'done', 'review': 'done', 'commit': 'done', 'push': 'done'}" ] \
  && ok || bad "happy: phase 1 ✅ glyphs -> done, '—' center omitted"
[ "$(J "$H" "(p['phases'][0]['tier'], p['phases'][0]['types'], p['phases'][0]['proof_type'])")" \
  = "('mvp', ['code', 'test'], 'test')" ] \
  && ok || bad "happy: tier base of override notation + YAML types + proof_type"
[ "$(J "$H" "(p['phases'][0]['proof'], p['phases'][0]['cases'])")" \
  = "('PROOF: fixture -> battery -> green', 'NEW C1 · NEW C2')" ] \
  && ok || bad "happy: phase 1 Proof + Cases bullets from details"
[ "$(J "$H" "p['phases'][1]['name']")" = "Guard | Rails" ] \
  && ok || bad "escaped pipe: \\| cell content must survive as a literal pipe"
[ "$(J "$H" "(p['phases'][1]['tier'], p['phases'][1]['cells']['red'], p['phases'][1]['cells']['exec'])")" \
  = "('mvp', 'in_progress', 'todo')" ] \
  && ok || bad "escaped pipe: row must not shift columns"
[ "$(J "$H" "(p['phases'][1]['types'], p['phases'][2]['types'])")" = "(['guard'], ['guard'])" ] \
  && ok || bad "happy: grouped 'Phases 2–3' heading applies to every id in range"
[ "$(J "$H" "('red' in p['phases'][2]['cells'], p['phases'][2]['cells']['commit'], p['phases'][2]['cells']['push'], p['phases'][2]['cells']['center'])")" \
  = "(False, 'todo', 'deferred', 'obsolete')" ] \
  && ok || bad "happy: '—' omits key, blank->todo, ⏸ deferred, ⚰️ obsolete"
[ "$(J "$H" "(p['phases'][3]['types'], p['phases'][3]['proof'])")" = "(['data'], None)" ] \
  && ok || bad "happy: in-table Types fallback + evidence-free proof stays null"

# --- case 5: idempotency — second run byte-identical -----------------------------------
cp "$H/.kdbp/PLAN.json" "$T/snap1.json"
[ "$(run "$H")" = 0 ] && ok || bad "idempotency: second run exits 0"
cmp -s "$T/snap1.json" "$H/.kdbp/PLAN.json" \
  && ok || bad "idempotency: PLAN.json must be byte-identical across runs"
grep -q "drift: rows added to mirror: none · rows dropped: none" "$T/out" \
  && ok || bad "idempotency: second run prints the no-drift summary"

# --- case 3: preservation — .md-silent evidence survives regeneration ------------------
PRES="$T/pres"; mkdir -p "$PRES/.kdbp"
cat > "$PRES/.kdbp/PLAN.md" <<'MD'
## Current Phase

Phase 2

## Phases

| # | Phase | Exec |
|---|-------|------|
| 1 | Alpha | ✅ |
| 2 | Beta | 🔄 |

## Phase Details

### Phase 1 — Alpha

- **Proof:** PROOF: md wins over the old mirror
MD
cat > "$PRES/.kdbp/PLAN.json" <<'JSON'
{"version": 1, "phases": [
  {"id": "1", "proof": "old-should-lose", "proof_type": null, "cases": null},
  {"id": "2", "proof": "PROOF: exec -> walked -> old-must-survive", "proof_type": "visual", "cases": "NEW C9 (red@abc123)"}
]}
JSON
[ "$(run "$PRES")" = 0 ] && ok || bad "preservation: run exits 0"
[ "$(J "$PRES" "p['phases'][1]['proof']")" = "PROOF: exec -> walked -> old-must-survive" ] \
  && ok || bad "preservation: silent .md must KEEP the old mirror's proof, never null it"
[ "$(J "$PRES" "(p['phases'][1]['proof_type'], p['phases'][1]['cases'])")" \
  = "('visual', 'NEW C9 (red@abc123)')" ] \
  && ok || bad "preservation: proof_type + cases preserved too"
[ "$(grep -c 'preserved phase 2' "$T/out")" = 3 ] \
  && ok || bad "preservation: all three preserved fields are printed"
[ "$(J "$PRES" "p['phases'][0]['proof']")" = "PROOF: md wins over the old mirror" ] \
  && ok || bad "preservation: an .md value must overwrite the old mirror's"
grep -q 'preserved phase 1' "$T/out" \
  && bad "preservation: overwritten field must not claim preservation" || ok
cp "$PRES/.kdbp/PLAN.json" "$T/snap2.json"
run "$PRES" >/dev/null
cmp -s "$T/snap2.json" "$PRES/.kdbp/PLAN.json" \
  && ok || bad "preservation: re-preserving is idempotent (byte-identical)"

# --- case 4: both documented BREAK exits + happy already proved exit 0 -----------------
NOHDR="$T/nohdr"; mkdir -p "$NOHDR/.kdbp"
cat > "$NOHDR/.kdbp/PLAN.md" <<'MD'
## Phases

| id | name |
|----|------|
| 1 | x |
MD
[ "$(run "$NOHDR")" = 1 ] && ok || bad "BREAK 1: table without '#'+'Phase' header must exit 1"
grep -q "BREAK: no Phases table header" "$T/err" && ok || bad "BREAK 1: names the missing header"

GLY="$T/glyph"; mkdir -p "$GLY/.kdbp"
cat > "$GLY/.kdbp/PLAN.md" <<'MD'
## Phases

| # | Phase | Exec |
|---|-------|------|
| 1 | x | ❌ |
MD
printf '{"sentinel": true}\n' > "$GLY/.kdbp/PLAN.json"
[ "$(run "$GLY")" = 1 ] && ok || bad "BREAK 2: unknown glyph must exit 1"
grep -q "phase 1 exec cell" "$T/err" && grep -q "is not a known glyph" "$T/err" \
  && ok || bad "BREAK 2: names phase, column, glyph"
[ "$(cat "$GLY/.kdbp/PLAN.json")" = '{"sentinel": true}' ] \
  && ok || bad "BREAK 2: a failed run must leave the existing mirror untouched (write is last)"

# Missing .kdbp/PLAN.md is a clean BREAK (was an uncaught FileNotFoundError
# traceback until the M26 battery flagged it; fixed same-commit).
MISS="$T/miss"; mkdir -p "$MISS/.kdbp"
[ "$(run "$MISS")" = 1 ] && ok || bad "missing PLAN.md: exits 1"
grep -q "BREAK: no .kdbp/PLAN.md" "$T/err" \
  && ok || bad "missing PLAN.md: must BREAK cleanly, not traceback"

# --- unreadable old mirror: regenerate fresh, say so -----------------------------------
GARB="$T/garb"; mkdir -p "$GARB/.kdbp"
cat > "$GARB/.kdbp/PLAN.md" <<'MD'
## Current Phase

Phase 1

## Phases

| # | Phase | Exec |
|---|-------|------|
| 1 | Solo | ⬜ |
MD
echo 'not json at all' > "$GARB/.kdbp/PLAN.json"
[ "$(run "$GARB")" = 0 ] && ok || bad "garbage mirror: regenerates fresh, exit 0"
grep -q "old mirror unreadable" "$T/out" \
  && ok || bad "garbage mirror: says why preservation was skipped"
[ "$(J "$GARB" "[ph['id'] for ph in p['phases']]")" = "['1']" ] \
  && ok || bad "garbage mirror: a valid mirror is rewritten"

# --- battery-found producer bugs, fixed same-commit (M26) ------------------------------
# (1) The in-table Types fallback once stripped " `[]" in the filter but only
# " `" in the value — a YAML-bracket cell "[x, y]" leaked as ['[x', 'y]'].
BR="$T/brackets"; mkdir -p "$BR/.kdbp"
cat > "$BR/.kdbp/PLAN.md" <<'MD'
## Phases

| # | Phase | Types | Exec |
|---|-------|-------|------|
| 1 | A | [x, y] | ⬜ |
MD
[ "$(run "$BR")" = 0 ] && ok || bad "bug1: bracket-types row still runs"
[ "$(J "$BR" "p['phases'][0]['types']")" = "['x', 'y']" ] \
  && ok || bad "bug1: bracket table cell must mirror clean types, no bracket leak"

# (2) A whitespace-only "- **Proof:** " bullet once parsed as proof "" (not
# None) and OVERWROTE a recorded old-mirror proof with the empty string — an
# evidence wipe the preservation rule (exact-None guard) never saw. A blank
# bullet is now NO value: the old proof survives, with its preservation note.
WS="$T/wsproof"; mkdir -p "$WS/.kdbp"
cat > "$WS/.kdbp/PLAN.md" <<'MD'
## Phases

| # | Phase | Exec |
|---|-------|------|
| 1 | A | ✅ |

## Phase Details

### Phase 1 — A

MD
printf -- '- **Proof:** \n' >> "$WS/.kdbp/PLAN.md"
cat > "$WS/.kdbp/PLAN.json" <<'JSON'
{"version": 1, "phases": [{"id": "1", "proof": "old-evidence", "proof_type": null, "cases": null}]}
JSON
[ "$(run "$WS")" = 0 ] && ok || bad "bug2: whitespace-proof fixture runs"
[ "$(J "$WS" "p['phases'][0]['proof']")" = "old-evidence" ] \
  && ok || bad "bug2: whitespace-only Proof bullet must PRESERVE recorded evidence, never wipe it"
grep -q 'preserved phase 1 proof' "$T/out" \
  && ok || bad "bug2: the preservation must say so in a note"

# --- declared Scope/Entities bullets → mirror lists (ruling 2026-08-07, ask A) ---
DE="$T/declared"; mkdir -p "$DE/.kdbp"
cat > "$DE/.kdbp/PLAN.md" <<'MD'
## Phases

| # | Phase | Exec |
|---|-------|------|
| 1 | A | ⬜ |
| 2 | B | ⬜ |
| 3 | C | ⬜ |

## Phase Details

### Phase 1 — A

- **Scope:** web/src/routes/items.tsx, api/routers/items.py
- **Entities:** `repertorio`, `pantry`

### Phase 2 — B

- **Entities:** none — cross-cutting infra, no registered entity applies

### Phase 3 — C

MD
[ "$(run "$DE")" = 0 ] && ok || bad "declared: fixture runs"
[ "$(J "$DE" "p['phases'][0]['scope']")" = "['web/src/routes/items.tsx', 'api/routers/items.py']" ] \
  && ok || bad "declared: Scope bullet must mirror to a list"
[ "$(J "$DE" "p['phases'][0]['entities']")" = "['repertorio', 'pantry']" ] \
  && ok || bad "declared: Entities bullet must mirror to slugs (backticks stripped)"
[ "$(J "$DE" "p['phases'][1]['entities']")" = "[]" ] \
  && ok || bad "declared: 'none — <reason>' must mirror to [] (explicit honest blank)"
[ "$(J "$DE" "'entities' in p['phases'][2]")" = "False" ] \
  && ok || bad "declared: absent bullet must emit NO key (absent ≠ declared-none)"

# preservation: mirror-recorded entities survive a regen whose .md lacks the bullet
PE="$T/presental"; mkdir -p "$PE/.kdbp"
sed -n '1,14p' "$DE/.kdbp/PLAN.md" | head -9 > "$PE/.kdbp/PLAN.md"
printf '## Phase Details\n\n### Phase 1 — A\n\n' >> "$PE/.kdbp/PLAN.md"
cat > "$PE/.kdbp/PLAN.json" <<'JSON'
{"version": 1, "phases": [{"id": "1", "proof": null, "proof_type": null, "cases": null, "entities": ["repertorio"]}]}
JSON
[ "$(run "$PE")" = 0 ] && ok || bad "declared: preservation fixture runs"
[ "$(J "$PE" "p['phases'][0]['entities']")" = "['repertorio']" ] \
  && ok || bad "declared: recorded entities must survive a regen with no .md bullet"

# --- detail_list must never fabricate slugs/scope (review 2026-08-07) ---
HP="$T/hardparse"; mkdir -p "$HP/.kdbp"
cat > "$HP/.kdbp/PLAN.md" <<'MD'
## Phases

| # | Phase | Exec |
|---|-------|------|
| 1 | Placeholder | ⬜ |
| 2 | Braceglob | ⬜ |
| 3 | Prose | ⬜ |
| 4 | NoneOfThe | ⬜ |
| 5 | Annotated | ⬜ |
| 6 | ProseScope | ⬜ |

## Phase Details

### Phase 1 — Placeholder

- **Entities:** <command-center projects only — center entity slug(s), e.g. `repertorio`, `pantry`; or `none — <reason>`>
- **Scope:** <files/globs this phase may touch — e.g. web/src/routes/items.tsx>

### Phase 2 — Braceglob

- **Scope:** web/src/{a,b}.tsx, api/x.py

### Phase 3 — Prose

- **Entities:** the pantry and cooking entities (both)

### Phase 4 — NoneOfThe

- **Entities:** none of the registered entities apply here

### Phase 5 — Annotated

- **Scope:** `api/one.py` (new), `api/two.py` (new, evidence companion)

### Phase 6 — ProseScope

- **Scope:** `api/x.py`, determined by triage · **scope change 2026-08-01:** see the design doc
MD
[ "$(run "$HP")" = 0 ] && ok || bad "hardparse: fixture runs"
[ "$(J "$HP" "'entities' in p['phases'][0]")" = "False" ] && ok || bad "hardparse: unfilled Entities placeholder must NOT mirror (never guess slugs)"
[ "$(J "$HP" "'scope' in p['phases'][0]")" = "False" ] && ok || bad "hardparse: unfilled Scope placeholder must NOT mirror"
[ "$(J "$HP" "p['phases'][1]['scope']")" = "['web/src/{a,b}.tsx', 'api/x.py']" ] && ok || bad "hardparse: brace glob must stay ONE token (depth-0 split)"
# a path with a trailing (annotation) still mirrors (annotation cut, path kept)
[ "$(J "$HP" "p['phases'][4]['scope']")" = "['api/one.py', 'api/two.py']" ] && ok || bad "hardparse: (annotation) tails must be cut, paths kept"
# a PROSE scope bullet (any token not path-shaped) mirrors NOTHING — all-or-nothing, never junk
[ "$(J "$HP" "'scope' in p['phases'][5]")" = "False" ] && ok || bad "hardparse: prose Scope bullet must NOT mirror junk globs (all-or-nothing, real-data lesson)"
[ "$(J "$HP" "'entities' in p['phases'][2]")" = "False" ] && ok || bad "hardparse: prose Entities (spaces) must NOT mirror as junk slugs"
grep -q 'phase 3 Entities bullet unparseable' "$T/out" && ok || bad "hardparse: an unparseable Entities bullet must be noted, not silently dropped"
[ "$(J "$HP" "p['phases'][3].get('entities')")" = "['none of the registered entities apply here']" ] && bad "hardparse: 'none of the…' is prose, not honest-none []" || ok

# --- current_phase preservation: a narrative Current Phase section must not wipe the
#     recorded current_phase (integration dry-run 2026-08-07 — gustify reads "P6 and P7
#     both closed", which the `Phase <id>` regex cannot recover; the E8 tail degraded to
#     no-NOW/NEXT on regen until this preservation landed) ---
CP="$T/curphase"; mkdir -p "$CP/.kdbp"
cat > "$CP/.kdbp/PLAN.md" <<'MD'
<!-- status: active -->
## Current Phase

**THIS PLAN IS COMPLETE THROUGH PUSH. P6 and P7 both closed at the production promotion.**

## Phases

| # | Phase | Exec |
|---|-------|------|
| P7 | F6 | ✅ |

## Phase Details

### Phase P7 — F6

MD
cat > "$CP/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":"P7","phases":[{"id":"P7","cells":{"exec":"done"},"proof":null,"cases":null}]}
JSON
[ "$(run "$CP")" = 0 ] && ok || bad "curphase: fixture runs"
[ "$(J "$CP" "p['current_phase']")" = "P7" ] && ok || bad "curphase: narrative Current Phase must PRESERVE recorded current_phase, never wipe to None"
grep -q 'preserved current_phase' "$T/out" && ok || bad "curphase: the preservation must say so in a note"
# but a preserved id that no longer exists in the table must NOT be resurrected
cat > "$CP/.kdbp/PLAN.json" <<'JSON'
{"version":1,"status":"active","current_phase":"P99","phases":[{"id":"P7","cells":{"exec":"done"},"proof":null,"cases":null}]}
JSON
run "$CP" >/dev/null
[ "$(J "$CP" "p['current_phase']")" = "None" ] && ok || bad "curphase: a stale current_phase absent from the table must NOT be preserved"

echo
echo "plan-mirror battery: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
