# Section-template lab — 2026-07-20

The per-SECTION analogue of the 2026-07-14 layout lab. That lab ruled the page shell
(A3 · Tabbed, now binding via adopt-spec + `templates/center/shell/`); this one explores the
INTERNALS — one exploration per row of the connection map's left column ("THE CENTER · PAGES ·
SECTIONS"), 2–3 candidate layouts each, rendered over gastify example data on the a3 skin.

**Front door:** `index.html` — the registry mapping (map section ⟷ section id ⟷ home template +
slot ⟷ also-appears-on ⟷ machine sources) plus the identity scheme. Group pages (`now` · `board` ·
`entities` · `docs` · `testing` · `ledger` · `releases`) hold the direction renders; recommended
direction always listed first with a green pill.

## The identity scheme (the point of this lab)

A section is not a page — it is a unit of meaning that may render on several pages
(`testing.matrix` renders full on Tests and entity-scoped on every feature page;
`docs.feature-cards` is an index on Docs and a single card on a feature's Overview tab).
Therefore:

- each map section gets a stable id (`now.needs-you`, `board.rail`, `testing.matrix`, …);
- each becomes ONE fragment template — `templates/center/shell/sections/<id>.html` — with its own
  placeholder contract;
- every rendered instance carries `data-sec="<id>"` on its wrapper, so sections are identifiable
  wherever they appear;
- page skeletons keep their slots; slot comments name the fragment(s) that fill them; generators
  compose pages FROM fragments. A section rendered from scratch instead of its fragment is a
  defect (extends the adopt-spec page rule down one level).

`leaf.reports` is deliberately template-less: external tools' own HTML, linked, never re-skinned.
Auxiliary slots (`{{BUCKETS}}`, `{{GATES}}`, `{{VERIFICATION_CHANGELOG}}`, KPI strips) inherit
their parent section's direction — no separate exploration.

## Status

Directions rendered, awaiting operator picks (one per section). On picks: fragments land in
`templates/center/shell/sections/`, page skeletons gain `data-sec` markers + fragment pointers,
shell README's contract table grows a sections column, `./install.sh` + doctor. Nothing is
binding until picked — this dir is exploration, like the layout lab before its convergence.

Regenerator: session scratchpad `gen-section-lab.py` (illustrative fill; not promoted — the lab
is a decision record, not a build tool).
