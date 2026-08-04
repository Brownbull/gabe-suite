# The workflow census — `docs/site/center/workflows/<entity>.json`

**An ACCUMULATOR.** It persists; its steps change status but never vanish. Its
evidence half is EPHEMERAL — captures on disk, cases in junit, fields in the
schema — so drift between the two is computable and nobody has to remember it.

Schema: the `EvidenceNav.mount()` contract in
`../shell/assets/evidence-nav.js` (states · workflows · start), which the
feature page inlines verbatim. `transaction.example.json` is a real one — the
measured gastify census, 43 steps across 9 workflows.

## The lifecycle — who touches it when

| Moment | Beat | What happens |
|---|---|---|
| a feature ships | `/gabe-execute` → `/gabe-review` | review runs the drift checker over the DIFF and raises **WORKFLOW DRIFT** findings (review-spec §subjects). Detection lives there because only review sees the diff that caused it — the session that added a field is the one that knows what it is for. |
| the phase's Center cell | `/gabe-cc-update <phase>` | the census is authored/extended: new steps, corrected specs, new links. This is the FIXER, never the detector — it only runs when the Center cell is open, and a drift in a phase with no center work must not be invisible. |
| a green e2e run | `/gabe-cc-update curate` | owed captures get shot and curated; the step flips from ghost/unpowered to running. |
| any spine beat, later | `/gabe-pulse` S8 | the standing reminder for what review could only DEFER: an owed capture needs a run plus curation, so it outlives the reviewing session. Fires at ≥3 owed steps. |

## The three drift checks

`../generators/check_workflow_drift.py <census> [--archmap] [--junit]` —
**report-never-gate** (D1): exit 0 with findings unless `--strict`.

- **capture-debt** — a step with no capture, or whose capture file left disk.
- **claim-drift** — a step naming a C-id no junit report ran, or a spec file no
  longer tracked. *This is the claim side the testing accumulator has been
  missing:* a claim nobody runs is a lie the page tells confidently.
- **census-lag** — a writable model field NO step covers; the census is behind
  the code. Needs a per-model column inventory in `archmap.json`; when the map
  has none the checker prints **`census-lag NOT RUN`** with the reason rather
  than reporting zero — a check that cannot fire must never look like a clean
  bill.

Battery: `tests/workflow-drift` (10 cases, C7 and C10 mutation-proven).
