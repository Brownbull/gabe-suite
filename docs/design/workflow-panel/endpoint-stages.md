# The endpoint's stages — the standard dimension for the API endpoint kind (2026-09-17)

The operator, after reading the robot: *"for any endpoint in this application or any other application we know of, what stages
should it reach as a standard API endpoint? That's the dimension I want to see: every stage, from beginning to end, including
the variations, exceptions and so on. EDGE · GATE · INPUT · HANDLER · EFFECTS · ANSWER are the expected dimensions for every
API endpoint. In that dimensionality we might be able to cover all the different topics — data, schema, function, test, widening,
security. The 429, 400, 422, 401 responses are final outputs: they will appear as paths, labels indicating which path the endpoint
followed, and those can appear in any of the topics. In the data topic we might end up in the middle panel with the tables
throughout all these stages; in the command panel, when we are positioned for data, we see all those stages in the middle."*

## The spine — the same eight for every door

| # | stage | what happens there | the form's slots | endings that leave here |
|---|---|---|---|---|
| 1 | **EDGE** | the checks every request meets before it reaches this door — the app band | K3 rate · U3 guards · the flag switch | 429 |
| 2 | **GATE** | the lock on the door — who may knock, and what the gate provisions | K2 auth · U8 switches (the verifier) · provisions | 401 |
| 3 | **INPUT** | the body — can it be read, does it fit the shape | framework exits · schema cases · K1 declared | 400 (body) · 422 |
| 4 | **HANDLER** | the door's own decisions — guards, calls, arms, catches | U3 · U7 · U6 paths · U11 failure | 400 · 409 · … |
| 5 | **EFFECTS** | the writes the door leaves behind — which survive each ending | U9 effects · U12 repeat (claims · races) | — (no ending; the ending decides the fate) |
| 6 | **ANSWER** | the reply the caller gets — one body per ending, beside what was promised | K4 responses · K1 declared | 200 · 201 · … |
| bay | **UNCAUGHT** | anything nobody caught — possible at any step | U11 | 500 |
| screen | **CLIENT** | the screen that reads the answer — can it tell the endings apart | frontend reason · guards · hooks | — |

A door that has nothing at a stage still HAS the stage (an open slab, 0/0): two doors stack as the same eight rows, and the
break in the silhouette is the finding. The bay runs beside every stage; the screen sits after the answer leaves.

## The endings are labels

Every way a request can end is a PATH; its status is its label. A label is chosen once (the command panel) and then any topic
can be read through it: the tables on that path, the shapes on that ending, the calls that ran, the cases that prove it, the
gates that fired. With no label chosen, a topic shows the union over every path (what the Data panel does today).

## The topics, read across the stages

| topic | what sits on the spine | the label changes |
|---|---|---|
| data | the tables touched at each stage — the WHEN picture (users at GATE, the rest at HANDLER, the fate at ANSWER) | which tables, which fate |
| schemas | the request shape at INPUT, the response shape at ANSWER, the 422 cases at INPUT | which response, which cases |
| functions | the dependencies at GATE, the handler and its calls at HANDLER, the catches where they are | which calls ran, which arm |
| tests | the cases hung on the ending they prove, at the stage the ending leaves | which cases |
| security | the band at EDGE, the scheme and gates at GATE, the guards at HANDLER — passed or fired | which gate fired |
| widening | the screen at CLIENT — the reason site, the guard chain, the hook's moves | which branch the client takes |

## The console, with this spine

- **COMMAND** positions on a topic (DATA ▸ · SCHEMAS ▸ · …) and on a label (PATHS ▸ → the endings); the by-part card is the
  default (the `verbs` pick `g2`).
- **MIDDLE** shows the positioned topic laid across the stages, wearing the chosen label; transposable (stages as rows or columns).
- **PORTRAIT** magnifies whatever is clicked in the middle.

Built first: the Data topic across the stages in the endpoint lab (the WHEN picture as a Data distribution), then each topic in
turn, one at a time. The robot (`data-atlas.html` §6) is the verification view of the same spine.
