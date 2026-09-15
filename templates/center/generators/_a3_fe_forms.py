"""Element forms — FRONTEND guard forms: the frontend arm's ``guards`` part (amendment 1 §A2 Slice 11a).

The extractor's flow run (``GABE_FE_FLOW=1``) hands over raw rows per body. A GUARD is a body whose own exits — outside
any callback — include a navigation: a ``Navigate`` element returned, or a ``redirect(…)`` thrown (``_a3_forms_fe``).
Its form in ``frontend.pieces["fe:<file>#<Export>"]``:

* ``exits[]`` in order — ``nav`` (with ``to``) · ``outlet`` · ``render`` (the tag) · ``null`` · ``throw`` · ``value`` — each
  with the atoms of the conditions above it (``when``) and of the earlier exits it passed (``passed``). An atom names the
  hook member it reads: ``const { data, isPending } = useMe()`` makes ``isPending`` the ``pending`` class of that hook
  and ``data.setup_required`` its ``data`` class with a ``field``. ``decided_by`` follows a data atom through the hook's
  bridge edge (c4 ``cross_edges``) to the endpoint, its declared response model and the schema field;
* ``effects[]`` — the calls a ``useEffect`` makes through a hook's binding, each joined to the exits whose own atoms it
  covers (``lands`` stays ``unknown``: where a sign-out sends the user is outside the tree);
* ``chain[]`` — one row per way a request ends, through every guard mounted above this one in a route config
  (``createBrowserRouter([...])``): an ancestor's non-outlet exit, or this guard's exit, one row per joined effect;
* ``k3`` — the router topology per navigation target: ``loops`` when it lands inside the guard's own subtree; a guard
  above the target that redirects back into this guard's subtree is a pair — ``exclusive`` when the two conditions
  contradict on one hook member, ``unproven`` otherwise; ``unknown`` when no route config holds the target; else
  ``safe``. The guard reads the worst target.

Finding ``redirect-loop`` (nag). Row ids ``<letter>-<sha10>`` hashed per piece (§A1): ``x`` exit · ``e`` effect · ``p`` chain row.
"""
from __future__ import annotations

import hashlib
import json
import re

import _a3_fe as FE
import _a3_forms as F
import _a3_forms_fe as FF

K3_RANK = {"safe": 0, "unknown": 1, "unproven": 2, "loops": 3}
ATOM_RX = re.compile(r"(!?)\s*\(?\s*([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*)\s*\)?(?:\s*(===|!==|==|!=)\s*(.+))?")


def _rid(letter: str, piece: str, parts: list) -> str:
    return f"{letter}-" + hashlib.sha1(json.dumps([piece, *parts], sort_keys=True, default=str).encode()).hexdigest()[:10]


def _split_top(text: str, op: str) -> list[str]:
    """``text`` split at ``op`` outside brackets."""
    out, depth, cur, i = [], 0, "", 0
    while i < len(text):
        c = text[i]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        if depth == 0 and text.startswith(op, i):
            out.append(cur)
            cur, i = "", i + len(op)
            continue
        cur, i = cur + c, i + 1
    out.append(cur)
    return [x.strip() for x in out if x.strip()]


def _atoms(pred: str, neg: bool, binds: dict) -> list[dict]:
    """A condition as atoms: its ``&&`` conjuncts, each a (possibly negated, possibly compared) name; an ``||``, or a negated
    conjunction, stays one ``opaque`` atom."""
    conj = _split_top(pred, "&&")
    if len(_split_top(pred, "||")) > 1 or (neg and len(conj) > 1):
        return [{"opaque": pred, "neg": neg}]
    out = []
    for part in conj:
        m = ATOM_RX.fullmatch(part)
        if not m:
            out.append({"opaque": part, "neg": neg})
            continue
        bang, path, op, val = m.groups()
        name = path.replace("?.", ".")
        base, _, rest = name.partition(".")
        positive = (bang != "!") != neg
        if op in ("!==", "!="):
            positive = not positive
        atom = {"name": name, "neg": not positive}
        if base in binds:
            hook, member = binds[base]
            atom.update({"hook": hook, "member": member, "class": FF.QUERY_STATE.get(member, "value")})
            if rest:
                atom["field"] = rest
        if val is not None:
            atom["value"] = val.strip().strip("'\"")
        out.append(atom)
    return out


