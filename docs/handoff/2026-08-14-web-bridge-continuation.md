# Handoff — web→API bridge, Path A: continuation (P2b render + P3 regen + wrap)

**Session goal (met so far):** ship the UI→API→data trace into the **shipped** center
(Path A — fold the frontend half into `GABE_C4`, not the LEVELS lab). The backend,
data, automation, and the web-piece render are **done, tested, committed**. What
remains: the bridge **edges** in the station render, the example regen they draw
against, and the wrap.

Progress artifact (visual): https://claude.ai/code/artifact/3257c449-b056-4a0c-b3ec-dbfd29f8d1c9

---

## Where we are — 2 commits on `main`, all batteries green

| Commit | What |
|---|---|
| `4f38662` | the C4 frontend arm + drift detectors (P1 + automation) |
| `cb4047e` | the station renders the `web` 'Screens' kind (P2a — no bridge edges yet) |

**Batteries:** arch-graph 126 · levels 24 · sim 31 · codebase-graph 219 · pulse-angles 33 — all green; **suite-doctor CLEAN**.

**Measured on gustify (read-only):** 32 fetching files → 32 web pieces · 54 fetch sites · **48 bridged / 6 unmatched / 4 dynamic** (80% call-site coverage). The 6 unmatched are real archmap-coverage gaps (`/equipment`, `/notifications`, `/history/dishes`, `/recipe-filter-modes`) + `${ENDPOINT}/${id}` — signal, not failure; the S10 nag surfaces them.

---

## Architecture (settled, do NOT re-litigate)

