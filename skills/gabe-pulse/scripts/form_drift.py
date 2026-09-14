#!/usr/bin/env python3
"""form_drift.py — element-forms drift, two arms (the fetch_bridge.py / entity_shape.py contract).

An element FORM is what a FastAPI endpoint decides: every refusal it can produce, what it declares
against what it produces, the guards in its body (docs/design/element-forms/plan.md). The generator
pass `_a3_paths` writes it to the committed ``forms.json``. Two arms surface what it finds:

  * STANDING (pulse S20): READ ``forms.json`` — nothing is recomputed here (a pulse angle must not
    parse source). The findings split in two classes, stated once below and kept in sync with
    ``_a3_forms.FINDINGS`` by contract (a two-line duplicate across install packages, like
    fetch_bridge's ``norm_path``):
      - NAG: a refusal a client cannot handle correctly — one status carrying different text-only
        refusals, a service reason replaced on the way out, a project error escaping as a 500, a
        refusal swallowed by a broad except. These count toward firing.
      - COUNT: a convention to set once — text-only refusals, undeclared statuses. They ride the
        line; they never fire it (on gustify every endpoint carries both, so a nag would be wallpaper).

  * ``--diff`` (gabe-review FORM DRIFT): read a NEW ``raise HTTPException(...)`` on ADDED (+) lines —
    multi-line raises are joined until their parentheses close — and classify it against the committed
    forms of the endpoints in the same file: text only · shares a status with an existing refusal of
    different text · a status the endpoint does not declare. Review prices it on the diff that adds it,
    BEFORE the center regenerates. Compares (status, detail), never line numbers.

Report-only, no stored artifact, exit 0 always (report-never-gate).
"""
from __future__ import annotations

import argparse
import ast
import json
import re
import subprocess
import sys
from pathlib import Path

# kept in sync with templates/center/generators/_a3_forms.py FINDINGS[*]["pulse"] by contract
NAG = ("shared-status", "reason-lost", "escape-500", "http-swallowed")
COUNT = ("text-only", "undeclared", "declared-unproduced")
# fire on a pattern of refusals a client mishandles, not a single stray (anti-wallpaper)
FORM_NAG_MIN = 3

_RAISE_RE = re.compile(r"raise\s+HTTPException\s*\(")
_HTTP_NAME_RE = re.compile(r"HTTP_(\d{3})")
_JOIN_MAX = 8


def _center(root: Path) -> Path:
    return root / "docs" / "site" / "center"


def load_forms(root: Path) -> tuple[str, dict, str]:
    """``(state, forms, reason)`` — state ∈ present · not_emitted · absent · unreadable."""
    p = _center(root) / "forms.json"
    if not p.is_file():
        return "absent", {}, "no forms.json — an older map (regen with the current generators) or the pass is switched off (center.config.json `forms: false`)"
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        return "unreadable", {}, f"forms.json unreadable ({exc.__class__.__name__})"
    if not isinstance(data, dict):
        return "unreadable", {}, "forms.json is not an object"
    if not data.get("present"):
        return "not_emitted", data, data.get("reason") or "the pass wrote no forms"
    return "present", data, ""


def endpoint_forms(forms: dict) -> list[tuple[str, dict]]:
    """``[(id, form)]`` with colliding ids' variants flattened, sorted by id."""
    out = []
    for key in sorted((forms.get("endpoints") or {})):
        f = forms["endpoints"][key]
        for v in (f.get("variants") or [f]):
            out.append((key, v))
    return out