def _resolve(callee: str, bindings: dict, file: str, local: set) -> str:
    """A callee or tag → the piece id its binding names (``fe:<file>#<name>``), ``ext:<name>`` for a library, else the name."""
    name = re.split(r"[.(<\s]", callee, maxsplit=1)[0]
    b = bindings.get(name) or {}
    if b.get("file"):
        return f"fe:{b['file']}#{b['name']}"
    if b.get("ext"):
        return f"ext:{name}"
    return f"fe:{file}#{name}" if name in local else name


def _binds(rows: list, bindings: dict, file: str, local: set) -> dict:
    out = {}
    for r in rows:
        if r["k"] == "call" and not r.get("ctx") and r.get("binds"):
            hook = _resolve(r["callee"], bindings, file, local)
            for b in r["binds"]:
                member, _, alias = b.partition(":")
                if member:
                    out[alias or member] = (hook, member)
    return out


def _nav(row: dict, rows: list) -> tuple[bool, str | None]:
    if row["k"] == "ret" and row.get("jsx") in FF.NAV_ELEMENTS:
        el = next((x for x in rows if x["k"] == "jsx" and x["line"] == row["line"] and x.get("tag") == row["jsx"] and not x.get("ctx")), {})
        return True, (el.get("props") or {}).get("to")
    if row["k"] == "throw" and (row.get("callee") or "").split(".")[-1] in FF.NAV_THROWS:
        call = next((x for x in rows if x["k"] == "call" and x["line"] == row["line"] and (x.get("callee") or "").split(".")[-1] in FF.NAV_THROWS), {})
        return True, (call.get("props") or {}).get("to")
    return False, None


def _norm(to) -> str | None:
    if not isinstance(to, str):
        return None
    t = re.split(r"[?#]", to, maxsplit=1)[0].rstrip("*")
    t = t.rstrip("/") or ("/" if t.startswith("/") else "")
    return t or None


def _exits(pid: str, file: str, rows: list, binds: dict) -> list[dict]:
    out = []
    for r in rows:
        if r.get("ctx") or r["k"] not in ("ret", "throw"):
            continue
        nav, to = _nav(r, rows)
        kind = "nav" if nav else "outlet" if r.get("jsx") in FF.OUTLETS else "render" if r.get("jsx") else \
            "null" if r.get("null") else "throw" if r["k"] == "throw" else "value"
        guards, after = r.get("guards") or [], r.get("after") or []
        x = {"id": _rid("x", pid, [kind, [g["pred"] for g in guards], [g["pred"] for g in after], to or r.get("jsx"), len(out)]),
             "kind": kind, "at": f"{file}:{r['line']}"}
        if nav:
            x["to"] = to
        elif r.get("jsx"):
            x["tag"] = r["jsx"]
        x["when"] = [a for g in guards for a in _atoms(g["pred"], g.get("neg", False), binds)]
        x["passed"] = [a for g in after for a in _atoms(g["pred"], g.get("neg", False), binds)]
        out.append(x)
    return out


def _effects(pid: str, file: str, rows: list, binds: dict) -> list[dict]:
    out, lines = [], set()
    for r in rows:
        ctx = r.get("ctx") or []
        if r["k"] != "call" or not ctx or ctx[0].split(":", 1)[-1] not in FF.EFFECT_HOSTS:
            continue
        base = re.split(r"[.(]", r["callee"], maxsplit=1)[0]
        if base not in binds or r["line"] in lines:           # the outer call on a line; its arguments are not effects
            continue
        lines.add(r["line"])
        guards = r.get("guards") or []
        hook, member = binds[base]
        out.append({"id": _rid("e", pid, [r["callee"], [g["pred"] for g in guards], len(out)]), "call": r["callee"], "hook": hook,
                    "member": member, "at": f"{file}:{r['line']}",
                    "when": [a for g in guards for a in _atoms(g["pred"], g.get("neg", False), binds)], "lands": "unknown"})
    return out


def _covers(effect: list, exit_atoms: list) -> bool:
    named = [a for a in exit_atoms if "name" in a]
    return bool(named) and all(any(b.get("name") == a["name"] and b.get("neg") == a["neg"] for b in effect) for a in named)


