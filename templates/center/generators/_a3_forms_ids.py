"""Element forms — stable ids for every generated row (amendment 1 §A1).

An id is ``<prefix>:<sha1(canonical json of a tuple)[:10]>``. The tuple names WHAT a row is — its phase, status,
the function it sits in, what it says — and never WHERE on a line it sits, so a blank line added above a raise keeps
its id while a reworded detail changes it (amendment D13). Identical tuples are told apart by an ordinal ``n``: the
rank of the row's position (line, then the location text) among every DISTINCT position that tuple has anywhere in the
feed. The rank is taken over the whole feed, not one endpoint's rows, because middleware exits are filtered per endpoint
by path prefix — ranking one endpoint's list would give one exit two ids and one id two exits.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

import _a3_paths as P

_VIA_AT = re.compile(r" @ \S+:\d+$")


def ident(prefix: str, parts) -> str:
    """``x:1a2b3c4d5e`` — the prefix plus the first 10 hex of sha1 over the tuple's canonical JSON."""
    raw = json.dumps(list(parts), separators=(",", ":"), ensure_ascii=False)
    return f"{prefix}:{hashlib.sha1(raw.encode('utf-8')).hexdigest()[:10]}"


def via_sym(via: str | None) -> str | None:
    """``via`` with its trailing `` @ file:line`` removed — the symbol survives a line move, the site does not."""
    return _VIA_AT.sub("", via) if via else via


def _line(at) -> int:
    ln = str(at or "").rpartition(":")[2]
    return int(ln) if ln.isdigit() else 0


def _pos(*ats) -> tuple:
    return tuple(_line(a) for a in ats) + tuple(str(a or "") for a in ats)


def fn_at(repo, at: str | None) -> str | None:
    """``file:line`` → ``file::qual`` of the innermost def holding that line (``file::<module>`` at module level).
    Only the file's top-level defs and class methods are candidates — the shape ``_a3_paths._Mod.defs`` keeps."""
    if not at:
        return None
    rel, _, ln = str(at).rpartition(":")
    if not rel or not ln.isdigit():
        return None
    m = P._mod(Path(repo), rel)
    if m is None:
        return f"{rel}::<module>"
    line, best = int(ln), None
    for qual, node in m.defs.items():
        end = getattr(node, "end_lineno", None) or node.lineno
        if node.lineno <= line <= end:
            cand = (end - node.lineno, qual)
            best = cand if best is None or cand < best else best
    return f"{rel}::{best[1]}" if best else f"{rel}::<module>"


def x_tuple(repo, row: dict, handler: str) -> list:
    """A produced exit's ``x:`` tuple, ordinal aside: ``[phase, status, at_fn, site_fn, via_sym, raised_fn, detail]``;
    a row with no ``at`` belongs to the handler."""
    return [row.get("phase"), row.get("status"), fn_at(repo, row.get("at")) or handler, fn_at(repo, row.get("site")),
            via_sym(row.get("via")), fn_at(repo, row.get("raised_at")), row.get("detail")]


def g_tuple(repo, row: dict, handler: str) -> list:
    """A precondition's ``g:`` tuple, ordinal aside: ``[pred, status, at_fn, via_sym, depth]``."""
    return [row.get("pred"), row.get("status"), fn_at(repo, row.get("at")) or handler, via_sym(row.get("via")), row.get("depth")]


def _ranked(prefix: str, entries: list[tuple], audit: dict | None) -> list[str]:
    """``entries = [(tuple, position)]`` → one id each; ``n`` ranks the position among the distinct positions of an
    identical tuple. ``audit[prefix]`` counts ids two different (tuple, n) keys share — a truncated-hash collision."""
    keys = [json.dumps(t, ensure_ascii=False) for t, _ in entries]
    seen: dict[str, set] = {}
    for k, (_, p) in zip(keys, entries):
        seen.setdefault(k, set()).add(p)
    rank = {k: {p: i for i, p in enumerate(sorted(ps))} for k, ps in seen.items()}
    ids, full = [], set()
    for k, (t, p) in zip(keys, entries):
        n = rank[k][p]
        ids.append(ident(prefix, t + [n]))
        full.add((k, n))
    if audit is not None:
        audit[prefix] = len(full) - len(set(ids))
    return ids


def _feed(forms: dict, rows_key: str, tuple_of, pos_of, prefix: str, audit: dict | None) -> dict:
    out: dict[str, list] = {}
    entries, where = [], []
    for key in sorted(forms.get("endpoints") or {}):
        form = forms["endpoints"][key]
        hosts = form.get("variants") or [form]
        out[key] = [[] for _ in hosts]
        for vi, v in enumerate(hosts):
            handler = v.get("handler") or form.get("handler")
            for r in v.get(rows_key) or []:
                entries.append((tuple_of(r, handler), pos_of(r)))
                where.append((key, vi))
    for (key, vi), i in zip(where, _ranked(prefix, entries, audit)):
        out[key][vi].append(i)
    return out


def x_ids(repo, forms: dict, audit: dict | None = None) -> dict:
    """``{endpoint_key: [[x: id per produced row] per variant]}`` for the whole feed — ``n`` ranks the distinct
    (site line, at line) positions an identical tuple has anywhere in the feed."""
    return _feed(forms, "produced", lambda r, h: x_tuple(repo, r, h), lambda r: _pos(r.get("site"), r.get("at")), "x", audit)


def g_ids(repo, forms: dict, audit: dict | None = None) -> dict:
    """``{endpoint_key: [[g: id per precondition] per variant]}`` — ``n`` ranks the distinct ``at`` positions of an
    identical tuple, so two identical guards in one function stay two preconditions."""
    return _feed(forms, "preconditions", lambda r, h: g_tuple(repo, r, h), lambda r: _pos(r.get("at")), "g", audit)
