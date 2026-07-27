"""Data layer for the Gabe Suite's OWN command center.

The standard center parses an application — FastAPI endpoints, SQLAlchemy
models, pytest corpora. The suite is not an application: its "code" is 29
markdown skills plus ~30 scripts, its "runtime" is a model reading prompts, and
per ruling R8 it carries no `.kdbp/`. So this module parses the suite itself.

Two classes of input, kept strictly apart:

  MACHINE FACTS  — derived live from the repo on every build (skills, hooks,
                   batteries, scripts). Never hand-kept. If a source is absent
                   the caller renders a NAMED GAP, never a zero.

  JUDGMENT       — `data/enforcement.json`, the rule registry. Whether a rule is
                   hardenable or inherently prompt-only is a call a parser
                   cannot make, so it is authored, committed, and reviewable —
                   the same honest split the standard center draws between
                   archmap.json (derived) and adoption.json (declared).

Recorded runs (`data/facts.json`) carry their own stamp so a stale battery
count reports its age instead of passing as current.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

GEN_DIR = Path(__file__).resolve().parent
CENTER_DIR = GEN_DIR.parent
REPO_ROOT = CENTER_DIR.parent.parent
CONFIG_PATH = CENTER_DIR / "suite-center.config.json"


# ---------------------------------------------------------------- config


def load_config() -> dict:
    if not CONFIG_PATH.is_file():
        raise SystemExit(
            f"BREAK: {CONFIG_PATH.relative_to(REPO_ROOT)} is missing — the suite "
            f"center cannot resolve its bindings. Nothing was written."
        )
    return json.loads(CONFIG_PATH.read_text())


def rel(cfg: dict, key: str) -> Path:
    """A configured path, resolved against the repo root."""
    return REPO_ROOT / cfg["paths"][key]


def beat_of_skill(cfg: dict) -> dict[str, str]:
    """skill-name -> beat slug, from the config's declared membership."""
    out: dict[str, str] = {}
    for b in cfg["beats"]:
        for s in b.get("skills", []):
            out[s] = b["slug"]
    return out


# ---------------------------------------------------------------- git / stamps


def _git(*args: str) -> str:
    try:
        return subprocess.run(["git", "-C", str(REPO_ROOT), *args],
                              capture_output=True, text=True, timeout=15
                              ).stdout.strip()
    except Exception:
        return ""


def head_sha() -> str:
    return _git("rev-parse", "--short", "HEAD") or "?"


def head_subject() -> str:
    return _git("log", "-1", "--format=%s") or ""


def working_tree_dirty() -> list[str]:
    """Files modified but uncommitted. Surfaced, never hidden: a center built
    over a dirty tree is reporting on something that is not in git yet.

    Parsed on whitespace rather than a fixed offset — `_git` strips the output,
    which eats the leading space of a ` M path` status line and would silently
    shave the first character off the first filename.
    """
    out = _git("status", "--porcelain")
    return [ln.strip().split(None, 1)[-1]
            for ln in out.splitlines() if ln.strip()]


def regen_stamp() -> str:
    """UTC build stamp. Sourced from git so the build stays reproducible."""
    return _git("log", "-1", "--format=%cd", "--date=format:%Y-%m-%d %H:%M") or "unknown"


# ---------------------------------------------------------------- skills


_FM_KEYS = ("name", "description", "when_to_use", "context", "agent",
            "disable-model-invocation", "user-invocable")


def _frontmatter(text: str) -> dict:
    """Minimal flat-scalar frontmatter reader plus `metadata.version`.

    Deliberately not pyyaml: this runs on every build and a third-party import
    would make the center refuse to build on a machine that can still run the
    suite. The shape it reads is the shape suite-doctor.sh already pins.
    """
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    block = text[3:end]
    out: dict = {}
    for key in _FM_KEYS:
        m = re.search(rf"^{re.escape(key)}:\s*(.+?)\s*$", block, re.M)
        if m:
            out[key] = m.group(1).strip().strip('"').strip("'")
    m = re.search(r"^  version:\s*([0-9][0-9.]*)\s*$", block, re.M)
    out["version"] = m.group(1) if m else ""
    m = re.search(r"^paths:\s*$", block, re.M)
    out["has_paths"] = bool(m)
    return out


