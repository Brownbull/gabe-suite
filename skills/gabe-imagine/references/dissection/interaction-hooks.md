# Interaction hooks — every element is an anchor

> Source: operator dictation, 2026-08-02. The paper corpus was static by
> MEDIUM, not by intent — "if I could manually, I would put labels and
> effects and moments, so I can see at a first glance what is happening."
> The web surface restores what paper couldn't. Load when deciding how a
> component RESPONDS to the reader.

## The hook principle

Every visual element is an anchor an explanation can hook from or to. An
element with nothing to say when touched is decoration — the interactive form
of P1's rule that a cell which opens nothing must not be clickable.

## Three layouts, chosen per section

1. **Plain** — the paper format: everything visible, nothing reactive. Still
   legitimate; a section with nothing to progressively disclose should not
   fake interactivity.
2. **Split view** — the visual LEFT, a reactive panel RIGHT. Clicking an
   element changes the panel; the visual never reflows — the panel does the
   explaining, the drawing keeps the reader's place.
3. **Full-bleed** — the visual takes the full width, and the explanation
   moves INTO the interaction ladder below.

## The interaction ladder (the full-bleed contract)

| layer | gesture | what it must give |
|---|---|---|
| glance | none | kind (silhouette), label, one number — readable untouched |
| peek | hover | a tooltip with the next layer: role + the consequence line |
| open | click | a popup / inspector with the full detail |
| relate | selection | the OTHER elements react — light, dim, connect |

- Each layer ADDS over the previous one; a hover that repeats the label, or a
  popup that repeats the hover, wastes the gesture.
- **Cross-reaction is the point of the selection layer** — "things that
  interact with what we are selecting and with the other elements are very
  good meaning communicators." A selection that only highlights itself
  communicates nothing.
- Anything that moves on reaction still answers the cog pause, spacebar and
  reduced-motion — a reactive element outside the pause contract is a defect.

## Detail levels — one visual, stepped depth (operator ruling, 2026-08-02)

A visual opens at **level 0: the bare bones** — the well of that component,
the fewest elements that still say the thing. A visible control (bar,
buttons, a toggle) steps detail IN: each level ADDS elements, labels and
numbers onto the SAME drawing, and the reader chooses their depth.

- Levels are the static twin of an animation's steps — same decomposition,
  reader-paced instead of time-paced. When a component also animates, its
  levels and its animation beats must be the same cuts.
- Keep the count small (2–4); a level adds, never rearranges — the drawing
  must not jump under the reader.
- The control shows the current level; the deepest level carries what the
  old surface prose would have said. **The levels mechanism replaces
  explanation text, it never adds to it** — this is the wording-reduction
  device, not another widget.

## Control choice — sliders for bounded levers

A bounded numeric lever gets a SLIDER with its live value formatted beside
it (a label reading `7.000000000000001%` has already lost the glance
layer); a number input only for unbounded or precision entry. A time-like
dimension (the month, the step) gets a scrub slider PLUS milestone chips
for the story beats (m1 · y1 · y10 · the crossover · the end) — continuous
for honesty, chips for narrative. Ruled on the lever bank + the anatomy.

## The consolidated variable bar (one model, one control surface)

When 2+ components share variables: ONE master control set (the first
component's sliders may be it), and a sticky VARIABLE BAR that follows the
scroll — value chips that MORPH into their own slider on hover/focus (only
the touched one). Mirrors sync by writing the master input and dispatching
`input`, so component listeners never re-wire. A component holding a
private constant the model already owns is a defect. The floor may stay
pinned to the worked case as the page's recountable anchor — SAY SO.
Reference implementation: the compound-interest page.

## Existing instances (extend these, don't fork)

- click→inspector: `pf-detail` panels (the open layer, shipped).
- selection→cross-reaction: the gravity map (seats light their bodies — the
  relate layer, shipped).
- hover: today only `title=` attributes — the weakest layer in the estate;
  a real tooltip element is the first gap this file names. **Standing ruling
  until it is promoted to Tier 1: `title=` SATISFIES the hover layer, and
  the page states the downgrade** (the say-so rule) — do not mint
  incompatible one-off tooltips per page.
- split view: not built — the second gap.
- hover-morph chips + one-model bar: the compound-interest variable bar.
- reader-paced formula: the badged equation (translation-elements.md).