def summary(forms: dict) -> dict:
    """The standing shape: nag and count findings, the endpoints they sit on, unknown rows."""
    eps = endpoint_forms(forms)
    nag: dict[str, int] = {}
    count: dict[str, int] = {}
    named: list[str] = []
    for key, f in eps:
        for x in f.get("findings") or []:
            fid = x.get("id")
            if fid in NAG:
                nag[fid] = nag.get(fid, 0) + 1
                if len(named) < 3:
                    named.append(f"{key.removeprefix('endpoint:')} {fid}"
                                 + (f" {x['status']}" if x.get("status") else ""))
            elif fid in COUNT:
                count[fid] = count.get(fid, 0) + 1
    st = forms.get("stats") or {}
    return {"endpoints": len(eps), "nag": dict(sorted(nag.items())), "count": dict(sorted(count.items())),
            "nag_total": sum(nag.values()), "named": named, "unknown_rows": int(st.get("unknown_rows") or 0)}


def one_line(s: dict) -> str | None:
    if s["nag_total"] < FORM_NAG_MIN:
        return None
    nags = " · ".join(f"{k} {v}" for k, v in s["nag"].items())
    counts = " · ".join(f"{k} on {v}" for k, v in s["count"].items())
    return (f"element forms — {s['nag_total']} refusal finding(s) a client cannot handle correctly: {nags}"
            f" (e.g. {'; '.join(s['named'])}) · of {s['endpoints']} endpoint(s): {counts or 'no convention counts'}"
            + (f" · {s['unknown_rows']} exit(s) the source could not tell" if s["unknown_rows"] else ""))


# ── diff mode ───────────────────────────────────────────────────────────────────────────────────────
def _parse_raise(text: str) -> dict | None:
    """``raise HTTPException(...)`` source → {status, detail, form[, code]}; tolerant of `from exc`."""
    m = _RAISE_RE.search(text)
    if not m:
        return None
    body = text[m.end() - 1:]                                  # from the opening parenthesis
    depth, end = 0, None
    for i, ch in enumerate(body):
        depth += ch == "("
        depth -= ch == ")"
        if depth == 0:
            end = i
            break
    call = None
    if end is not None:
        try:
            node = ast.parse("HTTPException" + body[:end + 1], mode="eval").body
            call = node if isinstance(node, ast.Call) else None
        except SyntaxError:
            call = None
    if call is None:
        hit = _HTTP_NAME_RE.search(body) or re.search(r"\b([1-5]\d\d)\b", body)
        lit = re.search(r"""["']([^"']*)["']""", body)
        return {"status": int(hit.group(1)) if hit else None, "detail": lit.group(1) if lit else None,
                "form": "text" if lit else "unknown"}
    st = call.args[0] if call.args else None
    det = call.args[1] if len(call.args) > 1 else None
    for kw in call.keywords:
        if kw.arg == "status_code":
            st = kw.value
        elif kw.arg == "detail":
            det = kw.value
    status = None
    if isinstance(st, ast.Constant) and isinstance(st.value, int):
        status = st.value
    elif isinstance(st, (ast.Attribute, ast.Name)):
        hit = _HTTP_NAME_RE.match(st.attr if isinstance(st, ast.Attribute) else st.id)
        status = int(hit.group(1)) if hit else None
    if det is None:
        return {"status": status, "detail": None, "form": "default-phrase"}
    if isinstance(det, ast.Constant) and isinstance(det.value, str):
        return {"status": status, "detail": det.value, "form": "text"}
    if isinstance(det, ast.Dict):
        for k, v in zip(det.keys, det.values):
            if isinstance(k, ast.Constant) and k.value in ("code", "error_code", "reason", "type") \
                    and isinstance(v, ast.Constant):
                return {"status": status, "detail": ast.unparse(det), "form": "object", "code": str(v.value)}
        return {"status": status, "detail": ast.unparse(det), "form": "object"}
    return {"status": status, "detail": ast.unparse(det), "form": "dynamic"}


