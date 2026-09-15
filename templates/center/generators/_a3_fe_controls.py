"""Element forms — FRONTEND controls, stores and optimistic updates: the frontend arm's ``controls`` and ``stores`` parts
(amendment 1 §A2 Slice 11d).

CONTROLS. A control is a JSX element a user acts on: a host tag in ``_a3_forms_fe.CONTROL_TAGS`` (``button`` · ``a``), or a
project component whose own body renders one with its props spread or its handler passed through (a design-system
``Button``). Each reads one state:

* ``disabled`` — ``disabled`` is literally set;
* ``unknown`` — props are spread at the site (a handler may arrive through them), or the handler is a parameter no call
  site renders;
* ``dead`` — no handler prop at all (finding ``dead-control``);
* ``maybe-dead`` — the handler does nothing (``() => {}``), is a destructured parameter some call site omits, is a
  ``type="submit"`` button with no form handler in the body, or the body renders a form that may submit it;
* ``live`` otherwise.

STORES. A store is an fe ``store`` piece whose declaration the flow run read as an initializer
(``create<T>()((set, get) => ({ … }))``): its initial values, and per action body ``<Store>.<key>`` the TRANSITIONS each
``set`` makes — ``reset`` (back to the initial literal) · ``set-literal`` · ``set-param`` · ``append`` · ``remove`` ·
``merge`` · ``expr``; whether anything outside the store names the action (finding ``action-uncalled``); K3 persistence —
``persisted`` (a ``persist`` wrapper and its name) · ``partial`` (the actions that write browser storage directly or through
a project helper, and the fields those actions set — not a proven persisted set) · ``memory``.

OPTIMISTIC. A mutation whose ``onMutate`` writes the query cache (``setQueryData``, or a call handed the ``useQueryClient()``
value) is optimistic; its ``rollback`` is ``defined`` when ``onError`` writes the cache again or reads its context, else
``missing`` (finding ``no-rollback``); ``reconcile`` says ``onSettled`` invalidates. Written onto the hook form's call. A
callback belongs to the mutation whose call precedes it in the body (line windows, as the hooks part reads them).

Control ids ``c-<sha10>`` hashed per piece (§A1).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import _a3_forms as F
import _a3_forms_fe as FF
from _a3_fe_forms import _leaf, _resolve, _rid

EMPTY_FN_RX = re.compile(r"\(\s*[\w$,\s]*\)\s*=>\s*(?:\{\s*\}|undefined|null|void 0)|noop|undefined")
STORAGE_RX = re.compile(FF.STORAGE_WRITES)
NAME_RX = re.compile(r"[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*")
STATES = ("live", "maybe-dead", "dead", "disabled", "unknown")


def _bodies(flow: dict, file: str) -> dict:
    return (((flow.get("byFile") or {}).get(file) or {}).get("flow") or {}).get("bodies") or {}


def _pmap(params) -> dict:
    """``{local name: prop key}`` of a body's parameters (a destructured ``{ onAdd: add }`` maps ``add`` → ``onAdd``)."""
    out = {}
    for p in params or []:
        for x in (p if isinstance(p, list) else [p]):
            if isinstance(x, str):
                key, _, local = x.partition(":")
                out[local or key] = key
    return out


def _control_components(flow: dict) -> dict:
    """``{piece id: {prop: condition}}`` — the props a component hands a host control, judged at each call site: ``*`` when
    it spreads its props onto one that sets no handler of its own, else the parameter keys it passes as a handler
    (``<button onClick={onDismiss}>`` → ``onDismiss``). A key whose button renders only when that prop is given is dropped
    (omitting it hides the button); a button rendered under another condition keeps it (``None`` = always rendered)."""
    out: dict = {}
    for file in flow.get("byFile") or {}:
        for name, body in _bodies(flow, file).items():
            names = _pmap(body.get("params"))
            for r in body.get("rows") or []:
                if r["k"] != "jsx" or r.get("tag") not in FF.CONTROL_TAGS:
                    continue
                props = r.get("props") or {}
                guards = [("!" if g.get("neg") else "") + g["pred"] for g in r.get("guards") or []]
                spread = re.match(r"[(\s]*([A-Za-z_$][\w$]*)", str(r.get("spread") or ""))     # `{...props}` — its own props, not a local object
                keys = {"*"} if spread and spread.group(1) in names and not any(h in props for h in FF.HANDLER_PROPS) else set()
                keys |= {names[props[h]] for h in FF.HANDLER_PROPS if isinstance(props.get(h), str) and props[h] in names
                         and not any(re.search(rf"\b{re.escape(props[h])}\b", g) for g in guards)}
                for k in keys:
                    out.setdefault(f"fe:{file}#{name}", {}).setdefault(k, []).append(" && ".join(guards))
    return {pid: {k: (None if "" in conds else conds[0]) for k, conds in keys.items()} for pid, keys in out.items()}


