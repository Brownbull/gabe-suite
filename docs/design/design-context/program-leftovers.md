# The ten pieces of work — order, definition of done, what re-enters the loop

Ruled by Gabe on 2026-09-19 (D-016). Evidence and the technical work of each piece: `gaps-endpoint.raw.json` (the evaluation)
and `gaps-endpoint.effects.raw.json` (what each piece adds); the readable version is `gaps-endpoint.html`.

## Order

| # | piece | cost (estimate) | where it lands |
|---|---|---|---|
| 1 | The route, in order | hours | the lab's panels + the inventory; fixes the app band drawn in registration order |
| 2 | What an empty slot means | hours | one helper over the lab's twelve lit-or-hollow decisions + the norms per stage |
| 3 | What each ending carries | hours | `gen-endpoint-facts.py` (cases and headers onto the drawn ending) |
| 4 | Whose write it is | hours | the Data panel: the endpoint's own writes apart from the gate's; one table set in every layout |
| 5 | Proof you can open | about a day | `gen-endpoint-facts.py` (asserts · role · the values tests give a setting) + `gen-robot.js` |
| 6 | Inside the calls | about a day | `gen-endpoint-facts.py` (functions{} · dependencies{} · function facts joined to the chain) |
| 7 | How common each piece is | about a day | `gen-endpoint-facts.py` (one loop over the 80 endpoints) |
| 8 | Field rules, and a line to open | about a day | `gen-endpoint-facts.py` (schemas{} · models{} · anchors) |
| 10 | What the screen does on each ending | days | a new part in the frontend reason arm (`_a3_fe_reason.py`), then the lab carry |
| 11 | What stays alive during the request | days | a new `inflight` part in the kinds arm, then the lab carry |
| 9 | Why a touch happens, and why it survives | days | LATER — trigger in D-016 |

## Definition of done, for every piece

1. **The facts are generated.** They reach `_lab-ep.js` through `gen-endpoint-facts.py`; nothing is typed. A fact the feed lacks is said so in the feed's own state words.
2. **The inventory row is measured.** Every row that says "to measure when piece N lands" gets its smallest · middle · largest over the 80 endpoints.
3. **Corrections are made with what the lab already has.** A wrong picture is fixed; a new fact is shown with existing components (chain rows, chips, the four states). NO new display design lands inside a piece — how the card finally shows a fact is decided by the loop (M3 → variants → tests), by seeing.
4. **The probe can fail on it.** `probe-eplab.mjs` gains asserts that measure the drawn thing, and at least one is proven to fire on a mutant.
5. **The example becomes real.** The "after this piece" rows on `gaps-endpoint.html` can be read off the lab.
6. **One commit per piece, by explicit path**, with the numbers in the message.

For the two generation pieces (10 · 11), before the lab carry: the new part ships with its battery (FIRE and SILENT cases), a dry run on the four study targets with the numbers in the commit message, `suite-doctor.sh` CLEAN, and propagation to the twins. Heavy checks run one at a time on this machine.

## What re-enters the loop afterwards

- The **(proposed)** rows of `inventory-endpoint.md` are rated by Gabe on `rate-endpoint.html`.
- **M1 round 2** runs on the larger inventory (round 1 stays a record: `m1-round1.inventory.md`, `m1-endpoint.json`). The eleven prisms are ruled; round 2 checks where the new attributes make their home and whether the running count of answerable questions moved as the evaluation predicted (1 of 20 → 16).
- Then step 3 of the loop: M3, the channel budget, for the first prism.

## Log

| date | piece | commit | note |
|---|---|---|---|
| 2026-09-20 | 1 The route, in order | see `git log -- docs/design/workflow-panel/gen-endpoint-facts.py` | the app band now runs CORS → RateLimit → Idempotency (it was drawn in registration order); every route carries checks passed · fired; the through-route is "first run", 10 of 10; 39 of 88 check rows carry their condition, a passed one too. Probe 1013 → 1025, a mutant fails 3 by name. A power cut hit mid-mutant: the facts file on disk was the mutant, restored byte-identical from the generator. |
