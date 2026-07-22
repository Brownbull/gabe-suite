"""gabe-docsite config for the Gabe Suite's own documentation site.

Paths are relative to THIS file's directory (docs/). Regenerate with:

    python3 ../skills/gabe-docsite/generator/build_docsite.py --config docsite.config.py
    node    ../skills/gabe-docsite/tools/diagram-compliance.mjs site
"""

SITE = {
    "title": "The Gabe suite",
    "kicker": "The KDBP Development Suite · Khujta AI",
    "brand": "🔧 GABE",
    "brand_sub": "the KDBP development suite",
    "lang": "en",
    "footer": [
        "<b>GABE</b> · the KDBP development suite · documentation",
        "Source of truth: <b>docs/src/*.md</b> + <b>docs/docsite.config.py</b> · generated — do not edit the HTML by hand",
        "Visual system: Cifra · Chile editorial palette",
    ],
    "src_dir": "src",
    "out_dir": "site",
    "hub_intro_md": "src/hub.md",
}

SECTIONS = [
    {
        "key": "foundations",
        "label": "Tier 1 · Foundations",
        "difficulty": "basic",
        "docs": [
            {"slug": "kdbp", "source_md": "kdbp.md", "title": "What KDBP is",
             "nav_label": "What KDBP is", "kicker": "Tier 1 · Concept",
             "summary": "The core idea: a project's memory lives in .kdbp/ files that every session reads — and what each file is for.",
             "swatch": "#3a6b3a"},
            {"slug": "the-loop", "source_md": "the-loop.md", "title": "The development loop",
             "nav_label": "The development loop", "kicker": "Tier 1 · Workflow",
             "summary": "The shape of the cycle from idea to shipped commit: scope → plan → red → execute → review → commit → push, plus where walking and the advisors sit.",
             "swatch": "#3a6b7a"},
        ],
    },
    {
        "key": "contract-beats",
        "label": "Tier 2 · The contract & the beats",
        "difficulty": "core",
        "docs": [
            {"slug": "contract", "source_md": "contract.md", "title": "The E1–E7 execution contract",
             "nav_label": "The E1–E7 contract", "kicker": "Tier 2 · The contract",
             "summary": "Seven floors under every command — each with the exact failure it prevents. The single home of the E1–E7 rule text.",
             "swatch": "#b65a2b"},
            {"slug": "commands", "source_md": "commands.md", "title": "Lifecycle beats & command reference",
             "nav_label": "Beats & commands", "kicker": "Tier 2 · Reference",
             "summary": "The mutated lifecycle beat by beat — what each command does, the gate it enforces, and where its state lands — plus the zero-logic router and the grouped skill roster.",
             "swatch": "#1f3a6b"},
            {"slug": "satellites", "source_md": "satellites.md", "title": "Analysis satellites",
             "nav_label": "Analysis satellites", "kicker": "Tier 2 · Analysis",
             "summary": "The on-demand adversarial advisors — myopic, roast, health, debt, assess, align — that run outside the loop and feed findings back into the plan.",
             "swatch": "#7a5a8a"},
        ],
    },
    {
        "key": "verification-first",
        "label": "Tier 3 · Verification-first",
        "difficulty": "advanced",
        "docs": [
            {"slug": "verification-first", "source_md": "verification-first.md", "title": "The one picture & the four laws",
             "nav_label": "The one picture", "kicker": "Tier 3 · The model",
             "summary": "The organizing idea: the command center is a derived view of the software lifecycle, read along three cuts — lifecycle produces, structure shapes, growth accrues — held together by four laws.",
             "swatch": "#1f7a5a"},
            {"slug": "gabe-red", "source_md": "gabe-red.md", "title": "/gabe-red — the RED-commit beat",
             "nav_label": "/gabe-red", "kicker": "Tier 3 · The beat",
             "summary": "Why test-first never landed before, and the dedicated beat that lands it: a commit whose declared cases fail by assertion, born before any source is written.",
             "swatch": "#b63a3a"},
            {"slug": "c-id", "source_md": "c-id.md", "title": "The C-id test-identity scheme",
             "nav_label": "The C-id scheme", "kicker": "Tier 3 · Identity",
             "summary": "How a test earns a durable name: a C-id token inside the test's own text, project-global and monotonic, where the corpus itself is the registry.",
             "swatch": "#7a6a2b"},
            {"slug": "command-center", "source_md": "command-center.md", "title": "The Testing Command Center",
             "nav_label": "The command center", "kicker": "Tier 3 · The derived view",
             "summary": "The subject spine read along entity × altitude — now, board, entities, docs, testing, ledger, releases — built separately from machine sources, never hand-kept.",
             "swatch": "#2b5a8a"},
        ],
    },
    {
        "key": "mechanism-corpus",
        "label": "Tier 4 · The mechanism corpus",
        "difficulty": "advanced",
        "docs": [
            {"slug": "mechanisms", "source_md": "mechanisms.md", "title": "The mechanism catalog",
             "nav_label": "The mechanism catalog", "kicker": "Tier 4 · Catalog",
             "summary": "The generic mechanisms that encode strong-model judgment as literal rules — five families, the byte-identical shared strings that keep beats in sync, and the budget that funds them all.",
             "swatch": "#a04030"},
            {"slug": "drift", "source_md": "drift.md", "title": "Why weak models drift",
             "nav_label": "Why weak models drift", "kicker": "Tier 4 · Rationale",
             "summary": "The five failure families the mechanisms target, grounded in real session incidents — and why any executor, strong or weak, drifts toward the cheap reading unless a check pulls the cost into view.",
             "swatch": "#d97a3d"},
            {"slug": "decisions", "source_md": "decisions.md", "title": "Design decisions & standing red flags",
             "nav_label": "Design decisions", "kicker": "Tier 4 · Rulings",
             "summary": "The seven decisions that fixed the verification-first architecture — report-never-gate, the walk witness, block-lies-warn-debts — and the gaps left deliberately open.",
             "swatch": "#6e6757"},
        ],
    },
]
