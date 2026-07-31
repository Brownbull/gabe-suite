---
name: gabe-artifact
description: "House chrome for published Artifacts — left-anchored content, a cog panel top-right, the fixed font roster, and motion-first visuals. Owns the build loop: design pass → kit → render gate → publish → report, plus two gated pattern libraries."
when_to_use: "ANY request that ends in a published Artifact (report, dashboard, spec page, comparison, explorer) — not only explicit invocations. Also when an existing artifact is being updated or retrofitted with house chrome."
metadata:
  version: 1.1.0
  status: suite skill (generic, project-agnostic)
  scope: any project that publishes Artifacts
---

# gabe-artifact — the house style for published pages

**Usage:** `/gabe-artifact <what to publish>` · `/gabe-artifact retrofit <path-or-url>`

## Gabe execution contract (E1–E7)

This skill runs under the suite execution contract — E1 EVIDENCE · E2 RUN-BEFORE-✅ · E3 NO SILENT DOWNGRADE · E4 REUSE FIRST · E5 STATE SYNC · E6 MISSING ANCHOR = STOP · E7 REPORT WHERE — floors, not ceilings; a skill's own gate may be stricter, never looser. Full text: `../gabe-docs/references/execution-contract.md` (if that file is missing, E6 applies — STOP).

> **One line:** an Artifact is a *product surface*, not a scratch file. Every page this project publishes wears the same chrome — content flush left, one cog top-right, the same font roster behind it — so a reader who has seen one has learned all of them.

## The four house rules

### H1 · Content is anchored LEFT
The column sits against the left edge with a gutter, never `margin: 0 auto`, and **nothing is centre-aligned** — not the hero, not section heads, not stat tiles. On a wide screen the right side stays empty; that is the look, not a bug. The kit ships this as `.artifact-page { margin: 0 auto 0 clamp(16px, 4vw, 56px) }`.

### H2 · One cog, top-right, and nothing else floats
A single fixed cog button at `top: 14px; right: 14px` opens the options panel. It is the *only* floating affordance on the page — no floating TOCs, no back-to-top, no toasts parked in a corner. The panel is a real `radiogroup`, closes on Escape, closes on outside click, and returns focus to the cog.

### H3 · The font roster is fixed and always present
Every artifact offers the same families, chosen from the founder's type-bench selections. They are declared once, in `assets/artifact-chrome.html`:

| Option | Stack | Base | Tracking | Note |
|---|---|---|---|---|
| **Mono** (default) | `ui-monospace, monospace` | 15px | −0.025em | The founder's pick resolved to the platform's default fixed face; `ui-monospace` leads so non-Windows machines get a modern mono instead of Courier. |
| **Segoe UI** | `"Segoe UI", sans-serif` | 16px | −0.015em | Windows-only face; elsewhere it falls to the platform sans. |
| _(third slot — unset)_ | — | — | — | The founder's shortlist contained two distinct settings, not three: two of the three pasted blocks were byte-identical. **Do not invent the third** — ask, then add one line to the roster. |

Family, base size and tracking move **together** — the settings were chosen as a set, so a family switch applies all three. Content must size in relative units (`em`, `%`) so the base size actually propagates; a hard-coded `font-size: 14px` opts that element out of the roster and is a defect.

### H4 · Motion outranks stillness
**Founder ruling (2026-07-31): "these animations will be higher in priority to use than the static ones."** Anything that is a flow, a trace, a pipeline, an architecture, a user journey, a state change or a sequence over time ships as a **moving** element — not a static picture of one. A still diagram is the fallback for material with no movement in it (a comparison matrix, a stat tile, a taxonomy), not the default.

Three obligations come with that, and they are not optional:

1. **Replayable.** Every animation carries its own Replay control; a one-shot that has finished before the reader arrives is a blank card.
2. **Pausable.** A global `Motion: Playing / Paused` group in the cog panel, wired to both CSS (`:root[data-motion="off"]` → `animation-play-state: paused`) and SMIL (`svg.pauseAnimations()`).
3. **Reduced-motion safe.** Under `prefers-reduced-motion` every element renders its **finished state** — bars at full width, traces fully written, nothing moving. Never a start state, never an empty frame.

