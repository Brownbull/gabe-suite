# The commit journey's change block

**2026-09-11 · operator ask:** walking a commit journey, each step's panel should say what that
commit did to *this* element — the lines side by side when there are few, otherwise the name with
lines deleted and added.

## What was missing

`_a3_commits.py` ran `git log --name-only`, so **no line data existed anywhere** in the feed, and
c4 pieces carry no line spans (only graft does). The step panel also mislabelled every commit step
as *"test-journey step — an element this test touches"*: commit steps carry `why:"touched"`, which
the meta chain had no case for, so they fell through to the calls-wire default and printed
**"Hop undefined"**.

## The change

**Emitter** (`_a3_commits.py`) — `--name-only` → `--numstat` in the SAME single pass, so per-file
`(added, deleted)` costs nothing extra. Then ONE bounded `git show --unified=0 <sha> -- <files>`
per commit for the small files' literal ± lines. Per commit the feed gains
`diffs: {file: {a, d, lines?}}` plus the rollup `add` / `del`.

Knobs, stated as a legibility budget rather than a data floor — the counts are exact for every
file whatever its size: `_SMALL = 12` (max added+deleted for a file to carry literal lines) ·
`_MAX_FILES = 6` (small files fetched per commit) · `_MAX_LINES = 24` (hard guard).

Two honesty rules: only files the MAP represents enter `diffs` (no step could ever show the
others), while the rollup `add`/`del` counts the WHOLE commit, mapped or not.

**Station** (`gabe-universe.html` + the example twin — the two-file law) — `_commitCollect` carries
`diffs`/`add`/`del` onto the journey; `_walkRender` renders `.sndiff`: a header of `file +A −D`,
then a two-column removed/added grid when `lines` is present. A big file shows counts alone, never
truncated content pretending to be the whole change. The meta chain gained its `why:"touched"` case.

## Measured (keypro-front, 30 commits)

`f56c760 +461/-103` — 9 mapped files, 5 carrying literal lines. Walked headless: every step shows
its file's ±, side-by-side at `+4/−3` (7 lines), `+2/−2` (4), `+1/−1` (2); counts-only at `+77/−18`
and `+17/−10`. Hop line reads *"touched by commit f56c760 — a coverage step"*. 0 console errors,
chrome harness 346/0.

## Battery

`tests/commits/run.sh` extended to **19 assertions** with a wide-rewrite fixture commit and a
commit touching a mapped AND an unmapped file together. **5 mutants killed**: lines never stored ·
`_SMALL` unbounded · unmapped files leaking into `diffs` · counts zeroed · rollup counting mapped
files only.

The battery also gained a `GEN_OVERRIDE` hook. Its header claimed "mutation-proven" but `GEN` was
hardcoded, so mutants were never loaded and every mutation run was a false green — worth knowing
if another battery makes the same claim.
