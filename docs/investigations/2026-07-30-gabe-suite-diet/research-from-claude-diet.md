# gabe-suite Restructure Brief — Stop Overengineering, Start Earning

**Source:** Claude.ai session, 2026-07-30. Context: Gabe diagnosed that gabe-suite
compensates for his limits (low bandwidth, decision opacity) with formalism made of
the exact material he can't carry. Boletapp = no structure (8k-line god files).
gabe-suite = all structure. Same failure, opposite costumes: structure decoupled
from a forcing function.

**One-line handle: "Structure must earn its seat — twice."**

---

## The Rule (apply to every piece of this repo)

A framework piece earns existence the way a test earns existence: by being able
to fail, and by a real pain that occurred TWICE without it. Not "could help" —
"bled here, twice, this stops that bleeding."

Corollaries:
1. **No structure before second pain.** First occurrence: fix by hand, log one line.
   Second occurrence: build the SMALLEST thing that catches it.
2. **Every piece names its kill condition at birth.** "Exists to stop X. If X
   hasn't occurred in a month → delete." Structure that can't fail is decoration.
3. **Build cadence beats framework cadence.** Week's commits mostly `.claude/` and
   `.md` files → the plane is growing gauges. Gastify is the flight; instruments
   exist only for flights.

This is lazy promotion (from the adaptive-RAG design) pointed at the tooling itself:
PROTOCOL.md et al. = raw corpus (Tier B, costs nothing on disk). A piece gets
PROMOTED to active use only on proven demand. Nothing is deleted — it is unpromoted.

---

## Audit Result — Promoted vs Unpromoted

### PROMOTED (earned by real, repeated pain — keep active)
| Piece                                                                                | Scar that earned it                                                          |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Terse register: output style `gabe.md` + UserPromptSubmit/SessionStart(compact) hook | Drowns in prose daily; compaction drift proven                               |
| Smoke-sensor test question (4-line form, see below)                                  | Tests-for-the-numbers that never failed; shipped broken with green walls     |
| Decision ledger, 4-line format (see below)                                           | Invisible causality/assumptions in Claude Code decisions — chauffeur problem |
| Enforcement tiers as MENTAL MODEL (gravity / speed bump / posted sign)               | CLAUDE.md rules ignored post-compaction; hooks held                          |
| Gabe Lens as on-demand skill (`/gabe-lens`)                                          | Real comprehension need — but on-demand, not always-on                       |

### UNPROMOTED (speculative — move to an `attic/` or `unpromoted/` dir, keep on disk, stop maintaining)
- Value Blocks / Intent Blocks / linkage maps as FILE MACHINERY (the mental models
  stay; the ceremony of maintaining them per-behavior goes to the attic)
- 3-tier decision router (designed before ONE week of plain ledger use — earn it first)
- Maturity models (seedling→mastered), orphan analysis, absorption protocol,
  evolution engine ceremony — framework-for-framework's-sake, no scar yet
- Any skill in the suite with zero invocations in the last month → attic

Promotion path back: same pain twice while using the plain version → promote the
smallest piece that fixes it.

---

## The Two Kept Artifacts (full spec — implement these, nothing more)

### 1. Decision ledger — `decisions.md` per story
Claude Code appends on every NON-TRIVIAL choice. Exempt from prose caps (like code).

```
DECISION: <one-line handle>
CHOSE: X over Y, Z
ASSUMED: <only assumptions the user did NOT state>
BREAKS IF: <what invalidates this>
```

- Scale/enterprise/perf decisions during MVP: auto-proceed with recommendation,
  one-line notify, entry goes to `DEBT.md` with its trigger condition
  (e.g. "revisit past ~1k daily scans"). Offer "dig deeper?" — default no.
- UX / user journeys / data flows the user feels: these ARE the MVP — surface
  short context + options + costs, ask now.
- Routing criterion = the active story/project intent. Interrupt only what the
  intent names as the point. (Gastify intent: "wallet, not ledger; simplicity
  over features.")
- Review burden: at story close, scan DEBT.md HEADERS only (~10 seconds) to
  catch misrouted items. No other mandatory review.

### 2. Story-close test question (replaces test-ceremony)
One checklist line, asked at story close:

> "Which user action does this test protect, and have I watched it fail?"

If no answer → the test is decoration. This is the whole smoke-sensor value
in its surviving form.

---

## Concrete Session Tasks (in order)

1. Create `attic/` (or `unpromoted/`). `git mv` everything in the UNPROMOTED list
   into it. Commit: "unpromote speculative structure — lazy promotion applied to tooling".
2. Verify/install the promoted register: `~/.claude/output-styles/gabe.md`
   (fork of carlosduplar caveman, `keep-coding-instructions: true`, ✓/◆ signals,
   cap lists at 5, restate state every turn) + the UserPromptSubmit and
   SessionStart(matcher: compact) hook re-injecting 3 rules. Static cat, <5ms.
3. Add ONE rule to the hook/register: "Non-trivial choices emit a DECISION block
   to decisions.md; scale-deferred ones also append to DEBT.md with trigger.
   DECISION blocks are exempt from prose caps."
4. Trim CLAUDE.md to <60 lines. Anything format-related lives in style+hook, not memory.
5. Write kill conditions: for every piece that remains active, add one line at the
   top of its file: `KILL IF: <condition>`. No kill condition → it goes to the attic.
6. Do NOT build: the 3-tier router as code, new skills, new protocols, meta-tooling
   to enforce this document. If tempted → that's the pendulum. Log the idea as one
   line in the attic and return to Gastify.

## Success Signal
Next 2 weeks: commit ratio dominated by Gastify migration code, not `.claude/`/`.md`.
decisions.md accumulating real entries. At least one attic promotion OR one kill —
either proves the loop is alive.
