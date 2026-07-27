"""Format-method lens — the suite's literal output-string contracts, and where
they have drifted.

`docs/src/mechanisms.md` declares eight strings that must stay **byte-identical**
across the skills that produce and consume them, and argues that byte-identity
exists precisely so "a plain-text diff can verify" the agreement. No such diff
ships. This module is that diff.

For each contract it greps a distinctive signature across the shipped surfaces,
normalises each hit (markdown emphasis, table pipes, list bullets and
surrounding prose are noise; the FORMAT is the signal), and groups the results.
More than one surviving variant means the contract is falsified by its own
carriers.

The probe is deliberately conservative: it reports what it found and where, and
never rewrites anything. A contract whose probe finds nothing is reported as
UNPROBED rather than as clean — a detector that cannot find the string it is
looking for has proven nothing about drift.
"""
from __future__ import annotations

import re
from pathlib import Path

# Contracts whose trailing `(...)` is a PLACEHOLDER the carrier fills in, so two
# different parentheticals are instantiations rather than drift. For the skip
# code the parenthetical is the opposite — it IS the contract (a closed enum),
# so a differing member list is exactly the drift worth catching.
ARG_IS_PLACEHOLDER = {"glyphs"}

# Contracts this probe cannot honestly compare. A REUSE LEDGER is a multi-line
# BLOCK, not a one-line format; a line regex would report its every mention as a
# variant. Saying so is better than manufacturing a drift count — the whole
# point of this lens is that an unverifiable claim gets labelled, not scored.
UNPROBEABLE = {
    "reuse-ledger": "a multi-line block, not a single-line format — a line probe "
                    "cannot compare it without reporting every mention as a variant",
}

# (key, label, CAPTURE regex, the carriers the table names)
#
# The regex captures the FORMAT ITSELF, not the line that mentions it. A first
# pass matched whole lines and reported all eight contracts as drifted, because
# prose describing a format ("the summary header MUST print: raw N → …") is not
# a divergent rendering of it. Capturing the token sequence and comparing
# skeletons separates a genuine wording split from an instantiation.
CONTRACTS: list[tuple[str, str, str, str]] = [
    ("proof-line", "PROOF line — `PROOF: <cmd> → <runtime> → <artifact>`",
     r"PROOF:\s*[^\n|]*?→[^\n|]*?→[^\n|`]*",
     "gabe-execute (produces) → gabe-review (consumes)"),
    ("evidence-row", "Evidence row — `<check>: <cmd> → exit <code>, \"<count>\"`",
     r"[\w<>]+:\s*[^\n|]*?→\s*exit\s*<code>[^\n|`]*", "gabe-execute ≡ gabe-commit"),
    ("verify-header", "Verify-pass header — `raw N → killed X → downgraded Y → survived Z`",
     r"raw\s*\{?\w+\}?\s*→\s*killed\s*\{?\w+\}?\s*→\s*downgraded\s*\{?\w+\}?\s*→\s*survived\s*\{?\w+\}?",
     "gabe-review ≡ gabe-myopic ≡ gabe-roast"),
    ("skip-code", "Skip code — `ℹ PLAN: <col> tick skipped (<enum>)`",
     r"ℹ\s*PLAN:[^\n|]*?tick skipped\s*\([^)]*\)", "gabe-plan ≡ gabe-commit ≡ gabe-execute"),
    ("prior-phase", "Prior-phase warning — `⚠ INCOMPLETE PRIOR PHASES: [...]`",
     r"⚠\s*INCOMPLETE PRIOR PHASES:\s*\[[^\]]*\]", "gabe-plan ≡ gabe-next"),
    ("glyphs", "3-state glyphs — `✅ / ❌ / ⤫ skipped(<reason>)`",
     r"⤫\s*skipped\s*\([^)]*\)", "gabe-commit ≡ gabe-execute ≡ the E2 preamble"),
    ("pending-schema", "Canonical PENDING schema — the 10-column header row",
     r"\|\s*#\s*\|\s*Date\s*\|\s*Source\s*\|[^\n]*",
     "gabe-review ≡ gabe-commit ≡ gabe-align ≡ gabe-push"),
    ("reuse-ledger", "REUSE LEDGER block",
     r"REUSE LEDGER[^\n|.]*", "gabe-execute ≡ gabe-mockup ≡ the E4 preamble"),
]

# Placeholder conventions differ legitimately between a spec and an example, so
# the SKELETON blanks them: <cmd>, {N}, [P26], and bare single-token stand-ins
# all collapse to *. What survives is the literal scaffolding — the words and
# arrows the contract is actually made of.
_PLACEHOLDER = re.compile(r"<[^>]*>|\{[^}]*\}|\[[^\]]*\]")
_LEADING_LABEL = re.compile(r"^[\w<>]+:")


