# Catan dissection — working notes

> The operator's keep-file for the Catan → `/gabe-imagine` refinement arc.
> Append findings here as they are ruled; this file is the durable record the
> skill generalization will be written FROM. Started 2026-08-01.

## The layer this arc discovered

The skill chooses a grammar by material shape (P3) and a page kind by question
shape (P0) — but nothing upstream chooses **whose question** a page answers.
That choice was being made silently in the first authored sentence. The
dissection layer makes it explicit, BEFORE the actor table:

```
subject → parts census → sphere scan → angle roster → gravity worlds → page queue
```

## The three nouns (ruled good, 2026-08-01)

- **Angle** — a seat plus one question. A person who could sit down tonight;
  "everyone" is not a seat.
- **Sphere** — a region of the subject where parts act together.
  Angle-independent: swap the audience and the spheres stay put.
- **Gravity world** — the view from one seat: entities pulled from across the
  spheres, ranked by how hard that seat's question bends around them.

## The Catan roster (operator: "all six angles are very good")

| Catan seat | asks | app seat it becomes |
|---|---|---|
| the new player | what do I do on my turn? | end user |
| the strategist | where is the edge? | power user |
| the table host | how do I run tonight's table? | admin / operator |
| the rules lawyer | what exactly is permitted? | compliance / security |
| the designer | why does this hold together? | architect |
| the publisher | why does it still sell tables? | investor / stakeholder |

The app-seat column is the transfer contract: the same roster runs on Gustify
and Gastify with the seats renamed, which was the point of rehearsing on a
board game.

## Findings worth keeping

- **The mass test.** One entity read through every seat must return different
  readings. The robber: a rule to survive · a weapon · a dispute generator ·
  a procedure · a catch-up valve · a drama dial. Identical readings mean you
  found the subject wearing hats, not gravity worlds. Transfer: run "the scan"
  through gastify's six seats and it forks into six pages.
- **The census is angle-blind on purpose.** Name parts for a known audience
  and every later seat inherits the cut. Count first, rank later. Catan: 24
  parts, five spheres — recountable on the dissection page.
- **Mass has no unit.** Ranks are argued, never numbered — an invented mass
  figure would pass today's PRESENT-not-traceable gate (the known
  `data-num-source` hole). Refusing the number is the honest rendering.
- **Pages have owners nobody declared.** The existing Catan production floor
  turned out to be the NEW PLAYER's page, built before anyone said whose it
  was. Every existing prism probably has an undeclared seat.
- **A sticky assembly must not eat the screen.** The method floor as a
  half-viewport `.pf-sticky` made the angles page unreadable on scroll
  (operator, 2026-08-01, screenshot). Layout lesson: an assembly earns sticky
  only when watching the floor change IS the content (neural net); a method
  record reads better as a normal console + prose sections.

## Structure rulings (operator, 2026-08-01)

- Catan will NOT fit one page and was never expected to: it becomes a nav
  **section** — an index page (`catan`) with subpages nested under it.
- The index (summary) page is the next thing worked on together.
- Per-angle pages are allowed but not mandated; format for angle pages is
  **freeform** — the binding part is the element vocabulary (moving elements
  vs static ones), not a fixed page shape.
- Per-angle pages DEFERRED until a seat's content is actually authored;
  first in queue by pull: the strategist. Six stubs today would be clutter.

## The dimension grammar (operator ruling, 2026-08-01)

One container silhouette per KIND, so co-rendered kinds identify themselves by
their outer shape before any label is read. Landed in `prism.css` (mirrored to
templates) and in the disk-target spec's "dimension grammar" table:
action=sharp card · gate=flat tag · payload=riding chip · **seat=capsule pill**
· **sphere=soft region panel** · **body=small tile** · **relationship=stroke-only
SVG between containers, never a box**. Colour/motion secondary to silhouette.
Design source: the factory-view artifact (c48f26f3 — machines as cards, gates as
"pills never card weight", SVG stroke layer for relations).

**The gravity map** is the first relationship component: seats cycle, pulled
tiles light and lift, a moving stroke draws seat→body. Joined the existing
motion contract (FXREPLAY + cog pause + spacebar + reduced-motion held state)
instead of forking it. It also SURFACED a finding prose hid: 8 of 24 census
parts sit in no seat's top five, and no part is pulled by more than 3 seats.

**Layout lesson #2:** the dissection page's word-salad fix was moving prose
DOWN a layer, not deleting it — beat text into machine inspectors, census
paragraphs into map tiles. Depth on demand, surface stays scannable.

## Estate structure ruling (2026-08-01)

- Pages grow **per SEAT, never per sphere** — machine 6's queue is the page
  list; a sphere has no reader, so a sphere page would be an encyclopedia
  entry. If a seat page needs a parts catalog, a sphere ships as an embeddable
  fragment.
- **The seat order IS the reading order** — play it → run it → win it →
  adjudicate it → understand it → sell it (new player · host · strategist ·
  lawyer · designer · publisher). No separate initial/advanced taxonomy.
  Escape hatch: if a real person's question IS a sphere ("teach me the
  probability layer"), that sphere gets seated properly and earns a page.
- First new seat page when we build one: **the strategist** (richest world,
  all real numbers — the best stress test of the freeform format).

## Icon roster (2026-08-01)