def load_skills(cfg: dict) -> list[dict]:
    """One record per shipped skill. `skills/_archive/` is deliberately excluded
    — it sits outside the install and doctor globs, so counting it here would
    overstate the live surface."""
    root = rel(cfg, "skills")
    beats = beat_of_skill(cfg)
    out: list[dict] = []
    if not root.is_dir():
        return out
    for d in sorted(root.glob("gabe-*")):
        skill_md = d / "SKILL.md"
        if not skill_md.is_file():
            continue
        fm = _frontmatter(skill_md.read_text(errors="replace"))
        refs = sorted((d / "references").glob("*.md")) if (d / "references").is_dir() else []
        scripts = [p for p in d.rglob("*")
                   if p.is_file() and p.parent.name in ("scripts", "tools", "generator")]
        out.append({
            "name": d.name,
            "version": fm.get("version", ""),
            "description": fm.get("description", ""),
            "when_to_use": fm.get("when_to_use", ""),
            "beat": beats.get(d.name, "cross-cutting"),
            "core_lines": len(skill_md.read_text(errors="replace").splitlines()),
            "reference_count": len(refs),
            "reference_lines": sum(len(p.read_text(errors="replace").splitlines())
                                   for p in refs),
            "script_count": len(scripts),
            "fork": fm.get("context", "") == "fork",
            "explore": fm.get("agent", "") == "Explore",
            "human_only": fm.get("disable-model-invocation", "") == "true",
            "background": fm.get("user-invocable", "") == "false",
            "auto_paths": fm.get("has_paths", False),
            "dispatch_chars": len(fm.get("description", "")) + len(fm.get("when_to_use", "")),
        })
    return out


# ---------------------------------------------------------------- hooks


_EXIT_RX = re.compile(r"\bexit\s+(\d+)\b")


def scan_hooks(cfg: dict) -> list[dict]:
    """Live scan of the shipped hook scripts joined to their wiring.

    The wiring lives in templates/hooks.json. That file is read for its
    event/matcher/timeout only — this center never edits templates/.
    """
    hook_dir = rel(cfg, "hooks")
    wiring_path = rel(cfg, "templates") / "hooks.json"
    wiring: dict[str, dict] = {}
    if wiring_path.is_file():
        try:
            raw = json.loads(wiring_path.read_text())
        except json.JSONDecodeError:
            raw = {}
        # Shape: {marker: {"event": <settings.json event>, "entry": {matcher, hooks[]}}}
        # The event is declared, not inferred from the marker text.
        for marker, node in raw.items():
            if not isinstance(node, dict):
                continue
            entry = node.get("entry", {})
            if not isinstance(entry, dict):
                continue
            hooks = [h for h in entry.get("hooks", []) if isinstance(h, dict)]
            cmds = " ".join(h.get("command", "") for h in hooks)
            m = re.search(r"hooks/kdbp/([a-z0-9-]+)\.sh", cmds)
            if not m:
                continue
            wiring[m.group(1)] = {
                "marker": marker,
                "event": node.get("event", ""),
                "matcher": entry.get("matcher", ""),
                "timeout": str(hooks[0].get("timeout", "")) if hooks else "",
            }

    out: list[dict] = []
    if not hook_dir.is_dir():
        return out
    for p in sorted(hook_dir.glob("*.sh")):
        src = p.read_text(errors="replace")
        stem = p.stem
        w = wiring.get(stem, {})
        exits = sorted({int(c) for c in _EXIT_RX.findall(src)})
        out.append({
            "name": stem,
            "script": str(p.relative_to(REPO_ROOT)),
            "marker": w.get("marker", ""),
            "event": w.get("event", ""),
            "matcher": w.get("matcher", ""),
            "timeout": w.get("timeout", ""),
            "lines": len(src.splitlines()),
            "exit_codes_found": exits,
            "wired": bool(w),
            "header": _hook_header(src),
        })
    return out


