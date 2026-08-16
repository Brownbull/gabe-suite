# Handoff — codebase-graph consolidation, Phase 2 (the panel port)

**Resume point:** the levels lab is a shipped page; next is **porting the designed right-panel
into it**. Everything below is pushed (both remotes, HEAD `2604185`).

## Where we are (all pushed)
- Design **LOCKED** — the plan of record is [`docs/design/codebase-graph-consolidation/README.md`](../design/codebase-graph-consolidation/README.md). Read it first.
- **Phase 1 DONE** (`57b930c`): the levels lab ships as a nav-linked page — `templates/center/shell/codebase-archive-lab.html` (nav label **"Levels"**), reverse-tokenized from the built lab (recipe: `scratchpad/phase1_port.py` pattern).
- **Phase 2 slice 1 DONE** (`2604185`): `derive_behind` now returns `names` (the named fns behind a handler). The panel's code-behind list has real data.

## ⚠ THE RULE — reuse, do not rebuild
The panel is DONE in `docs/design/codebase-graph-consolidation/element-components.html` and the
layout in `frontend-placement.html` (option 2, dedicated frontend entity). **Phase 2 PORTS their
markup + CSS + JS** into the levels page — it does NOT re-author them from scratch. A from-scratch
rebuild is exactly what forked the two graph tracks; it's forbidden.

## Next — the panel port, in order
1. **Map the data flow FIRST** (no code): read the shipped `templates/center/shell/codebase-archive-lab.html`
   — its current detail panel (the `get_creation_result`-style card), how it reads `GABE_LEVELS`
   (fn_nodes · detail · use_edges) and where a per-kind card would hook in. Confirm what each panel
   card (endpoint/model/schema/fn/screen/entity/external) pulls from `GABE_LEVELS` vs `GABE_C4`
   (behind + bridges are C4; the page must read both).
2. **Port the panel** — lift `element-components.html`'s per-kind cards + the settled rules:
   tab-only-for-Tests+Code-behind · connections always-visible + hover-highlight · Usage(in-degree)
   & Code-behind(out-degree) badges · icons everywhere · info/warn tip-icons · header no-dot ·
   top-right trace back/forward · bottom-right `»` rail collapse · follows `--font-content`/`--root-size`.
3. **`usage` in-degree emit** (small, NOT built yet): per-node inbound count (screens→endpoint ·
   endpoints+fns→model · callers→fn — fns already have `hub.usage` in the levels feed). Feeds the Usage badge.
4. **Shell-asset integration** (deferred MEDIUM from Phase-1 review): fold the levels page into the
   shared stack (`a3.css` + `a3-settings.js`/`slots.js`/`a3-lightbox.js`/`rowclick.js`) for the
   settings panel + safety net. **Needs a VISUAL pass** — the page is self-styled, so watch for
   `a3.css` collisions (not just a node-count check).
5. **Change-sim + bridges + behind in the levels grammar** — `example/level-lab/change-graph-lab.html`
   is the change-sim starting point.

Then **Phase 3**: retire the column station (`codebase-graph.html`). **Twin propagation is LAST** —
never before the merge lands, or it pushes the split into both twins.

## The verify loop (every slice)
Build against gustify twin READ-ONLY: `GABE_GRAFT_BUILD=0 GABE_REPO_ROOT=/home/khujta/projects/apps/gustify
GABE_CONFIG=…/center.config.json GABE_SHELL_SRC="$PWD/templates/center/shell" GABE_CENTER_OUT=$TMP
python3 templates/center/generators/build_center_a3.py` → confirm twin tree dirty count unchanged →
headless-render with `google-chrome --headless=new … --dump-dom`/`--screenshot` → batteries
(`tests/arch-graph`, `tests/codebase-graph`, `tests/sim`, `tests/levels`) → adversarial review
(code-reviewer subagent) → `scripts/suite-doctor.sh` CLEAN → commit → push on operator's word.

## Key files
- Panel source: `docs/design/codebase-graph-consolidation/element-components.html`
- Layout choice: `docs/design/codebase-graph-consolidation/frontend-placement.html` (option 2)
- Shipped levels page: `templates/center/shell/codebase-archive-lab.html`
- Levels emitter: `templates/center/generators/_a3_levels.py` (→ `GABE_LEVELS`)
- C4 emitter (behind/bridges): `templates/center/generators/_a3_graph.py` + `_a3_graft.py`
- Plan + memory: the design README + memory `codebase-graph-consolidation`
