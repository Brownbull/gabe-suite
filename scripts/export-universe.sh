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
[ -n "$OUT" ] || OUT="$REPO/docs/site/export"
DEST="$OUT/${NAME}-universe"

echo "── export $NAME → $DEST"
rm -rf "$DEST"; mkdir -p "$DEST/assets"

# the station's five script siblings. c4-graph.js and levels.js are the map; the other three are
# optional content whose absence is silent, so each is REPORTED either way.
missing=""
for f in c4-graph.js levels.js commits.js workflows.js workflows.draft.js; do
  if [ -f "$CENTER/$f" ]; then cp "$CENTER/$f" "$DEST/$f"
  else missing="$missing $f"; fi
done
for f in c4-graph.js levels.js; do
  [ -f "$DEST/$f" ] || { echo "FAIL: $f is required and absent — the station would draw nothing" >&2; exit 1; }
done

# the two asset bundles the station loads (3D renderer + the chip/icon atlas)
for f in 3d-bundle.js chip-assets.js; do
  [ -f "$CENTER/assets/$f" ] || { echo "FAIL: assets/$f absent — the station cannot render" >&2; exit 1; }
  cp "$CENTER/assets/$f" "$DEST/assets/$f"
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
  python3 - "$OUT" "${NAME}-universe" <<'ZIPPY'
import pathlib, sys, zipfile
out, name = pathlib.Path(sys.argv[1]), sys.argv[2]
src = out / name
dst = out / (name + ".zip")
if dst.exists():
    dst.unlink()
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(src.rglob("*")):
        if p.is_file():
            z.write(p, arcname=str(pathlib.Path(name) / p.relative_to(src)))
print("  zip: %s (%.1f MB)" % (dst, dst.stat().st_size / 1048576))
ZIPPY
fi
echo "  open: $DEST/index.html"
