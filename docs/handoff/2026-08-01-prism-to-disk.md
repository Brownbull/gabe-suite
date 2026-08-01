# Next session — gabe-prism moves to disk

**Written:** 2026-07-31, end of the session that landed prism 1.0.0 (`2f112a4`).
**Operator direction, verbatim intent:** move off Artifact publishing, build **on-disk pages** instead — full desktop width, no fixed column, no host format — then use them inside the Gabe Center's content sections. Two output shapes wanted: **full-page explanations** and **small explainer components** reusable across center sections.

Twin propagation is **deferred** (its plan stays at `docs/handoff/2026-07-31-twin-propagation.md`).

---

## 1 · What changes, and what does not

**Does not change:** the five patterns, the actor table with its STOP condition, the four-state vocabulary, `verify-prism.mjs` and its 10-case battery. Those are about the *material* and survive any output target.

**Changes:** the chrome, the width, the delivery.

| | Artifact target (today) | Disk target (next) |
|---|---|---|
| Chrome | `gabe-artifact` house kit — left column, cog, roster | the **center shell** — sidebar, a3.css, viewer settings |
| Width | `max-width: 74rem`, left-anchored by H1 | **full desktop**, sidebar aside; a floor plan can use the screen |
| CSP | strict — no external anything, inline only | none — local assets, multiple files, real images |
| Delivery | published URL, host-managed | `docs/site/center/*.html`, in git, in the nav |
| Reuse | one page, one URL | **embeddable fragments** across center pages |

The docsite merge just proved this exact shape: `docpage.html` + `nav.json` + a scoped CSS layer. A prism page is the same move with a different skeleton — which is why this is a small build, not a rewrite.

---

## 2 · Decisions to rule at the start (with recommendations)

**D1 · Chrome.** *Recommend:* the center shell. A prism page that wears the artifact chrome inside the center would be the second-skin problem the docsite merge just removed. New skeleton `prismpage.html` beside `docpage.html`: same sidebar from `nav.json`, same topbar, but a **full-bleed canvas** instead of a prose column.

**D2 · Who builds it.** *Recommend:* a small generator in `skills/gabe-prism/generator/`, invoked by the same refresh chain the docs now use. Alternative — extend `build_docsite.py` — is rejected: it owns markdown→HTML, and a prism page's body is authored HTML, not markdown.

**D3 · The width contract.** *Recommend:* the canvas takes the full viewport minus the sidebar, with content free to exceed any measure; **prose inside it still caps at ~76ch** (the `.docbody` rule), because a full-width paragraph is unreadable at any resolution. Freedom applies to the diagram, not to the sentence.

**D4 · The embeddable component.** *Recommend:* a fragment directory + manifest, included by slug — the same seam pattern as `nav.json`. `skills/gabe-prism/…/fragments/<slug>.html` with scoped CSS (`.px-<slug>`) and a registry the center generator reads, so a feature page's Overview or a doc page can carry `{{PRISM:scan-to-cooked}}`. Rejected: iframes (break theme, nav and height), and web components (a build step and a runtime for something that is static HTML).

**D5 · Does gabe-artifact stay?** *Recommend:* yes, unchanged. Two targets, two owners — `gabe-artifact` owns the published-page house style, `gabe-prism` gains `--target disk|artifact` and defaults to **disk**. The artifact path stays for things that leave the repo.

**D6 · Where the pages live in the center.** *Recommend:* a `Explanations` nav group beside `Docs`, fed the same way (a config list → `nav_model()` → `nav.json`). Full pages get a nav entry; fragments never do — a fragment with its own nav item is a page.

---

## 3 · The examples to build — pick 3, triangulate

The point of three is to prove the pattern is a **skill and not a habit**. If it only works on our own pipelines, it is a habit.

### From this repo's own history (software-internal)

| Candidate | Actors / payload | Why it tests something |
|---|---|---|
| **The hook chain** | harness event → hook script → injected rule → the skill it names | 7 actors, real exit codes, a genuine fan-out; the payload is an *injected instruction*, which is hard to draw and worth proving |
| **C-id → ledger row** | a test's name → C-id token → corpus registry → ledger anchor → the chip that links it | the payload is an *identity*, not an object — the hardest R2 case |
| **The ANGLE pipeline** (built today) | repo state → signal → one line → satellite | small, honest, and self-referential in a useful way |
| The docsite→center merge | already drawn five times | **skip** — too familiar to test anything |

### From the applications (domain, not code)

| Candidate | Actors / payload |
|---|---|
| **gastify: scan → cooked** | receipt photo → scan → draft → transaction → pantry stock → recipe → cooking event → proficiency | the operator's own domain, a genuine production line with side inputs and a feedback loop — the strongest single test |
| gustify: allergen propagation | ingredient → recipe → member profile → warning surface |

### Non-software (the generality test)

**Catan — resource production.** dice roll → hex → resource card → trade → build cost → settlement → victory point. It is a *recipe tree* by construction, it has failure states (blocked by the robber = starved machine), and **nobody can claim the pattern works because the subject was already a pipeline in code.** If a prism explains Catan to someone who has not played it, the pattern generalises. If it does not, that is the honest finding.

**Recommended set:** the **hook chain** (software-internal, injected-instruction payload) · **gastify scan→cooked** (domain, real data, side inputs) · **Catan** (non-software, and the one that can disprove the whole thing).

---

## 4 · Resume prompt

```
Build the disk target for /gabe-prism.

READ FIRST:
  docs/handoff/2026-08-01-prism-to-disk.md          (this plan — D1–D6 need your rulings)
  skills/gabe-prism/SKILL.md                        (the contract that does NOT change)
  docs/center/shell/docpage.html                    (the shape to copy)
  skills/gabe-docsite/generator/_center_shell.py    (how a skeleton gets filled from nav.json)
  docs/center/generators/build_suite_center.py      (nav_model / render_nav / the nav.json emit)

THEN, in order:
1. Rule D1–D6 (recommendations are in the doc; overrule freely).
2. prismpage.html — full-bleed canvas station, sidebar from nav.json, prose capped at 76ch
   inside a canvas that is not.
3. The generator + the fragment manifest, wired into refresh_suite_center.sh AFTER the docs leg.
4. Build the three examples. Start with Catan — it is the one that can disprove the pattern,
   and finding that out on example 3 wastes two builds.
5. Gates: verify-prism.mjs on every page, check_suite_center.py for links, and the fit check
   at 1440/1280/1024 — a full-bleed canvas has more ways to spill than a 74rem column.

CARRY FORWARD: prose caps even when the canvas does not · a fragment never gets a nav item ·
numbers on a prism page come from the actor table or they do not appear.
```

---

## 5 · Open question worth deciding early

**Do fragments carry their own motion?** A full page can afford an animated belt; a component embedded three times on one center page cannot — three independent `setInterval` loops in one viewport is a distraction, and the pause contract has to reach all of them. *Leaning:* fragments render **static by default** with motion opt-in per embed, and the `data-fx` + `FXREPLAY` contract stays so the existing motion gate still verifies whatever does move. Worth a ruling before the first fragment ships, because retrofitting it later means touching every embed.
