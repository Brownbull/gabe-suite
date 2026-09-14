"""Element forms — the orchestrator of the GENERATION ARMS (amendment 1, docs/design/element-forms/amendment-1.md).

``_a3_paths.build`` writes the endpoint forms; ``extend_backend`` then stamps the envelope's ``head`` and runs the
arms the operator selected — ``center.config.json`` ``forms_arms`` or ``GABE_FORMS_ARMS`` — in ``F.ARM_STAGES`` order.
A stage is one arm, or some of its parts; each PART runs only when its own hard needs succeeded, so a sibling's
failed need never blocks it. Each stage is isolated: it runs over the live feed inside its own ``try``, and a raise —
or a feed or result the write could not serialize — restores the whole feed from a snapshot and records
``present: false`` with the error, while later stages still run. Runners read a private copy of the archmap, so no arm
can move the archmap · c4 · levels built from it after the forms block. The orchestrator records which keys each stage
ADDED (a diff against its snapshot), so a unit that is only NEEDED by a selected arm is computed in memory and its
additions are removed before the write — kept only where a selected arm wrote inside them, and said so. Every arm is
off by default (D12): an unselected build writes ``_a3_paths.build``'s feed plus ``head`` and nothing else. Arms land
slice by slice and register in ``RUNNERS``; the shared leaves are imported at column 0 so ``propagate.sh`` lands them.
"""
from __future__ import annotations

import copy
import json
import os
from pathlib import Path

import _a3_forms as F
import _a3_forms_catch  # noqa: F401  (a shared leaf — imported at column 0 so propagate.sh lands it on a twin)
import _a3_forms_ids as I
import _a3_forms_reach  # noqa: F401
import _a3_forms_settings  # noqa: F401

# arm → runner(forms, ctx) -> {"version", "options", "stats"}; ctx carries amap (a private copy) · repo · cfg · selected ·
# parts (the parts this stage runs; () for an arm without parts) · ok (units that already succeeded) · soft (the soft
# needs that are selected and succeeded)
RUNNERS: dict = {}
_ERR_CAP = 200


def _names(raw) -> tuple[set[str], list[str]]:
    names = {str(x).strip().lower() for x in raw if str(x).strip()}
    unknown = sorted(names - set(F.ARMS) - {"all", "none"})
    return (set(F.ARMS) if "all" in names else names & set(F.ARMS)), unknown


def selection(cfg: dict | None) -> tuple[set[str], list[str]]:
    """``(selected arms, ignored names)``. ``GABE_FORMS_ARMS`` (``all`` · ``none`` · ``a,b``) for one run beats the config's
    ``forms_arms`` (a ``{arm: true}`` map, a list, or a comma string). Names are case-insensitive; unknown ones are named."""
    env = os.environ.get("GABE_FORMS_ARMS")
    if env is not None:
        return _names(env.split(","))
    want = (cfg or {}).get("forms_arms")
    if isinstance(want, dict):
        return _names(k for k, on in want.items() if on is True)
    if isinstance(want, (list, tuple)):
        return _names(want)
    if isinstance(want, str):
        return _names(want.split(","))
    return set(), []


def selected(cfg: dict | None) -> set[str]:
    return selection(cfg)[0]


def units_of(name: str) -> set[str]:
    """``kinds`` → every ``kinds.<part>``; ``paths`` → ``{"paths"}``; ``kinds.functions`` → itself."""
    if "." in name:
        return {name}
    parts = F.ARMS.get(name, {}).get("parts") or ()
    return {f"{name}.{p}" for p in parts} if parts else {name}


def _needs(table: dict, unit: str) -> set[str]:
    out: set[str] = set()
    for key in {unit, unit.split(".")[0]}:
        for n in table.get(key, ()):
            out |= units_of(n)
    return out - {unit}


def unit_needs(unit: str) -> set[str]:
    """A unit's hard needs, as units: its own plus its arm's."""
    return _needs(F.ARM_NEEDS, unit)


def _label(units) -> str:
    """Units as a reader says them: a whole arm by its name (``paths``), a lone part as ``arm.part``."""
    units = set(units)
    whole = sorted(a for a in {u.split(".")[0] for u in units} if units_of(a) <= units)
    rest = sorted(u for u in units if u.split(".")[0] not in whole)
    return ", ".join(whole + rest)


def closure(sel: set[str]) -> set[str]:
    """Every unit a selection runs: the selected arms' units plus, transitively, what they hard-need."""
    out: set[str] = set()
    todo = [u for a in sel for u in units_of(a)]
    while todo:
        u = todo.pop()
        if u not in out:
            out.add(u)
            todo.extend(unit_needs(u))
    return out


def _off(reason: str, arm: str | None = None) -> dict:
    out = {"present": False, "reason": reason, "version": 1, "options": {}, "stats": {}}
    parts = F.ARMS.get(arm, {}).get("parts") if arm else None
    if parts:
        out["parts"] = {p: {"present": False, "reason": reason} for p in parts}
    return out