**Verify motion by sampling, never by eye** (the founder's animation rule): `tools/verify-motion.mjs` fingerprints each card's computed transforms, dash-offsets, opacity, colours and geometry, clicks Replay, re-samples, and requires a difference. Two traps it cost us to learn: a fingerprint that ignores `background-color`/`border-color` reports colour-only animations as frozen, and a sampling window shorter than the animation's cadence reports slow loops as dead — the window must exceed the slowest interval on the page.

## The pattern libraries

Two built, gated and kept as assets — **read them before inventing a form.** Both are self-contained: open in a browser, or lift a single card.

| Library | Holds | Use when |
|---|---|---|
| `assets/motion-patterns.html` | 20 moving elements — flow diagram, marching ants, command-trace replay, span waterfall, pipeline, architecture-with-traffic, event fan-out, queue, pulse, screen walkthrough, ghost cursor, funnel, scroll steps, bar race, chart entrance, chart morph, scrubber, skeleton, log ticker, state machine | **First stop.** Per H4. |
| `assets/static-patterns.html` | 31 still elements — stat tiles, bar/line/area/histogram/scatter/radar/donut, sparkline, heat calendar, dumbbell, timeline, tree, matrix, stepper, Mermaid, tabs, accordion, chips, sortable table, callouts, empty state | The material genuinely doesn't move. |

Charts in both follow the `dataviz` skill's validated palette — load that skill before writing chart code, and **run its validator**; never eyeball a palette.

## The build loop

1. **Design pass — always.** Load the `artifact-design` skill before writing markup. It sets treatment (utilitarian vs editorial); this skill only fixes the chrome, never the palette or the concept. A report and a landing page both wear the cog; they should not look alike otherwise.
2. **E4 line.** Publishing an update to an existing page? `REUSE <path>` — republish the same file path (same URL) or pass `url:` from a different conversation. Minting a second URL for the same subject is a defect.
3. **Copy the kit, don't retype it.** `assets/artifact-chrome.html` carries three marked blocks — tokens+CSS, cog markup, roster script. Paste all three; author content inside `.artifact-page`.
4. **Write to the session scratchpad**, not the repo, unless the user asked for a file in the project.
5. **Run the gate** (E2): `node <skill>/tools/verify-artifact-chrome.mjs <file>` — 20 checks covering cog placement, panel behaviour, every roster option actually changing computed type, reload persistence, left anchoring, no sideways scroll. Publish only on green; paste the count. If the page animates, also run `tools/verify-motion.mjs` (see H4) — motion is never signed off by eye.
6. **Publish** with the Artifact tool: `file_path`, a one-sentence `description`, a `favicon` (1–2 emoji, **stable across redeploys**), and a `<title>` in the file. Same file path → same URL.
7. **Report (E7 + founder preference).** End with the published URL **and** the absolute source path. Both, every time — the founder reviews artifacts by opening the file as often as the page.

## Platform constraints (do not relearn these the hard way)

- **Strict CSP.** No CDN scripts, external stylesheets, webfonts, remote images, `fetch`, or WebSockets. Inline everything; embed images as `data:` URIs. A webfont must be a `@font-face` data URI or it silently falls back — which is why the roster is built from locally-resolvable stacks.
- **No `<!doctype>`/`<html>`/`<head>`/`<body>`** in the file — the host wraps it. Keep `<title>`.
- **Theme is the viewer's.** `prefers-color-scheme` carries the OS setting and the viewer's toggle stamps `data-theme` on the root; the kit defines both, and `:root[data-theme]` must win in both directions. **Never add your own light/dark control to the cog panel** — it would fight the host chrome.
- **Storage can throw.** The published page runs in a sandboxed frame; every `localStorage` call is wrapped. The roster key `gabe:artifact:font` is shared across this user's artifacts on purpose — pick a family once, and every page opens that way. An id that is not in the current roster falls back to the default.
- **Mermaid renders natively** (```mermaid fences, or `<pre class="mermaid">`) — never vendor a diagram library.

## Extending

- **Another family** → one entry in the `FONTS` array in block 3. The panel, the radio wiring, and the gate pick it up with no other edit.
- **Another option** (density, numerals, reduced motion…) → add a second `.af-group` block inside the panel, same `radiogroup` pattern. Keep the panel to one screen without scrolling; if it needs a scrollbar the artifact wants a settings *page*, not a popover.
- **Retrofit** an existing artifact → paste the three blocks, wrap the content in `.artifact-page`, strip any `text-align: center` and `margin: 0 auto`, run the gate, republish to the same URL.

## Anti-patterns

- Centred hero text, centred stat tiles, `margin: 0 auto` on the column — all violate H1.
- A settings icon that opens nothing, or options that do not persist.
- Hard-coded `font-family` on content elements; only the chrome's own labels may pin a face (`ui-monospace` for spec readouts is the one sanctioned exception).
- Publishing before the gate runs, or reporting a URL without its source path.
- Inventing a third roster family because the table has an empty row.
