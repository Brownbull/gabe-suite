# Translation elements — the page-surface micro-patterns

> Source: the DL derivations (Lucid + book1) and the graphics.h study cards
> (book3). Load when WRITING a page's surface text, labels and numbers.

## The surface budget (the digestibility bar, binding)

Two operator verdicts define failure: "zero diagrams, zero visual
representations … I have to read all the details to understand" and "still a
word salad of an article, very difficult to follow." The checkable contract:

- every section LEADS with a component; prose is captions beneath it;
- **the budget counts FREE-STANDING prose blocks** (`.prismprose` and any
  text standing between components) **AND the builder-rendered lede +
  handle** — the reader meets them before the first component, and chrome
  position does not exempt words (ruled on the compound-interest one-shot:
  123 counted vs 212 read). Section headings and component-attached text
  stay exempt. **≤150 words total, no block over 2 sentences** — count
  before presenting and report the count;
- component-attached text (consequence lines, step sentences, under-labels,
  cast entries, tile/node labels, legends, live readouts) is budgeted by its
  OWN rule — one sentence per element, the templates below — and is exempt
  from the 150;
- **the tiebreak:** when mandated elements would overflow their component or
  push prose past the budget, the overflow moves DOWN — into a detail level,
  a hover, an inspector — never onto the surface. The levels device (see
  interaction-hooks.md) is the overflow's home; the budget never yields;
- captions are **register sentences** — and for this skill the register IS
  this template, self-sufficient: *thing → action → consequence*, results
  carrying *"if X then Y, so Z"*. (The full Gabe output style is
  suite-internal context, not required reading.)

## Cast first

The page opens with a glossary box declaring every symbol AND the real
payloads — the NN master page declares `w: weight · b: bias · f: activation`
and in the same box `W: person WEIGHT · H: person HEIGHT · G: gender →
y_true`. The cast is the first thing read, not a legend discovered later.

## Owner.field addressing

Every quantity is an actor's named field — `neuron.DELTA`,
`NN.NL[2].NE[0].ERROR`, `y1[wt][0]`, `N(2,0).del` — and the formal material
is REWRITTEN into that notation before any code. (This is the actor table's
consumes/produces grammar, validated by 15+ years of the operator's own
practice: keep it strict.)

## The uniform step sentence

Every step of one kind is captioned with the SAME sentence template — "…rate
of change in X respect of Y", "…tweking wN" — with the "…" continuation
prefix. Repetition is load-bearing: vary the values, never the frame.

## The consequence line

Under every result, one sentence of the form **"if X then Y, so Z"** — "if
this rate is positive then w1 decreases, so the error decreases." A number
without its decision rule is a reading without a next move; `data-num` wants
this sentence beside it.

## Semantic under-labels

The role name written directly beneath the term it explains — "error",
"deriv_transf", "input[0]" under their σ/∂ factors. The translation layer
lives IN PLACE; a distant legend costs a round trip per symbol.

## Minted names and boxed keys

- Personal abbreviations are minted and then used consistently (`drr`,
  `iox` index prefix, WCM, QUV) — a minted name is a handle, define it once
  at the mint.
- The formula or fact that will be REUSED gets a box (the polar→cartesian
  key with its quadrant table); boxes mark reusable, not important.

## Receipts at the claim

Evidence pasted beside the assertion: grapher screenshots with value tables
("Derivative Cost Analysis"), the source URL glued to the convolution
integral, worked parameter values on every API card. This is the page-format
half of the `data-num-source` provenance hole — the gate half stays open, the
authoring half is this rule.

## The badged equation (the formula device — chosen over three rivals)

A formula never ships as a symbols-only wall. Its surface form: each
sub-expression is a clickable unit wearing its CURRENT value as a badge
directly beneath the symbol (Aₖ → $243,994 · (1+i)ᵏ → ×8.12 · the fraction
→ ×1,219.97), a time/moment scrub + milestone chips re-deriving every badge
together, and a side card that names the clicked piece, shows its worked
arithmetic at that moment, and carries its consequence line. Math is
TYPESET (serif math stack, italic vars, real fraction bars — CSS only, no
libs). The under-label row (ulrow) remains the lighter form for a
recurrence; the stored trace-replay cascade and evaluation ladder (the
equation-lab artifact) are the step-by-step teaching forms for when a
reader must watch the resolution happen. Ruled 2026-08-04 ("I need to
replace the values one by one" → then "E4 is perfect").

## Bilingual glosses

Glosses in whichever language is fastest for the reader-of-one (Spanish over
English code in the notebooks). For suite pages the reader is the operator:
plain speech beats formal register in glosses.
