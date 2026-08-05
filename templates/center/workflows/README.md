# The workflow census — `docs/site/center/workflows/<entity>.json`

**An ACCUMULATOR.** It persists; its steps change status but never vanish. Its
evidence half is EPHEMERAL — captures on disk, cases in junit, fields in the
schema — so drift between the two is computable and nobody has to remember it.

Schema: the `EvidenceNav.mount()` contract in
`../shell/assets/evidence-nav.js` (`states` · `workflows` · `start`) plus ONE
top-level key `mount()` ignores: `entity` — the drift checker's report line
names the census by it. The two consumers agree on everything else; there is
no second schema. `shot` paths are **center-relative**
(`assets/evidence-states/…`): the checker probes `<center>/<path>` and the
generated feature page lives IN the center dir, so one path serves both
consumers unchanged. `transaction.example.json` is a real one — the
measured gastify census, 43 steps across 9 workflows;
`tests/center/fixtures/workflow-census-gadget.json` is the cut-down reference
the center battery builds against (2 workflows, 8 states, all three proof
states).

The feature page (`_a3_evidence.workflow_nav_section`, called from
`_a3_feature`) inlines the census verbatim **except one build-time honesty
pass**: a `shot` path that does not resolve under the center dir is HELD OUT
of the inlined copy, and a `running` step left with no surviving capture
renders `unpowered` on the page — never a broken `<img>`, never a staged
shot. The census file keeps the stale claim ON PURPOSE (accumulator law), so
`check_workflow_drift.py` still prices it as capture-debt; every hold-out
prints a build note. Where NO census exists, the entity's Evidence tab
renders a one-line NAMED absence — the census is capture debt, cleared by
`/gabe-cc-update`, nagged by `/gabe-pulse` S8 — never silence and never a
fake empty tree. *(Reconciliation note, 2026-08-05: this paragraph softened
the earlier "inlines verbatim" line when the generator mount landed — the
shot demotion is the only divergence between the file and the page.)*

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
