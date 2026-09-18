# Gabe Universe — Visualization Design Context

> Handoff context for the Claude Code agent working on Gabe Universe.
> Source: a design-research conversation between Gabe and Claude (chat), 17–18 Sep 2026.
> Status: **recommendations, not decisions.** Nothing here is implemented or tested unless Gabe says so.

---

## 0. How to use this document

- Sections 1–2 are **facts stated by Gabe**. Treat them as ground truth.
- Sections 3–10 are **recommendations from research**. Each carries an evidence grade. Challenge them if the codebase or Gabe's testing says otherwise.
- Section 12 lists **unknowns**. Ask Gabe before assuming.
- When explaining anything to Gabe, use the `gabe-lens` skill format: problem → analogy → map → constraint box → one-line handle.
- A longer research report with sources exists as an artifact in the original chat ("Making a Dense Code-Entity Dashboard Feel Like a Game"). Ask Gabe for it if you need depth.

Evidence grades used below:

| Grade | Meaning                                                              |
| ----- | -------------------------------------------------------------------- |
| **A** | Replicated experimental findings                                     |
| **B** | Established standard or well-argued framework, not lab-proven as law |
| **C** | Practitioner craft knowledge (game dev blogs, talks)                 |
| **?** | Mixed or no direct evidence — test it                                |

---

## 1. Project context (stated by Gabe)

- **Gabe Suite**: a suite of development skills and workflows.
- **Gabe Universe**: part of the suite. A spatial **3D graph** representing the app being developed. Currently covers mostly **React + FastAPI** apps.
- **Nodes are code entities**: API endpoints, functions (flavors such as handler, accessor, others), models/tables, schemas, views, stores, and more.
- Each entity carries a lot of information, currently organized by **topic**: `data`, `schemas`, `functions`, `security`, `tests`, `widening`.
- The scan captures both what each node **reaches** and its **internal wiring**. The scan is shallow but good enough to detect, for example, the different return paths of an endpoint (200, 401, 422, ...).
- For an API endpoint, the **data section** shows, per table touched: table name, handler function, entity, fields, operation (read, write, or both).
- **Table blocks** are usually 4 rows high. Currently the **last row** shows the table's columns as colored icons. This worked well.
- A recent proposal moved those column icons to the **left side** as 2 vertical columns. Gabe briefly felt it read more easily but cannot confirm. **This is an open question** (section 7).

## 2. Design goal and constraint (stated by Gabe)

- **Benchmark**: reading the dashboard should feel like a game — Factorio, Civilization-style 4X, RTS with tech trees — where you read panels and make decisions.
- **Constraint**: text-only communication gets crowded for him. He already uses color, font style, shape, movement, and perspective as resources.
- He wants a **method to explore layouts**: find the dimensions, correlate them, develop "prisms", and grow the approach over time (section 8).

---

## 3. One-line handles (compaction-safe summary)

1. *Quantities ride on position and length; categories ride on shape and hue.*
2. *A healthy universe is quiet — color is an alarm, not decoration.*
3. *Four things on the face, the rest behind the door.*
4. *One channel, one meaning, per view.*
5. *Same slot, every card, forever.*
6. *Icons are a grammar, not a gallery.*
7. *3D earns its keep only when it moves.*
8. *Animate change, never a constant.*
9. *Juice what the hand does most.*
10. *Every layout is a fader setting — find the faders, then save presets (prisms).*
11. *Test with the ugliest data you have.*

---

## 4. Core principles