def skeleton(fragment: str, blank_args: bool = False) -> str:
    s = _PLACEHOLDER.sub("*", fragment)
    s = _LEADING_LABEL.sub("*:", s)          # `lint:` / `types:` / `<check>:`
    s = re.sub(r"\b[A-Z]\b", "*", s)         # raw N → killed X → …
    if blank_args:
        s = re.sub(r"\([^)]*\)", "(*)", s)   # `skipped(no reporter)` == `skipped(*)`
    s = re.sub(r"\s+", " ", s).strip(" .,;`")
    return s

SEARCH_GLOBS = ("skills/gabe-*/SKILL.md", "skills/gabe-*/references/*.md",
                "templates/*.md", "templates/tier-sections/*.md", "docs/src/*.md")

# Leading markdown scaffolding that is not part of the format itself.
_LEAD = re.compile(r"^[\s>*\-•|]+")
_TRAIL = re.compile(r"[\s|]+$")


def _normalise(line: str) -> str:
    """Strip the carrier's markup so two renderings of the SAME format compare
    equal, while a genuine wording difference still differs. Backticks and bold
    markers are carrier decoration; the token sequence is the contract."""
    s = line.strip()
    s = _LEAD.sub("", s)
    s = _TRAIL.sub("", s)
    s = re.sub(r"\\(.)", r"\1", s)      # markdown escapes: \` and \| are carrier syntax
    s = s.replace("**", "").replace("`", "")
    s = re.sub(r"\s+", " ", s)
    return s


def probe(repo: Path) -> list[dict]:
    out: list[dict] = []
    for key, label, sig, carriers in CONTRACTS:
        rx = re.compile(sig)
        hits: list[tuple[str, int, str]] = []
        for pattern in SEARCH_GLOBS:
            for path in sorted(repo.glob(pattern)):
                try:
                    text = path.read_text(errors="replace")
                except OSError:
                    continue
                for n, line in enumerate(text.splitlines(), 1):
                    for m in rx.finditer(line):
                        hits.append((str(path.relative_to(repo)), n,
                                     _normalise(m.group(0))))

        # Group twice: by exact captured text (an instantiation differs here),
        # and by skeleton (only a real wording split differs here).
        blank = key in ARG_IS_PLACEHOLDER
        exact: dict[str, list[str]] = {}
        skel: dict[str, list[str]] = {}
        for rel, n, frag in hits:
            exact.setdefault(frag, []).append(f"{rel}:{n}")
            skel.setdefault(skeleton(frag, blank), []).append(f"{rel}:{n}")

        out.append({
            "key": key,
            "label": label,
            "carriers": carriers,
            "signature": sig,
            "hits": len(hits),
            "files": len({h[0] for h in hits}),
            "renderings": len(exact),
            "skeletons": len(skel),
            "variants": [{"text": t, "where": w} for t, w in
                         sorted(exact.items(), key=lambda kv: -len(kv[1]))],
            "skeleton_variants": [{"text": t, "where": w} for t, w in
                                  sorted(skel.items(), key=lambda kv: -len(kv[1]))],
            # UNPROBED is not CLEAN: a detector that never found the string it
            # was looking for has proven nothing about that contract.
            "unprobeable": UNPROBEABLE.get(key, ""),
            "status": ("UNPROBEABLE" if key in UNPROBEABLE
                       else "UNPROBED" if not hits
                       else "DRIFTED" if len(skel) > 1
                       else "CLEAN"),
        })
    return out


# --------------------------------------------------------------- enum drift

_ENUM_RX = re.compile(r"\(\s*(no-plan[^)]*)\)")


def enum_variants(repo: Path) -> list[dict]:
    """The skip-code enum specifically — the one contract whose *member list*
    can be compared as a set rather than as a string, which makes the drift
    precisely quantifiable instead of merely visible."""
    found: list[dict] = []
    for pattern in SEARCH_GLOBS:
        for path in sorted(repo.glob(pattern)):
            try:
                text = path.read_text(errors="replace")
            except OSError:
                continue
            for n, line in enumerate(text.splitlines(), 1):
                m = _ENUM_RX.search(line)
                if not m:
                    continue
                members = [x.strip().strip("`") for x in m.group(1).split("|")]
                found.append({
                    "where": f"{path.relative_to(repo)}:{n}",
                    "members": members,
                    "count": len(members),
                })
    if not found:
        return found
    union: set[str] = set()
    for f in found:
        union |= set(f["members"])
    for f in found:
        f["missing"] = sorted(union - set(f["members"]))
    return found