def _state(r: dict, handler, pmap: dict, has_form: bool, sites: list, submits: bool, conditional) -> tuple:
    """``submits``: a host ``button``, or a component that spreads its props onto one — the only controls a form can submit.
    ``conditional``: the condition a component renders its button under, when it never renders it unconditionally."""
    props = r.get("props") or {}
    if props.get("disabled") is True:
        return "disabled", None
    if r.get("spread"):
        return "unknown", "props are spread — a handler may arrive through them"
    if not handler:
        up = r.get("up") or {}
        if "asChild" in (up.get("attrs") or []):
            return "live", f"<{up['tag']} asChild> supplies its handler"
        if any(a in FF.CLICK_PROPS for a in up.get("attrs") or []):
            return "live", f"its parent <{up['tag']}> handles the click"
        if conditional:
            return "maybe-dead", f"renders its control only when {conditional}"
        if not submits:
            return "dead", None
        if props.get("type") == "submit":
            return ("live", "submits the form in this body") if has_form else ("maybe-dead", "a submit button with no form handler in this body")
        return ("maybe-dead", "a form in this body may submit it") if has_form else ("dead", None)
    v = props[handler]
    if isinstance(v, str) and EMPTY_FN_RX.fullmatch(v.strip()):
        return "maybe-dead", "the handler does nothing"
    if isinstance(v, str) and v in pmap:
        if any(not g.get("neg") and re.search(rf"\b{re.escape(v)}\b", g["pred"]) for g in r.get("guards") or []):
            return "live", None                                          # `{onMore && <button onClick={onMore}>}`: rendered only when given
        if not sites:
            return "unknown", f"no call site renders it — {v} is a parameter"
        miss = sum(1 for x in sites if pmap[v] not in (x.get("props") or {}) and not x.get("spread"))
        return ("maybe-dead", f"{miss} of {len(sites)} call sites omit {pmap[v]}") if miss else ("live", None)
    return "live", None


