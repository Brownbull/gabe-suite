# Gabe Cognos — the cognitive gravity wells, one kind at a time (2026-09-10)

**The ask (operator):** for each kind of element, name the *gravity wells* — the questions a reader's attention must
resolve — and answer each **without reading**: count · length · colour · shape · motion that means something. The
reader model is the operator's calibrated suit (**Sequential-Procedural** — an element reads as an ordered chain, time
top to bottom). Process: we show what we see, the operator says what they get; one kind per run. **Not a skill yet** —
the skill files wait on "land it"; this folder is its first run, on the API endpoint.

| page | what | build |
|---|---|---|
| `cognos-endpoint.html` — artifact "Cognos · Endpoint" 🧲 | the 17-agent run: 12 wells · 12 encodings with three-lens verdicts · corrections · channel load · console seating · R1–R11 | `python3 build-cognos.py` over `cognos-endpoint.json` (the workflow's return) |
| `cognos-bridge.html` — artifact "Cognos · Bridge" 🌉 | the operator's diagram made literal: the door in brief · the ALPHABET A–M with the operator's rulings · 12 bridge rows drawn simple and big with the station's hover card on every glyph · the derivatives (speed · acceleration · expectation) · the dimension strip · six parts · B/G/H/L applied · marks kept on the page (artifact `db`, doc `cognos/endpoint`) | `python3 build-bridge.py` over `bench-data.json` (computed from the frozen example feed @ 8356f531 — regenerate it with the node snippet in the session record) |

Laws that came out of it: the alphabet (A how many · B whose/where · C = the icon rule · D order, ≤2 per element,
F absorbed · E the data axis · G how sure = the MAP's certainty · H posture · I pulse · J mutation · K speed · L the
shape between two counts · M waiting) · the six PARTS of an element (DATA · SCHEMAS · FUNCTIONS · TESTS · WIDENING ·
SECURITY) + a motion layer · **commit = the DB transaction, never git** · the encoding is INHERITED from the station's
journey matrix (R/W/RW chips, OPERATION badge, the cell popover) — never redrawn.

Gates: `node _gate.mjs ~/.claude/skills/gabe-artifact/tools/verify-artifact-chrome.mjs <page>` (routes the gabe-artifact
gates to system Chrome — the bundled chromium crashes on this WSL machine) and the same with `verify-motion.mjs`.
The kit is read from `~/.claude/skills/gabe-artifact/assets/artifact-chrome.html` (the install).