def _added(old, new, path: tuple = ()) -> list[tuple]:
    """The key paths ``new`` has that ``old`` does not — a dict key or a list item appended past the old length."""
    out: list[tuple] = []
    if isinstance(old, dict) and isinstance(new, dict):
        for k in new:
            out.extend([path + (k,)] if k not in old else _added(old[k], new[k], path + (k,)))
    elif isinstance(old, list) and isinstance(new, list):
        for i, v in enumerate(new):
            out.extend([path + (i,)] if i >= len(old) else _added(old[i], v, path + (i,)))
    return out


def _at(doc, path: tuple):
    for p in path:
        if isinstance(doc, dict) and p in doc or isinstance(doc, list) and isinstance(p, int) and p < len(doc):
            doc = doc[p]
        else:
            return None, False
    return doc, True


def _order(path: tuple) -> list:
    return [(0, p) if isinstance(p, int) else (1, str(p)) for p in path]


def _top(paths: list[tuple]) -> list[tuple]:
    ps = set(paths)
    return [p for p in paths if not any(p[:i] in ps for i in range(1, len(p)))]


def _size(v) -> int:
    return len(json.dumps(v, ensure_ascii=False, sort_keys=True, indent=1))


def _containers(forms: dict) -> list[tuple]:
    """Create the shared ``arm_findings`` dicts (top level and on every endpoint or variant) before any arm runs, so the
    key diff credits each arm with its own entry and no arm with the container; returns the paths it created."""
    made: list[tuple] = []
    for key, e in (forms.get("endpoints") or {}).items():
        hosts = [(("endpoints", key, "variants", i), v) for i, v in enumerate(e["variants"])] if e.get("variants") else [(("endpoints", key), e)]
        for path, v in hosts:
            if isinstance(v, dict) and "arm_findings" not in v:
                v["arm_findings"] = {}
                made.append(path)
    if "arm_findings" not in forms:
        forms["arm_findings"] = {}
        made.append(())
    return made


def _write_ids(forms: dict, repo) -> dict:
    """Stamp ``id`` on every produced exit (``x:``) and precondition (``g:``) — every id computed before any is written —
    and link each precondition to its exit: the ``x:`` row whose ``at`` or ``raised_at`` is the precondition's ``at``
    (``exit``; ``exits`` and ``exit: null`` when more than one row is). Returns the envelope's ``ids`` block."""
    audit: dict = {}
    xs, gs = I.x_ids(repo, forms, audit), I.g_ids(repo, forms, audit)
    stats = {"present": True, "reason": None, "x": 0, "g": 0, "linked": 0, "ambiguous": 0, "unlinked": 0,
             "collisions": audit.get("x", 0) + audit.get("g", 0)}
    for key, e in (forms.get("endpoints") or {}).items():
        for vi, v in enumerate(e.get("variants") or [e]):
            by_at: dict[str, list] = {}
            for r, i in zip(v.get("produced") or [], xs[key][vi]):
                r["id"] = i
                stats["x"] += 1
                for k in ("at", "raised_at"):
                    if r.get(k) and i not in by_at.setdefault(r[k], []):
                        by_at[r[k]].append(i)
            for g, i in zip(v.get("preconditions") or [], gs[key][vi]):
                g["id"] = i
                stats["g"] += 1
                hits = by_at.get(g.get("at")) or []
                g["exit"] = hits[0] if len(hits) == 1 else None
                if len(hits) > 1:
                    g["exits"] = hits
                stats["linked" if len(hits) == 1 else "ambiguous" if hits else "unlinked"] += 1
    return stats


def _drop_empty(forms: dict, made: list[tuple]) -> None:
    for path in made:
        host, found = _at(forms, path)
        if found and isinstance(host, dict) and host.get("arm_findings") == {}:
            del host["arm_findings"]


