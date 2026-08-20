# Handoff — Universe / Underworld (element-components ↔ spike review, then the two-section plan)

**Paste the “Resume prompt” below into a fresh session.** Context, file map, learnings, and the persistent rules
follow it. This closes the element-components retrofit arc and opens the review → plan arc.

---

## Resume prompt

> Continue the **codebase-graph consolidation** work. Two phases, in order.
>
> **Phase A — comparison / mapping / review** between the **card** (`docs/design/codebase-graph-consolidation/
> element-components.html`) and the **5C graph spike** (`docs/design/graft-adoption/spike/index.html`). Find what is
> **missing · under-represented · over-represented** on either side. A prior icon/asset gap map exists (artifact
> `https://claude.ai/code/artifact/559041a9-faa9-4f59-8f5d-195babd81676`) — use it as a REFERENCE, but do a FRESH
> pass, because the retrofit already reconciled the big items (tests taxonomy, assets, flags). Then **fix** the issues
> you find (verify each with Playwright over system Chrome; `spike/_build/` has the harness).
>
> **Phase B — plan the two-section restructure, REUSING what exists (do NOT recreate).** The “codebase graph”
> area of the command center becomes **Universe**. Rename the **codebase archive lab**
> (`templates/center/shell/codebase-archive-lab.html`, currently titled “Levels graph”) → **Universe** in the left
> nav (`docs/site/center/nav.json`). Then add a second section, **Underworld** — the SAME graph, but dedicated to the
> **code lifecycle STAGES**: `gabe-red` · `gabe-execute` · `gabe-review` · `gabe-commit`. Universe = the code as it IS
> (structure + the ELEMENTS-LAB dimensions); Underworld = the code as it MOVES through the lifecycle. Produce a PLAN
> (files touched, what’s reused vs new, the stage→visual mapping) before building — this is a suite/center change, so
> draft + confirm before writing.
>
> **Rules that persist:** push ONLY on the operator’s explicit word (branch `graft-adoption` is LOCAL, ~90+ commits,
> no upstream); gustify/gastify are read-only twins; the suite repo NEVER gets `.kdbp`; respond in the Gabe register;
> every spike change gets a `docs/design/graft-adoption/records/5C-3D-trace.md` note + a memory line + a Playwright pass.

---

## Where we are (the arc that just closed)

The **5C spike** graphics/controls are DONE. The **element-components card** was retrofitted to speak the spike’s
visual language. The **test taxonomy** was researched and reconciled (a 5-agent workflow), landing operator ruling
**C+D**: `api/web/e2e` canonical + real join-tier depth.

- **Spike** (`spike/index.html`) — every ELEMENTS-LAB dimension: per-node fleets (defence · attack · conflict · sats,
  all-nodes, `warOn`-gated), typed connectors on every link, cluster star field, live inter-entity transports (cargo
  + test chip), the 6-tab→3-tab **legend** (Types · Connectors · Planet[Defense/Attack/Field sub-tabs]), the config
  panel (icon toggles, Show·Radius merged row), the left Transports panel, copy-config buttons. **Defence renamed
  unit/integ/e2e → `api/web/e2e`** (the old labels were FICTION — `nodeFleet` round-robins `k=DEF_KINDS[i%3]`); legend
  tiers now mean the real **join tier** T1 direct / T2 via-route / T3 file-reach.
- **Card** (`element-components.html`) — 12 kind cards. Each: 2D kind icon kept; **usage → satellite asset**;
  **Tests = custom layout** (`testsSection`): total next to the title, TEXT corpus tabs (api/web/e2e), ONE big tile
  top-right showing the SELECTED corpus’s ship (swaps on click), per-credit **join-tier badge** (T1 green/T2 amber/T3
  grey) + **failing state** (red chip); **god / unguarded flags** carry the raider / tie asset; **payload → cargo**;
  asset tiles are **theme-aware** (light slate / deep space) and re-rendered tight so the ship fills the frame.
  Title-end anomaly-assets were RETIRED (operator: no red icons in the title — they duplicated the flags).

## Key learnings (don’t re-derive)

- **The only generated test axis is CORPUS** (`ref['corpus']`): `api` pytest · `web` vitest · `e2e` playwright. Plus a
  real depth signal: the **join tier** (`by_*.direct` T1 · `.via_route` T2 · `by_file.reach` T3). `unit/integ/e2e` was
  never generated — the spec (`ELEMENTS-LAB-SPEC.md:37`) admitted it. Full brief in memory `[[element-components-gap]]`.
- **Element × test matrix**: endpoint = api+web+e2e (universal meeting point); model/schema/function = api DIRECT +
  web/e2e VIA-ROUTE; component/hook/store/route/type = web+e2e BY NAME only (not modeled as distinct kinds yet —
  planned/unbuilt); entity = aggregate; external = none.
- **Full Option C is not done**: the spike’s `nodeFleet` still round-robins for the toy — at scale it should read the
  real per-credit `(corpus, tier)`. Underworld/Universe planning may want to close this.

## File map

| What | Path |
|---|---|
| The card (this review’s left side) | `docs/design/codebase-graph-consolidation/element-components.html` |
| The 5C graph spike (the right side) | `docs/design/graft-adoption/spike/index.html` |
| The 16 GLB assets (rendered) | `spike/_build/_assets2.json` (+ `_renderassets2.mjs` recipe; gitignored) |
| Playwright harness | `spike/_build/*.mjs` (system chrome, swiftshader; gitignored) |
| Gap artifact (icon/asset map) | `https://claude.ai/code/artifact/559041a9-faa9-4f59-8f5d-195babd81676` |
| **Codebase archive lab → “Universe”** | `templates/center/shell/codebase-archive-lab.html` (title “Levels graph”) |
| Codebase-graph station | `templates/center/shell/codebase-graph.html` |
| Left nav | `docs/site/center/nav.json` |
| Spike trace log | `docs/design/graft-adoption/records/5C-3D-trace.md` |
| Memory | `[[element-components-gap]]` · `[[5c-trace-arc]]` |

## Open / deferred

- The **gap artifact** still shows the retired `unit/integ/e2e` + a “taxonomy mismatch” verdict — refresh its Defence
  row to the reconciled `api/web/e2e × join-tier` and republish (same URL) when convenient.
- Honest **frontend-binding note** on the fe cards (web/e2e-by-name-only, kinds planned-not-built).
- **Full Option C**: spike graph reads real per-credit corpus×tier (retire the round-robin).
- Nothing is committed — branch `graft-adoption` is LOCAL.
