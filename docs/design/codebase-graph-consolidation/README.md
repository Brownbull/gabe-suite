# Codebase-graph consolidation — the levels lab becomes canonical

**Status:** DECIDED (operator ruling 2026-08-15) · **not yet executed** · code waits behind Phase 0.
**Owner decision:** the levels lab (`GABE_LEVELS` cluster grammar + rich panel) becomes the
canonical codebase-graph page; the column C4 station is demoted/retired, not enriched further.

> Read this before touching **either** codebase-graph track. It exists because the suite grew
> **two parallel codebase-graph implementations** and new features kept landing in the wrong one.

---

## The problem — two parallel tracks

The suite has TWO codebase-graph diagrams, each with its own emitter, data feed, and render
grammar. They derive from the same archmap but never converged. Recent work (web→API bridge,
the endpoint `behind` floor) landed in the **shipped** one (columns); the **40+-iteration**
polished one (clusters + rich panel) was never wired into the center — it ships its *data*
(`levels.js`) but its *page* lives in `example/` only, reachable by file path alone.

Net: we enriched the shipped-but-uglier page while the good one sat unwired. The column
layout makes endpoints hard to select; the cluster layout + rich panel are what we want to
iterate on.

### Inventory (verified 2026-08-15)

| | **Track A — C4 station** (shipped) | **Track B — Levels lab** (prototype) |
|---|---|---|
| Emitter | `templates/center/generators/_a3_graph.py` (840L) → `GABE_C4` | `_a3_levels.py` (400L) → `GABE_LEVELS` |
| Data feed ships? | ✅ `c4-graph.js` | ✅ `levels.js` (data ships; page does not) |
| Page shipped + nav-linked? | ✅ `codebase-graph.html` ("Change graph") + `codebase-archive.html` ("Codebase archive") — both in `shell/` root, copied by `build_center_a3` via `SHELL_SRC.glob("*.html")` (~line 1916) | ❌ `codebase-archive-lab.html` / `level-lab/level-lab.html` — **example-only, NOT in shell root, NOT nav-linked** |
| Render grammar | column L2 (endpoints · models · schemas · external · **screens**) | clusters/communities + fn nodes + level tabs (Entities · Functions · Layers · **Trace**) |
| Layout | cramped columns — hard to select endpoints | force/cluster (the 40+ iterations) |
| Right panel | basic (method · handler · returns · **behind**) | **RICH** (routes · touches · returns · fan-in · role · tests · connections) |
| Change-sim explode | ✅ (`GABE_SIM`) | preview only (`level-lab/change-graph-lab.html`) |
| Web→API bridges | ✅ (this arc, `1a232dc`) | ❌ |
| Endpoint `behind` floor | ✅ (this arc, `d0268c3`) | ❌ |

**Birth order (git):** `7eab453` C4 emitter → `0416f02` `_a3_levels` emitter → `338e318` the
LEVEL LAB (48 rounds) → `c0ec98e` the STATION PORT. The station is a *port* of the lab; the
lab is the richer origin. This is why the layouts diverge.

---

## Target architecture — one page, two feeds

The two emitters are **complementary, not duplicate**, so consolidation rewrites neither:

- `GABE_C4` owns coarse pieces + **bridges + behind + the change-sim topology**.
- `GABE_LEVELS` owns fine functions + **clusters + the rich per-fn detail panel**.

The canonical page is the **levels lab render**, reading **both** feeds:
`GABE_LEVELS` for its cluster grammar + panel (unchanged — no recreation), and `GABE_C4`
for the bridge / behind / change-sim overlay. Both siblings already coexist in the same
directory, so this is additive, not a rewrite.

**Keep:** the clusters, the rich panel, both emitters. **Recreate:** nothing.

---

## Locked design decisions (operator, 2026-08-15)

Elicited via the spikes in this directory (`panel-spike.html`, `element-components.html`,
`frontend-placement.html`).

