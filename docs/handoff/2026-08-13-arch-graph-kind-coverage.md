# Handoff — arch-graph arc: kind coverage + toolbar redesign

> Generated 2026-08-13 · branch `main` · HEAD `bf0fa1d` (pushed origin + korigin, tree clean)
> The suite repo carries no `.kdbp/` (ruling R8) — durable state lives in the session
> memory (`arch-graph-arc.md`) and this file. Overwrite/append on the next handoff.

## Resume prompt

Continue the ARCH-GRAPH ARC in /home/khujta/projects/gabe_lens on branch `main`
(HEAD `bf0fa1d` — the ARCHIVE port + shared grammar; 0 ahead, pushed to origin AND korigin).

READ FIRST:
- ~/.claude/projects/-home-khujta-projects-gabe-lens/memory/arch-graph-arc.md (the full arc record)
- templates/center/shell/example/level-lab/level-lab.html (the ITERATED reference — endpoints ON the border, schemas as brace icons, handler ƒ glyphs, use-fns)
- templates/center/shell/codebase-graph.html + codebase-archive.html (the two ported stations)
- templates/center/shell/assets/graph-grammar.js (the shared grammar both stations consume)

STATE
- Landed this session (all pushed both remotes, suite-doctor CLEAN): `8c78420` port slice 1 (lab renderer) · `c16ef60` doctor lint scope · `68ee10d` slice-1 review fixes (15 confirmed) · `c8c1758` slice 2 (det dossiers, emitter `element_detail`) · `2fb7d7a` slice-2 review fixes (18 confirmed: uqs normalize, file-row split) · `2f3950e` slice 3 (journeys · ← trail · corner boxes) · `bf0fa1d` archive port + `assets/graph-grammar.js` extraction + the line ruling (change graph = DIRECT default · archive = BOWED, both pinned).
- Verified: tests/codebase-graph 198/0 · tests/arch-graph 101/0 · tests/sim 31/0 · probes port1–6 = 336/336 (real browser). Artifacts current: change graph `88252c8f` (🗺️) · archive `55f39ce9` (🗄️).
- In-flight: nothing uncommitted.

TASK (do this next) — operator's words, verbatim:
1. "running a Playwright test comparing the diagrams that we created against the ones
   that we iterated on. Compare them, because right now in the diagrams I only see
   models. There are no functions, no API endpoints, no nothing else, only models,
   not schemas, so we are missing a lot. This is in both the change graph and the
   codebase archive."
   KNOWN ROOT CAUSES (verified this session): the archive's `ecoPieces()` filters
   `n.kind==="model"` (codebase-archive.html:414) — endpoints/schemas exist in
   DATA.l2 but are never drawn; the change graph's explode draws `SIM.pieces`,
   which `_a3_sim.py` emits as MODEL pieces only (recorded MVP thinness) — only
   its no-SIM L2 drill shows all kinds. The LAB grammar (the iterated reference)
   puts the entity's FULL surface in view: endpoints as method-coloured markers
   ON the container border, schemas as brace icons in the core, handler ƒ +
   use-fns (level-lab drawPieces/drawTrace). APPROACH: write the comparison
   probe FIRST (a port7-probe that loads the lab + both stations and counts
   drawn kinds per entity — it must be RED against today's stations), then close
   the gap render-side (the data is already in DATA.l2 — endpoints/schemas/
   touches edges; `_a3_sim` changes only if the change graph needs endpoint/
   schema pieces IN the sim, otherwise draw the full surface from L2 and overlay
   the sim's model pieces on it, the lab's own pattern). Keep every existing
   battery-pinned seam; probes port1–6 must stay green.
2. "check the navigation bars. They are getting too crowded and are unbrowsable,
   so I want you to come up with a better way to represent the navigation bar"
   — the CHANGE GRAPH TOOLBAR (see the operator's screenshot: stage seg +
   journeys select + step bar + depth slider wrapping into a second row with
   Close-all + gear). Candidates from the lab's own rulings (round 36): icon-only
   toggles with tooltips, gear far-right, a deliberate two-row header (levels/
   lenses split) instead of accidental flex-wrap, journeys behind a compact
   icon+popover. PROPOSE 2–3 options to the operator before rebuilding — this is
   a design call, not a mechanical port.

RUNBOOK
- Probes: bash templates/center/shell/example/codebase-graph-station/probes/run.sh [portN]
  (engine: createRequire('/home/khujta/.npm/_npx/9833c18b2d85bc59/node_modules/') +
  executablePath /home/khujta/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell)
- Lab probes: bash templates/center/shell/example/level-lab/probes/run.sh (~8 min, 30 batteries)
- Batteries: bash tests/codebase-graph/run.sh · tests/arch-graph/run.sh · tests/sim/run.sh
- Example regen after ANY shell edit: fill tokens from the OLD example copy + rehome
  assets/ → ../../assets/ (the python pattern used across this arc — see the regen
  snippets in this session's commits; also README "Regenerate" section for the full
  build_center_a3 dry-run path). Regen BOTH pages when the shared asset changes.
- Gotchas: probe REAL mouse clicks where z-order matters; every re-render replays the
  0.9s fly-in — settle ~1.2s before real-mouse clicks; a "background" click must use
  the STAGE rect (viewport coords can hit the nav sidebar and navigate away); a
  selection-probe pick must sit on a DRAWN wire; synthetic hooks must mirror the WHOLE
  real handler; `assert old in t` before every python .replace; commit direct to main,
  push BOTH remotes; suite-doctor only via run_in_background.

AFTER THAT
1. Artifact refresh (both 🗺️ 88252c8f + 🗄️ 55f39ce9) once kinds render.
2. The parked production slice: endpoints dedup (c)+(b) URL-home · use-cases
   derivation · derive_communities · path-constant fix.
3. Twin propagation — OPERATOR-GATED (twins' vendored shells lack both stations +
   graph-grammar.js; resolve_shell presence-drift note stands).

## State snapshot

- Landed: 7 commits `8c78420`..`bf0fa1d` (see STATE above), all pushed both remotes.
- In-flight: none (tree clean, 0 ahead).
- Verified: batteries 198/0 · 101/0 · 31/0; probes 336/336; doctor CLEAN.
- KDBP sync this run: none — no `.kdbp/` in this repo (ruling R8); memory
  `arch-graph-arc.md` updated instead.