| #   | Rule                                                                                                                                                                                                                                     | Why                                                                                                      | Grade                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| P1  | Encode **quantities** (fan-out, counts, coverage) with position or length. Encode **categories** (entity type, operation, status class) with shape, hue, spatial region. Never encode magnitude with area, volume, or looping animation. | People decode aligned position most accurately; area and color intensity least.                          | A — Cleveland & McGill 1984; Heer & Bostock 2010; Munzner 2014  |
| P2  | **Quiet resting state.** Normal entities are muted, near-monochrome. Saturated color is reserved for abnormal states.                                                                                                                    | Saturated color is a scarce attention resource; clutter measurably slows search.                         | B — High Performance HMI / ISA-101; Rosenholtz clutter research |
| P3  | **About 4 chunks at a glance.** Glyph face shows at most 4–5 attributes. Everything else is details-on-demand. Topic blocks act as chunk boundaries.                                                                                     | Working-memory focus holds roughly four chunks.                                                          | A — Cowan 2001                                                  |
| P4  | **One pop-out channel per view.** Do not make the user search for a conjunction (e.g., red AND triangle).                                                                                                                                | Single-feature targets are found in parallel; conjunctions need slow serial search.                      | A — Treisman & Gelade 1980; Healey                              |
| P5  | **Redundant coding** for critical categories: shape + hue together (operation read/write/both, status class).                                                                                                                            | Survives colorblindness, small sizes, grayscale.                                                         | A/B — Ware; Borgo et al. 2013                                   |
| P6  | **Positional constancy.** The same kind of information always sits in the same slot on every card of that entity type.                                                                                                                   | Enables aligned comparison across cards and muscle memory.                                               | C (StarCraft II command card) + consistent with P1              |
| P7  | **Compositional icon grammar.** Base shape = entity class. Inner mark = flavor (handler, accessor, ...). Size/length = one key magnitude. Must stay legible at small size.                                                               | A learnable grammar scales; bespoke icons do not.                                                        | C — EVE Online icon system                                      |
| P8  | **Overview → zoom/filter → details on demand**, with **semantic zoom** (far / mid / near). For large graphs also support **search → show context → expand**.                                                                             | Standard exploration structure; focal-node expansion scales better on big graphs.                        | B — Shneiderman 1996; van Ham & Perer 2009; CodeCity, ExplorViz |
| P9  | **3D needs motion.** Provide slow rotation or camera drift (motion parallax). Handle occlusion with billboarded labels and focus+context dimming.                                                                                        | 3D graphs with motion cues are readable at roughly 10x the size of 2D; motion mattered more than stereo. | A — Ware & Mitchell 2008                                        |
| P10 | **Animation is for transitions, attention, and change over time.** Eased, about 0.3–1.0 s, staged when complex. Never require watching an animation to read a static value. Provide a reduced-motion toggle.                             | Animation often fails unless it matches the concept; staged transitions improve tracking.                | A — Tversky et al. 2002; Heer & Robertson 2007                  |
| P11 | **Juice the frequent micro-interactions**: hover, select, expand, pin. Layered feedback (motion + light + optional sound).                                                                                                               | This is what makes an interface feel alive.                                                              | C — Swink 2009; Jonasson & Purho 2012; Nijman                   |
| P12 | **Nested, pinnable tooltips** for deep drill-down (endpoint → table → field → schema). One tooltip per concept, looking the same everywhere it appears. Keep the most-needed numbers on the glyph face so nesting stays optional.        | Proven pattern for extreme stat density.                                                                 | C — Paradox CK3 dev diary 16; Factorio FFF-318                  |
| P13 | **Proximity compatibility.** Things used together sit together (or share a color). Things read alone stay visually separate.                                                                                                             | Integration tasks benefit from proximity; focused tasks are hurt by it.                                  | A/B — Wickens & Carswell 1995                                   |

---

## 5. Entity glyph and card guidance

### Card zones (shared vocabulary)

```
┌────────────────────────────────┐
│ HEADER  (identity: shape+name) │
├──────┬─────────────────────────┤
│ LEFT │ BODY  rows 1..N         │
│ RAIL │                         │
├──────┴─────────────────────────┤
│ FOOTER strip                   │
└────────────────────────────────┘
   + corner badges (alerts, counts)
```

### Endpoint — data section

- One **row per touched table**, fixed slot order:
  `[table name] · [entity] · [handler fn] · [fields] · [operation]`