def _hook_header(src: str) -> str:
    """The script's own one-line self-description — quoted verbatim so the page
    can set it against observed behaviour. Several hooks describe themselves
    inaccurately; that gap is the point, so it is never paraphrased."""
    lines = [ln.strip("# ").strip() for ln in src.splitlines()[:14]
             if ln.startswith("#") and len(ln.strip()) > 3]
    body = [ln for ln in lines if not ln.startswith("!")]
    return body[0] if body else ""


# ---------------------------------------------------------------- batteries


def doctor_exclusions(cfg: dict) -> list[str]:
    """Battery paths suite-doctor's G3 sweep skips, read from the doctor itself
    rather than restated here — a restated exclusion list drifts."""
    doctor = REPO_ROOT / "scripts" / "suite-doctor.sh"
    if not doctor.is_file():
        return []
    return re.findall(r"\*/tests/([a-z0-9_-]+)/\*\)\s*continue", doctor.read_text())


def scan_batteries(cfg: dict) -> list[dict]:
    """Every tests/<name>/run.sh on disk, with its doctor status.

    Assertion counts and pass/fail are NOT derived here: running eight batteries
    on every page build would make the center slow and non-deterministic. They
    come from data/facts.json, which records a real run with its stamp.
    """
    tests = rel(cfg, "tests")
    excl = set(doctor_exclusions(cfg))
    out: list[dict] = []
    if not tests.is_dir():
        return out
    for run in sorted(tests.glob("*/run.sh")):
        name = run.parent.name
        if name == "_archive":
            continue
        src = run.read_text(errors="replace")
        out.append({
            "name": name,
            "path": str(run.relative_to(REPO_ROOT)),
            "lines": len(src.splitlines()),
            "in_g3": name not in excl,
            "excluded_reason": _exclusion_reason(cfg, name) if name in excl else "",
            # On-disk fixture files. Most batteries build their fixtures inline
            # from heredocs into a temp dir, so 0 here means "hermetic", not
            # "unfixtured" — the assertion counts in facts.json are the real
            # coverage signal.
            "fixture_files": len([p for p in run.parent.rglob("*")
                                  if p.is_file() and p.name != "run.sh"]),
        })
    return out


def _exclusion_reason(cfg: dict, name: str) -> str:
    doctor = REPO_ROOT / "scripts" / "suite-doctor.sh"
    if not doctor.is_file():
        return ""
    m = re.search(rf"\*/tests/{re.escape(name)}/\*\)\s*continue\s*;;\s*#\s*(.+)",
                  doctor.read_text())
    return m.group(1).strip() if m else ""


# ---------------------------------------------------------------- authored data


def load_json_data(cfg: dict, filename: str) -> tuple[dict | None, str]:
    """An authored data file plus a provenance line. A missing file is returned
    as None so the caller can render a NAMED GAP — never an empty table that
    reads as 'nothing to report'."""
    path = rel(cfg, "data") / filename
    if not path.is_file():
        return None, f"{path.relative_to(REPO_ROOT)} (absent)"
    try:
        return json.loads(path.read_text()), str(path.relative_to(REPO_ROOT))
    except json.JSONDecodeError as e:
        return None, f"{path.relative_to(REPO_ROOT)} (UNPARSEABLE: {e})"


def load_enforcement(cfg: dict) -> tuple[list[dict], str]:
    data, prov = load_json_data(cfg, "enforcement.json")
    if data is None:
        return [], prov
    return data.get("rules", []), prov


def load_facts(cfg: dict) -> tuple[dict, str]:
    data, prov = load_json_data(cfg, "facts.json")
    return (data or {}), prov


# ---------------------------------------------------------------- rollups


def bucket_counts(rules: list[dict], cfg: dict) -> dict[str, int]:
    keys = [b["key"] for b in cfg["buckets"]]
    counts = {k: 0 for k in keys}
    for r in rules:
        b = r.get("bucket", "")
        if b in counts:
            counts[b] += 1
    return counts


def by_beat(rules: list[dict], cfg: dict) -> dict[str, list[dict]]:
    order = [b["slug"] for b in cfg["beats"]]
    out: dict[str, list[dict]] = {slug: [] for slug in order}
    for r in rules:
        out.setdefault(r.get("beat", "cross-cutting"), []).append(r)
    return out
