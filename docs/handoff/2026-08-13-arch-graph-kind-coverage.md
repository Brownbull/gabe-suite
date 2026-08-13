# Handoff — arch-graph arc: kind coverage LANDED · production slice next

> Generated 2026-08-13 · branch `main` · HEAD `ff0a3cf` (pushed origin + korigin, tree clean)
> The suite repo carries no `.kdbp/` (ruling R8) — durable state lives in the session
> memory (`arch-graph-arc.md`) and this file. Overwrite/append on the next handoff.

## Resume prompt

Continue the ARCH-GRAPH ARC in /home/khujta/projects/gabe_lens on branch `main`
(HEAD `ff0a3cf` — KIND COVERAGE + the toolbar redesign; 0 ahead, pushed origin AND korigin).

READ FIRST:
- ~/.claude/projects/-home-khujta-projects-gabe-lens/memory/arch-graph-arc.md (the full arc record)
- templates/center/generators/_a3_graph.py (the emitter — parse_endpoints, model_ids, _cross_edges)
- templates/center/shell/example/level-lab/level-lab.html (the iterated reference — round 27 diagnosis of the 4 recipe-filter-mode endpoints names the 3 production items)
- templates/center/shell/codebase-graph.html + codebase-archive.html (the two stations, now full-surface)

## What just landed (`ff0a3cf`)

Both stations draw the **full L2 surface** (API endpoints on the container BORDER,
schemas + models in the CORE — not models-only), matching the level-lab reference,
from data already in `DATA.l2` (zero emitter change). Plus the change-graph toolbar
redesign (Option B): journeys fold behind a ▷ popover + count badge, Open-all is
icon-only, the two popovers are mutually exclusive, the toolbar no longer wraps.

- CHANGE GRAPH: sim BEAT pieces stay `.xpiece` (port1's count pin holds); the surface
  draws as a separate `.xsurf[data-kind]` layer the sim overlays. `surfaceLayout()` +
  `declutterExpanded()` new; surface pieces selectable via the `reopenPanel` `surf` arm.
- ARCHIVE: `ecoPieces` widened to model|schema|endpoint; `insidePos` splits border/core;
  kind glyph dispatch + `data-kind`; touch wires (Connections-gated); beat model-only.
- Comparison probe **port7** (RED→GREEN, counts DERIVED from `GABE_C4.l2`, per-entity
  exact + aggregate floor + behavioral touch-wire/endpoint-click).
- Verified: port1-7 = 54/21/16/30/38/41/21 · batteries 219/101/31 · doctor CLEAN.
- 10-agent adversarial review: drawExpansions rewrite CLEAN; 5 confirmed findings
  fixed (popover mutual-exclusion + 4 probe/battery quality); 1 refuted.
- Artifacts refreshed (same URLs): 🗺️ `88252c8f` (change graph) · 🗄️ `55f39ce9` (archive).

## TASK (do this next) — the parked PRODUCTION slice (operator-sequenced)

All four are GENERATOR-side (twin-neutral, ride every cc-update regen), from the
round-27 / round-41 diagnosis (see arch-graph-arc.md):

1. **Endpoints dedup + URL-home in `parse_endpoints`** (operator ruling 2026-08-13,
   options (c)+(b)): a canonical `(method,path)` key with claim-merge (touch-union) +
   URL-namespace override on multi-claimed files. Prevents the allergen double-claim
   (99→67 unique endpoints in the lab fixture; allergen honestly 0 endpoints = an
   ASPECT). (a) twin-config curation stays optional per-twin.
2. **Use-cases derivation into the archmap build** (~½ day, zero new scan): URL first
   non-param segment(s) → 1–10 use-cases/entity. Rides every regen.
3. **`_a3_graft.derive_communities`** (~1 day incl. determinism battery): label
   propagation over graft intra-entity calls+touches+FK+resp, ≤14/entity.
4. **Path-constant resolution**: `_BASE`-style variable route paths collapse to "/"
   in `parse_endpoints` (the 4 recipe-filter-mode endpoints). Literal-only today.

Cascade note: any endpoint change re-homes every entity's endpoint set at next regen —
re-pin the lab/station probes' derived counts.

THEN: **twin propagation — OPERATOR-GATED** (gustify/gastify vendored shells lack BOTH
stations + `graph-grammar.js`; `resolve_shell` only byte-diffs files in both shells,
so a twin missing the station regens silently — greenlight required).

Deferred / noted: standalone FN nodes (the operator's "no functions") = the graft L3
arm; the lab's L2 shows no fn glyphs either (endpoints already name their handler fn
in the dossier). docs/src/command-center.md station count (browser-gated docsite rebuild).

## Runbook

- Probes: `bash templates/center/shell/example/codebase-graph-station/probes/run.sh [portN]`
  (engine: `createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/')` +
  executablePath `/home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell`)
- Batteries: `bash tests/{codebase-graph,arch-graph,sim}/run.sh`
- Example regen after a SHELL edit (no browser build): node-regex swap the shell's
  `<style>` + inline `<script>` into the example clone; for MARKUP changes ALSO swap
  the `<div class="cbg-root">…</main>` block (tokens/assets live outside all three →
  `leaked tokens: 0`). Self-contained artifact inliner: `/tmp/…/scratchpad/inline-artifact.mjs`.
- Gotchas: settle ~1.3s after re-renders (fly-in) before real-mouse clicks; a
  background click uses the STAGE rect (viewport coords hit the nav → navigate away);
  a selection pick must sit on a DRAWN wire; `node --check` the extracted inline script
  before probing (a load-time SyntaxError just times out the probe); commit direct to
  main, push BOTH remotes; suite-doctor via `run_in_background` (foreground SIGTERM
  kills a backgrounded doctor); doctor short-circuits on install DRIFT → `./install.sh`
  before a clean doctor run.

## State snapshot

- Landed this session: `ff0a3cf` (kind coverage + toolbar), pushed both remotes.
- In-flight: none (tree clean, 0 ahead) after the docs(handoff) commit.
- Verified: probes 218 asserts · batteries 219/101/31 · doctor CLEAN.
