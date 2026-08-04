# Visual grammar — the drawing-level patterns

> Source: the DL color matrices and geometric proofs (Lucid + book1), the
> Linkchain Core storyboard, the graphics.h cards (book3). Load when DRAWING
> or choosing components. The container-silhouette table (action=card,
> seat=capsule, sphere=panel, body=tile, relationship=stroke) is BINDING and
> lives in `../disk-target.md` — this file adds the mined practices around it.

## Color = shared-factor provenance

The strongest mined visual: in the two-hidden-layer expansion every product
paints its factors by SOURCE (tan = C′ "Error Speed Direction", red = outer
σ′, blue = inner σ′), dashed boxes around the repeating factor, identical
across every row — the shared structure (why backprop reuses gradients) pops
before any algebra is read. Rule: when the same thing recurs across cases,
give it ONE color and let the repetition carry the insight. State color is a
different, already-reserved channel — never overload the two.

## Ownership grouping

Curly braces (or the grouping device of the surface) bundle rows under their
owner — parameters under their neuron (H1/n11, H2/n21). Progressive expansion
runs as columns left→right: compact form → expanded → fully substituted. The
eye gets WHO owns it vertically and HOW DEEP horizontally.

## Two abstraction levels co-present

The expanded expression and its collapsed form appear TOGETHER, linked by a
dotted enclosure — σ(w5(σ(...))+...) beside σ(w5h1+w6h2+b3)=y_pred. Never
force the reader to hold the collapse in their head.

## Geometric proof first

Before algebra: the drawing that makes it obvious — product rule as a
rectangle with added strips, x² as a growing square, sin′ from a unit-circle
triangle zoom, circle area from summed rings. If a claim has a geometric
model, the model leads.

## The zone storyboard (audience-facing scenes)

For non-technical readers (Linkchain Core): colored ZONE backgrounds as
domains (yellow street-actors · green counterpart · blue the system's
insides), ICON actors and payloads (person, cart, envelope, $, document),
a caption bar on every arrow, the system core as a segmented gradient column
with fan-in curves, gauges parked beside it as measures, the scene titled by
state ("CURRENT STATE"). Zones are the spheres, drawn as ground.

## At-a-glance annotation — labels · effects · moments

The drawing carries its own reading, untouched: **labels** name the things,
**effects** mark what an action changes (the consequence, drawn at the arrow
that causes it), **moments** mark when (the numbered walk is the moment
layer). The test is the operator's own: "see at a first glance what is
happening" — if the first glance needs a click to know what is going on, the
annotation layer is missing, not the interactivity.

## Unlike kinds never share a silhouette

When processes, files and databases share a page, each KIND gets its own
container and color, held consistently — because edges connect UNLIKE
things, and if the endpoints look alike, every edge costs a double-click to
learn what the relationship even is. The silhouette is what makes an edge
readable at a glance: a process→database arrow already says "writes/reads"
before any label. Corollary: a new kind joining a page MINTS a new silhouette
(extend the disk-target table); reusing an existing one silently merges two
kinds and reintroduces the double-click.

## Links carry direction — or they carry nothing

Every wire between actors wears an ARROWHEAD (uni- or bidirectional, but
never bare): the head is information about the link, not decoration. The
defining edge of a loop (the return) draws in accent with more weight —
the compound-interest floor whispered its own subject until the return hop
got mass. Ruled on the loop-grid landing, 2026-08-04.

## Absolute scale for animated composition

A composition animated over time must NOT renormalize each frame to 100% —
that shows shares eating shares and hides the growth itself. Pin the canvas
to the FINAL frame's total; frame k draws at √(total_k/total_end) per
dimension, anchored at one corner, so area stays value-true at every step.
Lift: the "Growing composition map" motion card. Ruled on the money map.

## Ambient motion says WHEN

Looping/ambient motion carries a legible position in time — a ruled
timeline sliding under a fixed NOW cursor, a ticking month label — or it is
decoration ("there is nothing that tells us at which moment we are").
Lift: the "Timeline conveyor" motion card. Ruled on the production line.

## Tool and API cards

A library function is studied as a card: signature → worked parameter values
→ a drawing of the effect → a plain gloss → equivalences ("clear device() =
clrscr()") → edge cases ("if b==0 the near lines don't appear"). One card
per function; the card is complete or the function isn't studied.
