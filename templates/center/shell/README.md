# Center shell templates — A3 · Tabbed (the ruled layout)

The command-center SHELL every `/gabe-adopt init` bootstraps from — the layout-lab convergence
(2026-07-14; decision record: `docs/investigations/2026-07-14-center-layout-lab/README.md`,
archetypes on the claude.ai/design project "Gabe Center — Layout Directions").

**The shape, in one line:** a persistent left sidebar of section/entity nouns (`aside.side`)
picks a SUBJECT; every subject — the hub included — renders as the same self-similar page with
a four-tab bar (`nav.tabbar`: Overview · Tests · Evidence · Risk). Tabs re-lens one subject;
the sidebar changes subjects. The hub gets its own shell (`index.html`), features get
`feature.html`.

## Files

- `a3.css` — the shell's skin + layout, verbatim from the lab's converged direction. Projects
  copy it to `docs/site/center/assets/a3.css`. Do not fork it per-project; layout evolution
  happens HERE (suite repo) and re-installs.
- `index.html` — hub skeleton. `feature.html` — subject skeleton.

## Placeholder contract (what a generator must fill)

`{{PROJECT_NAME}}` `{{LANG}}` · `{{SIDEBAR_NAV}}` (navlabel groups + navitem links + optional
navsub/count — nouns come from the APPROVED adopt baseline, never an archived nav) ·
`{{REGEN_STAMP}}` `{{HEAD_SHA}}` `{{GENERATOR_NAME}}` (the foot is machine truth) ·
`{{STATUS_PILLS}}` `{{SYNC_AGE}}` · `{{HUB_TITLE}}` `{{HUB_LEDE}}` `{{HUB_HEADLINE_STATS}}` /
`{{SUBJECT_TITLE}}` `{{SUBJECT_LEDE}}` `{{SUBJECT_HEADLINE_STATS}}` `{{SIDEBAR}}` ·
`{{TAB_OVERVIEW}}` `{{TAB_TESTS}}` `{{TAB_EVIDENCE}}` `{{TAB_RISK}}` · `{{TAB_SCRIPT}}` (the
tab-switching script the generator emits — no external JS).

## Rules

- **The archived project's legacy shell/css is never a source of chrome** (adopt-spec shell
  contract) — the archive is testimony to re-verify, not styling to restore.
- The four-tab set is invariant across subjects — self-similarity IS the navigation model.
- Content in every tab is generated from machine sources (junit, git, walks.jsonl, digests);
  authored prose only translates (anti-curation).
- Generators consume these skeletons by slot substitution; a project's generator may add
  slots but must fill every listed one or render an honest gap.