- **Operation chip** uses redundant coding. Suggested: read = outline, write = filled, both = half-filled, plus a hue per state.

### Endpoint — return paths

- A small strip of **status chips**: status class as a muted categorical encoding, code as text.
- **Refinement over the earlier report:** a 401 or 422 path existing is usually *good* (it proves a guard or validation exists). Do **not** color 4xx as a warning by default. Reserve alert color for **anomalies**, for example:
  - a write endpoint with no 401/403 path
  - an endpoint with a body schema and no 422 path
  - a path with no test
- In a trace view, draw each return branch as its own strand.

### Table card

- Column icons: zone is an open question (section 7). Whatever wins, keep it identical on every table card.
- Plan for **overflow**: a `+N` chip when icons exceed zone capacity.

---

## 6. Exploration patterns inside the tool

| Pattern                                          | Task it serves | Description                                                                                                           |
| ------------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Prisms** (called "lenses" earlier in the chat) | audit          | One topic owns the color channel at a time and recolors the whole universe. Like Civ map lenses or Factorio alt-mode. |
| **Search, then expand**                          | locate         | Start from a focal node, grow outward by relevance.                                                                   |
| **Trace mode**                                   | trace          | Select an endpoint; light handler → accessor → table; dim the rest.                                                   |
| **Brushing and linking**                         | all            | Hover a table in a panel; every endpoint touching it glows in 3D, and the reverse.                                    |
| **Pin and compare**                              | compare        | 2–3 cards side by side with identical slots.                                                                          |
| **Alert stack**                                  | summarize      | Strategy-game notification column (untested endpoints, unguarded writes). Click flies the camera there.               |
| **Breadcrumbs and saved views**                  | backtrack      | Exploration trail plus camera bookmarks, like RTS camera hotkeys.                                                     |

---

## 7. Open question — column icons: footer strip vs left rail

**No direct study exists.** Closest evidence:

| Factor                                                             | Favors                                   | Grade                               |
| ------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------- |
| Left-side scanning bias (F-pattern)                                | left rail                                | B — NN/g eye tracking               |
| Binding icons to the rows they describe (proximity, common region) | left rail, **only if icons map to rows** | A/B                                 |
| Stable alignment across cards of different heights                 | left rail                                | A (aligned position)                |
| Raw search speed with many icons                                   | strip or compact grid                    | ? — studies conflict                |
| Icons summarize the whole table, not the rows                      | footer strip is fine                     | reasoning                           |
| Capacity: a 2x4 left rail holds 8 icons                            | strip, for wide tables                   | reasoning — test with densest table |

### Self-test protocol

Build two decks of about 20 table cards from real scan data (A = footer strip, B = left rail). Include the densest table.

| Task                                                    | What it measures      | Predicted winner |
| ------------------------------------------------------- | --------------------- | ---------------- |
| T1 — find a column type inside one card                 | within-card search    | strip / grid     |
| T2 — among 6 cards, which has the most of column type X | cross-card comparison | left rail        |
| T3 — find table T, read the handler for column C        | icon-to-row binding   | left rail        |

- Record: time, errors, ease rating 1–7.
- Alternate which deck goes first to cancel learning effects.
- Decision rule: adopt left rail if it wins T2 and T3 by roughly 15% or more with T1 equal or better. If results are a wash, default to left rail for alignment robustness. Log the decision (section 10).

---

## 8. Design-space exploration method

**Problem:** layouts proposed one at a time cannot be compared, because several things change at once and nobody knows which change mattered.

**Analogy:** a mixing desk. Each design dimension is a **fader**. A layout is one position of all faders. A **prism** is a saved preset. Some faders are linked: moving one forces another.

### The loop

```
INVENTORY → QUESTIONS → MATRICES → PRISMS → VARIANTS (3–5 in parallel)
    ▲                                              │
    │                                              ▼
 PROMOTE to grammar/tokens ← DECISION LOG ← TESTS (section 9)
```

