# tests/frontend/fixture — the frontend arm's hermetic corpus

`extract.frozen.json` is the FROZEN output of the TypeScript-compiler extractor
(`_a3_fe_extract.mjs`) over this fixture app. The `_a3_fe` battery
(`tests/frontend/run.sh`) proves both halves against it:
- **build_fe** turns this frozen JSON into `{pieces, edges, homes, stats}` — pinned exactly.
- **LIVE** (when a `typescript` resolves) re-runs the extractor and asserts it re-derives
  this frozen JSON **byte-for-byte**; it SKIPs by name otherwise.

## Refreeze (after editing any `src/**` fixture file or the extractor)

```bash
# GABE_TS_DIR must point at a dir whose node_modules has `typescript`.
# argv3 (repo_root) MUST be the fixture dir itself, so emitted piece ids stay fixture-relative.
GABE_TS_DIR=<dir-with-node_modules/typescript> \
  node ../../../templates/center/generators/_a3_fe_extract.mjs \
       . extract.frozen.json . 
#      ^web-root ^out                       ^repo_root(=fixture)
bash ../run.sh          # re-pin the battery to the new corpus, then MUTATION-check it
```

(Run from `tests/frontend/fixture/`. A twin's web dir is a convenient `GABE_TS_DIR` —
`tests/frontend/run.sh` auto-discovers one for its LIVE case the same way.)

## The corpus (hand-enumerated — every count in run.sh is derived from this)

`route · components · fetching hook · stores · types · modules · story · barrel`, plus the
batch-53 blind-spot files (nested feature dir, deep bucket, app-shell `lib/utils` vs
`routes/utils`, a `components[…]` apiAlias co-located with a real export). Editing the tree
changes those counts — refreeze, then update the pins in the same commit.
