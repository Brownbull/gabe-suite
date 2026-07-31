# Twin propagation — the docsite→center merge + gabe-prism

**Written:** 2026-07-31, suite repo, after the merge landed and went green.
**For:** a fresh session in `gustify` and one in `gastify`. Do them one at a time.
**Precondition:** the suite commit exists and is pushed. If `git -C ~/projects/gabe_lens log --oneline -1` does not show the merge, stop — the twins vendor from the suite, and vendoring an uncommitted tree is how the two fall out of step.

---

## 1 · What landed in the suite

| Piece | Path | Why the twins need it |
|---|---|---|
| Doc-page skeleton | `templates/center/shell/docpage.html` | the station that renders an authored doc inside the center |
| Prose layer | `templates/center/shell/assets/a3.css` (`.docbody`, +96 lines) | a3.css had **zero** rules for a paragraph; without this, doc pages render as unstyled text |
| Reference chips + backlink line | same file (`.refs`, `.refchip`, `.docref`) | the two link directions |
| Shell exemplar | `templates/center/shell/example/docpage-skill-map.html` | what a finished doc page looks like, rendering from the shipped `../assets/` |
| Center-shell adapter | `skills/gabe-docsite/generator/_center_shell.py` | fills the skeleton; replaces the standalone chrome |
| Reference extractor | `skills/gabe-docsite/generator/_references.py` | four token classes → both directions in one pass |
| Builder flags | `skills/gabe-docsite/generator/build_docsite.py` `--shell` / `--nav` | center mode, plus the probed diagram path |
| Staleness checker | `scripts/checkers/docsite-staleness.sh` + `tests/docsite-staleness/` | extracted from suite-doctor so it can be tested |
| New skill | `skills/gabe-prism/` (SKILL, spec, 5 patterns, verifier) + `tests/prism/` | the explanation pattern set |

All of it installs to `~/.claude/` via `./install.sh`, so **a twin does not copy the skills** — it copies the *vendored shell* and adopts the *build chain*.

---

## 2 · The shape of the twin change

A twin already has a center at `docs/site/center/` built by `scripts/refresh_center.sh`. The merge adds three things to it:

1. **The center emits `nav.json`** — its sidebar model, including a Docs group derived from the twin's own docsite config. In the suite this is `build_suite_center.py`; in a twin it is `build_center_a3.py`, which has a different sidebar function (`{{SIDEBAR_ENTITIES}}` etc.). **This is the one piece that is not a copy — it is a port**, and the twin's sidebar is entity-shaped where the suite's is lens-shaped.
2. **The docsite build runs with `--shell --nav`** and emits into `docs/site/center/`, with `hub.md → docs.html`.
3. **The refresh chain becomes four steps:** center → docs → center again → gates. The second center pass exists because the estate pages need `docs-backlinks.json`, which only exists after the docs are extracted.

In a twin, **two more token classes come alive** that are dormant in the suite: `entity` (from `adoption.json`) and `case id` (from the `test-matrix.html#C<n>` anchors). That is the half of the design the suite could not exercise — gustify has 7 entities and ~1,700 C-ids, gastify ~1,600. **Expect the first run to surface far more edges than the suite's 133, and expect some of them to be wrong.** Read a sample before trusting the count.

---

## 3 · Resume prompt — gustify

