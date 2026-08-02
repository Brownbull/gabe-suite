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

## Open items

- Generalize the dissection layer into `skills/gabe-imagine` (a pre-P1 step +
  the app-seat roster template + the mass test) — drafted, awaiting the
  operator's "land it".
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
