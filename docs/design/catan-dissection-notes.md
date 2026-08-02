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