### Step 1 — Attribute inventory

One table per entity type (template in section 10). For every attribute: data type, cardinality (min / typical / max), importance, volatility, own attribute vs relation to another entity.

### Step 2 — Question list

Write 10–15 real questions Gabe asks the graph. Tag each with a task type: **locate, trace, compare, audit, summarize**.

### Step 3 — The faders (five families)

| Family             | Faders                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data** (what)    | entity type, attribute, data type (category / order / quantity / relation / text), cardinality, importance, volatility                                                            |
| **Task** (why)     | locate, trace, compare, audit, summarize                                                                                                                                          |
| **Encoding** (how) | channel: position, length, hue, luminance, shape, size, texture, motion, text. Mark: icon, chip, bar, strand, badge, text                                                         |
| **Space** (where)  | card zone (header, left rail, body, footer, right rail, corner badge), orientation, cross-card alignment, fixed slot vs flowing, zoom level (far / mid / near / tooltip / pinned) |
| **State** (when)   | resting, hovered, selected, dimmed, alerted, prism active, transitions                                                                                                            |

### Step 4 — Correlation matrices

| Matrix                                 | What it reveals                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1: attribute × question**           | Which attributes are needed together. Reorder rows and columns until clusters appear (Bertin's reorderable matrix). **Each cluster is a candidate prism.**                                        |
| **M2: attribute × zoom level**         | The disclosure plan. Enforce P3 at the glyph face.                                                                                                                                                |
| **M3: attribute × channel, per prism** | The **channel budget**. Each channel carries exactly one meaning per view. Conflicts show up as two attributes claiming the same cell. No free channel → the attribute goes to details-on-demand. |
| **M4: cardinality × zone**             | What overflows. Corner badges hold 1; a 2x4 rail holds 8; a strip depends on card width.                                                                                                          |

### Step 5 — Prisms

A prism is a named recipe (template in section 10). Start from the six existing topics, but let M1 decide whether the real prisms differ. Candidate set to evaluate: structure (default), data flow, security, tests, contract (schemas + return paths), change impact.

### Step 6 — Diverge in parallel

- Build a **sandbox gallery route** that renders variants side by side at true size with real scan data.
- Generate **3–5 variants at once**, each moving **one fader**. Label each variant with the fader moved.
- Rationale: parallel prototyping yields better, more diverse designs than serial refinement (grade A — Dow et al. 2010). The Five Design-Sheets method (Roberts et al. 2016) is a usable sketching structure: one brainstorm sheet, three alternatives, one realization.

### Step 7 — Test, log, promote

Run section 9 tests. Record the decision and reason. Promote winners into the glyph grammar, slot maps, and design tokens. New entity types or attributes re-enter at step 1.

---

## 9. Evaluation tests

| Test                | How                                             | Pass criteria                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Squint**          | Blur the view until detail vanishes             | Alerts still locatable; entity classes distinguishable by silhouette; card zones read as distinct blocks. If the most important item is not the most visible, fix size / contrast / position, not by adding color. |
| **Grayscale**       | Remove all color                                | Every hue-coded category still distinguishable by shape / fill / position; alerts still stand out; text still legible.                                                                                             |
| **Worst-case data** | Render the densest entity and the largest graph | No overflow breakage; `+N` chips work; labels stay legible.                                                                                                                                                        |
| **5-second**        | Look 5 s, look away, write what you remember    | What is recalled is what the glyph face really communicates.                                                                                                                                                       |
| **Timed questions** | Time the step-2 questions per variant           | Faster and fewer errors than the current layout.                                                                                                                                                                   |

Dev toggles (CSS filters also apply to a WebGL canvas element):

```css
.debug-squint { filter: blur(6px); }
.debug-gray   { filter: grayscale(1); }
.debug-both   { filter: grayscale(1) blur(6px); }
```

---

## 10. Templates

### Attribute inventory

| Entity | Attribute | Data type | Cardinality min/typ/max | Importance 1–3 | Volatile? | Own / relation | Prisms | First visible at | Channel |
| ------ | --------- | --------- | ----------------------- | -------------- | --------- | -------------- | ------ | ---------------- | ------- |

### Prism spec

```
PRISM:      <name>
QUESTIONS:  the 2–5 questions it answers
PROMOTES:   attributes brought to the glyph face
CHANNELS:   hue → …   shape → …   length → …   motion → …
DIMS:       what fades to neutral
ALERT RULE: what counts as abnormal in this prism
ENTRY:      how it is switched on (hotkey, button, alert click)
```

### Decision log entry

```
## D-00X — <title>
Date:
Fader moved:
Variants compared:
Tests run:
Result:
Decision + reason:
Revisit if:
```

---

## 11. Working rules for the agent

**Do**

- Ask which question or prism a UI change serves before building it.
- Build variants in the sandbox gallery with real scan data, including the densest entity.
- Move one fader per variant and label it.
- Keep alert colors as separate design tokens that are never reused for categories.
- Keep slot maps per entity type in a single source-of-truth file.
- Provide hover labels for every icon (legend-learning cost is real).
- Add dev toggles: blur, grayscale, reduced motion.
- Log decisions using the template.

**Don't**

- Add a hue or shape without checking the channel budget (M3) for that prism.
- Encode magnitude with area, volume, or looping animation.
- Put more than about 5 attributes on a glyph face.
- Color 4xx return paths as warnings by default (see section 5).
- Ship whole-viewport shake or heavy motion without a reduced-motion gate.
- Treat this document as a decided spec.

---

## 12. Unknowns to confirm with Gabe

- What the **`widening`** topic means.
- Renderer stack (three.js / react-three-fiber / other).
- Do table-card column icons **map to the card's rows**, or summarize the whole table? This changes the section 7 answer.
- What the 4 rows of a table block contain.
- Typical and maximum **columns per table**; typical **node count** of a graph.
- Whether a mock of the left-rail proposal exists.
- Gabe's exact meaning of **"prism"** (this document's definition is a working one).

