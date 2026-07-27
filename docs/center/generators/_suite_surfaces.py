"""Agents · functions · structures — the three remaining spike-2 lenses.

All three are DERIVED on every build. Nothing here is authored: if a fact cannot
be read out of the repo it is reported absent rather than filled in.
"""
from __future__ import annotations

import ast
import json
import re
from pathlib import Path

# --------------------------------------------------------------- agents


def agent_surface(skills: list[dict], repo: Path) -> dict:
    """What runs as a separate context, and what the harness offers.

    Two populations that are easy to conflate: the suite's own FORK skills
    (a satellite analysis that runs in its own context and returns findings)
    and the harness's subagent registry (`~/.claude/agents/`), which the suite
    neither ships nor depends on.
    """
    forks = [s for s in skills if s["fork"]]
    explore = [s for s in skills if s["explore"]]
    human = [s for s in skills if s["human_only"]]
    background = [s for s in skills if s["background"]]

    registry: list[dict] = []
    agents_dir = Path.home() / ".claude" / "agents"
    if agents_dir.is_dir():
        for p in sorted(agents_dir.glob("*.md")):
            head = p.read_text(errors="replace")[:1200]
            m = re.search(r"^description:\s*(.+)$", head, re.M)
            registry.append({
                "name": p.stem,
                "description": (m.group(1).strip().strip('"') if m else ""),
                "shipped_by_suite": False,
            })

    return {
        "forks": forks,
        "explore": explore,
        "human_only": human,
        "background": background,
        "registry": registry,
        "registry_path": str(agents_dir),
    }


# --------------------------------------------------------------- functions

_SH_FN = re.compile(r"^\s*(?:function\s+)?([a-zA-Z_][\w-]*)\s*\(\s*\)\s*\{")
_JS_FN = re.compile(r"^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)"
                    r"|^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*"
                    r"(?:async\s*)?\(")

CODE_ROOTS = (
    ("scripts", "scripts"),
    ("skills", "skills"),
    ("schemas", "schemas"),
    ("suite-center", "docs/center/generators"),
    ("templates", "templates/center/generators"),
)

# docs/center/generators/ is a VENDORED FORK of templates/center/generators/.
# Counting both would double every function in the standard center and make the
# fork look like new suite surface. templates/ is the canonical copy, so the
# vendored files are skipped and only the suite center's own modules are counted.
VENDORED = {
    "_a3_board.py", "_a3_code.py", "_a3_evidence.py", "_a3_feature.py",
    "_a3_guard.py", "_a3_ledger.py", "_a3_render.py", "_a3_tests.py",
    "_center_data.py", "_center_mermaid.py", "_render_mermaid.mjs",
    "_results_ingest.py", "build_center_a3.py", "check_center_links.py",
    "curate_proof.py", "next_feature.py", "refresh_center.sh",
    "verify_center_chrome.mjs",
}


def _py_functions(path: Path, rel: str, area: str) -> list[dict]:
    try:
        tree = ast.parse(path.read_text(errors="replace"))
    except (SyntaxError, ValueError):
        return []
    out = []
    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        doc = ast.get_docstring(node) or ""
        out.append({
            "name": node.name,
            "file": rel,
            "line": node.lineno,
            "lang": "python",
            "area": area,
            "lines": (getattr(node, "end_lineno", node.lineno) or node.lineno)
                     - node.lineno + 1,
            "private": node.name.startswith("_"),
            "doc": doc.strip().splitlines()[0] if doc else "",
            "args": len(node.args.args),
        })
    return out


def _line_functions(path: Path, rel: str, area: str, lang: str,
                    rx: re.Pattern) -> list[dict]:
    out = []
    lines = path.read_text(errors="replace").splitlines()
    for n, line in enumerate(lines, 1):
        m = rx.match(line)
        if not m:
            continue
        name = next((g for g in m.groups() if g), None)
        if not name:
            continue
        out.append({
            "name": name, "file": rel, "line": n, "lang": lang, "area": area,
            "lines": 0, "private": name.startswith("_"), "doc": "", "args": 0,
        })
    return out


def functions(repo: Path) -> list[dict]:
    out: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for area, sub in CODE_ROOTS:
        root = repo / sub
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*")):
            if not path.is_file() or "_archive" in path.parts:
                continue
            if area == "suite-center" and path.name in VENDORED:
                continue
            rel = str(path.relative_to(repo))
            if (rel, path.suffix) in seen:
                continue
            seen.add((rel, path.suffix))
            if path.suffix == ".py":
                out += _py_functions(path, rel, area)
            elif path.suffix == ".sh":
                out += _line_functions(path, rel, area, "shell", _SH_FN)
            elif path.suffix in (".mjs", ".js"):
                out += _line_functions(path, rel, area, "js", _JS_FN)
    return out


# --------------------------------------------------------------- structures


def _referenced_by(repo: Path, schema_rel: str) -> str:
    """Which executable files NAME this schema.

    Deliberately called `referenced_by`, not `validated_by`: a filename in a
    docstring is not proof that anything loads it. `schemas/validate.py` builds
    its path dynamically (`f"scope-{name}.schema.json"`) and only matches here
    because its module docstring happens to spell both names out. The page says
    "referenced by" for that reason — the strong claim would be unearned.
    """
    stem = Path(schema_rel).name
    hits = []
    for pattern in ("**/*.py", "**/*.mjs", "**/*.js", "**/*.sh"):
        for p in repo.glob(pattern):
            if ".git" in p.parts or "_archive" in p.parts:
                continue
            try:
                if stem in p.read_text(errors="replace"):
                    hits.append(str(p.relative_to(repo)))
            except OSError:
                continue
    return ", ".join(sorted(hits)[:3])


def structures(repo: Path, rules: list[dict]) -> list[dict]:
    """Every artifact shape the lifecycle reads or writes, joined to whether a
    validator stands behind it and whether the ledger already has a rule on it.
    """
    out: list[dict] = []

    for sp in sorted(repo.rglob("*.schema.json")):
        if ".git" in sp.parts:
            continue
        rel = str(sp.relative_to(repo))
        try:
            body = json.loads(sp.read_text())
        except json.JSONDecodeError:
            body = {}
        refs = _referenced_by(repo, rel)
        out.append({
            "name": sp.name,
            "kind": "JSON Schema",
            "where": rel,
            "shape": (f"{len(body.get('properties', {}))} root properties · "
                      f"required: {len(body.get('required', []))} · "
                      f"additionalProperties: {body.get('additionalProperties', 'unset')}"),
            "referenced_by": refs or "",
            "referenced": bool(refs),
        })

    # The .kdbp artifact surface, from the shipped templates.
    tpl = repo / "templates"
    if tpl.is_dir():
        for p in sorted(tpl.glob("*.md")):
            if p.name in ("CLAUDE.md", "DOCS.md", "STRUCTURE.md"):
                pass
            text = p.read_text(errors="replace")
            table = re.search(r"^\|(.+)\|\s*$", text, re.M)
            cols = ([c.strip() for c in table.group(1).split("|")]
                    if table else [])
            out.append({
                "name": p.name,
                "kind": "markdown artifact",
                "where": str(p.relative_to(repo)),
                "shape": (f"{len(cols)}-column table: "
                          + " · ".join(cols[:6]) if cols
                          else "prose / section-structured — no table schema"),
                "referenced_by": "",
                "referenced": False,
            })

    # Join the ledger: which structures already carry a catalogued rule.
    for s in out:
        base = Path(s["where"]).name
        s["rules"] = sum(1 for r in rules
                         if base in (r.get("where", "") + r.get("statement", "")
                                     + r.get("mechanism", "")))
    return out