def controls_part(flow: dict, fe: dict) -> tuple[dict, dict, list]:
    """``({piece id: {at, controls[]}}, stats, findings)`` — every control a component renders and the state it reads."""
    files = flow.get("byFile") or {}
    comps = _control_components(flow)
    callers: dict = {}
    for file, rec in sorted(files.items()):
        bodies = _bodies(flow, file)
        if rec.get("story"):
            continue
        for body in bodies.values():
            for r in body.get("rows") or []:
                if r["k"] == "jsx":
                    callers.setdefault(_resolve(r["tag"], rec.get("bindings") or {}, file, set(bodies)), []).append(r)
    out, found = {}, []
    stats = {"controls": 0, "components": len(comps), **{s: 0 for s in STATES}}
    for file, rec in sorted(files.items()):
        if rec.get("story"):                                              # a story renders a showcase, not the app's controls
            continue
        bodies, bindings = _bodies(flow, file), rec.get("bindings") or {}
        for name, body in sorted(bodies.items()):
            if "." in name and name.split(".", 1)[0] in bodies:         # a store action: its rows are the store body's
                continue
            pid, rows = f"fe:{file}#{name.split('.', 1)[0]}", body.get("rows") or []
            pmap = _pmap(body.get("params"))
            has_form = any(r["k"] == "jsx" and r.get("tag") == "form" and ("onSubmit" in (r.get("props") or {}) or "action" in (r.get("props") or {})) for r in rows)   # `action` — a server action or a posting form
            controls = []
            for r in rows:
                if r["k"] != "jsx":
                    continue
                host = r["tag"] in FF.CONTROL_TAGS
                target = None if host else _resolve(r["tag"], bindings, file, set(bodies))
                if (host and pid in comps) or not (host or target in comps):
                    continue                                              # a control component's own element is its definition
                props = r.get("props") or {}
                accepts = {} if host else comps[target]
                keys = FF.HANDLER_PROPS if host else (FF.HANDLER_PROPS if "*" in accepts else ()) + tuple(sorted(k for k in accepts if k != "*"))
                handler = next((h for h in keys if h in props), None)
                submits = r["tag"] == "button" if host else "*" in accepts
                conditional = None if host or None in accepts.values() else sorted(accepts.values())[0]
                state, reason = _state(r, handler, pmap, has_form, callers.get(pid, []), submits, conditional)
                c = {"id": _rid("c", pid, [name, r["tag"], handler, len(controls)]), "at": f"{file}:{r['line']}", "tag": r["tag"], "state": state}
                if handler:
                    c["handler"] = {handler: props[handler]}
                if reason:
                    c["reason"] = reason
                if r.get("guards"):
                    c["when"] = [("!" if g.get("neg") else "") + g["pred"] for g in r["guards"]]
                controls.append(c)
                stats[state] += 1
                if state == "dead":
                    found.append({"id": "dead-control", "slot": F.FINDINGS["dead-control"]["slot"], "piece": pid, "at": c["at"], "tag": r["tag"]})
            if controls:
                out.setdefault(pid, {"at": f"{file}:{body.get('line')}", "controls": []})["controls"].extend(controls)
                stats["controls"] += len(controls)
    return out, stats, found


def _same(value, text) -> bool:
    try:
        return text is not None and json.loads(str(text).replace("'", '"')) == value
    except ValueError:
        return False


def _kind(field: str, value, params: dict, initial: dict) -> str:
    """One transition: a ``set`` object value (resolved by the extractor) or a callback's returned text."""
    if isinstance(value, dict) and value.get("ref") in ("null", "undefined"):
        value = None                                                     # `set({ token: null })` — the extractor keeps null as a name
    elif isinstance(value, dict):
        ref = str(value.get("ref"))
        return ("set-param" if NAME_RX.fullmatch(ref) and ref.split(".")[0] in params else "expr") if "ref" in value else "set-literal"
    return "reset" if _same(value, initial.get(field)) else "set-literal"


def _kind_text(field: str, text: str, params: dict, initial: dict) -> str:
    t, k = text.strip(), re.escape(field)
    if field.startswith("...") or re.match(rf"\{{\s*\.\.\.\s*[\w$]+\.{k}\b", t):
        return "merge"
    if re.match(rf"\[\s*\.\.\.\s*[\w$]+\.{k}\b", t):
        return "append"
    if re.match(rf"[\w$]+\.{k}\.filter\(", t):
        return "remove"
    try:
        return "reset" if _same(json.loads(t.replace("'", '"')), initial.get(field)) else "set-literal"
    except ValueError:
        return "set-param" if t in params else "expr"


def _transitions(file: str, ab: dict, set_name, initial: dict) -> list[dict]:
    """Each ``set`` an action makes, per field. A set back to the constant the store spreads as its initial value
    (``set(INITIAL)``, ``set({ ...INITIAL })``) is a ``reset`` of every field (``*``); a callback whose returned object the
    flow run cannot read is ``expr`` on ``*``."""
    out, params, rows = [], _pmap(ab.get("params")), ab.get("rows") or []
    readable = any(x["k"] == "ret" and x.get("obj") and (x.get("ctx") or [""])[-1] == f"callback:{set_name}" for x in rows)
    for r in rows:
        if not set_name:
            break
        at = f"{file}:{r['line']}"
        if r["k"] == "call" and r.get("callee") == set_name:
            if isinstance(r.get("opts"), dict) and r["opts"]:
                out += [{"field": "*", "kind": "reset" if f in initial else "merge", "at": at} if f.startswith("...")
                        else {"field": f, "kind": _kind(f, v, params, initial), "at": at} for f, v in r["opts"].items()]
            elif (r.get("refs") or [None])[0]:
                name = r["refs"][0]
                out.append({"field": "*", "kind": "reset" if f"...{name}" in initial else "set-param" if name.split(".")[0] in params else "expr", "at": at})
            elif not readable:
                out.append({"field": "*", "kind": "expr", "at": at})
        elif r["k"] == "ret" and r.get("obj") and (r.get("ctx") or [""])[-1] == f"callback:{set_name}":
            out += [{"field": f, "kind": _kind_text(f, "" if v is True else str(v), params, initial), "at": f"{file}:{r['line']}"} for f, v in r["obj"].items()]
    return out


