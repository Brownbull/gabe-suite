#!/usr/bin/env bash
# export-universe.sh <repo-root> [--out DIR] [--name NAME] [--no-zip]
#
# Package ONE project's Gabe Universe as a self-contained folder anyone can open — no server, no
# install, no clone. The recipient unzips it and opens index.html.
#
# WHAT SHIPS: the station, its five script siblings, and the two asset bundles it loads. Nothing
# else from the command center — the other 20 pages are a different artifact, and shipping them
# half-wired would hand someone a folder full of dead links.
#
# The sidebar's links to those pages ARE rewritten, because a "self-contained" folder that 404s on
# the first click is not self-contained. Each becomes inert and says so on hover; the station's own
# deep links (gabe-universe.html?ent=…) keep working, which is why the file keeps its name and
# index.html is a redirect rather than a second copy of 730 KB.
#
# workflows.js and workflows.draft.js are injected by a loader whose onerror is SWALLOWED
# (gabe-universe.html:1112-1113), so a missing one fails INVISIBLY — the journeys tab would simply
# be empty. They are copied when present and their absence is reported, never left to chance.
set -euo pipefail
REPO="${1:?usage: export-universe.sh <repo-root> [--out DIR] [--name NAME] [--no-zip]}"; shift || true
OUT=""; NAME=""; ZIP=1
while [ $# -gt 0 ]; do case "$1" in
  --out) OUT="$2"; shift 2;;
  --name) NAME="$2"; shift 2;;
  --no-zip) ZIP=0; shift;;
  *) echo "unknown arg: $1" >&2; exit 2;;
esac; done

[ -d "$REPO" ] || { echo "FAIL: $REPO is not a directory" >&2; exit 1; }
REPO="$(cd "$REPO" && pwd)"
CENTER="$REPO/docs/site/center"
[ -f "$CENTER/gabe-universe.html" ] || {
  echo "FAIL: no station at $CENTER/gabe-universe.html — regen the center first" >&2; exit 1; }
[ -n "$NAME" ] || NAME="$(basename "$REPO")"
# OUTSIDE the repo by default. Writing the bundle to `<repo>/docs/site/export/` put 7 JavaScript
# files inside the very tree the map indexes: keypro's next build read them and `unmapped_file` went
# 1,981 → 1,985, so exporting a map CHANGED that map. It is also the wrong thing to do to a
# codebase someone lent you. A sibling directory is one `cd ..` away and the paths are printed.
[ -n "$OUT" ] || OUT="$(dirname "$REPO")"
DEST="$OUT/${NAME}-universe-export"

echo "── export $NAME → $DEST"
rm -rf "$DEST"; mkdir -p "$DEST/assets"

# WHAT THE STATION ACTUALLY LOADS. A hardcoded roster shipped five script siblings and two asset
# bundles — and the station also references `sim.data.js` and `assets/gabe-icon.png`, so the first
# export 404'd twice the moment it was opened, silently: a feed loader's onerror is swallowed, and a
# missing icon just looks broken. The list is DERIVED from the station's own `src=`/`href=`
# references instead, so a reference added upstream ships without anyone remembering this script.
mapfile -t REFS < <(python3 "$(dirname "$0")/_export_refs.py" "$CENTER/gabe-universe.html")
missing=""
for f in "${REFS[@]}"; do
  if [ -f "$CENTER/$f" ]; then mkdir -p "$DEST/$(dirname "$f")"; cp "$CENTER/$f" "$DEST/$f"
  else missing="$missing $f"; fi
done
# the feeds and bundles WITHOUT which the station draws nothing — a hard floor, because whether a
# derived reference is load-bearing is exactly what deriving it cannot tell you
for f in c4-graph.js levels.js assets/3d-bundle.js assets/chip-assets.js; do
  [ -f "$DEST/$f" ] || { echo "FAIL: $f is required and absent — the station would not render" >&2; exit 1; }
done

# the station, with links to unshipped pages made inert
python3 - "$CENTER/gabe-universe.html" "$DEST/gabe-universe.html" <<'PY'
import re, sys, pathlib
src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
html = src.read_text(encoding="utf-8")
KEEP = {"gabe-universe.html"}            # its own deep links stay live
def inert(m):
    href = m.group(1)
    if href.split("?")[0] in KEEP or href.startswith(("#", "http")):
        return m.group(0)
    return ('href="#" data-unshipped="%s" title="not in this export — only the '
            'universe ships in a standalone bundle"' % href)
out, n = re.subn(r'href="([a-z0-9._-]+\.html(?:\?[^"]*)?)"', inert, html)
dst.write_text(out, encoding="utf-8")
print("  station: %d link(s) to unshipped pages made inert" % n)
PY

# the entry point — a redirect, so the 730 KB station is not duplicated and its own ?ent= deep
# links keep resolving to a file that exists
cat > "$DEST/index.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>Gabe Universe</title>
<meta http-equiv="refresh" content="0; url=gabe-universe.html">
<style>body{font:14px/1.6 system-ui,sans-serif;margin:3rem auto;max-width:34rem;padding:0 1rem}
a{color:#2f6feb}</style>
<p>Opening the <strong>Gabe Universe</strong>…</p>
<p>If nothing happens, open <a href="gabe-universe.html">gabe-universe.html</a> directly.</p>
HTML

cat > "$DEST/README.txt" <<TXT
Gabe Universe — $NAME

Open index.html in a browser. Nothing to install, no server needed.

WHAT THIS IS
  A 3D map of the codebase: its entities, endpoints, functions, data tables and the
  wires between them. Pick a journey from the journeys button to walk one path
  through the system step by step.

WHAT IS IN THE FOLDER
  index.html            the entry point (redirects to the station)
  gabe-universe.html    the station itself
  c4-graph.js           the entity / endpoint / table graph
  levels.js             the function graph
  commits.js            recent commits, each as a walkable set of touched elements
  workflows.js          the curated journeys
  assets/               the 3D renderer and the icon atlas

NOTES
  · Chrome, Edge or Firefox. Safari renders it but is slower on the 3D view.
  · This is a snapshot. It does not read the repository and cannot change it.
  · Links to other command-center pages are inert here — only the universe ships
    in a standalone bundle.
TXT

SIZE=$(du -sh "$DEST" | cut -f1)
echo "  files: $(find "$DEST" -type f | wc -l) · size: $SIZE"
[ -n "$missing" ] && echo "  note: absent from the center, so absent here:$missing"

if [ "$ZIP" = 1 ]; then
  # Python's zipfile, not zip(1): the binary is absent on this host, and a .tar.gz is the wrong
  # thing to hand someone on Windows, which is where these get opened.
  # $DEST, never a re-derived name: the folder name and the zip name were computed independently
  # and drifted apart the moment the default OUT moved — the run reported a cheerful "0.0 MB" zip
  # of a directory that did not exist, which is the one failure a person cannot see until the
  # recipient opens it.
  python3 - "$DEST" <<'ZIPPY'
import pathlib, sys, zipfile
src = pathlib.Path(sys.argv[1])
dst = src.with_suffix(".zip")
if dst.exists():
    dst.unlink()
n = 0
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(src.rglob("*")):
        if p.is_file():
            z.write(p, arcname=str(pathlib.Path(src.name) / p.relative_to(src)))
            n += 1
if not n:
    dst.unlink(missing_ok=True)
    raise SystemExit("FAIL: the zip would be EMPTY — %s holds no files" % src)
print("  zip: %s (%d files, %.1f MB)" % (dst, n, dst.stat().st_size / 1048576))
ZIPPY
fi
echo "  open: $DEST/index.html"
