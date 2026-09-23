# Records — what the loop has closed

Files moved here on 2026-09-23 because nothing live reads them any more; their rulings already have a home in
`../decisions.md`. Moved, never deleted: `git log --follow` on any of them gives its history. One line each.

## brainmap/ — the brain map's own page, retired by the fold (D-024)

- `brainmap-endpoint.html` — the navigator page over the eleven blocks (D-021, D-022, D-032); the lab's section map tab now carries it, and this copy still opens, frozen as last generated.
- `brainmap.tpl.html` — its template; `../gen-brainmap.js` no longer reads it and writes only `../brainmap-endpoint.json`, the tree the lab reads.
- `probe-brainmap.mjs` — its render proof (158 asserts at the move); its ruling asserts are carried by `../../workflow-panel/probe-eplab.mjs` (MAP NAV). Still runs from here.
- `walk-brainmap.mjs` — its real-click walk; `../../workflow-panel/walk-fold.mjs` walks the same moves in the lab.
- `brainmap-shots/` — the walk's pictures (`walk/`) and the placements' pictures.

## review/ — the leftovers review page, a ruled record (D-017, D-018)

- `review-leftovers.html` — the decision page he ruled on 2026-09-20; published as artifact `TYtFyh7fZcDbeZzYcJFuwZ`.
- `review-leftovers.ruled.json` — his pasted REVIEW text, verbatim; while it exists `gen-review.js` refuses to regenerate the page.
- `gen-review.js` · `review.tpl.html` · `review.words.json` — the page's generator, template and words; the toolkit to copy for the next review page.
- `probe-review.mjs` · `shoot-review.mjs` · `review-shots/` — its probe, the real-click shooter and the pictures the page embeds.
- `review-leftovers.impacts.raw.json` · `review-leftovers.review.raw.json` — the agent reviewers' and verifier's raw returns behind Versions 5 and 6.
- `review-plan.md` — the agent's draft plan the page superseded; kept beside the raw returns because they cite its lines.

## m1-round1/ — M1's first round

- `m1-round1.raw.json` — round 1's raw rater returns, frozen; every row is also in `../m1-endpoint.raw.json`, and `gen-matrices.js` reads round 1 from `../m1-round1.{inventory.md,input.json,endpoint.json}`, which stay live.

## census-b14/ — the first cross-app census (backlog B14)

- `census-b14.md` · `census-b14.py` — the wiring census over the four arms-on feeds, 2026-09-16; its job went to `../../workflow-panel/gen-pieces-digest.py`. The gaps evaluation (`../gaps-endpoint*.json`) still cites it at its old path, `element-forms/`. gastify's head has moved since (bcaea22c → 0cba5b93), so a re-run gives different gastify numbers.

## console-rules.md

- `console-rules.md` — the console's region and hover rules as he gave them on 2026-09-18; D-008 and D-009 carry them, and its three lines they did not are backfilled under D-002 and D-008.