def _decided(x: dict, bridge: dict, forms: dict) -> dict | None:
    for a in x["when"]:
        if a.get("class") != "data" or not a.get("field") or a["hook"] not in bridge:
            continue
        ep = bridge[a["hook"]]
        e = (forms.get("endpoints") or {}).get(ep) or {}
        v = (e.get("variants") or [e])[0]
        model = ((v.get("declared") or {}).get("response_model") or {}).get("name")
        field = a["field"].split(".")[0]
        schema = (forms.get("schemas") or {}).get(f"schema:{model}") if model else None
        state = "defined" if schema and any(f.get("name") == field for f in schema.get("fields") or []) else "unread"
        return {"endpoint": ep, "response_model": model, "field": field, "state": state}
    return None


def _routers(flow: dict) -> list[tuple]:
    return [(file, rt, rec.get("bindings") or {}) for file, rec in sorted((flow.get("byFile") or {}).items())
            for rt in (rec.get("flow") or {}).get("routes") or [] if (rt.get("callee") or "").split(".")[-1] in FE._ROUTER_CALLEES]


def _mounts(routers: list, flow: dict, guards: set) -> list[dict]:
    """Every route node: its full path and the guards mounted above and at it, outer first."""
    nodes = []

    def walk(level, prefix, above, file, bindings, local):
        for n in level:
            p = n.get("path")
            full = prefix if p is None else str(p) if str(p).startswith("/") else prefix.rstrip("/") + "/" + str(p)
            own = [g for tag in n.get("element") or [] if (g := _resolve(tag, bindings, file, local)) in guards]
            here = above + [g for g in own if g not in above]
            nodes.append({"path": full if p is not None or n.get("index") else None, "guards": here, "own": own, "at": f"{file}:{n.get('line')}"})
            walk(n.get("children") or [], full, here, file, bindings, local)
    for file, rt, bindings in routers:
        local = set(((flow["byFile"][file].get("flow") or {}).get("bodies") or {}))
        walk(rt.get("routes") or [], "", [], file, bindings, local)
    return nodes


def _chain(gid: str, pieces: dict, nodes: list) -> list[dict]:
    rows, seen = [], set()

    def add(through, guard, exit_id, effect=None, ready=False):
        key = (tuple(through), guard, exit_id, effect)
        if key in seen:
            return
        seen.add(key)
        row = {"id": _rid("p", gid, [list(through), guard, exit_id, effect]), "through": list(through), "guard": guard, "exit": exit_id}
        if effect:
            row["effect"] = effect
        if ready:
            row["ready"] = True
        rows.append(row)
    for n in nodes:
        if gid not in n["own"]:
            continue
        through = []
        for a in n["guards"][: n["guards"].index(gid)]:
            for x in pieces[a]["exits"]:
                if x["kind"] != "outlet":
                    add(through, a, x["id"])
            outlet = next((x["id"] for x in pieces[a]["exits"] if x["kind"] == "outlet"), None)
            if outlet is None:
                break
            through.append(outlet)
        else:
            for x in pieces[gid]["exits"]:
                for e in x.get("effects") or [None]:
                    add(through, gid, x["id"], e, x["kind"] == "outlet")
    return rows


def _contradiction(a: list, b: list) -> str | None:
    for x in a:
        for y in b:
            if x.get("hook") and x.get("hook") == y.get("hook") and x.get("name") == y.get("name") and x["neg"] != y["neg"]:
                return x["name"]
    return None


def _k3(gid: str, pieces: dict, nodes: list, has_router: bool) -> dict:
    if not has_router:
        return {"state": "unknown", "reason": "no route config read"}
    by_path: dict = {}
    for n in nodes:
        if n["path"] is not None:
            by_path.setdefault(_norm(n["path"]) or "/", []).append(n)
    state, targets, pairs = "safe", [], {}
    for x in pieces[gid]["exits"]:
        if x["kind"] != "nav":
            continue
        hits = by_path.get(_norm(x.get("to")) or "") or []
        s = "unknown" if not hits else "safe"
        for n in hits:
            if gid in n["guards"]:
                s = "loops"
                break
            for g2 in n["guards"]:
                for y in pieces[g2]["exits"]:
                    if y["kind"] == "nav" and any(gid in m["guards"] for m in by_path.get(_norm(y.get("to")) or "", [])):
                        on = _contradiction(x["when"], y["when"])
                        pairs[(g2, y["id"])] = {"with": g2, "exit": y["id"], "state": "exclusive" if on else "unproven", **({"on": on} if on else {})}
                        if not on:
                            s = max(s, "unproven", key=K3_RANK.get)
        targets.append({"exit": x["id"], "to": x.get("to"), "state": s})
        state = max(state, s, key=K3_RANK.get)
    return {"state": state, "targets": targets, **({"pairs": [pairs[k] for k in sorted(pairs)]} if pairs else {})}


