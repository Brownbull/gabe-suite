# The dissection method — six machines upstream of any page

> Source: the Catan dissection (prism-catan-angles, gates green) rehearsing
> the layer the operator ruled good; the WCM notebooks show the same method
> run freehand a decade earlier. Load when a NEW SUBJECT arrives and no page
> exists yet.

## The three nouns

- **Angle (seat)** — a person plus one question they would pay to have
  answered. Someone who could sit down tonight; "everyone" is not a seat.
- **Sphere** — a region of the subject where parts act together.
  Angle-independent: swap the audience and the spheres stay put.
- **Gravity world** — the view from one seat: entities pulled from across the
  spheres, ranked by how hard that seat's question bends around them.

## The six machines

| # | machine | consumes | produces | discipline |
|---|---|---|---|---|
| 1 | subject intake | a subject, whole | named parts | open the box; naming is the first act |
| 2 | parts census | named parts | a counted ledger | **angle-blind on purpose** — count first, cut never; the cut belongs to the seats |
| 3 | sphere scan | a counted ledger | spheres | cluster by where parts act together, not by who cares |
| 4 | angle roster | spheres | seated questions | people, not demographics — a seat = person + question + refusal (seat-archetypes.md has the derivation recipes; the app archetype mapping is available, never mandatory) |
| 5 | gravity assignment | seated questions | gravity worlds | ~5 bodies per seat, ranked; mass is argued, never numbered |
| 6 | page plan | gravity worlds | a page queue | each world names the page kind its question deserves |

## The gates (decide, never transform)

- **in ≠ out** — a machine whose input and output share a name is refused
  (machine-enforced by verify-prism once pages exist).
- **P1 STOP** — under 3 distinct payloads the material ships as prose, not a
  floor (prose-only rule; nothing can fire it — say so where used).
- **seat test** — a seat names a person who could sit down tonight.
- **mass tiebreak** — a body every seat ranks first is the subject itself,
  not a gravity body.

## The proof and the output

- **The mass test:** run ONE body through every seat; the seats are real only
  if the readings differ (Catan's robber: a rule · a weapon · a dispute · a
  procedure · a valve · a story). Identical readings = the subject wearing
  hats.
- **The queue is the deliverable:** pages wanted vs built, per seat, with
  honest states (built = running · mapped-not-built = ghost). Refusals are
  legitimate outputs — a checklist or a reference table is prose, and forcing
  it onto a belt is decoration.

## The proposal checkpoint (I2 — nothing is built before it)

After the dissection, STOP and ask — via AskUserQuestion, compactly:

1. **The seats found** — one line each: who, their question.
2. **Candidate representations**, ranked and priced: **CRITICAL** (the page
   fails its seat without it) · **RECOMMENDED** (earns its space) ·
   **NICE-TO-HAVE** (defer unless asked). Name the component kind for each
   (simulator, ledger, map, console, tiles…) from the assets inventory.
3. **The page index** — one page, or a section with a queue; which page
   first; what stays ghost. Multi-session coverage is normal: the index
   tracks built/ghost across sessions.

State your defaults so the operator can approve in one word — but the
operator cuts, promotes, and reorders; their word wins over the ranking.

**The representation-lab move** (proven on the machine floor, the end
sections, and the equation): when a representation stays CONTESTED after
the ask — or the operator says "show me options" — build the candidates as
LIVE lettered demos in one throwaway chooser Artifact (one shared model +
clock, real numbers, a cost tag per option), and let the operator answer
with a letter. Verdicts land on the page; the runners-up get STORED
(library card or shell grammar) before the chooser retires — a rejected
representation someone built is an asset, a rejected description is
nothing.

## Subject-shape census guide (I0 feeds this)

- **concept/phenomenon** — parts are its quantities, rules, loops, actors
  (inflation: money supply, the central bank, rates, prices, wages…).
  **A subject that carries a formula/parameterized system: its FREE
  VARIABLES ARE the lever census** — every variable gets a control or is
  declared a fixed ghost with its price (the compound-interest one-shot
  silently dropped P and n for two rounds; a vanilla answer had them).
- **system/app** — entities, stores, surfaces, jobs; the center's committed
  data (archmap/registry) is the census when one exists — READ through the map
  tools first, never re-derived by hand: `mcp__gabe-map__map_status` says
  whether there is a map here at all, `center_overview` gives the entity roster
  with counts and coverage, `entity_context` opens one entity's endpoints,
  models and files. What comes back is a FLOOR — count first, cut never — so
  what the map does not carry is still measured by hand; where the tools do not
  answer, the committed JSON is still the census.
- **use case** — the steps, the actors touched, the payloads exchanged, the
  failure gates along the walk. Where a command center exists, name the walk's
  entry with `mcp__gabe-map__find` and take the actors touched from `touches`
  (an endpoint, model, file or case names its owners, r/w functions, endpoints,
  tests and edges); read `cases_for` as a HINT at which failures are already
  declared, never as the gate census. All three are floors — the walk through
  the code is what finds the payloads and the gates.
- **code map** — functions/modules/endpoints and their call/data edges; the
  census is measured, never recalled. Where a command center exists, ask the map
  first — `mcp__gabe-map__find` + `outline` for the definitions,
  `mcp__gabe-map__who_calls` for the call edges (graft callers ∪ word-boundary
  grep, hits marked code vs prose) — then `grep -rn`, which stays the census's
  absence proof: only grep proves a part is not there.

## The queue's durable home (I3 writes it, I0 reads it)

When a section is approved, I3 persists the dissection machine-readably at
`docs/prisms/<index-slug>/dissection.json`: the seats (question, refusal,
world), the cut seats, and the page queue (`pages: [{slug, seat, kind,
state: built|ghost}]`). The index page's ghost cards are RENDERED views of
this file, never a parallel copy. **Resume clause (E4):** I0 finds an
existing estate or dissection.json for the subject ⇒ load it, report
built/ghost, and jump to I2 with the delta — the dissection is not re-run
unless the operator asks. **Nesting:** a use case under an already-dissected
app inherits the app's census and joins its section as a page — never a new
dissection.

## Standing rulings

- Pages grow **per seat, never per sphere** — a sphere has no reader. Escape
  hatch: when a real person's question IS a sphere ("teach me the probability
  layer"), seat them properly and the page exists as a seat page.
- If a seat page needs a full parts catalog, a sphere ships as an embeddable
  fragment, not a page.
