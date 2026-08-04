# Evidence states lab — the state-flow ⇄ screenshot navigator

The operator's sketch (2026-08-04): the Evidence tab gains a two-column format —
**left** a state-flow diagram of the entity, **right** the selected state's
screenshot with its full provenance (role · captured when · code touched ·
data models · functions · use case · sequence position). Click a state, the
right panel follows. When one consolidated diagram gets too dense, a dropdown
picks between per-flow diagrams.

Three iterations of that format, all over **real gastify transaction evidence**
(proof manifests `tx2b-journey` · `tx1-detail-reskin` · `txflows-journey`,
12 curated production screenshots, entity config, and the API/model code as
read on 2026-08-04 — nothing invented):

| Page | Framing | The bet |
|---|---|---|
| `it-a-inplace.html` | Upgrade `#sec-ev-sets` in place; ONE consolidated diagram, three dashed lanes | One picture holds the whole entity; no chrome beyond the section |
| `it-b-dropdown.html` | NEW `#sec-ev-states` section; one small diagram per flow + dropdown | The sketch's own fallback; scales past what one diagram can hold |
| `it-c-filmstrip.html` | Consolidated diagram + filmstrip of the active use-case sequence | Navigation by thumbnail — the flow reads like frames of the journey |

Shared machinery: `assets/states-data.js` (the 12-state model: capture →
locks/flags → delete, every field manifest-sourced), `assets/lab.js` (SVG
builders + panel renderer), `assets/lab.css` on top of the center's `a3.css`.

**The honest-gap proof:** the `sealed-409` state (UX-11 delete window) has no
capture and no test — it renders as a hatched named-gap card, never a fake
screenshot. Any real implementation of this format must keep that property.

View: open any page directly (`file://` works) or `python3 -m http.server`
in this directory. Verified 2026-08-04: all 12 states render in both diagram
modes, Playwright pass over all three pages — 0 console/page errors.

Next step (needs a ruling, not taken here): pick an iteration → wire it into
`templates/center/generators/_a3_feature.py` as a real Evidence section, with
the states model derived from proof-manifest `legs` + flows and the diagram
authored per entity (the one judgment piece the generator cannot derive).