---

## 13. References

- Cleveland & McGill (1984), graphical perception, *JASA*. Replicated by Heer & Bostock (2010).
- Munzner (2014), *Visualization Analysis and Design*, ch. 5; nested model of design.
- Bertin, *Semiology of Graphics*; the reorderable matrix.
- Ware, *Information Visualization: Perception for Design*.
- Treisman & Gelade (1980), feature integration; Healey, "Perception in Visualization".
- Cowan (2001), "The Magical Number 4 in Short-Term Memory".
- Hollifield et al., *The High Performance HMI Handbook*; ISA-101.
- Rosenholtz et al., feature congestion / clutter measures.
- Borgo et al. (2013), "Glyph-based Visualization" (Eurographics STAR).
- Shneiderman (1996), visual information seeking mantra; van Ham & Perer (2009), search / show context / expand on demand.
- Ware & Mitchell (2008), "Visualizing Graphs in Three Dimensions".
- Tversky, Morrison & Betrancourt (2002), "Animation: can it facilitate?"; Heer & Robertson (2007), animated transitions.
- Wickens & Carswell (1995), proximity compatibility principle.
- Wettel, Lanza & Robbes (2011), CodeCity controlled experiment; ExplorViz.
- Dow et al. (2010), parallel prototyping; Roberts, Headleand & Ritsos (2016), Five Design-Sheets; Sedlmair, Meyer & Munzner (2012), design study methodology.
- Swink (2009), *Game Feel*; Jonasson & Purho (2012), "Juice it or lose it"; Nijman, "The Art of Screenshake".
- Factorio Friday Facts 318, 191, 212; Paradox CK3 dev diary 16; EVE Online icon dev blogs; StarCraft II command card.
- Nielsen Norman Group, F-shaped reading pattern.