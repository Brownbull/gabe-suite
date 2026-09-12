# Sending one project's universe

`scripts/export-universe.sh <repo-root> [--out DIR] [--name NAME] [--no-zip]`

Packages ONE project's Gabe Universe as a folder anyone can open — no server, no install, no clone.
The recipient unzips and opens `index.html`.

## Where it lands

**Outside the repo**, as a sibling: `<repo>/../<name>-universe-export/` + `.zip`. The first cut wrote
to `<repo>/docs/site/export/`, which put seven JavaScript files inside the very tree the map indexes
— keypro's next build read them back and `unmapped_file` went 1,981 → 1,985, so exporting a map
CHANGED that map. It is also the wrong thing to do to a codebase someone lent you. `--out` overrides.

## What ships, and what deliberately does not

Twelve files, 5.1 MB on disk, **1.4 MB zipped**. The list is DERIVED from the station's own
`src=`/`href=` attributes (`scripts/_export_refs.py`), never a roster: the hardcoded roster shipped
five scripts and two bundles while the station also referenced `sim.data.js` and
`assets/gabe-icon.png`, so the first bundle 404'd twice the moment it was opened — invisibly, because
a feed loader's `onerror` is swallowed and a missing icon merely looks wrong.

```
index.html            the entry point (a redirect, not a second copy of the 730 KB station)
gabe-universe.html    the station
c4-graph.js           the entity / endpoint / table graph
levels.js             the function graph
sim.data.js           the change-simulation feed
commits.js            recent commits as walkable touched-element sets
workflows.js          the curated journeys
workflows.draft.js    the machine drafts
assets/gabe-icon.png  the station's mark
assets/3d-bundle.js   the renderer
assets/chip-assets.js the icon atlas
README.txt            what it is, how to open it, what it cannot do
```

**Not** the other 20 command-center pages. They are a different artifact, and shipping them
half-wired hands someone a folder of dead links.

## Three things the packager has to get right

**The sidebar links.** A "self-contained" folder that 404s on the first click is not
self-contained. Every `href` to an unshipped page becomes inert and says so on hover
(`data-unshipped` + a title); the station's own deep links (`gabe-universe.html?ent=…`) stay live,
which is why the file keeps its name and `index.html` is a redirect.

**The silent loaders.** `workflows.js` and `workflows.draft.js` are injected by a loader whose
`onerror` is swallowed (`gabe-universe.html:1112-1113`), so a missing one fails **invisibly** — the
journeys tab would simply be empty and nothing would say why. Both are copied when present and
their absence is reported.

**The zip.** Written with Python's `zipfile`, not `zip(1)`, which is absent on this host — and a
`.tar.gz` is the wrong thing to hand someone on Windows, where these get opened.

## Proven as a recipient, not as the author

The zip was extracted to a clean directory and probed headless from there:

* **243 nodes · 335 links** drawn, 0 console errors.
* **8 journeys** resolve in the picker, with their curated notes.
* **0 files** contain an operator path — checked with `grep -rl`, after a first check was silently
  swallowed by a pipe whose exit status came from `sed`.
* `index.html` carries the redirect.

## Floors

* A snapshot. It does not read the repository and cannot change it.
* Chrome, Edge or Firefox. Safari renders it but is slower on the 3D view.
* `c4-graph.js` and `levels.js` are required — the export fails loudly without them rather than
  shipping a station that draws nothing.

## Verified as a recipient (2026-09-12)

The zip is extracted to a fresh directory and the extracted `index.html` opened headlessly — the
only check that describes what the person receiving it sees:

```
nodes 83 · links 143 · binds 57 (48 carrying their selecting condition)
journeys 8 · commit journeys 8
failed requests: none · page errors: none
```

`binds 57 / pred 48` is the check worth keeping. The port verdict is dropped at TWO hops between
feed and picture — `fn_edges → _FNLINKS` and `_FNLINKS → links`, which rebuilds the object — and
fixing only the first still drew 57 wires that could not say which implementation, or under what
condition. The station battery now pins both hops.
