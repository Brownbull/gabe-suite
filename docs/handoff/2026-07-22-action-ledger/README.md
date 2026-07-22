# Action Ledger — feature-page IA redesign (operator-approved 2026-07-22)

A design track that reshapes the A3 command-center **feature page** around a single
principle the operator kept returning to: **action items lead every section, and
record content follows.** Approved after an interactive walk over two live examples;
**roast pending, then retrofit.**

## The two approved examples (the review surface)

- [`../../../templates/center/shell/example/feature-allergen-action-ledger.html`](../../templates/center/shell/example/feature-allergen-action-ledger.html)
  — gustify `allergen` (its card has no `# CLAIMS`, so Claimed coverage shows its
  honest "no claims yet" placeholder).
- [`../../../templates/center/shell/example/feature-transaction-action-ledger.html`](../../templates/center/shell/example/feature-transaction-action-ledger.html)
  — gastify `transaction` (21 real claims, populated), the fuller demo.

Both are self-contained (the proposed CSS/JS are inlined and clearly commented as
proposed shell additions). Open them directly in a browser.

## What the design does

1. **Action Ledger leads Overview** — a dashboard: a compact stat strip + a
   per-area summary (Code · Tests · Evidence · Risk · Other, each with counts +
   a jump link) + an **Other** table (moves with no section home: manual walk,
   deployed probes). No cloned tables — the summary jumps to each section.
2. **Every record section fronts its own "Pending" action table** (Code · Tests ·
   Evidence · Risk). Each open move lives in **exactly one** section — the old
   three-places scatter (Kinds/Growth/Risk all restating the same angle) is gone.
3. **One reusable `xtable()` component** — expandable-row tables where **clicking
   the row** opens its detail in place (no second "Columns of X / Open N" button).
   Used by the **data model** (grouped models/schemas), the **test matrix**
   (grouped by corpus), and the **proof shelf**.
4. **Claimed coverage** (absorbed from gastify's live generator, which had grown
   past our promotion) — the card's `# CLAIMS` joined to junit by C-id; a claimed
   class no longer running renders **DRIFT**. Leads with a colour-coded **Kind**
   column; the old `+N` C-id overflow is replaced by row-click-to-expand.
   Tests-tab order: **Pending → Kinds & coverage → Claims → Matrix**.
5. **Risk consolidated** to one table in the ledger columns (Severity · exposure ·
   move · ripe · if-we-do · stake); Effort/Cost dropped (a risk isn't machine-priced).
6. **Unified expand interaction** — clicking a ⊕ cell behaves exactly like clicking
   its row: open/close everything in the row together (text expanders included).
7. **Action-table readability** — fixed column widths (text columns get room, tag
   columns stay tight); `structure` line counts are **red-graded** like the code
   map's Lines column (green ≤800, deepening red toward 2,000).
8. **Layout** — the top bar aligns to the centered content box; a minimized (rail)
   nav hands the reclaimed width to the content, panes and their tables; the tab
   bar (status pills) shares the content width instead of overflowing it.

## Retrofit steps (after the roast)

**A · Generators (this suite's lane — `templates/center/generators/`)**
Copy `generators/*.py` over `templates/center/generators/`. Six files changed
(~889 lines): `_a3_feature.py` (Action Ledger, per-section action tables,
`angle_rows` single derivation, `claim_verdicts`, risk consolidation, xtable
wiring, widths, line-grade), `_a3_code.py` (data-model → xtable), `_a3_render.py`
(`xtable()` + `table(widths=…)`), `_a3_evidence.py` (proof shelf → xtable),
`_center_data.py` + `build_center_a3.py` (env overrides — see note).

**B · Shell (Session A's lane — coordinate)** — `shell-assets/`:
- `proposed-a3css-additions.css` → fold into `assets/a3.css`: `.xtbl`/`.xrow`
  (expandable rows), `.tbl.wcol` (fixed-width tables), the row-open highlight,
  the compact stat strip is inline (no CSS), and the **layout** block
  (`--content-max`, `.subject`/`.subjecthead`/`.tabbody`/`.tabbar`, `.topbar`
  alignment, rail widening). The layout rules must load AFTER the base rules.
- `rowclick.js` → new shell asset; wire a `<script>` into the station skeletons.
- `a3-lightbox.js` → **replaces** the shell's copy — it is `.xrow`-aware AND keeps
  the legacy `tr.exp` path, and implements **minimize-on-leave** (↑/↓ folds the set
  you leave, opens the one you enter, so Esc leaves the last-viewed set open).

**C · Spec + card format** — document the card `# CLAIMS` section (class — intent
per line) in the adopt/feature specs so `/gabe-adopt` authors it.

**D · Regenerate** the twins (gastify + gustify) once A+B land, and refresh the
exemplar if the operator promotes this over `feature-transaction.html`.

## Note on the env overrides in the generators

`_center_data.py`/`build_center_a3.py` gained `GABE_REPO_ROOT` / `GABE_CENTER_OUT`
/ `GABE_CONFIG` / `GABE_SHELL_SRC` env overrides — lab scaffolding that let a driver
read one project's data and write to a scratch dir (how these examples were
generated read-only against gustify/gastify). They default to normal behavior when
unset, so they are harmless to ship; keep or strip at retrofit.

## Dry-run (the discipline)

Generated read-only against the live twins, writing to scratch — **both twins'
`docs/site/center/` verified untouched** each run. allergen (gustify) and
transaction (gastify, via our config over gastify's data) both build clean with
**0 dead internal links**. The transaction example resolves 21 claims (11
integration + 10 unit), 14 endpoints, and the endpoint→data-model cross-links all
land on their (now-`.xrow`) class rows.
