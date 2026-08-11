# Codebase-graph station — example

A **frozen snapshot** of the `Codebase graph` command-center station
(`shell/codebase-graph.html`), rendered over **real gustify data**, so the station
is viewable without running a twin build.

- `codebase-graph.html` — the built station (shell chrome + the zero-lib SVG graph).
  Shell assets are rehomed to the suite's real `../../assets/`; the graph data is the
  sibling `./c4-graph.js`. Open it directly in a browser (`file://`).
- `c4-graph.js` — gustify's emitted C4 graph (`window.GABE_C4` topology with baked
  ring **x/y** + deps-gradient **fx/fy**, plus `window.GABE_C4_COLORS`, the palette).

What it shows: the L1 entity graph (size ∝ lines, directed FK edges), a **Ring | Flow**
layout toggle (Flow reads the baked dependency gradient — foundations left, entry
points right), and double-click to **drill** an entity to its L2 pieces
(endpoints · models · schemas · external).

Note: only the station page ships here — the sidebar's links to sibling center pages
(board, entities, …) are illustrative chrome, not live in this isolated snapshot.

## Regenerate (portable — no machine paths)

Build a twin's center into a temp dir (the twin's tree is never written), then copy
the two files out:

```bash
TMP=$(mktemp -d)
GABE_REPO_ROOT=<twin-repo> \
GABE_CONFIG=<twin-repo>/docs/site/center/center.config.json \
GABE_SHELL_SRC="$PWD/templates/center/shell" \
GABE_CENTER_OUT="$TMP" \
python3 templates/center/generators/build_center_a3.py
# rehome assets/ → ../../assets/ in $TMP/codebase-graph.html, copy it + c4-graph.js here.
```