def guards_part(flow: dict, fe: dict, forms: dict, graph: dict | None) -> tuple[dict, dict, list]:
    """``(frontend{pieces, routers, idioms}, stats, findings)`` from the flow run, the fe structure arm and the c4 graph."""
    fe_ids = {p["id"] for p in (fe or {}).get("pieces") or []}
    bridge: dict = {}
    for e in sorted((graph or {}).get("cross_edges") or [], key=lambda e: (str(e.get("export")), str(e.get("to")))):
        if e.get("kind") == "bridge" and e.get("export"):
            bridge.setdefault(e["export"], e.get("to"))
    pieces: dict = {}
    stats = {"bodies": 0, "rows": 0, "truncated": 0, "guards": 0, "exits": 0, "effects": 0, "decided_by": 0, "chain_rows": 0,
             "routers": 0, "mounted": 0, "k3": {}}
    for file, rec in sorted((flow.get("byFile") or {}).items()):
        bodies = (rec.get("flow") or {}).get("bodies") or {}
        local = set(bodies)
        for name, body in sorted(bodies.items()):
            stats["bodies"] += 1
            stats["rows"] += len(body.get("rows") or [])
            stats["truncated"] += bool(body.get("truncated"))
            rows = body.get("rows") or []
            if not any(not r.get("ctx") and r["k"] in ("ret", "throw") and _nav(r, rows)[0] for r in rows):
                continue
            owner = name.split(".", 1)[0]
            pid = f"fe:{file}#{owner}"
            if pid in pieces:
                continue
            binds = _binds(rows, rec.get("bindings") or {}, file, local)
            exits, effects = _exits(pid, file, rows, binds), _effects(pid, file, rows, binds)
            for x in exits:
                joined = [e["id"] for e in effects if _covers(e["when"], x["when"])]
                if joined:
                    x["effects"] = joined
                if (d := _decided(x, bridge, forms)):
                    x["decided_by"] = d
            pieces[pid] = {"form": "guard", "at": f"{file}:{body.get('line')}", **({"via": name.split(".", 1)[1]} if "." in name else {}),
                           **({} if pid in fe_ids else {"structure": "no fe piece"}),
                           "hooks": {k: v[0] for k, v in sorted(binds.items()) if str(v[0]).startswith("fe:")}, "exits": exits, "effects": effects}
    routers = _routers(flow)
    nodes = _mounts(routers, flow, set(pieces))
    found = []
    for pid, g in pieces.items():
        g["mounts"] = sum(1 for n in nodes if pid in n["own"])
        g["chain"] = _chain(pid, pieces, nodes)
        g["k3"] = _k3(pid, pieces, nodes, bool(routers))
        stats["guards"] += 1
        stats["mounted"] += bool(g["mounts"])
        stats["exits"] += len(g["exits"])
        stats["effects"] += len(g["effects"])
        stats["decided_by"] += sum(1 for x in g["exits"] if "decided_by" in x)
        stats["chain_rows"] += len(g["chain"])
        stats["k3"][g["k3"]["state"]] = stats["k3"].get(g["k3"]["state"], 0) + 1
        if g["k3"]["state"] == "loops":
            found.append({"id": "redirect-loop", "slot": F.FINDINGS["redirect-loop"]["slot"], "piece": pid,
                          "to": sorted({str(t["to"]) for t in g["k3"]["targets"] if t["state"] == "loops"})})
    stats["routers"] = len(routers)
    stats["k3"] = dict(sorted(stats["k3"].items()))
    frontend = {"pieces": dict(sorted(pieces.items())), "routers": [{"at": f"{f}:{rt.get('line')}", "callee": rt.get("callee")} for f, rt, _ in routers],
                "idioms": {"unknown": {}}}
    return frontend, stats, found
