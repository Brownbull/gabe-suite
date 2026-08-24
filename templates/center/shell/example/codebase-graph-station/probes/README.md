# probes — author-time browser checks for the change-graph stations

Seven headless-chrome probes over `codebase-graph.html` / `codebase-archive.html`
(the change-graph + archive stations). **Author-time only** — `suite-doctor` excludes
`example/*/probes/` (machine-bound instruments, not the shipped estate). The committed
static+render battery is `tests/gabe-universe/run.sh`.

## Engine (portable)

Each probe resolves its browser from two env vars, with this machine's defaults as fallback:

```bash
GABE_PW_DIR=<node_modules-that-has-`playwright`>   # full playwright (probes use its chromium)
GABE_CHROME_BIN=<path-to-chrome>                   # default: /usr/bin/google-chrome-stable
bash run.sh
```

A fresh clone with no `playwright`: `mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright`,
then `GABE_PW_DIR=/tmp/pw/node_modules bash run.sh`.

## KNOWN DECAY (owed — do NOT read a red count as a station regression)

These probes are pinned to a specific seeded `sim.data.js` era AND to pre-batch-48 station
DOM. Two independent rots, both predating the batch-53 work:

1. **Station-drift** — `port1/port3/port6` assert DOM the batches 48–53 station rewrote;
   they fail even on the exact original fixture. Re-pin against the current station.
2. **Fixture-coupling** — the probes hardcode the *shape* of the old 2-entity frozen change
   ("two dashed containers" = exactly 2 involved entities). The shipped `sim.data.js` is now
   DERIVED from a real twin commit (`derive-seeded-sim.py` — coherent with the feeds, a
   4-entity change), so shape-assertions miss. Re-pin the counts to read from `window.GABE_SIM`
   (n involved entities) so they survive future regens instead of freezing one fixture's shape.

Until re-pinned, `port2` (nulls the sim itself) is the only green one — same as at HEAD, where
the committed sim was the `null` stub. The shipped stations render the seeded change 0-error
(verified); the probe reds are proof-debt, not a render defect.
