# 5C Trace-Graph — Session Handoff (2026-08-18)

**Paste the block below to resume.** Then the operator introduces the **Space War positions** — a new way
to lay out / place the encoded dimensions (details to come from the operator).

---

## Resume prompt

> Continue the **5C 3D-trace** spike (graft-adoption arc). The spike now lives IN-REPO at
> `docs/design/graft-adoption/spike/index.html` (+ `3d-bundle.js`, a vendored esbuild bundle of
> THREE + ForceGraph3D + SVGLoader + ConvexGeometry + MarchingCubes) — moved 2026-08-18 from the
> external scratch `/home/khujta/gabe-graph-review/spike-kinds/`. The design record is
> `docs/design/graft-adoption/records/5C-3D-trace.md` §9a–§9x — read the tail first.
>
> **Verify before changing anything:** `cd docs/design/graft-adoption/spike/_build && npm ci && node
> pw-panel-test.mjs` (Playwright over system Chrome, **57/57**). NOTE: `spike/_build/` and
> `spike/screenshots/` are **gitignored (local-only, not pushed)** — on a fresh clone `_build` is absent;
> rebuild the bundle + battery per records/5C-3D-trace.md §8. The vendored `spike/3d-bundle.js` IS
> committed, so the spike runs standalone. The battery resolves `../index.html` via `import.meta.url`.
> Headless screenshots:
> `google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1500,950
> --virtual-time-budget=15000 --screenshot=out.png "file://…/index.html?enc=B&subOn=off&entOn=off"`.
> URL hooks: `?enc=A|B|C`, `?panel=<nodeId>`, `?link=<src>>​<tgt>`, `?cmode=heat`, `?bubble=ghost`.
>
> **Next task:** the operator's "Space War positions" — a positional scheme to place some of the encoded
> dimensions differently. Hear the spec first; do NOT build until the operator describes it.
>
> **Rules that persist:** push only on explicit word (the whole `graft-adoption` branch is LOCAL — 79
> commits, no upstream); gustify/gastify are read-only twins; suite repo never gets `.kdbp`; every spike
> change re-runs the Playwright battery + gets a `§9…` spec note + a memory line.

---

## Where things stand

The spike is a **live encoding playground**, not the final diagram. Two panels:
- **CONFIG** (top-right, draggable) — the consolidated hand-off surface: container shape (polygon/wrap),
  sub/entity on-off, radius, transparency (faint/ghost/film). Carries into the real diagram later.
- **ENCODE** (top-left) — the experiment surface (marked "not saved"): setup A/B/C presets, colour
  identity/heat, icon-size (3 positions), per-dimension **rows** (toggle · variable dropdown · value · ±
  steppers), a `↺` reset, and a flow-speed slider.

### The encoding grammar (all data-driven, fields real in archmap/c4-graph)
| effect | reads (default) | render |
|---|---|---|
| icon colour | KIND (fixed) · or **heat** by mass/fanin/tests | billboard, tintable |
| endpoint tint | HTTP **method** | GET green · POST blue · PUT orange · PATCH yellow · DELETE red (reserved, no kind uses them) |
| **mass** | behind.fns | the sphere grows (icons never resize) |
| **glow** | behind.depth | additive glow |
| **tests** (ring1) | tests | green satellite belt (dots orbit, spin ∝ speed) |
| **flags** (ring2) | flags = god+large+hot | red satellite belt |
| **used-by** (ring3) | fanin | amber satellite belt |
| **verts** | fanin | RADAR sweep: lights N sphere vertices → dot + a little `+` of edge-stubs grows/contracts (dot **0.05**, stubs 45%, flush with the wireframe) |
| **god / pulse** | god | red satellite + pulse |
| edges | weight·kind·trust·payload·direction | width / colour / dim-if-inferred / particle-width / flow |

- **Scales are twin-calibrated + fixed:** `MAXES.behind=30`, `depth=5` (gastify+gustify p95, n=346), so
  outliers saturate instead of shrinking everyone.
- **Colour is unique per kind and per method, no overlap** — propagated to
  `docs/design/codebase-graph-consolidation/element-components.html` (a tracked repo file).
- **Right rail** = the full element-components card per kind + a link card; docked, opens on click.
- **Effect→variable mapping is per-setup and editable** (each row's dropdown writes `MAP[setup][key]`).
- Steppers fake any value on the selected element (ephemeral, `↺` resets). `verts` dot locked at 0.05.

### Open threads (operator to steer)
- used-by has TWO encodings (amber belt vs the radar-vertex glow) — pick one at some point.
- flags: real set at scale-up = god · hot · large-LOC · unguarded.
- radar sweep is azimuthal (rotating) — could be a plane translating through instead.
- **Scale-up:** port the encoders + cards from synthetic recipe+auth to real gustify `c4-graph.json` (FE
  collapses to one `web` kind + `sites`). The frozen example payloads go stale silently on regen.

## Provenance
- Spec: `docs/design/graft-adoption/records/5C-3D-trace.md` §9a–§9x (every step, with the why + the fix log).
- Branch `graft-adoption`, **local only, 79 commits unpushed** (push with `git push -u origin graft-adoption`
  when the operator says).