- **Path A** — web pieces + bridges fold into `GABE_C4` (the model the shipped station renders); NOT a port of the LEVELS lab. The bridge is a new `cross_edges` kind (`kind:'bridge'`); a web piece is a new L2 kind (`web`).
- **Pluggable extractor** — `_a3_web.py` auto-detects the api-call idiom (apiFetch | axios | fetch | honest-empty for non-REST). gustify centralizes through `apiFetch<T>(path,{method})`.
- **Homing** — file-first (`_file2slug`, gustify's 280 web rows), endpoint-fallback for apps whose web files aren't in the archmap.
- **Normalization** — `_a3_graph._norm_path`: strip `/api/vN`, collapse `{x}`/`${x}`→`{}` (snake↔camel + prefix). Mirrored (5 lines) in `fetch_bridge.py`.
- **Honest-empty invariant** — `web=None` build byte-identical to the FK+graft build (arch-graph pins it). Every new list sorted; `emit` sort_keys.
- **Two arms, two try/excepts** — `_a3_web.web_arm` never rides `graft_arm`'s blanket except; a fetch-parser bug degrades only the bridge.

### Decisions carried forward
```
behind metric — DEFERRED. View-only (not a rail); the C4 model is piece-level and
behind is fn-level (no clean per-piece anchor). Trigger: after the bridge renders,
or on operator word — then anchor it on endpoint handlers as a labeled floor (~25 lines).

Render split — P2a (web pieces) done + static-verified; P2b (bridge edges) needs a
BROWSER check against a c4-graph carrying web data, which only exists after the P3
regen. So P3 runs BEFORE P2b verification.
```

---

## Files touched (committed)

- **NEW** `templates/center/generators/_a3_web.py` (205 lines) — the extractor.
- `templates/center/generators/_a3_graph.py` (704→**828**, over the 800 budget by 28 — report-never-gate): `_L2_KINDS` (+`web`, appended), `_norm_path`, `_index_endpoints`, `_l2(web_pieces=)`, `build_c4_graph(web=)` — web pieces + bridge cross-edges + `stats.web`.
- `templates/center/generators/build_center_a3.py` — `_a3_web` import, `web_arm` call (own try/except) at ~1988, web-presence tripwire, `web=_warm` at build_c4_graph, summary line.
- `templates/center/generators/_a3_levels.py` — filter `kind:'bridge'` out of the LEVELS `cross_edges` (FK-only, byte-identical — the handshake fix).
- **NEW** `skills/gabe-pulse/scripts/fetch_bridge.py` — the S10 reader + `--diff` arm.
- `skills/gabe-pulse/scripts/angles.py` — `import fetch_bridge`, `s10_web_bridge`, S10 in SIGNALS.
- `skills/gabe-review/references/review-spec.md` — the WEB-BRIDGE DRIFT subject.
- `tests/arch-graph/run.sh` (126) + `tests/pulse-angles/run.sh` (33) — cases + mutations.
- `templates/center/shell/codebase-graph.html` — `web` kind: KIND_COLOR/KIND_LABEL (`Screens`, `#e8590c`), the 3 column-order arrays (web appended), buildLegend, the `renderL2` web glyph branch.

---

## NEXT — the remaining work, in order

### P3 · regen the example c4-graph WITH web data (do FIRST — P2b verifies against it)
Build `c4-graph` with `web=` against gustify (read-only glob) and emit to the example:
```python
# read-only over gustify; writes ONLY the suite example dir
import _a3_graph, _a3_web
AM = json.load(open("<gustify>/docs/site/center/archmap.json"))
warm = _a3_web.web_arm(Path("<gustify>"), AM["entities"])
g = _a3_graph.build_c4_graph(AM, colors={...}, graft=<garm>, web=warm)
_a3_graph.emit(g, Path("templates/center/shell/example/codebase-graph-station"))
```
- The example c4-graph.js is at `templates/center/shell/example/codebase-graph-station/c4-graph.js`.
- `levels.js` is UNCHANGED (bridges filtered out → byte-identical) — do not regen it.
- Record the live numbers in the commit (32/48/6/4), per the dry-run-on-a-COPY convention.
- Confirm the head/colors match how the example was last regenerated (see commit `cc4f5eb`).

### P2b · bridge EDGES in the station render (needs a browser to verify)
Insertion points in `codebase-graph.html` (from the seam-map, current line numbers):
- **CSS** near `.e-xfk` (~line 121): add `.cbg-root .e-bridge{ fill:none; stroke:var(--c-fn-web); stroke-width:1.6; stroke-dasharray:6 4; opacity:.9; }`.
- **`renderL2`** after the `g2.edges` loop (~1199): a pass over `DATA.cross_edges` filtered `kind==='bridge' && from_slug===drilledSlug`. Same-entity endpoint (`nodePos[e.to]` exists) → draw an `.e-bridge` edge; cross-entity → add a synthetic endpoint stub (mirror the `external` node pattern) + edge. Register via `regEdge(p,'bridge',from,to,'inferred fetch → endpoint (a floor)')`.
- **`edgeWord`** (~936): add `bridge:"bridge"`.
- **The explode** (SIM-gated): `surfaceLayout` (~838) add a `web[]` bucket; `drawSurf` (~1551) add a `kind==='web'` branch; the `SIM.cross_edges` pass (~1524) — bridges are in `DATA.cross_edges`, so add a DATA-bridge pass or fold bridges into the explode's edge set.
- **Unmatched marker**: a web node whose id is in `DATA.stats.web.unmatched[].from` gets a hollow-dashed accent + a "fetch — unmatched (no endpoint named)" title (reuse the external-stub hollow-dashed vocabulary).
- **Probes** `__cbgtest` (~1931): add `bridgeEdges: vp.querySelectorAll('.e-bridge').length`; `surfKind('web')` already works for the explode.
- **Battery** `tests/codebase-graph/run.sh` (static/regex): assert the `.e-bridge` class + the web glyph markers appear (FIRE + SILENT). Real render proof belongs in a browser check, NOT a tautological substring mutation.
- **VERIFY**: open the station (or a headless check) against the P3-regenerated example — web pieces + bridge edges must actually draw.

### Wrap
- **CLAUDE.md**: add a bullet describing the web-bridge arm (`_a3_web` + the C4 web pieces/bridge/stats.web + S10 + WEB-BRIDGE DRIFT). Correct R9's "two over-budget generators" (now includes `_a3_graph` 828).
- **Version bumps**: gabe-pulse (S10 angle → minor) + gabe-review (WEB-BRIDGE DRIFT subject → minor). Bump `metadata.version` + the CLAUDE.md capability table.
- `install.sh` (5s) + `suite-doctor.sh` (2–4 min) — must be CLEAN.
- **Final adversarial review** (ultracode) of the whole diff before the last commit.

---

## Gotchas the reviewers flagged (already handled, keep true)
- `_L2_KINDS` MUST carry `web` or `.index()` raises → c4-graph skipped. (Done, appended.)
- sim-panel.js has a test-kind `web` (KIND_CHIP/TEST_ICON) — the piece-kind `web` is a different namespace; watch for collision if you touch sim-panel.
- The station has THREE piece-draw paths (renderL2 drill · drawSurf explode · drawPieceIcon). renderL2 is done; drawSurf/drawPieceIcon are the explode (P2b).
- `counts:null` on `__unclaimed__` once killed the station at boot — any new per-node read must survive a null.
- Determinism: c4-graph.json is `sort_keys` — any new list MUST be sorted or the committed JSON churns.
