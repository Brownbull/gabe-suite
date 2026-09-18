# The console's rules — what each region may hold (Gabe, 2026-09-18)

When we click an element in the graph (an endpoint, a function, a model, a store…) we are exploring: what is inside it, its
implications, what happens, the effects, the impact, the test coverage. There is a lot to absorb; the console exists to move
through it swiftly.

| region | what it holds | what it never holds |
|---|---|---|
| **COMMAND** | concepts and points of view only: topics, prisms, KINDS of ending (success · error · warning · something else). It tells you what is available to explore in this element and lets you change the point of view. ≤ 3 levels, the cancel corner everywhere. | actual codes, values, names of things — nothing specific |
| **MIDDLE** | the ground of operations: with the point of view in place, everything available, drilled down in different ways — data, functions, cases, paths; not only reach but BEHAVIOUR. Specifics live here: the actual returns, a filter by code (422 · 401 · 200 · 500). | — |
| **PORTRAIT** | the detail of any one thing clicked in the middle — a function, a table — "see inside things as much as the codebase map allows" | navigation |

*A possibility, not a decision:* the command panel gets a section of the possible paths as KINDS of response, and the middle
shows everything with the filter by code.

**Known conflict with what is built (2026-09-18):** the command card's PATHS ▸ level lists the fourteen endings by status
code. By this rule the command offers the kinds; the codes move to the middle as a filter. To be reworked in the loop.

## Hovers — three depths

| where | how much |
|---|---|
| headers · the command panel · little buttons · settings | **very short** — one brief explanation. If the thing is complex, ONE example of application, and nothing more. |
| an element with much more to show (a table, a model, a function block) | the DETAIL hover — more context than the face, less than the portrait; things that invite exploring |
| click | the portrait — the full detail |

**Known conflict with what is built:** command cells, headers and rail controls open multi-row cards today. To be shortened.

## Scope of the rules ruled on 2026-09-17

- **Animations opening on the finished frame, with a repeat button** — this is for ARTIFACTS (gabe-artifact and explanations in
  general; the skill may be modified for it). In PANELS, animation follows the design-context guide (P10: transitions, attention,
  change over time; eased, about 0.3–1.0 s; never required to read a static value; a reduced-motion toggle). The 3D graph's own
  animations are a separate topic, taken up at the end.
- **Centred content** — ARTIFACTS only.
- **Exploration pages** (labs like this one) use the endpoint lab's layout: the configuration panel on the left, the page being
  judged on the right. For panels and anything that is not an artifact, the design-context guide governs.

## Priorities — the spine of the process (tier 1 in the graph)

Backend: **API endpoints · functions · schemas · models.** Frontend: **views · components · stores · hooks.** The rest still
gets done, after these. The endpoint's stage spine is the structure for API endpoints in general; whether it translates to the
other kinds is open — start with it, then look at each principal kind.

## Cards, as of today

Tables/models: the block is right. Schemas: the block is right ("we nailed them"). Functions: usable now, to be revisited —
possibly another layout, possibly an attribute every function block must surface. Tests: there is no card, only labels —
wanted. "The Blocks card is the table's face in every layout" was an assumption: it is the DEFAULT for now, not a law.
