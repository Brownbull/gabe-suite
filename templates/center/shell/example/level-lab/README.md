# Level lab — the level-navigation model + symbol grammar

A **display-design lab** (operator-requested 2026-08-12): the four graph LEVELS the
stations will grow into, rendered over **real gustify data** so each level's encoding
can be judged before any station changes. Open `level-lab.html` directly (`file://`).

## The levels

| Level | Shows | Encodings |
|---|---|---|
| **1 · Entities** | one dot per domain entity; edges carry KINDS | fk = solid grey · calls = dashed **moving** accent · imports = dotted; parallel paths per kind on the same pair |
| **2 · Pieces** | inside each entity | **models = database cylinders** · **schemas = S badges** · **endpoints = method-coloured ⚡ markers ON the container border** (the entity's surface — GET green, POST indigo, PUT amber, DELETE red) |
| **3 · Functions** | the busiest cross-entity functions (graft) | **F glyphs coloured by layer** (api indigo · services teal · web/TS orange) · thick ring = endpoint handler · red dashed halo = god fn · call edges **dashed = confidence:inferred** (every cross-file call — a floor, not a census) |
| **4 · Layers** | the same functions in api / services / web lanes | a dashed edge **crossing lanes** = cross-layer coupling at a glance |

Position persistence (lifted from graft's viewer as an algorithm): entity anchors
keep their x/y across level switches, so navigation morphs instead of re-scattering.

## Files

- `level-lab.html` — the lab (self-contained, zero libs, pan/zoom, click-for-detail,
  `window.__lvltest` probe hook).
- `level-lab.data.js` — the **EXAMPLE FIXTURE**: derived read-only from gustify's
  archmap (head in its `note`) + the twin's graft index (`wiring.json`, fingerprint in
  the `note`). 7 entities · 33 kinds-aware L1 edges · 36 models · 99 endpoints ·
  41 cross-entity functions (24 web/TS · 9 api · 8 services — the TS side's first
  appearance on any suite graph) · 39 call/import edges.

**Not a station.** Nothing here ships to a twin center; the approved encodings get
implemented into `codebase-graph.html` / `codebase-archive.html` as their own slice.
