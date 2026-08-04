---
name: gabe-imagine
description: "Understanding carried visually, not by prose — give it a brief context (a concept, an app, a use case, a phenomenon, a code map) and it dissects the material, proposes what to build, asks, then produces command-center pages that are INSTRUMENTS: one variable model driving every component, payloads moving, machines stating their recipe, formulas wearing their live values, and barely any words on the surface. Six grammars chosen by the shape of the material; two targets — a command-center page (default) or a published Artifact."
when_to_use: "Explaining anything with interlocking parts — a concept, a pipeline, an app, a single use case, a social/economic phenomenon, a map of functions or workflows. Give it a one-line context; it dissects, proposes representations, asks, then builds. Also when a reader says a concept map left them lost."
metadata:
  version: 1.4.0
  status: suite skill (generic, project-agnostic)
  scope: any subject that can be decomposed into actors with named payloads
---

# gabe-imagine — give it a context

> **Naming:** the SKILL is `gabe-imagine`; the artifact it renders is called a
> **prism** — the format's noun, carried by `docs/prisms/`, `{{PRISM:<slug>}}`,
> `prism-<slug>.html` and the gates. Skill name ≠ artifact name.

**Usage:** `/gabe-imagine <context>` — the context is a brief pointer, one line
to a short paragraph: a concept ("compound interest, for a saver"), an app
("gustify"), a use case ("adding a transaction in gustify"), a phenomenon
("how countries create money"), a code relationship ("the hook router's
callers"). The skill carries everything else; a caller never passes
constraints, structure, or style — those live in this skill's references.
Also: `/gabe-imagine patterns` — list and open the grammar pattern pages
under `assets/patterns/` for browsing, nothing else · `--target artifact`.

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings. Full text: `../gabe-docs/references/execution-contract.md` (missing ⇒ E6 — STOP).

> **One line:** a concept map draws the connections and hides the cargo. A
> production floor answers by existing — the item is on the belt, it changes
> shape at each machine, and the starved machine turns colour before anyone
> reads a word. The finished page is an INSTRUMENT the reader plays, not an
> article the reader abstracts from — when a page explains by paragraph, this
> skill has failed (the compound-interest one-shot's verdicts, both rounds).

## THE FLOW — from a brief context to pages

Every run walks these steps; the per-step depth flexes with the subject, the
steps themselves do not. The binding detail for each lives in
`references/dissection/` — start at `MAP.md`, load per step:

| Step | Does | Binding reference |
|---|---|---|
| **I0 · intake** | classify the context's shape — concept · system/app · use case · phenomenon · code map — AND census the existing estate: read `docs/prisms/*/prism.json` + any `dissection.json`; an estate for this subject exists ⇒ load its queue, report built/ghost, jump to I2 with the delta (E4). Anchor missing → ONE clarifying round; still dark → STOP (E6) | `dissection/MAP.md` |
| **I1 · dissect** | angle-blind parts census → spheres → seats (person + question + refusal) → gravity worlds → the mass test. For code subjects the census is entities, functions, endpoints, workflows | `dissection/dissection-method.md` + `dissection/seat-archetypes.md` |
| **I2 · propose & ASK** | present the dissection compactly, then the candidate representations ranked **CRITICAL / RECOMMENDED / NICE-TO-HAVE**, and the page index — each page marked **NEW / UPDATE / already COVERED**; writing into an existing slug requires the operator's explicit word here. Via AskUserQuestion, defaults stated; nothing is built before this checkpoint | `dissection/dissection-method.md` §proposal |
| **I3 · index** | more than one page approved ⇒ a section index is the queue AND the dissection persists to `docs/prisms/<index-slug>/dissection.json` (seats · worlds · pages with built/ghost states) — the file I0 resumes from; one page ⇒ skip | `dissection/dissection-method.md` §queue · `disk-target.md` §Authoring |
| **I4 · produce** | per approved page: the ladder (rungs the subject has, kept) + the ordering law (worked case first, generalization last) + well first; assets by lookup order (lift before create, created = recorded); the surface contract below | `dissection/representation-ladder.md` · `dissection/assets-inventory.md` · `dissection/translation-elements.md` · `dissection/visual-grammar.md` · `dissection/interaction-hooks.md` |
| **I5 · gate & STOP** | the P5 gates + the render probe: `tools/probe-render.mjs` loads the built page headless and proves the authored script RAN — zero errors, every `data-fx` in FXREPLAY, and the page's declared `data-probe*` hooks (non-empty roots · readout values · inputs move readouts · hover changes its target). An authored script with NO hooks fails the probe — declare them at I4 on everything the script renders. Then the pre-present checklist, reported: surface word count (lede + handle count toward the 150) · caption spot-check (register template) · ladder order confirmed. One shot per page; the operator judges | `disk-target.md` §gates |

## The surface contract (binding on every produced page)

- **Every section leads with a component** — a floor, a map, a simulator, a
  ledger, tiles. Prose is captions beneath visuals, never the carrier.
- **Surface budget: ≤150 words** across the page's prose blocks — the
  builder-rendered lede and handle INCLUDED — no block over 2 sentences.
  Depth lives one layer down — inspectors, hover, click.
- **Captions are register sentences** — thing → action → consequence, per the
  Gabe register; a caption that only describes state gets its consequence
  attached or gets cut.
- **Assets by lookup order** — Tier 1 shell grammar (free) → Tier 2 lift
  (31 static + 25 motion + 5 grammar pattern libraries) → Tier 3 create,
  page-local, AND record it in `dissection/assets-inventory.md`. Inventing
  what the library holds is a defect (E4).
- **Numbers are real and recountable**; new chart colors run the dataviz
  validator; unlike kinds never share a silhouette.
- **One model, one control surface** — when 2+ components share variables,
  a consolidated VARIABLE BAR drives them all (sticky mirror chips,
  hover-morph sliders, master-dispatch sync — `disk-target.md` §Authoring);
  a component with private constants that the model already owns is a defect.
- **A formula is shown wearing its values** — the badged-equation device
  (`dissection/translation-elements.md`), never a symbols-only wall.

## P0 · Two targets — disk by default

| `--target` | Chrome | Width | Delivery |
|---|---|---|---|
| **disk** (default) | the command center's shell | viewport minus sidebar; scaled, never reflowed | `docs/site/center/prism-<slug>.html` + embeddable fragments |
| artifact | `gabe-artifact`'s house kit | `max-width: 74rem` | a published URL |

Disk page kinds: **console** (one screen, ambient loop + scrub) answers *how
does this move*; **article** (assembles down the scroll, may end on a console
cover) answers *what does each part do*. Canvas takes the viewport, prose caps
at 76ch; 13px floor text × 0.92 min scale = the 12px floor.
**Binding spec: `references/disk-target.md`** — read before authoring.

## P1 · The actor table, or no floor

Per actor: name · consumes (named payload IN) · produces (named OUT, ≠ IN) ·
one measured number · state (one of the four) · optional gate + failure mode ·
inspector payload (nothing to open ⇒ not clickable). **STOP (E6-shaped):**
fewer than three actors with distinct named payloads ships as prose, not a
floor — decorating an undecomposed system is the failure this skill prevents.

## P2 · Four states — "red or green" collapses three different next moves

**running** (built + proven) · **ghost** (not built — a named absence, dashed)
· **unpowered** (exists, nothing proves it can fail — amber) · **broken**
(reports success over work it did not do — red). Every state used is legended
on that page, beside the thing it colours.

## P3 · The chooser — pattern follows material, not taste

| Pattern | Choose when |
|---|---|
| **belt-line** | one linear chain, ≤7 actors, payload identity is the point |
| **belt-lanes** | the chain forks/rejoins; gates matter |
| **floor-grid** | 8+ actors; adjacency and dead cells matter |
| **recipe-tree** | the question is dependency — what is missing before X |
| **assembly-step** | first-time teaching; slow reference view |
| **loop-grid** | the chain CLOSES on itself — the return hop IS the subject; ≤5 actors on a 2×2, the return drawn as bold geometry through the open center |

Each ships as an openable page under `assets/patterns/` — read one before
authoring (E4) — EXCEPT loop-grid, a NAMED GAP: until its page ships, read
the "Loop grid floor" motion-library card + the compound-interest floor
(`docs/prisms/compound-interest/body.html`, the reference implementation).
When two fit, offer both at I2; the operator's word wins. A representation
still contested after that ⇒ the representation-lab move
(`dissection/dissection-method.md` §proposal).

## P4 · The build loop (inside I4)

1. Inventory check (`dissection/assets-inventory.md`) — what is already built
   or liftable for this page's components.
2. Fill the actor table (P1). Cannot fill ⇒ prose.
3. Choose pattern (P3) and page kind (P0), one line each on why.
4. Lift the closest pattern/library asset and re-point it at the real actor
   table — numbers come from the table only.
5. Author `docs/prisms/<slug>/{prism.json,body.html}` (schema: `disk-target.md`
   §Authoring), then build + gate in one command from the repo root (E2):
   ```
   bash docs/center/generators/refresh_suite_center.sh regen     # suite repo
   ```
   (iterating: the fast loop in `disk-target.md` §Build order; downstream
   projects: §Portability's honest state). Add the render probe for anything
   interactive (I5).
6. Report the absolute source path (+ URL on the artifact target).

## P5 · What the verifier checks

`tools/verify-prism.mjs` (fixtures in `tests/prism/`): payloads named and
different · every node numbered · states legal and legended · clickables open
panels with content · gates are never stages · the payload changes identity
across the chain. **Known hole:** check 3 verifies a number is PRESENT, not
traceable — `data-num-source` remains open; do not assume the gate defends
provenance. Prose-only: whether the actors are RIGHT and the analogy earns
its cost — a reviewer adjudicates, and I5's stop exists for exactly that.

## Anti-patterns

- Building anything before the I2 checkpoint answered.
- Inventing an asset the libraries already hold (E4).
- A floor drawn from a system nobody decomposed (P1's STOP).
- Prose carrying what a component should show; a surface past the budget.
- Motion for its own sake — a taxonomy does not move.
- A number on the page that is not in the actor table.
- Two states where four are needed.
- A belt past ~5 machines left as one row (break into `.pf-rows`).
- A fragment with a nav entry (a fragment with one is a page).
- Re-authoring chrome, palettes or motion primitives `gabe-artifact` ships.