- **Frontend placement = a dedicated `Frontend` entity** (`frontend-placement.html` option 2):
  screens live inside their own entity circle; bridges cross to the backend endpoints they call.
  Rejected: concentric ring (harder to read), satellites (crowds busy entities). **Layer-lanes is
  DEFERRED** — it becomes a separate future "codebase archive in **layers**" view, not this graph.
- **Canonical graph layout** = endpoints on the entity-circle **edge** (entry points), models/schemas
  inside; the levels-lab cluster grammar + all its layout-options carry over unchanged.
- **Journeys** step through the **Red · Execute · Review · Commit** stage faces per event, in the panel.
- **The right panel** — one per-kind card, shared chrome:
  - header **restacked**: NAME on row 1, then `[kind-glyph] TYPE · sub` on row 2 (no left badge);
  - the center's **kind-glyphs** on the header + chips, a **Lucide icon on every section and field**
    (nothing bare — matches the rest of the command center);
  - min/max top-right · left-edge drag-resize (as today);
  - **TABS are for Tests + Code-behind ONLY.** Tests tab per kind when it has >1 (Allergen:
    `api 41` / `web 3`), with a count badge by the title; a single-kind Tests shows directly.
    Code-behind has one category (functions) → shows straight through.
  - **Connections are NEVER tabbed** — every group (routes/touches/returns/screens · bridged/unmatched)
    is **always fully visible**, and hovering a connection chip **highlights its node in the graph**
    (the diagram's existing peek/selection behavior). Long groups keep a `+N more`.
  - **A section-level warning is an ICON by the title** (not a text block) — hover/click reveals why.
    Code-behind carries one until the fn-list lands.
  - **Code behind**: one category (functions) → shown directly, never gated. The `{fns, depth}` COUNT
    is live (the shipped `behind` metric); the **named function list** needs a small `derive_behind`
    extension (the BFS already visits them — collect the ids). ⏳ Phase-2 first task, ~10 lines + re-regen + a battery case.

## The plan — phased, no big-bang

### Phase 0 · DECIDE — DONE (this doc)
Levels lab canonical; column station demoted. No code.

### Phase 1 · WIRE the levels lab into the center
Promote `codebase-archive-lab.html`/`level-lab.html` from `example/` to `shell/` root (as the
`{{TOKEN}}`-slotted shell page), add the "Change graph"/"Codebase archive" nav link, let
`build_center_a3`'s glob copy it. Result: the beautiful diagram becomes the real, shipped page.
**Blast radius:** shell root + nav + a battery pin. *Small.* No emitter change (`levels.js`
already ships).

### Phase 2 · OVERLAY the C4-only features onto the levels page
Teach the levels page to also read `GABE_C4` and draw: the web→API **bridges** (screen→endpoint),
the endpoint **behind** badge, and the **change-sim** explode (touched/blast/stages). The
change-sim port is the hard part — `level-lab/change-graph-lab.html` is a prototype starting
point. **Blast radius:** the levels render + a data-join; the emitters stay put. *Medium.*

### Phase 3 · RETIRE the column station
Drop `codebase-graph.html`'s column render (or keep it as a secondary "flat" view if a reason
emerges). Keep `_a3_graph.py` — it still feeds bridges/behind. **Blast radius:** remove one page +
its batteries. *Small, last.*

### THEN · twin propagation
⚠ Propagating BEFORE the merge would push the two-track split into both twins. **Twin
propagation waits until the consolidated single track exists**, then propagates once.

---

## What NOT to do
- Do NOT recreate the cluster/community layout — it exists in `_a3_levels` + the lab render.
- Do NOT recompute bridges/behind in the levels feed — read them from `GABE_C4`.
- Do NOT enrich the column station further — every new codebase-graph feature goes to the
  levels page from Phase 1 onward.
- Do NOT propagate to twins until Phase 3 lands.

---

## Provenance
The bridge + behind arcs that exposed this split: [[web-fns-full-trace]] · [[arch-graph-arc]].
Facts in the inventory table were verified read-only against the suite example + gustify on
2026-08-15 (nav from the shipped sidebar, shell-root glob, birth-order git log).
