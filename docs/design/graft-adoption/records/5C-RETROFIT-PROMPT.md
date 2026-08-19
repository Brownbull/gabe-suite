# 5C Retrofit — Elements Lab → spike/index.html (paste-able prompt)

**Purpose:** the Elements Lab (`spike/elements-lab.html`) settled the Gabe-universe visual language. This prompt
starts a fresh session that **implements** that language into the 5C spike (`spike/index.html`) — it does **not**
recreate the lab. The binding spec is [`records/ELEMENTS-LAB-SPEC.md`](ELEMENTS-LAB-SPEC.md); the lab is the
reference implementation to copy machinery from.

---

## Resume prompt

> Continue the **graft-adoption / 5C** arc. Retrofit the **Elements Lab** visual language into the 5C spike at
> `docs/design/graft-adoption/spike/index.html`. The BINDING spec is `records/ELEMENTS-LAB-SPEC.md` — read it
> first, plus the tail of `records/5C-3D-trace.md` (through ITER-32). The reference implementation is
> `spike/elements-lab.html` (copy machinery from it; do not port the lab's controls/palette).
>
> **The element = a planet.** Each entity is the neutral **bubble** (`entitySphere`: `#aab4c6` fill @0.05 +
> wireframe lattice @0.13, tintable per entity). Around each planet sit five **zones**; between planets run typed
> **connectors**; groups of planets form **clusters** with a hidden-fn **star field**. 5C already renders entities +
> typed edges via `_a3_levels`; add the planet rendering below.
>
> **Adopt these FIVE designed DIMENSIONS** (the legend is the contract — see spec's table). Elements is NOT a
> dimension — it is a spike-owned placeholder tab. The legend has **SIX tabs**: `Elements (placeholder) · Connectors ·
> Defense · Attack · Conflict · Field` — Field holds two groups (satellites + cluster stars) in ONE tab.
> 1. **Connectors** — entity↔entity relationship kind: fk/calls/imports are `c4-graph.json` **L1 edge kinds**, bridge
>    is a top-level `cross_edges` edge (NOT L1). 4 styled wires reaching the sphere edge, per the dialed config.
> 2. **Defense** — test KIND (unit/integ/e2e) → a fleet ship per kind, green team accent.
> 3. **Attack** — problem type (god=oversized fn/class · unguarded=no-test floor ×N) → a raider per type, red accent.
> 4. **Conflict** — internal fn usage in-flight → shock (blast size+radius) + flak (failing tests · untested elements).
> 5. **Field** — one tab, two groups: **satellites** = used-by / callers (`det.usage` fan-in, endpoint/model L2) →
>    starlink sats orbiting the south pole · **cluster stars** = fns used across the cluster
>    (`derive_functions.fn_slug` − drawn `fn_nodes`) → glowing star-dots inside a polygon/wrap hull.
> The **node representation itself** (kind icon + 3D form) is ALREADY the spike's — do NOT redesign it; the Elements
> tab keeps it as a placeholder.
>
> **Lift the LEGEND as-is** (fixed 300px wide + 250px scrolling body, minimizable, the six tabs above, real asset
> thumbnails via the shared renderer). Copy from `elements-lab.html`: the `#legend` CSS block, `<div id="legend">`,
> `legThumb`/`legPrune` + the per-cell-size `palLoop` line, the `LEGEND`/`buildLegend()` pair, and the `rebuildAll`
> ships-ready hook. Swap the thumbnail build closures for 5C's data-driven models; keep colours/patterns in sync.
>
> **Use the settled config verbatim** from the spec's JSON block (defense/attack/conflict/deployment/satellites/
> inter_entity connectors/clusters). Orientation rules are load-bearing: `orientTo` (nose→forward + up→world-Y),
> `NOSE_FLIP={hauler}`, per-slot `ROT[section][kind][tier]` applied **Y→X→Z in LOCAL axes**.
>
> **The one data gap** — the ordered e2e/integration journey path — needs a small `_a3_graft` tweak (DFS each test's
> `calls` call-tree from its entry → first-reached entity order `journey_order[]`, a static inferred floor). e2e is a
> multi-stop journey (`test_insight.exercises`), NOT a pairwise connector.
>
> **Verify** every change with Playwright over system Chrome (`spike/_build/`, `--use-angle=swiftshader`); confirm
> the WebGL context count stays under ~16 (reuse the ONE shared renderer for all thumbnails). Screenshot each new
> surface — WebGL viewer canvases without `preserveDrawingBuffer` read 0% via pixel-read, so verify by element
> screenshot.
>
> **Rules that persist:** push ONLY on the operator's explicit word (the whole `graft-adoption` branch is LOCAL,
> ~80+ commits, no upstream); gustify/gastify are read-only twins; the suite repo never gets `.kdbp`; respond in the
> Gabe register; every spike change gets a `records/5C-3D-trace.md` note + a memory line + a Playwright pass.

---

## Integration checklist (for the retrofit session)

- [ ] Bubble as each entity node's body (`entitySphere`, tintable per entity colour).
- [ ] Five zones around a focused/hovered planet, driven by that entity's map fields (def right · atk left · conflict
      top · sats south — the deployment placement law from the config).
- [ ] Typed connectors styled per config (fk teal-dashed · calls amber-dashed · imports purple-dotted · bridge
      yellow-dotted), reaching the sphere edge, count-labelled; reuse 5C's edge data.
- [ ] Cluster hull (reuse 5C's own polygon/wrap `makeCluster`) + star field (hidden-fn set-difference, glow dots).
- [ ] LEGEND lifted, thumbnails data-driven, placeholder tab for the spike node.
- [ ] (Optional) the `journey_order[]` graft tweak for the ordered e2e path — dry-run + battery before it ships.