Inline Lucide-geometry stroke SVGs (`.gvi`, currentColor), never icon fonts or
emoji. The SEAT icons are suite-level — they follow the archetype onto every
app dissection. Sphere icons are per-subject (these five are Catan's).

| Seat archetype | icon | | Catan sphere | icon |
|---|---|---|---|---|
| end user | single user | | chance | die (4 pips) |
| admin / operator | user group | | geometry | hexagon |
| power user | target | | economy | two coins |
| compliance | scales | | social | speech bubbles |
| architect | drafting compass | | progression | trophy |
| investor | briefcase | | | |

Index follow-up (next shaping session): the index roster still renders seats
as pf-node CARDS — off-grammar since the capsule ruling; re-render as `.gv-seat`
capsules with these icons, in reading order.

## Digestibility verdict (operator, 2026-08-02)

The strategist/dissection pages: good content, **not digestible yet** — too
much work to absorb. Two symptoms named: visualizations that show nothing,
and places that need a visualization carrying none. Page-by-page iterative
honing is PAUSED; the arc pivots to extracting patterns from the operator's
own notes and previous work (Lucidchart material incoming), and the pattern
set drives the next format revision instead of another polish pass.

## Mined patterns — the operator's own notation (Lucidchart, 2026-08-02)

Corpus walked via Chrome: **DataScience Tool Decision → DL page** (the
neural-nets-from-scratch notes, read in depth) and **Linkchain → Core** (the
audience-facing grammar, read at structure level). Idea/System pages named as
un-walked — the view-only session stopped re-rendering on page switch.

**The derivation spine (how the operator understands a thing inside out):**
1. **Plain-words definition before any formula** — "Cost or Loss Function:
   Function that gets the error or accumulated difference…", then MSE.
2. **Intent + decision-consequence before math** — "Tweking w1: Getting rate
   of change on L respect to w1 *in order to adjust w1*. If the rate is
   positive then w1 will decrease *in order to* decrease… *therefore, the
   error*." Every derivation opens with why and closes with the decision rule.
3. **One sentence template names every step** — "… rate of change in X
   respect of Y" captions EVERY chain-rule factor identically; "…" prefix
   marks continuation. Uniform phrasing is load-bearing, not monotony.
4. **Full expansion, zero skipped steps** — σ′ always rewritten as σ(1−σ),
   substitution carried down to raw inputs, then an explicit recombination
   line ("… So the rate of change in L respect to w_1 is").
5. **One fully-worked case FIRST, then exhaustive enumeration, then the
   generalization** — w1 end-to-end → the "…tweking w2/w3/b1…" ledger for
   every parameter → "Pattern from backpropagation". Order matters: pattern
   is EXTRACTED after enumeration, never asserted before it.
6. **Ownership grouping** — curly braces bundle parameter rows under their
   neuron (H1/H2, n11/n12/n21); progressive expansion shown as columns,
   compact → expanded, left to right.
7. **Color = shared-factor provenance** — in the 2-hidden-layer expansion,
   every product paints its factors by source layer (tan = C′ "Error Speed
   Direction", red = outer σ′, blue = inner σ′) in dashed boxes; the
   repetition across rows makes the reuse insight (why backprop is cheap)
   visible before any algebra is read. Columns get SEMANTIC names.
8. **The actor chip owns its formula** — (h1)→σ(w1x1+w2x2+b1); and the same
   expression appears expanded AND collapsed, linked by a dotted ellipse —
   two abstraction levels co-present.
9. **Prerequisite cards with minted abbreviations** — "drr: Derivative
   Reciprocal Rule" derived from the limit definition in its own boxed card;
   Activation/Cost function reference tables parked as a legend estate.
10. **Receipts pasted next to claims** — screenshots of an interactive
    grapher with value tables ("Derivative Cost Analysis"); source URL glued
    beside the convolution integral. Evidence lives AT the claim.
11. **Concrete payloads everywhere** — inputs are weight/height, examples are
    dog/cat photos with one-hot tables, never abstract x's alone.
12. **Overview → step ladder → per-step drill** — CNN: 3-box overview, STEP
    1–4 ladder, then a titled section per step with a worked matrix example
    (highlighted cells); the Keras code card's comments repeat the ladder's
    step names verbatim (structure mirrored code↔diagram).

**The audience-facing grammar (Linkchain Core):**
13. Colored ZONE backgrounds = domains (yellow street-actors · green
    counterpart · blue the system's insides) — spheres as literal ground.
14. Icon actors and icon payloads (person, cart, envelope, $, document,
    laptop) — payloads recognizable at a glance, not labeled boxes.
15. Black caption bars on every arrow — each hop carries its step label.
16. The system core drawn as a segmented gradient COLUMN with fan-in curves
    from sources; gauges parked beside it as the measures.
17. Scenes titled by state ("CURRENT STATE") — storyboard framing.

**Why the prism pages felt indigestible against this corpus:**
- The pages LEAD with the generalized machine row and hide the narrative in
  inspectors — the operator's own order is one concrete case fully expanded
  first, enumeration second, generalization LAST.
- The pages vary phrasing per element — the corpus repeats one sentence
  template per step class, and the repetition is what makes it scannable.
- The pages use color for STATE only — the corpus's strongest visual move is
  color as SHARED-STRUCTURE provenance (the robber ×3 on the gravity map
  worked for exactly this reason, by accident).
- The corpus puts a consequence sentence under every result ("if this rate is
  positive then w_1 decreases, so the error decreases") — pf-num carries
  numbers but never the decision rule.
- The corpus pastes receipts at the claim — the data-num-source hole is not
  just a gate gap, it is a missing FORMAT element.

## Mined patterns — the paper notebooks (35 photos, 2026-08-02)

Corpus: `docs/investigations/2026-08-02-personal-notes/photos/` — book1 = the
calculus+NN foundation (the handwritten origin of the Lucid DL page), book3 =
algorithms + graphics.h era studies, book4 = the WCM/YelpCamp system designs,
book2 = real-world planning. What the paper adds beyond the Lucid set:

1. **The representation ladder IS the method.** Every subject climbs the same
   ladder: drawing/geometry → symbolic derivation → owner.field notation →
   table/ledger → pseudocode → screen. NN: unit-circle & area models → ∂
   chains → `N(2,0).del` / `y1[wt][0]` → gradient ledger → handwritten
   `backprop()` in python-style. Graphs: node drawing → adjacency matrix →
   path enumeration → C code → memory-strip drawing. WCM: ER cast → prose
   flow → boxless word-cycle → numbered formal diagram → one-page spec.
   Understanding = climbing; no rung skipped, each rung kept.
2. **Glossary-first.** The master NN page opens with a cast box: `w: NN
   weight · b: bias · f: activation → sigmoid · h: hidden neuron` AND the
   real payloads `W: person WEIGHT · H: person HEIGHT · G: gender → y_true`.
3. **Owner.field addressing** predates the suite: `neuron.DELTA`,
   `NN.NL[2].NE[0].ERROR`, `y1[err]`, `g1[wt][0]` — every quantity is an
   actor's named field, and the calculus is REWRITTEN into that notation
   before any code exists.
4. **Semantic under-labels.** Role names written directly beneath algebra
   factors — "error", "deriv_transf", "input[0]" under their σ/∂ terms — the
   translation layer lives IN PLACE, not in a legend elsewhere.
5. **Numbered walk order.** The WCM formal diagram numbers its nodes 1–17
   (circled) — a static graph becomes a guided tour. Decision diamonds always
   carry yes/no plus a consequence node (penalty · deny · accept).
6. **Iterate the same picture, keep the drafts.** WCM drawn 4+ times draft →
   cleaner → richer (dashed vs solid arrows appear by pass 3); rotated
   squares overlaid until the emergent circle shows. Matches Linkchain's
   Core/Idea/System page trio — versions are an estate, not waste.
7. **Geometric proof first.** Product rule as a rectangle with strips, x² as
   a growing square, sin′ from a unit-circle triangle zoom, circle area from
   summed rings — algebra only after a drawing has made it obvious.
8. **API/tool cards.** graphics.h studied one function per card: signature →
   worked parameter values → drawing of the effect → Spanish gloss →
   equivalences ("clear device() = clrscr()") → edge cases ("if b==0 the
   near lines don't appear").
9. **The one-page spec.** YelpCamp on a single sheet: file tree + routes
   table (Name|Path|HTTP Verb) + "you can:" capability list + Main Objective
   + UI wireframes. A whole app held in one glance.
10. **Boxed reusable keys + minted names.** The polar→cartesian conversion
    boxed with its quadrant table; personal conventions everywhere: `iox`
    index prefix, drr, WCM, QUV; bilingual (Spanish gloss over English code).

**Transfer to gabe-imagine:** the ladder (1) is the missing macro-structure —
a page should CLIMB representations, not present only the finished one; the
numbered walk (5) is the static twin of the scrub bar; owner.field (3)
validates the recipe/actor-table grammar from 15+ years of the operator's own
practice; under-labels (4) are the missing translation element under every
formula/number; the one-page spec (9) is what a section INDEX wants to be.

## Interaction hooks + focus wells (operator dictation, 2026-08-02)

Surfaced by the operator on reviewing the mined set — paper was static by
medium, not by intent:

- **Every visual element is a hook** an explanation attaches from or to.
  Three layouts per section: plain (the paper format) · split view (visual
  left, reactive panel right — clicking changes the panel, the drawing keeps
  the reader's place) · full-bleed with the interaction ladder: glance
  (silhouette + label + number) → hover (tooltip: role + consequence) →
  click (popup/inspector) → selection (the OTHER elements react).
  Cross-reactions are "very good meaning communicators" — a selection that
  only highlights itself communicates nothing.
- **Focus gravity wells** — one big abstraction covering ~all concepts from
  one point of view: the whole picture first at low detail, framed by what
  is HAPPENING; then each concept in detail below (article) or in sibling
  pages. One well per seat; never open on a detail.
- **At-a-glance annotation** — labels + effects + moments drawn on the
  diagram itself; if the first glance needs a click, the annotation layer is
  missing, not the interactivity.
- **Unlike kinds never share a silhouette** — processes, files, databases
  each get their own container/color, because edges connect unlike things
  and look-alike endpoints cost a double-click per edge to learn the
  relationship. New kind on a page ⇒ mint a new silhouette.

Encoded into the staged map: new `interaction-hooks.md` + extensions to
`representation-ladder.md` (wells) and `visual-grammar.md` (annotation,
unlike-kinds). Named gaps in the estate: a real hover tooltip element and
the split-view layout — neither built yet.

## The test bench — seven concepts for the next session (2026-08-02)

Catan is ON HOLD (operator). Next session picks from this bench — not all
will run. Graded simple → hard; each stresses a different part of the mined
toolkit; every one has traceable real numbers (the provenance rule).

1. **Compound interest** · simple — the smallest full-ladder test: one
   formula as the well, consequence lines everywhere ("if the rate then…"),
   investor seat native. Numbers: any published rate table.
2. **What happens when you sign in** (a login, hash → session → cookie) ·
   simple-medium — the unlike-kinds test: browser/process/file/database on
   one page; the security seat native; split-view natural (flow left, actor
   panel right). Numbers: bcrypt cost, session TTLs.
3. **Git under the hood** (blob → tree → commit → ref) · medium — four
   object KINDS mint four silhouettes; receipts measured live from THIS repo
   (`git cat-file`, object counts); the operator's daily tool, so the
   glance-test has a real judge.
4. **D'Hondt seat allocation** (how votes become seats, Chilean ballots) ·
   medium — the enumeration-ladder test: ONE worked constituency fully, then
   the full quotient table, then the pattern; real published election
   numbers; civic seats (voter · candidate · analyst · lawyer).
5. **Anatomy of a QR code** (finder patterns, masks, error correction) ·
   medium-hard — the visual-grammar test: zones, at-a-glance annotation,
   geometry-first proofs; the operator's graphics-notebook affinity; numbers
   from the spec (versions, EC levels).
6. **DNS resolution** (the chain of caches behind a URL) · medium-hard — the
   four-states test in the wild: cache hit = running, miss = ghost, stale =
   broken-shaped; a distributed chain with real TTL numbers and a natural
   gate register.
7. **Transformer attention** (how an LLM reads a sentence) · hard — the
   sequel to the operator's from-scratch NN notebooks and the stress test
   for everything at once: provenance color for shared Q/K/V structure, the
   ladder down to matrices, wells per seat, enumeration of heads. Numbers:
   any published model card's dims.

Recommendation if one must lead: start at 3 (git) — medium, self-receipting,
and the operator can judge the glance-test instantly; then 7 as the hard
proof.

## Bench test №1 — compound interest: the fit-gap list (2026-08-02)

Page: docs/prisms/compound-interest/ → prism-compound-interest.html
(contract 8/8 · fit 15/15 · motion 4/4 · chain OK · doctor CLEAN).

**FIT — patterns the shell carried without strain:**
- The ordering law (well → worked decade → formula → levers → loop console)
  fit article mode natively; no machinery needed, just discipline.
- Cast-first glossary and the well composed from existing sphere panels.
- Provenance color: plain tile = the seed's flat $50, accent tile = interest
  on interest — the accent column growing down the ledger IS the concept.
- Consequence lines rode the existing `.k` spans ("chasing daily over
  monthly buys $1.65 a decade").
- **Under-labels MINTED**: `.ulrow`/`.ul` in prism.css (mirrored), the
  formula now reads with plain-word roles beneath each symbol — the map
  predicted this gap and the test filled it.
- The four states priced the honesty boundary: fees/tax = ghost (named
  absences), withdrawal = unpowered (prose rule), machines = running because
  every number is the page's own recountable arithmetic.
- The return hop ("↺ 2", nn-loop precedent) carried the entire mechanism.

**GAP — named on the record, not faked on the page:**
1. **No hover layer** — ledger rows want hover = the exact arithmetic
   (1,551.33 × 0.05 = 77.57); only `title=` exists. Interaction-hooks gap
   #1, now confirmed by a real page.
2. **No split view** — the three levers want visual-left / panel-right.
   Gap #2 confirmed.
3. **No curve component** — the hockey stick is TOLD in numbers, never
   SHOWN; a real growth curve is the dataviz path, deliberately not taken
   this round.
4. **No well component** — the whole-picture section is a repurposed sphere
   panel; a dedicated low-detail overview element (bigger type, fewer boxes)
   would land the well better.
5. **Ledger rows** are improvised `.gv-bodies` lines — they pass fit but
   wrap unevenly when narrow; a proper ledger-row element is a candidate
   mint for any enumeration-heavy page (D'Hondt would hit this hard).
6. **Arithmetic is recountable but unchecked** — self-computed numbers
   mitigate the data-num-source hole; nothing machine-verifies them. One
   caught-by-hand error (year 16, not 15) proves both the risk and the
   recount culture.

**Round 2 (operator verdict on round 1: "zero diagrams, zero visual
representations" — the sketch asked for a simulator):**
- **The simulator SHIPPED** (page-local, inline in body.html): inputs
  $/%​/months + saving↔loan toggle → month-resolution SVG curve (hover
  crosshair + tooltip, click-pin — the sketch's "info click" dots) + the
  paid/earned/remaining stacked bar on the right that REACTS to the hovered
  month (the cross-reaction rule, working). Loan mode computes the real
  payment (P·mr/(1−(1+mr)^−m)). Probed in headless: curve drawn, saving
  $1,647.01/loop $647.01 (cross-checks the frequency ladder), loan
  $10.61/mo · $272.79 interest.
- **Ledger got inline bars** (amber = seed's pay · accent = earned-by-
  interest, scale = year 10's $77.57) — the "Table with inline bars"
  pattern lifted from gabe-artifact's static library at last.
- **Loop console TRIMMED** — subs removed, recipes cut to 2–3 words, one
  short number per machine.
- **dataviz skill applied for real**: six-checks validator RAN — it killed
  the neutral-gray series (chroma floor) and a too-light dark amber
  (lightness band); shipped pair: accent + #b45309 light / #c98500 dark,
  ALL PASS both modes. Mission skin's teal accent sits a hair under the
  chroma floor as series-1 — accepted with secondary encoding (labels +
  position + gaps), noted here.
- **Asset lesson (operator's question "what assets do you have?"):**
  gabe-artifact ships 31 static + 20 motion patterns (bar/line/area charts,
  table-with-bars, stat tiles, timelines, tabs…) that disk pages had NEVER
  used; gabe-imagine has 5 grammar patterns; the dataviz skill has the
  method + validator. The sim + ledger bars are the first lifts. Candidate
  mints for the shell (post-bench): the simulator frame (inputs+plot+
  reactive bar) and the chart primitives — page-local for now, promotion
  decision at land-it.

## The one-shot goal (operator, 2026-08-02 — the skill's success criterion)

The end state is a skill invoked as **"give it a context"** (a subject, e.g.
compound interest) that generates the page IN ONE SHOT — no correction loop.
Round 2's verdict stands: "still a word salad of an article, very difficult
to follow." The honing continues THROUGH the test protocol, not through more
in-session patching:

**Test protocol:** the operator opens a FRESH session and runs a prepared
prompt; the session builds the page cold from the staged map + inventory;
the operator checks the result. Every failed run adds its verdict to this
file and tightens the map — the map, not the page, is what accumulates.

**The bar (verbatim verdicts a run must not reproduce):**
- "zero diagrams, zero visual representations … I have to read all the
  details to understand" (round 1)
- "still a word salad of an article, very difficult to follow" (round 2)

**Hard budget derived from the verdicts (checkable):** surface prose ≤150
words total; no prose block over 2 sentences; every section leads with a
visual component — prose is captions, never carrier. Depth lives in
inspectors/hover/click, not on the surface.

## The land-it, redirected — gabe-imagine v1.3.0 (operator, 2026-08-02)

The one-shot prompt draft was rejected: "you are encoding too much
information and context to give to the prompt itself." The constraints
belong IN the skill; the prompt carries only a brief context. The skill must
serve, equally: concepts (neural nets, compound interest), whole apps
(gustify), single use cases (add a transaction, find a recipe), phenomena
(inflation, money creation and its regulation — actors and social
consequences), and code maps (function/workflow relationships). It may ASK
(propose seats + representations ranked critical/recommended/nice-to-have),
builds an index of pages, and covers big subjects across several sessions.

Landed as v1.3.0 (map now BOUND):
- SKILL.md: the flow **I0 intake → I1 dissect → I2 propose-&-ASK →
  I3 index → I4 produce → I5 gate-&-STOP**, + the surface contract
  (component-led sections · ≤150 surface words · register captions · assets
  lifted before invented). 144 lines.
- dissection-method.md: the I2 proposal checkpoint + the subject-shape
  census guide (concept/app/use-case/code-map).
- translation-elements.md: the surface budget with both verdicts quoted.
- The operator floated a future name — "Gabe" — for the skill: rename
  DEFERRED until the flow survives a one-shot (renames are full-sweep
  expensive; trigger = operator repeats the ask after a passing run).
- A separate context-producer skill (dissection as its own skill): DEFERRED;
  trigger = a second skill needs the dissection layer.

## The verify panel + v1.3.1 (2026-08-02, ultracode round)

A 3-lens adversarial panel (generality · one-shot-ability · operator
fidelity; full findings preserved at
docs/design/2026-08-02-imagine-flow-panel.json) audited v1.3.0 and found the
exact defect class the operator named: Catan/app residue promoted to
universal law. Fixed as v1.3.1:
- seats: general rule (person + question + refusal) + per-shape derivation
  recipes; the six-seat table demoted to the app EXEMPLAR; mass test rebound
  to the seated count; reading order generalized (distance from the doing);
  caller-named audience ruling ("for a saver" seats that seat first).
- ladder: maximal template — never skip a rung the subject HAS, declare the
  missing ones; per-shape ladders; sibling enumeration scales (exhaustive
  ≲10, else sample + count).
- flow: I0 censuses the existing prism estate + resumes from
  `dissection.json` (the queue's new durable home, written by I3); I2 marks
  pages NEW/UPDATE/COVERED and slug overwrites need the operator's word; I5
  defines the render probe + a reported pre-present checklist (word count ·
  caption spot-check · ladder order).
- budget: counting unit defined (free-standing prose only; component text
  has per-element rules); the tiebreak: overflow moves DOWN into levels/
  inspectors, the budget never yields.
- disk-target: full prism.json schema (section/mode-index/order semantics),
  the ONE build command named, portability rewritten honestly (downstream
  centers not wired; owed at twin propagation), fragment header syntax.
- hover ruling: `title=` satisfies the layer until a Tier-1 tooltip exists.
- **Owed, explicitly:** mechanical budget/caption checks in verify-prism (+
  battery) · a fixtured tools/probe-render.mjs · downstream prism wiring.

## The two-session protocol + detail levels (operator, 2026-08-02)

- **Detail levels ruling** (encoded in interaction-hooks.md): visuals open
  at level 0 (bare bones) and a control (bar/buttons/toggle) steps detail IN
  on the same drawing; levels = an animation's beats, reader-paced; the
  levels mechanism REPLACES explanation text. The stepper is a named Tier-3
  candidate.
- **Protocol:** Session A (generator) runs ONLY the thin prompt, one shot.
  Session B (corrections, inherits this session's context via handoff)
  receives the operator's feedback on A's page, applies page corrections,
  and generalizes every fix into the map/skill in the same pass.
- **Round-2 compound-interest page REMOVED** after being committed (history
  keeps the simulator; assets-inventory cites the sha) — the one-shot page
  takes precedence.

## One-shot round 1 — the corrections session (2026-08-02)

**Session A** ran the thin prompt cold and produced
`docs/prisms/compound-interest/` (the saver's console: floor + simulator +
ledger + four states + formula-last). **Operator verdict:** "seems like a
playwright test is needed before declaring page ready, judge by yourself."

**The judgment (Session B):** all three shipped gates were GREEN on a page
whose runtime nobody had run — contract 8/8, fit 15/15, motion 5/5, and not
one of them executes the page's own authored script. A hot inline probe then
proved the simulator fine (15/15: curve drawn, $243,994 readout, inputs
react, hover cross-reacts, inspectors open — the 2 first-pass fails were the
probe's own viewport-coordinate bug, not the page). Visual pass clean. One
REAL page defect surfaced by the checklist Session A never reported: surface
prose = **212 words** when the builder-rendered lede + handle count, 123
without — the counting unit had never ruled on page chrome, and that
ambiguity is a word-salad leak.

**Page fix (smallest change):** lede 45→27 · handle 44→17 · two prismprose
blocks trimmed → **148/150 counted tokens**; meaning moved down, not lost —
the floor and inspectors already carried it.

**Generalization (the actual product):**
- **`tools/probe-render.mjs` SHIPPED** (the I5 named gap closed): one
  browser, all pages; always-on checks (zero page/console errors at load AND
  after interaction · every `data-fx` slug in FXREPLAY) + author-declared
  hooks — `data-probe` (renders non-empty) · `data-probe-expect` (readout
  regex) · `data-probe-react`/`data-probe-out` (each input must move every
  readout, then restore) · `data-probe-hover` (gesture changes its target).
  **An authored script with no hooks FAILS** — Session A's gap verbatim,
  now a firing clause. Generator chrome (`mermaid.initialize`) exempted.
- **Battery:** `tests/prism-probe/` — 9 cases (8 FIRE mutations + the
  chrome SILENT case), doctor-discovered.
- **Wired:** `refresh_suite_center.sh` gained the probe leg (32 checks
  across 9 floor pages, green); SKILL.md I5 rewritten to the shipped tool;
  disk-target §Authoring got the hook table + §Gates row; the page declares
  7 hooks.
- **Counting-unit ruling** (translation-elements §surface budget): lede +
  handle COUNT — the reader meets them before the first component; headings
  and component-attached text stay exempt. SKILL bumped to **1.3.2**.

**Pre-present checklist (reported, per I5):** surface count 148/150 ·
captions spot-checked (consequence-carrying: "the machine passes you —
m217", "same 7%, ×1,217 the payment") · ladder order confirmed (worked case
→ floor → simulator → enumeration ledger → states → doubling → rule LAST).
Full chain green: contract 8/8 · fit 135/135 · motion · probe 32/0 · doctor
CLEAN. Still owed from the panel: mechanical budget/caption checks inside
verify-prism, downstream prism wiring.

## One-shot round 2 — the vanilla-Claude comparison (2026-08-02, operator)

The operator asked desktop Claude (no skill) the same question and got a page
whose GRAPHIC beat ours: full-width slider rows (value right-aligned) → a
stat-tile row → one large chart, with a **starting amount** lever ours never
had. Diagnosis (ruled): not over-tuned to compound interest and not a
conscious cut — three mechanisms:
1. **Census hole** — nothing enumerates a formula's FREE VARIABLES; P and n
   fell out at bench round 2 and the lift rule carried the omission forward.
2. **Lift preserved an improvisation** — the round-2 simulator frame (number
   boxes + side bar) was lifted verbatim; no reference names a canonical
   simulator layout, so the nearest local asset won.
3. **No control-abstraction rule** — bounded numeric levers want sliders
   with live formatted values (their "7.000000000000001%" is the
   counter-case), number inputs only for unbounded/precision entry.

**The corrections queue (SAVED — the working plan):**
- STEP 1 (now): modify the page to the ruled layout — sliders (incl.
  starting amount) → stat tiles (lifted shape from gabe-artifact's static
  library) → full-width chart with year ticks; hover/pin, crossover,
  provenance and probes kept; iterate with the operator to acceptance.
- STEP 2: encode into the skill — (a) formula free-variable lever census:
  every variable gets a control or a declared ghost; (b) the simulator
  layout pattern (controls → tiles → chart) in the inventory + the lift
  rider: a lifted asset's LAYOUT is re-judged against the library, not
  inherited; (c) slider-vs-input rule + formatted value labels (battery
  case for the float artifact). OPEN RULING (operator-only): chart-as-well
  leading concept pages, floor demoted to the mechanism section.
- STEP 3: re-run Session A's exact prompt cold ("/gabe-imagine compound
  interest, for a saver") against the updated skill; the recreated page is
  the test of the encodings.

### The simplicity scan + the correction sweep (same session)

Operator asked for a cold scan — "simplicity, abstractions visible right
away" — then ruled: correct all findings, removal allowed, keep the sliders.
Nine findings, all landed:
1. **Loop quietest** → return hop got mass: wider hop, 3px rail, bold ink
   label "↺ back into the pot" (wrap allowed; the shell ellipsizes hop
   labels — page-local override), node 4 sub now says "the hop that IS
   compound interest".
2. **Three representations, word-only joins** → cast box CUT (recipe faces
   already carry the payloads); one explicit join sentence: "The curve above
   is this machine, running."
3. **Shape after arithmetic** → the SIM LEADS the page; the floor demoted to
   "The machine behind the curve". (The chart-as-well ruling, made by the
   correction itself.)
4. **Vocabulary strips between question and answer** → legend follows the
   floor, drops `broken` (floor never uses it), gates shortened to fit
   unclipped at 1440.
5. **Crossover absent from the chart** → drawn on the curve: ring +
   "the machine passes you · m217", recomputed live, hidden when settings
   never cross; `data-probe` on the marker group.
6. **Ledger duplicated the curve** → CUT entirely; its unique facts moved
   (crossover → chart, shares → tiles at any hovered month).
7. **State words in machine silhouettes** → floor 2 replaced by four
   state-badged scenario TILES in a sphere (legend's own dot swatches
   reused), each opening its old inspector.
8. **Insight-last doubling** → pulled row moved first.
9. **Six chrome strips** → cast gone, handle rewritten as a chart pointer
   ("the gap … is the machine's share").
Surface: **114/150** (was 148). Chain green after sweep: contract 8/8 ·
fit 135/135 · motion 4/4 · probe 8/8 page / 32-0 site. STEP-2 encoding
candidates the sweep adds: hop-label wrap-on-return default in the shell;
"the ladder is also an ordering law INSIDE components" (insight-first);
scenario-tile grammar for states-without-machines.

### The head-grammar round (operator, same arc): "too many formats, no icons"

Operator on the page head: too many unlabeled formats (kicker · title ·
lede · handle box · seat pill), titles not distinct, no section navigation,
icons only on the seat. **SHELL-level correction** (mirrored byte-identical
to templates/center/shell/, doctor CLEAN):
- **Labeled handle** — build_prisms.py wraps every handle in a `.phlab` tag
  (bookmark icon + "THE HANDLE"): a reader never deduces what the box is.
- **Kicker conditional** — empty kicker renders nothing; this page emptied
  it (the seat row carries the addressing). Estate kickers unchanged.
- **Section titles = iconed h2 pills** (`.prismprose h2`: panel background,
  border, inline stroke icon) — the eye finds sections without reading.
- **The section rail** — `prism-fx.js buildToc()`: 2+ h2 pills ⇒ a sticky
  `.prism-toc` chip row at the stage top (icons cloned from pills,
  scroll-spy `.on`, reduced-motion jumps, runtime-built so the static link
  gate never sees dead anchors). Shape borrowed from the center's .subnav.
- Page: four iconed sections (lever bank · machine · accounts · rule); seat
  gvt now says "this page's seat · end user · …".
Headless check: 4 chips, jump 0→1988px, spy highlights, rail sticks at 0,
zero errors; probe 32/0, suite OK. Every prism page inherits pills + rail
+ labeled handle automatically at its next regen.

### The treemap round (operator, 2026-08-04): rail drag + "the formula, mapped"

Two asks, both landed:
- **Rail drag-to-scroll (SHELL, mirrored):** the section rail pans by
  grabbing anywhere on it — pointer events, 6px threshold; a press that
  moves is a pan and never navigates, a clean press still jumps. Cursor
  grab/grabbing, touch-action pan-y.
- **NEW SECTION between the lever bank and the machine — "the formula,
  mapped":** an animated 2-level treemap of the closed form's parts, month
  by month. Columns = ownership (you · the machine), blocks = the five
  parts: start P · deposits c·k | growth-on-start P((1+i)^k−1) · simple
  interest c·i·k(k−1)/2 · interest-on-interest (the remainder). The split
  RECOUNTS the page: at m360 simple = $75,390 and surplus = $96,604 — the
  same numbers the credit/engine inspectors state. Formula typeset
  LaTeX-look in pure CSS (serif math stack, italic vars, stacked fraction
  bar — no external libs on center pages). Controls: month slider + play
  (auto-advance ~200 steps); the treemap owns ONLY the month — amounts
  follow the lever bank's sliders live (one model, two views; "maybe one
  less selector" taken to its end). Registered as FXREPLAY["ci-map"],
  obeys the cog (headless: advancing 48, frozen at 48 under
  Motion=Paused, resumed 48→78) and reduced motion (loads finished).
  Colors: shades of the two validated families via color-mix — no new
  hues. Trap recorded: `--ci-s2` was scoped to `.ci`, so the treemap's
  amber rendered TRANSPARENT until the var moved to `.ci, .tm` — a
  page-local component reusing another component's var must widen the
  var's scope, not assume it.
Surface 131/150 · motion 5/5 (ci-map is a gated animation) · probe 32/0 ·
doctor CLEAN. Rail now 5 chips.

**Treemap correction round (operator, same day):** three rulings, landed:
1. Formula OUT of the section (it never mapped to the diagram) → the
   typeset math moved into the rule's closed-form inspector.
2. The numbers moved ABOVE the map as an iconed stat strip — one tile per
   part (month · start · deposits · growth-on-start · simple ·
   interest-on-interest · the pot), color-dotted, watchable month by month.
   probe-outs sit only on tiles that MOVE at P=0 (start/growth stay $0 —
   an out no input moves fails the union clause, correctly).
3. **The absolute-scale ruling (encode at STEP 2 — this is a general
   animated-composition law):** a composition animated over time must NOT
   renormalize each frame to 100% — that shows shares eating shares and
   hides growth. The canvas is pinned to the FINAL frame's total; frame k
   draws at sqrt(total_k/total_end) per dimension, anchored at the
   bottom-left corner, so area stays money-true at every month and
   exponential growth is VISIBLE as growth beside the linear deposits.
   Columns stack column-reverse so the root parts sit at the anchor corner.
Frames verified m60 (small corner cluster) · m217 (~60%, machine rivals
deposits) · m360 (full canvas). Surface 140/150 · gates + probe green.

**Pattern promotion (operator ruling):** the absolute-scale growing map is
GENERAL ("growth over time of a whole divided into parts" — coverage,
failure cases, code per entity) → promoted into gabe-artifact's motion
library as **"Growing composition map"** (`data-anim="growmap"`, neutral
code-per-entity demo on the s1/s2 series palette, follows the library's
clearInterval/MOTION.on/reduced conventions). Library gate 22/22 · battery
6/6 · counts 20→21 everywhere (CLAUDE.md, artifact SKILL 1.3.0→**1.3.1**,
imagine SKILL, tool-registry, assets-inventory) · doctor CLEAN.

**Machine-floor redesign (operator: "dense, plain, no icons/colors/
dimension — show me options"):** four live options built as a chooser
Artifact (one model, one clock, all four animated):
A 2×2 loop grid (recommended) · B richer belt · C orbit console ·
D production line. Published: claude.ai/code/artifact/ae2a22a7 (private).

**The verdict + the landing:** operator chose **A** for the page; **B's
card anatomy STORED as shell grammar** (prism.css optional additions:
`.pf-name svg` icon slot · `.pf-node.tinted` consuming an authored
`--tint` · `.pf-share` bar — a plain card stays legal; mirrored to
templates); **D refined in the artifact** (kept as reference): the return
pipe now flies in OPEN AIR above the stations — a pipe grazing a box reads
as something half-hidden — and the engine got its own gauge fill (payment
scales toward $1,423), because "it's scaled, not only the pot". Third D
ruling (operator): a conveyor that rolls forever but says nothing about
WHEN is decoration — **the belt became the timeline**: a year-ruled strip
(y1…y30, month ticks) sliding beneath a fixed accent NOW cursor labeled
"m·y", so the motion itself carries the time dimension. Encode at STEP 2:
*looping/ambient motion must carry a legible position in time, or it is
noise.*
**Storage round (operator: "store these as reference diagrams — A, B, D"):**
- **Loop grid floor** + **Timeline conveyor** joined the motion library
  (21→**23**; neutral subjects — a plan→build→measure→learn cycle and a
  build-progress belt; gate 24/24, battery 6/6, counts swept, doctor CLEAN).
  B already stored as shell grammar. The SIXTH GRAMMAR (loop-grid as a full
  `assets/patterns/` page + P3 row + "five grammars"→"six" sweep + minor
  version) is DEFERRED to STEP 2 — that is where the version bump and
  chooser-table change belong; trigger: STEP 2 execution.
- **Directional links ruling (operator):** floor wires carry DIRECTION —
  arrowheads on every link (muted head on flow wires, accent head on the
  return), uni- or bidirectional but never bare. Landed on the page's A
  floor + the chooser's A; encode into visual-grammar at STEP 2.
- **Motion-gate flake, third hit** → the recorded trigger fired:
  FX_WINDOW_MS widened to 3600 in refresh_suite_center.sh's motion leg
  (isolated re-runs were 5/5 twice; regen load starves the sampler).
**The page floor is now the 2×2 loop grid**: pf grammar fully intact
(data-in/out/num/state/detail, hops in DOM order, scrub steps 4 payloads),
layout authored page-locally — fixed 880px design grid (pffit scales it),
SVG carries ONLY the four wire paths (labels live on the hops; svg text
duplicating hop labels was the first build's bug), the return curve sweeps
the open center bold-accent, cards carry icons + tints (amber you / accent
machine) + share bars (29.5% · 100% · 70.5%). Chain green: contract 8/8 ·
fit 135/135 · probe 32/0 · doctor CLEAN.

**Block-label round (operator):** each treemap container now carries its
concept ICON beside the name (flag · coins · sprout · percent · loop), and
a second row with the amount + a SHARE RING — a 26px circle whose border
arc IS the percentage of the pot (50% = half the circumference bold, rest
a faint track; SVG dasharray over a 25%-opacity track, currentColor so it
inherits the block's label color). Labels tier by absolute block size:
full (head+row) → head-only → none; the title attr always carries all
three facts. Bonus made visible: at m217 the deposits ring reads exactly
50% — the crossover AS a gauge. Probe 32/0, suite OK.

## The end-sections chooser (operator: same exercise, new vocabularies)

Second chooser Artifact for the page's LAST TWO sections, six live options
on the real numbers, one shared clock:
claude.ai/code/artifact/b86e70e0 (private, favicon 🎯).
- **§ four accounts** — F1 divergence chart (four fates from one first
  dollar; the gaps are the argument; state-colored endpoint chips carry
  number + next move) · F2 outcome race (bar race, time-anchored; the
  parked bar stalls in plain sight) · F3 the forked account (ONE account
  forking at three decisions; branch thickness = ending balance). CUT and
  stated: an interactive "doors" treatment — least comparable, most cost.
- **§ the rule** — R1 the recurrence RUNNING (odometer slots execute
  pot + pot·r/12 + deposit = next pot, next pot slides back — the return
  hop in arithmetic) · R2 term anatomy (reader-paced stepper; each term
  lifts, names itself, shows its worked value) · R3 the 360-row collapse
  (rows stream, accelerate, collapse into the closed form landing on the
  same $243,994 — the formula as COMPRESSION, not decree).
**Verdicts + landing:** **F1 CHOSEN** (accounts → the divergence chart on
the page: state-colored curves — good/faint-dashed/warn/bad — endpoint
chips clickable into the old d-s-* inspectors, loads finished,
FXREPLAY["ci-fates"] replays the draw under the cog) · F2 refined in the
artifact (gained the belt-as-timeline strip + NOW cursor — the
time-position law applied) · F3 stored for MANY-BRANCH subjects · **R2
CHOSEN + UPGRADED** (the rule → the formula anatomy: the symbolic line
with a NUMERIC TWIN — $243,994 = $0 × 8.12 + $200 × 1,219.97 — joined by
a month scrub + milestone chips m1/y1/y10/m217/y30; term stepper with
live worked values; my call on steps: full 0–360 slider for continuity +
five milestones for the story beats; the ulrow recurrence and the
d-formula inspector RETIRED — the anatomy subsumes both, the lever
asymmetry moved into the factor term's card). Library: **divergence
fates** + **decision fork** cards added (neutral subjects: policy
adoption · CI fork) → **25 motion**, gate 26/26, battery 6/6, counts
swept, doctor CLEAN. Page: contract 8/8 · motion 6/6 (3 registered
animations) · probe 32/0 · surface 128/150.

## The equation lab (operator: "the values aren't well mapped — show the resolution")

The anatomy's numeric twin SKIPPED the resolution — symbols jumped to the
answer. Third chooser Artifact: claude.ai/code/artifact (equation-lab,
🧮) — four ways to RESOLVE the equation, all fed by one variable bench
(P/c/i/k cards, color-coded, ± steppers, click-to-flash; i shown rounded,
math exact):
- **E1 substitution cascade** — the operator's numbered list as lines:
  substitute → parentheses → powers → subtraction → division (the
  machine's factor) → multiplications → the pot; each line's freshly
  resolved piece glows; stepper + show-all.
- **E2 the morph** — same steps, ONE line simplifying in place (paper-
  style, cheapest on space).
- **E3 the evaluation ladder** — order of operations as a ladder,
  variables enter at the bottom, every rung carries its live value.
- **E4 the badged equation** — no steps; every sub-expression wears its
  value as a badge and names itself on click.
**Round 2 (operator: E1 + E3, add motion-library animation):** E1 gained
the **command-trace replay** — lines stream in one per 800ms, the newest
carries a blinking caret, the freshly resolved piece glows (reduced
motion: all lines instantly) — plus the RIGHT-SIDE variable panel
(P/c/i/k live, color-coded) and **the moment slider** (k, m12–m360,
drag = all views re-derive; release = both animations replay). E3 gained
**bottom-up evaluation** — rungs render dimmed, then light one per 520ms
from i = r/12 up to the pot. Verified: streaming 3/8 mid-replay w/ caret,
slider syncs bench + panel, ladder 2-lit/5-dim mid-eval, zero errors.
**Verdict: E4 CHOSEN** ("just saw E4 — it is perfect") + the moment
slider added to it in the lab. **Landed on the page:** the rule section's
anatomy is now the BADGED EQUATION — five clickable units (Aₖ · P ·
(1+i)ᵏ · c · the factor fraction), each wearing its live value as a badge
($243,994 · $0·yours · ×8.12 · $200/mo · ×1,219.97 at y30), month slider
+ milestone chips kept, side card names the selected piece; probe outs on
the three k-varying badges, expects 243,994 + 1,219.97. E1's trace-replay
cascade and E3's bottom-up ladder stay STORED in the lab (animated).
Probe 32/0 · suite OK.

## The variable-bar round (operator: consolidate all variables, sticky + hover-morph)

Every graphic owned private constants; ruled: ONE MODEL. Landed page-local:
- **The lever bank stays the master** — its four sliders are the source of
  truth; the FLOOR alone stays pinned to the worked case (the page's
  recountable anchor, stated).
- **The variable bar** — sticky under the section rail (top:39, z-6):
  four chips (start · deposit/mo · rate/yr · years) showing live values;
  **hovering (or keyboard-focusing) a chip morphs IT — and only it — into
  its slider**, title centered above; mirrors are two-way synced by
  setting the master input + dispatching `input`, so every component's
  existing listener keeps working untouched.
- **Fates chart + badged equation rewired off their private constants**
  onto the model (fates rebuilds its own scale per change; the wait-chip's
  "behind" gap now derives live; equation badges P/c live).
- Probe: vbar is data-probe-react (each mirror moves its own chip; union
  holds); headless proof: bar stuck at 39px · hover→slider yes · rate
  7→10 propagated fates $243,994→$452,098 = sim tile = equation A —
  CONSISTENT. Probe 32/0 · suite OK.
**STEP-2 encoding candidate:** the consolidated-variable-bar pattern (one
model · master controls · sticky mirror chips · hover-morph, master-
dispatch sync so listeners never re-wire).

**De-dup follow-up (operator: "redundancy — put the bar atop the first
diagram"):** the lever bank's big slider rows HIDDEN (display:none — they
stay the master inputs), the variable bar moved to the top of the first
diagram as the page's ONE control surface. Re-proven after the move:
hover-morph yes · rate 7→10 → fates = tile = equation $452,098 · probe
32/0. The pattern's final form: chips-with-morph ARE the controls, the
masters are invisible plumbing.

## STEP 2 — the arc encoded (gabe-imagine → 1.4.0, 2026-08-04)

Operator's north star, verbatim intent: *"Gabe Imagine should help us
understand things visually instead of giving huge text to abstract from"*
— the page ended up almost wordless, everything carried by instruments.
Encoded:
- **SKILL.md 1.4.0** — description + one-liner rewritten around the
  instrument-not-article law; surface contract gains one-model/variable-bar
  + badged-equation bullets; P3 gains **loop-grid** (sixth grammar; its
  pattern page a NAMED GAP → read the loopfloor motion card + the
  compound-interest floor); the representation-lab move linked; 161 lines.
- **dissection-method.md** — formula free-variable lever census (I0 guide);
  the representation-lab move at the I2 checkpoint (contested ⇒ lettered
  live chooser artifact; runners-up STORED before the chooser retires).
- **representation-ladder.md** — shape-leads/mechanism-follows (page scale)
  + insight-first (component scale) corollaries of the ordering law.
- **visual-grammar.md** — directed links · absolute scale · ambient-motion-
  says-WHEN, each with its lift pointer.
- **interaction-hooks.md** — slider-vs-input + scrub-with-milestones rule;
  the consolidated variable bar recipe; instances updated.
- **translation-elements.md** — the badged equation as THE formula device
  (typeset math, badges, scrub, side card; cascade/ladder stored as the
  teaching forms).
- **disk-target.md §Authoring** — the one-model contract + simulator layout
  + directed wires paragraph.
- **assets-inventory.md** — the lift rider (layout re-judged, not
  inherited).
CLAUDE.md row rewritten; install 29/29 (operator's new dev-conventions
skill rides alongside — untouched); doctor CLEAN.

**STEP 3 (next, FRESH session):** park `docs/prisms/compound-interest/`
(rename to `compound-interest-v1` or archive) so I0's census can't resume
it, then run the EXACT prompt cold: `/gabe-imagine compound interest, for
a saver`. Judge the cold page against v1: the census must surface P, the
sim must lead, the floor must loop with directed wires, the formula must
wear values, the surface must stay ≤150. The delta = what the skill still
cannot do unaided.

## Open items

- Generalize the dissection layer into `skills/gabe-imagine` (a pre-P1 step +
  the app-seat roster template + the mass test) — awaiting the operator's
  "land it". The mined material is now ENCODED as the skill's staged
  reference map: `skills/gabe-imagine/references/dissection/` (router:
  `MAP.md`; parts: dissection-method · seat-archetypes ·
  representation-ladder · translation-elements · visual-grammar). The
  land-it session wires MAP.md into SKILL.md; this file stays the narrative
  record.
- Prism page breadcrumbs don't know about sections yet (crumb is always
  Overview › Explanations › page) — cosmetic, revisit if sections multiply.
- Downstream centers (`build_center_a3.py`) have no Explanations group at all;
  section nav goes to the twins with the deferred twin propagation, not before.
- The `data-num-source` provenance hole predates this arc and stays open.
- **Known flake family (2026-08-01, two hits in one session):** headless-
  chromium legs are load-sensitive when several run back-to-back — (1) the
  motion gate's replay fingerprint on neural-net caught 1 frame under
  full-chain load (4/5, clean solo), (2) the doctor's tests/center sweep
  reported the harness FAILING while direct runs pass 96/96. Both clean on
  rerun. If a third hit lands, widen the fingerprint sampling window and/or
  serialize the doctor's chromium batteries instead of rerunning forever.
