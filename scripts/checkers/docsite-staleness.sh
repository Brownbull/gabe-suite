#!/usr/bin/env bash
# docsite staleness — is every published doc page newer than the markdown it
# was rendered from?
#
#   bash scripts/checkers/docsite-staleness.sh [<repo-root>]
#     exit 0  every source has a page, and every page is at least as new
#     exit 1  at least one page is missing or stale (each one named on stdout)
#
# Extracted from suite-doctor.sh on 2026-07-31, when the docs merged into the
# command center and the check's output path moved with them. Inline in the
# doctor it could not be tested: a check that silently compares against files
# that no longer exist reports CLEAN forever, which is precisely the failure it
# is supposed to catch. As its own script it takes a repo root, so
# tests/docsite-staleness/run.sh can prove it both FIRES and stays SILENT.
set -u
REPO="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
SRC_DIR="$REPO/docs/src"
OUT_DIR="$REPO/docs/site/center"      # the merged home; docs/site/ pre-merge

drift=0
report() { echo "docsite: $1"; drift=$((drift + 1)); }

[ -d "$SRC_DIR" ] || { echo "docsite: no docs/src — nothing to check"; exit 0; }

# An EMPTY source dir must not read as success: a glob that matched nothing is
# how this check would pass on a repo whose docs were deleted.
shopt -s nullglob
sources=("$SRC_DIR"/*.md)
shopt -u nullglob
if [ ${#sources[@]} -eq 0 ]; then
  echo "docsite: docs/src exists but holds no markdown — nothing was verified"
  exit 1
fi

for src in "${sources[@]}"; do
  base=$(basename "${src%.md}")
  # hub.md renders as the DOCS STATION, not a hub.html the builder never emits.
  [ "$base" = "hub" ] && base="docs"
  page="$OUT_DIR/$base.html"
  if [ ! -f "$page" ]; then
    report "no generated page for docs/src/$(basename "$src") — rebuild (build_docsite.py)"
  elif [ "$src" -nt "$page" ]; then
    report "stale: docs/src/$(basename "$src") is newer than its generated page — rebuild"
  fi
done

[ "$drift" -eq 0 ] || exit 1
echo "docsite: ${#sources[@]} source(s) checked, every page present and current"
exit 0