def extend_backend(forms: dict, amap: dict, repo, cfg: dict | None = None) -> dict:
    """Stamp ``head`` and run the selected backend arms into ``forms`` — never raises; returns ``forms``."""
    try:
        if not isinstance(forms, dict) or not forms.get("present"):
            return forms
        forms["head"] = amap.get("head")
        sel, ignored = selection(cfg)
        if ignored:
            forms["arms_ignored"] = ignored
        if not sel:
            return forms
        run = closure(sel)
        private = copy.deepcopy(amap)                      # runners never touch the archmap the c4 · levels are built from
        made = _containers(forms)                          # arm_findings is shared: nobody owns the container, each arm its entry
        try:                                               # ids first (D13): on P.build's own rows, before any stage owns a key
            forms["ids"] = _write_ids(forms, repo)
        except Exception as exc:  # noqa: BLE001 — ids that fail never cost the arms
            forms["ids"] = {"present": False, "reason": f"error: {type(exc).__name__}: {exc}"[:_ERR_CAP]}
        ok: set[str] = set()
        results: dict[str, dict] = {}
        outcomes: dict[str, dict] = {}
        owned: dict[str, list] = {}
        for arm, parts in F.ARM_STAGES:
            units = [f"{arm}.{p}" for p in parts if f"{arm}.{p}" in run] if parts else ([arm] if arm in run else [])
            if not units:
                continue
            res = results.setdefault(arm, {"present": False, "reason": None, "version": 1, "options": {}, "stats": {}})
            out = outcomes.setdefault(arm, {})
            runnable = []
            for u in units:
                missing = unit_needs(u) - ok
                if missing:
                    out[u] = {"present": False, "reason": "needs " + _label(missing)}
                else:
                    runnable.append(u)
            runner = RUNNERS.get(arm)
            if runnable and runner is None:
                for u in runnable:
                    out[u] = {"present": False, "reason": f"not built yet (slice {F.ARMS[arm]['slice']})"}
            elif runnable:
                snapshot = copy.deepcopy(forms)
                ctx = {"amap": private, "repo": Path(repo), "cfg": cfg or {}, "selected": frozenset(sel),
                       "parts": tuple(u.split(".", 1)[1] for u in runnable if "." in u), "ok": frozenset(ok),
                       "soft": tuple(sorted({s for u in runnable for s in _needs(F.ARM_SOFT, u)} & ok))}
                try:
                    got = runner(forms, ctx)
                    got = {} if got is None else got
                    if not isinstance(got, dict):
                        raise TypeError(f"a runner returns a dict, not {type(got).__name__}")
                    version = int(got.get("version", res["version"]))
                    options, stats = dict(got.get("options") or {}), dict(got.get("stats") or {})
                    json.dumps([forms, options, stats], ensure_ascii=False, sort_keys=True)   # the write's own test
                    owned.setdefault(arm, []).extend(_added(snapshot, forms))
                    res["version"] = version
                    res["options"].update(options)
                    res["stats"].update(stats)
                    for u in runnable:
                        out[u] = {"present": True, "reason": None}
                    ok.update(runnable)
                except Exception as exc:  # noqa: BLE001 — one stage's failure never costs the feed
                    forms.clear()
                    forms.update(snapshot)
                    for u in runnable:
                        out[u] = {"present": False, "reason": f"error: {type(exc).__name__}: {exc}"[:_ERR_CAP]}
            if parts:
                for u in units:
                    res.setdefault("parts", {})[u.split(".", 1)[1]] = out[u]
        for arm, res in results.items():                  # an arm is present when any part is; a part's failure is said
            failed = [(u.split(".", 1)[-1], o["reason"]) for u, o in outcomes[arm].items() if not o["present"]]
            res["present"] = any(o["present"] for o in outcomes[arm].values())
            if res["present"] and failed:
                res["reason"] = ("partial — " + "; ".join(f"{p}: {r}" for p, r in failed))[:_ERR_CAP]
            elif not res["present"]:
                res["reason"] = failed[0][1]
        for arm in sel:
            if arm in owned:
                results[arm]["bytes"] = sum(_size(_at(forms, p)[0]) for p in _top(owned[arm]))
        kept: dict[str, set] = {}
        doomed: list[tuple] = []
        for arm in sorted(owned):
            if arm in sel:
                continue
            for p in owned[arm]:
                inside = {a for a in sel for q in owned.get(a, ()) if q[:len(p)] == p}
                if inside:
                    kept.setdefault(arm, set()).update(inside)
                else:
                    doomed.append(p)
        for p in sorted(doomed, key=_order, reverse=True):  # needed-only additions: computed in memory, never written
            parent, found = _at(forms, p[:-1])
            if found and (isinstance(parent, dict) and p[-1] in parent or isinstance(parent, list) and p[-1] < len(parent)):
                del parent[p[-1]]
        _drop_empty(forms, made)
        for arm in list(results):
            if arm in sel:
                continue
            why = ", ".join(sorted(a for a in sel if closure({a}) & units_of(arm))) or "a selected arm"
            res = results[arm]
            if not res["present"]:
                off = _off(f"{res['reason']} — needed by {why}", arm)
                off.get("parts", {}).update(res.get("parts") or {})
                results[arm] = off
            elif arm in kept:
                res["reason"] = f"needed by {why}; written only where {', '.join(sorted(kept[arm]))} writes inside it"
            else:
                results[arm] = _off(f"switched off — computed in memory for {why}", arm)
        forms["arms"] = {arm: results.get(arm) or _off(
            "not built yet (slice 11) — runs beside the fe structure arm" if arm == "frontend" and arm in sel else "switched off", arm)
            for arm in F.ARM_ORDER}
        return forms
    except Exception as exc:  # noqa: BLE001
        if isinstance(forms, dict):
            forms["arms_error"] = f"{type(exc).__name__}: {exc}"[:_ERR_CAP]
        return forms


def extend_frontend(forms, fe, repo, cfg: dict | None = None):
    """The frontend arm's seam (Slice 11) — called after the fe structure arm; nothing yet."""
    return None