```
Propagate the docsite→center shell merge from the Gabe Suite into gustify.

READ FIRST, in this order:
  ~/projects/gabe_lens/docs/handoff/2026-07-31-twin-propagation.md   (this plan)
  ~/projects/gabe_lens/skills/gabe-docsite/SKILL.md                  (center mode, both seams)
  ~/projects/gabe_lens/docs/center/generators/build_suite_center.py  (nav_model / render_nav / nav.json — the port source)
  templates/center/shell/README.md                                   (the docpage.html row)

WHAT TO DO
1. Vendor the shell: copy templates/center/shell/docpage.html and the .docbody /
   .refs / .refchip / .docref blocks of templates/center/shell/assets/a3.css into
   gustify's vendored templates/center/shell/. Do NOT overwrite the whole a3.css —
   gustify's copy may carry local additions; append the blocks and diff the result.
2. PORT the nav model into build_center_a3.py: split its sidebar into
   nav_model() → render_nav(), add a Docs group read from gustify's docsite config,
   and write nav.json into the center dir at the END of the build. The suite's
   version is entity-free; gustify's must keep {{SIDEBAR_ENTITIES}} semantics —
   adopted entities link their feature pages, pending ones render muted with their
   tracker state. That rule is in the shell README and must survive the port.
3. Run the docsite with --shell/--nav; confirm it reports "mode: CENTER shell".
4. Wire refresh_center.sh: center → docs → center → check_center_links → diagram gate.
5. Move the doctor's staleness check to the merged path (or adopt
   scripts/checkers/docsite-staleness.sh wholesale) and bring tests/docsite-staleness/ with it.
6. Delete nothing until the link gate is green. The suite's map.html looked like an
   orphan and turned out to have two inbound links.

VERIFY BEFORE CALLING IT DONE
  bash scripts/refresh_center.sh regen        → link gate + diagram gate both green
  node scripts/verify_center_chrome.mjs docs/site/center
  the batteries that exist in this repo, all green
  open docs/site/center/docs.html and one doc page — prose styled, sidebar correct,
    reference chips resolving to real feature pages

WATCH FOR (the suite hit all four)
  · entity + case-id classes go LIVE here — sample the chips before trusting them;
    a slug like `card` matching inside `card-alias` is the failure mode the
    word-boundary rule exists for
  · the doctor's staleness check silently comparing against the pre-merge tree —
    that reports CLEAN forever, which is the exact false-green
  · the diagram gate double-counting (figure + inner pre) — the suite's fix is in
    diagram-compliance.mjs; carry it
  · a renderer that is present but broken: probe it, do not trust its existence

Do not propagate to gastify in this session.
```

---

## 4 · Resume prompt — gastify

```
Propagate the docsite→center shell merge from the Gabe Suite into gastify.

Same plan as gustify (read
~/projects/gabe_lens/docs/handoff/2026-07-31-twin-propagation.md), with three
differences:

1. gastify's corpus is larger and its C-ids run to ~C1601. The case-id registry is
   built by scanning test-matrix.html for id="C<n>" anchors — confirm that page
   exists and carries them BEFORE wiring the extractor, or the class will silently
   resolve nothing and look like "no citations in the docs".
2. gastify still has the pre-rename skill names in its vendored docs and PLANs
   (gabe-feature / gabe-adopt / gabe-entity / gabe-walk). Sweep those in the SAME
   session — a doc citing /gabe-feature will extract a token that resolves to
   nothing, and the reader cannot tell a renamed skill from a deleted one.
3. If gastify ships a working _render_mermaid.mjs, the diagram path will differ
   from gustify's. That is fine and expected — the gate PRINTS the path per page
   (pre-rendered | runtime | mixed). Record which one this repo took in the commit
   message so the two twins stay comparable.

VERIFY: same list as gustify.
```

---

## 5 · The owed sweep, independent of the merge

Both twins still name `gabe-feature`, `gabe-adopt`, `gabe-entity`, `gabe-walk` in vendored docs and PLAN files. The renames landed in the suite at `5608b2a` (2026-07-30). This is separate work from the merge, but the merge makes it **visible**: a doc citing a retired skill name now produces a token that resolves to nothing.

Fold it into the same session as the merge in each twin, or do it first — but do not leave it for a third pass, because the extractor will keep reporting the same unresolved names and the noise will train you to ignore the report.

---

## 6 · What is deliberately NOT propagated

- **`gabe-prism`** — it installs from the suite to `~/.claude/` like every other skill. A twin needs nothing.
- **The suite's own docs** (`docs/src/*.md`) — those describe the suite. Each twin publishes its own.
- **`_shell.py` / `site.css`** — the standalone Cifra chrome survives in the suite for projects with no center. A twin has a center and never takes the standalone path.