def _storage_writers(flow: dict, file: str, ab: dict, bindings: dict, local: set) -> list[str]:
    out = []
    for r in ab.get("rows") or []:
        if r["k"] != "call":
            continue
        if STORAGE_RX.fullmatch(str(r.get("callee"))):
            out.append(r["callee"])
            continue
        target = _resolve(r["callee"], bindings, file, local)
        if target.startswith("fe:"):
            tf, tn = target[3:].split("#", 1)
            if any(x["k"] == "call" and STORAGE_RX.fullmatch(str(x.get("callee"))) for x in (_bodies(flow, tf).get(tn) or {}).get("rows") or []):
                out.append(target)
    return out


def _writes_cache(r: dict, clients: set) -> bool:
    return r["k"] == "call" and (_leaf(r.get("callee")) in FF.CACHE_WRITE_CALLS or any(x in clients for x in r.get("refs") or [] if x))


def stores_part(flow: dict, fe: dict, pieces: dict, repo=None) -> tuple[dict, dict, list]:
    """``({store piece id: {at, initial, actions, persist}}, stats, findings)``; optimistic facts are written onto the hook
    forms in ``pieces``. With ``repo``, callers are searched in the SOURCE of every file the flow run captured (a body cut at
    the row cap still names its calls there); the store's own file is searched by rows, outside the store body."""
    files = flow.get("byFile") or {}
    kinds = {p["id"]: p.get("kind") for p in (fe or {}).get("pieces") or []}
    texts = [(file, name, json.dumps([{k: v for k, v in r.items() if k not in ("line", "guards", "after")} for r in body.get("rows") or []]))
             for file in sorted(files) for name, body in sorted(_bodies(flow, file).items())]
    if repo is not None:
        for file in sorted(files):
            try:
                texts.append((file, None, (Path(repo) / file).read_text(encoding="utf-8", errors="replace")))
            except OSError:
                continue
    stores, found = {}, []
    stats = {"stores": 0, "actions": 0, "uncalled": 0, "transitions": {}, "persist": {}, "optimistic": 0, "rollback": {}}
    for file, rec in sorted(files.items()):
        bodies, bindings = _bodies(flow, file), rec.get("bindings") or {}
        for name, body in sorted(bodies.items()):
            pid = f"fe:{file}#{name}"
            if "wraps" not in body or kinds.get(pid) != "store":
                continue
            params = body.get("params") or []
            set_name = params[0] if params and isinstance(params[0], str) else None
            obj = next((r["obj"] for r in body.get("rows") or [] if r["k"] == "ret" and r.get("obj") and not r.get("ctx")), {})
            keys = {n.split(".", 1)[1] for n in bodies if n.startswith(name + ".")}
            initial = {k: v for k, v in obj.items() if k not in keys}
            actions, writers, fields, wkeys = {}, [], set(), []
            for key in sorted(keys):
                ab = bodies[f"{name}.{key}"]
                trans = _transitions(file, ab, set_name, initial)
                if (w := _storage_writers(flow, file, ab, bindings, set(bodies))):
                    writers += w
                    wkeys.append(key)
                    fields |= {t["field"] for t in trans if t["field"] != "*"}
                called = any(re.search(rf"\b{re.escape(key)}\b", t) for f2, n2, t in texts if not (f2 == file and n2 in (None, name, f"{name}.{key}")))
                actions[key] = {"at": f"{file}:{ab.get('line')}", "transitions": trans, "called": called}
                for t in trans:
                    stats["transitions"][t["kind"]] = stats["transitions"].get(t["kind"], 0) + 1
                if not called:
                    found.append({"id": "action-uncalled", "slot": F.FINDINGS["action-uncalled"]["slot"], "piece": pid, "action": key, "at": actions[key]["at"]})
            wrap = next((w for w in body["wraps"] if w.get("call") in FF.PERSIST_CALLS), None)
            if wrap:
                persist = {"state": "persisted", "via": wrap["call"], **({"name": wrap["opts"]["name"]} if isinstance((wrap.get("opts") or {}).get("name"), str) else {})}
            else:
                persist = ({"state": "partial", "writers": wkeys, "set_by_writers": sorted(fields), "via": sorted(set(writers))}   # the fields those actions set, not a proven persisted set
                           if writers else {"state": "memory"})
            stores[pid] = {"at": f"{file}:{body.get('line')}", "initial": initial, "actions": actions, "persist": persist}
            stats["stores"] += 1
            stats["actions"] += len(actions)
            stats["uncalled"] += sum(1 for a in actions.values() if not a["called"])
            stats["persist"][persist["state"]] = stats["persist"].get(persist["state"], 0) + 1
    for file, rec in sorted(files.items()):
        for name, body in sorted(_bodies(flow, file).items()):
            rows = body.get("rows") or []
            calls = sorted((r for r in rows if r["k"] == "call" and not r.get("ctx") and _leaf(r.get("callee")) in FF.CACHE_MUTATION_CALLS), key=lambda r: r["line"])
            clients = {b.partition(":")[2] or b for r in rows if r["k"] == "call" and _leaf(r.get("callee")) in FF.CLIENT_HOOKS for b in r.get("binds") or []}
            for i, m in enumerate(calls):
                opts = m.get("opts") or {}
                if not isinstance(opts.get("onMutate"), dict):
                    continue
                end = calls[i + 1]["line"] if i + 1 < len(calls) else float("inf")

                def window(key):
                    start = opts[key].get("line") if isinstance(opts.get(key), dict) else None
                    return [] if start is None else [r for r in rows if f"prop:{m['callee']}.{key}" in (r.get("ctx") or []) and start <= r["line"] < end]
                writes = [r for r in window("onMutate") if _writes_cache(r, clients)]
                if not writes:
                    continue
                err, ps = window("onError"), (opts.get("onError") or {}).get("params") if isinstance(opts.get("onError"), dict) else None
                context = ps[2] if ps and len(ps) > 2 and isinstance(ps[2], str) else None
                if any(_writes_cache(r, clients) for r in err):
                    rollback = {"rollback": "defined", "via": "cache write"}
                elif context and any(re.search(rf"\b{re.escape(context)}\b", json.dumps(r)) for r in err):
                    rollback = {"rollback": "defined", "via": "context"}
                else:
                    rollback = {"rollback": "missing"}
                o = {"writes": [f"{file}:{r['line']}" for r in writes], **rollback,
                     "reconcile": any(r["k"] == "call" and _leaf(r.get("callee")) in FF.INVALIDATE_CALLS for r in window("onSettled"))}
                pid = f"fe:{file}#{name.split('.', 1)[0]}"
                for c in (pieces.get(pid) or {}).get("calls") or (pieces.get(pid) or {}).get("cache") or []:
                    if c["at"] == f"{file}:{m['line']}":
                        c["optimistic"] = o
                stats["optimistic"] += 1
                stats["rollback"][o["rollback"]] = stats["rollback"].get(o["rollback"], 0) + 1
                if o["rollback"] == "missing":
                    found.append({"id": "no-rollback", "slot": F.FINDINGS["no-rollback"]["slot"], "piece": pid, "at": f"{file}:{m['line']}"})
    for k in ("transitions", "persist", "rollback"):
        stats[k] = dict(sorted(stats[k].items()))
    found.sort(key=lambda f: (f["id"], f["at"]))
    return stores, stats, found