def diff_new_raises(diff_text: str) -> list[dict]:
    """``[{file, status, detail, form[, code]}]`` for every ``raise HTTPException(`` an ADDED line opens."""
    out: list[dict] = []
    lines = diff_text.splitlines()
    cur = None
    for i, line in enumerate(lines):
        if line.startswith("+++ "):
            cur = line[4:].removeprefix("b/").strip()
            continue
        if not line.startswith("+") or not cur or not cur.endswith(".py") or not _RAISE_RE.search(line):
            continue
        text = line[1:]
        for nxt in lines[i + 1:i + 1 + _JOIN_MAX]:             # a multi-line raise: join until it closes
            if text.count("(") <= text.count(")"):
                break
            if nxt.startswith(("+", " ")):
                text += " " + nxt[1:].strip()
        parsed = _parse_raise(text)
        if parsed:
            out.append({"file": cur, **parsed})
    return out


def classify_new_raises(new: list[dict], forms: dict) -> list[dict]:
    """Which NEW raises carry a form finding. A coded refusal on a declared status is silent."""
    by_file: dict[str, list[tuple[str, dict]]] = {}
    for key, f in endpoint_forms(forms):
        by_file.setdefault(f.get("file", ""), []).append((key, f))
    drift = []
    for r in new:
        why = []
        if not r.get("code") and r.get("form") in ("text", "default-phrase", "dynamic", "object"):
            why.append("text only — no stable code a client can branch on")
        for key, f in by_file.get(r["file"], []):
            name = key.removeprefix("endpoint:")
            same = sorted({str(x.get("detail")) for x in f.get("produced") or []
                           if x.get("status") == r["status"] and x.get("state") == "defined" and not x.get("code")
                           and x.get("detail") != r.get("detail")})
            if r.get("status") and same and not r.get("code"):
                why.append(f"shares {r['status']} with {same[0]!r} on {name}")
            declared = set((f.get("declared") or {}).get("refusals") or [])
            success = ((f.get("declared") or {}).get("success") or {}).get("status")
            if r.get("status") and r["status"] not in declared and r["status"] != success:
                why.append(f"{r['status']} is not declared on {name}")
        if why:
            drift.append({**r, "why": sorted(set(why))})
    drift.sort(key=lambda d: (d["file"], d.get("status") or 0, str(d.get("detail"))))
    return drift


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root", nargs="?", default=".", help="project root")
    ap.add_argument("--json", action="store_true", help="emit the standing shape as JSON")
    ap.add_argument("--one-line", action="store_true", help="emit the pulse line (silent when no signal)")
    ap.add_argument("--diff", nargs="?", const="HEAD", default=None,
                    help="review mode: classify NEW raise HTTPException(...) lines in the git diff (default HEAD)")
    args = ap.parse_args()
    root = Path(args.root).resolve()
    state, forms, reason = load_forms(root)

    if args.diff is not None:
        if state != "present":
            print(f"FORM DRIFT NOT RUN: {reason}")
            return 0
        try:
            diff_text = subprocess.run(["git", "-C", str(root), "diff", args.diff],
                                       capture_output=True, text=True, timeout=30).stdout
        except Exception:  # noqa: BLE001 — a git hiccup is silence, not a crash
            return 0
        for d in classify_new_raises(diff_new_raises(diff_text), forms):
            det = f" {d['detail']!r}" if d.get("detail") else ""
            print(f"FORM DRIFT: new refusal {d.get('status') or '?'}{det} in {d['file']} — " + " · ".join(d["why"]))
        return 0

    if state != "present":
        if args.json:
            print(json.dumps({"state": state, "reason": reason}, indent=1, sort_keys=True))
        elif not args.one_line:
            print(f"element forms {state}: {reason}")
        return 0
    s = summary(forms)
    if args.json:
        print(json.dumps({"state": state, **s}, indent=1, sort_keys=True))
    elif args.one_line:
        line = one_line(s)
        if line:
            print(line)
    else:
        print(f"element forms — {s['endpoints']} endpoint(s) · nag {s['nag'] or 'none'} · count {s['count'] or 'none'}"
              f" · {s['unknown_rows']} unknown exit(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
