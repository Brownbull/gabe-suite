"""_ep_joins.py — joins of feed blocks the endpoint lab did not read before (split out of gen-endpoint-facts.py, 2026-09-20).

`inside_the_calls` (leftovers piece 6): functions{} · dependencies{} · what each function does here.
`field_rules` (leftovers piece 8): schemas{} · models{} · functions{}.at · middleware{}.registered_at — the rule on every
field and column, and the line every block can be opened at.
`client_joins` (leftovers piece 10, the lab half): frontend.reasons.readers — which client branch each ending reaches — and the
guards and screens tied to this endpoint BY THE FEED'S OWN JOINS, never by a name typed here. Nothing is extracted here: every value is the feed's own, and
a block the feed lacks is said so in the feed's state words."""
from __future__ import annotations

import collections
import re


def _short_detail(d):
    """`{'detail': 'Rate limit exceeded. Try again shortly.'}` → the sentence; a plain string stays."""
    if not d:
        return None
    m = re.match(r"^\{'detail': '(.*)'\}$", str(d))
    return m.group(1) if m else str(d)


def inside_the_calls(fj: dict, ID: str, forms_block: dict, functions: dict, security: dict, gsig: str, n_endpoints: int, insight_rec, insight_state: dict) -> None:
    """Leftovers piece 6 — a call that opens. Three carries, nothing invented:
    `forms.inside` = the feed's functions{} rows this endpoint reaches (raises with their condition and the answer each becomes HERE ·
    refusals · saves · savepoints · swallows), joined to the chain's call / collapsed rows by `file::fn`;
    `security.resolution` = this endpoint's dependencies{} rows in the order they are resolved (can it end a request · does it run code after the handler);
    `functions.does` = what each function's own code shows it doing here (faces the web · decides an ending · reads or writes data · gives context)."""
    FN, steps = fj.get("functions"), fj.get("steps") or {}
    short = lambda k: str(k or "").split("::")[-1]
    # ── inside ────────────────────────────────────────────────────────────────────────────────
    if FN is None:
        forms_block["inside"] = {"state": "absent", "why": "the feed carries no functions{} — the kinds reading is off", "functions": [], "calls": {}, "counts": {}}
    else:
        recs = []
        for key, f in FN.items():
            reach = next((r for r in (f.get("reached_by") or []) if r.get("root") == ID), None)
            if not reach:
                continue
            raises = []
            for r in f.get("raises") or []:
                here = [{"exit": t.get("exit"), "status": t.get("status"), "at": t.get("at")} for t in (r.get("translated_by") or []) if t.get("endpoint") == ID]
                lost = [{"exit": t.get("exit"), "status": t.get("status")} for t in (r.get("untranslated_at") or []) if t.get("endpoint") == ID]
                other = sum(1 for t in (r.get("translated_by") or []) + (r.get("untranslated_at") or []) if t.get("endpoint") != ID)
                raises.append({"cls": r.get("cls"), "msg": r.get("msg"), "pred": r.get("pred"), "at": r.get("at"), "through": r.get("through") or [],
                               "translation": r.get("translation"), "here": here, "uncaught_here": lost, "on_other_endpoints": other,
                               # the feed's word is app-wide; on THIS endpoint a failure is answered, left uncaught, or neither — it never borrows another endpoint's answer
                               "here_word": "translated" if here else ("uncaught" if lost else
                                            ("answered on another endpoint only" if r.get("translation") in ("translated", "mixed", "untranslated") else (r.get("translation") or "unknown")))})
            refusals = [{"at": r.get("at"), "pred": r.get("pred"), "status": r.get("status"),
                         "exit": next((t.get("exit") for t in (r.get("surfaces_on") or []) if t.get("endpoint") == ID), None)} for r in (f.get("refusals") or [])]
            recs.append({"fn": key, "name": short(key), "file": key.split("::")[0], "at": f.get("at"), "depth": reach.get("depth"), "via": reach.get("via"), "site": reach.get("site"),
                         "paths": reach.get("paths") or [], "raises": raises, "refusals": refusals,
                         "commits": [{"step": c, "op": (steps.get(c) or {}).get("op"), "at": (steps.get(c) or {}).get("at")} for c in (f.get("commits") or [])],
                         "savepoints": list(f.get("savepoints") or []), "swallows": list(f.get("swallows") or []),
                         "also_reached_by": sum(1 for r in (f.get("reached_by") or []) if r.get("root") != ID)})
        _line = lambda at: int(str(at or ":0").rsplit(":", 1)[-1]) if str(at or "").rsplit(":", 1)[-1].isdigit() else 0
        recs.sort(key=lambda r: (r["depth"] or 0, _line(r["site"]), r["fn"]))
        by_fn = {r["fn"]: r for r in recs}

        def under(key, seen=()):
            out = []
            for r in recs:
                if r["via"] == key and r["fn"] not in seen and r["fn"] != key:
                    out += [r["fn"]] + under(r["fn"], seen + (key,))
            return out
        calls = {}
        for p in forms_block.get("paths") or []:
            for c in p.get("chain") or []:
                if c.get("kind") in ("call", "collapsed") and c.get("fn") and c["fn"] not in calls:
                    opens = ([c["fn"]] if c["fn"] in by_fn else []) + under(c["fn"])
                    calls[c["fn"]] = {"opens": opens, "insight": insight_rec(c["fn"]),
                                      "n": {"raises": sum(len(by_fn[k]["raises"]) for k in opens), "refusals": sum(len(by_fn[k]["refusals"]) for k in opens),
                                            "commits": sum(len(by_fn[k]["commits"]) for k in opens), "savepoints": sum(len(by_fn[k]["savepoints"]) for k in opens),
                                            "swallows": sum(len(by_fn[k]["swallows"]) for k in opens)}}
        allr = [x for r in recs for x in r["raises"]]
        forms_block["inside"] = {"state": "present", "why": None, "functions": recs, "calls": calls, "insight": insight_state,
                                 "counts": {"functions": len(recs), "raises": len(allr), "raises_by_word": dict(collections.Counter(x["here_word"] for x in allr)),
                                            "refusals": sum(len(r["refusals"]) for r in recs), "commits": sum(len(r["commits"]) for r in recs),
                                            "savepoints": sum(len(r["savepoints"]) for r in recs), "swallows": sum(len(r["swallows"]) for r in recs),
                                            "deepest": max((r["depth"] or 0 for r in recs), default=0), "calls_on_chain": len(calls),
                                            "calls_that_open": sum(1 for v in calls.values() if v["opens"]), "calls_with_map_facts": sum(1 for v in calls.values() if v["insight"])},
                                 "reading": "the feed follows a failure ONE call down; a failure raised deeper says 'beyond one level' — the answer it becomes is not read"}
    # ── the helpers, in the order they are resolved ──────────────────────────────────────────
    DEP = fj.get("dependencies")
    if DEP is None:
        security["resolution"] = {"state": "absent", "why": "the feed carries no dependencies{} — the kinds reading is off", "rows": []}
    else:
        named = collections.defaultdict(list)
        for k in DEP:
            named[short(k)].append(k)

        def key_of(g):
            if g.get("fn") in DEP:
                return g["fn"]
            ks = named.get(g.get("name")) or []
            return ks[0] if len(ks) == 1 else None
        in_sig = lambda name: (name + ")") in gsig
        top = sorted(security.get("guards") or [], key=lambda g: (gsig.find(g["name"] + ")") if in_sig(g["name"]) else len(gsig), 0))
        order, asked = [], collections.defaultdict(list)

        def resolve(k, by):
            asked[k].append(by)
            if k in order:
                return
            for sub in (DEP.get(k) or {}).get("subdeps") or []:
                resolve(sub, short(k))
            order.append(k)
        unresolved = []
        for g in top:
            k = key_of(g)
            (resolve(k, "the handler") if k else unresolved.append(g.get("name")))
        rows = []
        for i, k in enumerate(order):
            d = DEP.get(k) or {}
            ex = [{"id": x.get("id"), "status": x.get("status"), "detail": _short_detail(x.get("detail")), "at": x.get("at"), "pred": x.get("pred"), "via": x.get("via")} for x in (d.get("exits") or [])]
            inh = [{"id": x.get("id"), "status": x.get("status"), "detail": _short_detail(x.get("detail")), "via": x.get("via")} for x in (d.get("inherited_exits") or [])]
            rows.append({"key": k, "name": short(k), "at": d.get("at"), "kind": d.get("kind"), "order": i + 1, "of": len(order), "asked_by": asked[k],
                         "exits": ex, "inherited_exits": inh, "can_end_the_request": bool(ex or inh), "subdeps": [short(x) for x in (d.get("subdeps") or [])],
                         "runs_after_the_handler": bool(d.get("teardown")), "effects": d.get("effects") or [], "applies_to": d.get("applies_to"), "endpoints": n_endpoints,
                         "in_the_map_list": any(key_of(g) == k for g in top), "present": k in DEP,
                         # the handler's OWN helpers are placed by its signature; a helper's helpers come in the feed's own order; a name the clipped signature does not show is a guess
                         "placed_by": ("the feed's order" if "the handler" not in asked[k] else "the signature" if in_sig(short(k)) else "a guess")})
        security["resolution"] = {"state": "present", "why": None, "rows": rows, "unresolved": unresolved,
                                  "rule": "the order the handler's signature asks for them, each one's own helpers first; a helper asked for twice keeps its first place",
                                  "signature_clipped": str(gsig).rstrip().endswith("…"),
                                  "counts": {"rows": len(rows), "guessed": sum(1 for r in rows if r["placed_by"] == "a guess"), "can_end": sum(1 for r in rows if r["can_end_the_request"]), "end_nothing": sum(1 for r in rows if not r["can_end_the_request"]),
                                             "after_the_handler": sum(1 for r in rows if r["runs_after_the_handler"]), "beyond_the_map_list": sum(1 for r in rows if not r["in_the_map_list"])}}
        by_name = {r["name"]: r for r in rows}
        for g in security.get("guards") or []:
            g["resolved"] = by_name.get(g["name"])
    # ── what each function does here ──────────────────────────────────────────────────────────
    walk = [functions["handler"]] + [x for lvl in functions.get("walk") or [] for x in lvl] if functions.get("handler", {}).get("loaded") else []
    keys = {str(x["id"]).replace("#", "::"): x for x in walk}
    decides = collections.defaultdict(set)
    for b in forms_block.get("branches") or []:
        decides[b.get("fn")].add("a fork that picks the ending")
    for c in ((forms_block.get("failure") or {}).get("catches") or []):
        decides[c.get("fn")].add("catches a failure")
    for r in forms_block.get("returns") or []:
        if r.get("status") is not None:
            decides[r.get("fn")].add("returns the answer")
    for r in (forms_block.get("inside") or {}).get("functions") or []:
        if r["raises"] or r["refusals"]:
            decides[r["fn"]].add("raises or refuses")
    for r in (security.get("resolution") or {}).get("rows") or []:
        if r["exits"]:
            decides[r["key"]].add("can end the request")
    data = collections.defaultdict(set)
    for p in forms_block.get("paths") or []:
        for st in ((p.get("effects") or {}).get("steps") or []):
            if st.get("fn"):   # a step with no table is the transaction itself: a flush, a commit, a rollback, a savepoint
                data[st["fn"]].add(("writes" if st.get("op") != "read" else "reads") if st.get("table") else "ends or holds a transaction")
    for k, x in keys.items():
        for o in x.get("ops") or []:
            data[k].add("writes" if o.get("rw") == "w" else "reads")
    context = {r["key"] for r in (security.get("resolution") or {}).get("rows") or []}
    every = list(dict.fromkeys(list(keys) + [k for k in list(decides) + list(data) + sorted(context) if k]))
    does = []
    for k in every:
        d = collections.OrderedDict()
        if keys.get(k, {}).get("handler") or (functions.get("handler") or {}).get("id", "").replace("#", "::") == k:
            d["faces the web"] = ["the route names it"]
        if decides.get(k):
            d["decides an ending"] = sorted(decides[k])
        if data.get(k):
            d["reads or writes data"] = sorted(data[k])
        if k in context:
            d["gives context"] = ["the handler is handed what it returns"]
        does.append({"fn": k, "name": short(k), "does": list(d), "why": d, "on_the_walk": k in keys})
    functions["does"] = {"rows": does, "two_or_more": sum(1 for r in does if len(r["does"]) >= 2), "none": sum(1 for r in does if not r["does"]), "of": len(does),
                         "by_role": dict(collections.Counter(w for r in does for w in r["does"])),
                         "rule": "a role is lit only when the function's own code shows it: the route names it · a fork, a catch, a raise or the answer is in it · a step of a route touches a table in it · the handler is handed what it returns"}
    functions["insight"] = insight_state


def field_rules(fj: dict, ID: str, identity: dict, schemas_out: dict, tables: list, functions: dict, forms_block: dict) -> dict:
    """Leftovers piece 8 — a card you can open. Joins, by name, what the feed already holds:
    a body FIELD's rule (must it be sent · its limits · the validators that also check it · its line) and its shape's policy on undeclared fields;
    a table COLUMN's rule (may it be empty · what fills it · what a delete of the row it points at does) and the table's unique and check rules;
    the LINE a function starts at (the feed's roster knows some, never all — the rest say so); where an app-wide step is switched on."""
    S, M, FN, MW = fj.get("schemas"), fj.get("models"), fj.get("functions") or {}, fj.get("middleware") or {}
    ep = (fj.get("endpoints") or {}).get(ID) or {}
    n = collections.Counter()
    # the handler's own line — the map's `flines` is the FILE's length, never a line to open
    if ep.get("line"):
        identity["line"] = ep["line"]; identity["at"] = f"{identity.get('file')}:{ep['line']}"
    identity["flines_is"] = "the file's length in lines — not a line to open"

    def schema_join(rec: dict) -> None:
        if not rec or not rec.get("present"):
            return
        n["shapes"] += 1
        s = (S or {}).get("schema:" + str(rec.get("name")))
        if not s:
            rec["rules"] = None
            rec["rules_why"] = "the feed carries no schemas{} — the short reading is off" if S is None else "the feed's schemas{} holds no shape of this name"
            return
        n["shapes_with_rules"] += 1
        vals = collections.defaultdict(list)
        for v in s.get("validators") or []:
            for fld in v.get("fields") or []:
                vals[fld].append({"name": v.get("name"), "kind": v.get("kind"), "at": v.get("at"), "normalises": v.get("normalises") or [],
                                  "rules": [{"msg": r.get("msg"), "pred": r.get("pred"), "type": r.get("type"), "at": r.get("at")} for r in (v.get("rules") or [])]})
        rec["at"] = s.get("at")
        rec["extra"] = {"policy": s.get("extra"), "at": s.get("extra_at"), "state": s.get("extra_state")}
        rec["rules"] = {f["name"]: {"required": bool(f.get("required")), "constraints": f.get("constraints") or {}, "at": f.get("at"), "annotation": f.get("annotation"),
                                    "validators": vals.get(f["name"]) or []} for f in (s.get("fields") or [])}
        n["fields"] += len(rec["rules"]); n["fields_limited"] += sum(1 for r in rec["rules"].values() if r["constraints"] or r["validators"])
        n["fields_required"] += sum(1 for r in rec["rules"].values() if r["required"])
        for sub in rec.get("nested") or []:
            schema_join(sub)
    for side in ("request", "response"):
        schema_join(schemas_out.get(side))

    for t in tables:
        n["tables"] += 1
        m = (M or {}).get("model:" + str(t.get("model")))
        if not m:
            t["rules"] = None
            t["rules_why"] = "the feed carries no models{} — the short reading is off" if M is None else "the feed's models{} holds no model of this name"
            continue
        n["tables_with_rules"] += 1
        f = m.get("file") or str(m.get("at") or "").rsplit(":", 1)[0]
        ln = lambda x: f"{f}:{x}" if isinstance(x, int) else x
        t["at"] = m.get("at")
        cons = m.get("constraints") or {}
        # the feed keys a column by its DATABASE name and says the Python attribute beside it; the map draws the attribute — join on what is drawn, keep both names
        t["rules"] = {"columns": {(v.get("attr") or c): {"type": v.get("type"), "nullable": v.get("nullable"), "nullable_from": v.get("nullable_from"), "primary_key": bool(v.get("primary_key")),
                                                        "default": v.get("default"), "server_default": v.get("server_default"), "fk": v.get("fk"), "at": ln(v.get("at")),
                                                        "db_name": c if v.get("attr") and v.get("attr") != c else None}
                                  for c, v in (m.get("columns") or {}).items()},
                      "uniques": [{"name": u.get("name"), "cols": u.get("cols") or [], "at": ln(u.get("at"))} for u in (cons.get("uniques") or [])],
                      "checks": [{"name": c.get("name"), "sql": c.get("sql"), "at": ln(c.get("at"))} for c in (cons.get("checks") or [])],
                      "indexes": [{"name": i.get("name"), "cols": i.get("cols") or [], "at": ln(i.get("at"))} for i in (cons.get("indexes") or [])]}
        n["columns"] += len(t["rules"]["columns"])
        n["columns_filled_by_db"] += sum(1 for v in t["rules"]["columns"].values() if v["server_default"] is not None)
        n["columns_cascade"] += sum(1 for v in t["rules"]["columns"].values() if (v["fk"] or {}).get("ondelete"))
        n["columns_renamed_in_db"] += sum(1 for v in t["rules"]["columns"].values() if v["db_name"])

    walk = ([functions["handler"]] if (functions.get("handler") or {}).get("loaded") else []) + [x for lvl in functions.get("walk") or [] for x in lvl]
    for x in walk:
        n["functions"] += 1
        at = (FN.get(str(x["id"]).replace("#", "::")) or {}).get("at")
        x["at"] = at
        if at:
            n["functions_with_line"] += 1
        else:
            x["at_why"] = "no feed carries this function's line — it opens at its file"

    for p in forms_block.get("paths") or []:
        for c in p.get("chain") or []:
            if c.get("kind") == "step" and not c.get("at"):
                n["steps"] += 1
                reg = (MW.get("middleware:" + str(c.get("label"))) or {}).get("registered_at")
                if reg:
                    c["at"] = reg; c["at_is"] = "where the step is added to the application"; n["steps_with_line"] += 1
    return {"counts": dict(n), "state": {"schemas": "present" if S else ("absent" if S is None else "empty"), "models": "present" if M else ("absent" if M is None else "empty")},
            "reading": "a rule is the feed's own reading of the declaration; which body fields a given ending actually read is in no feed"}


def client_joins(fj: dict, ID: str, forms_block: dict, climbed: list) -> None:
    """Leftovers piece 10, the lab half — what is already known about the client, joined and not typed.
    `readers`: every ending routed to the client branch it reaches (its own, or the general case), from frontend.reasons.readers.
    `guards`: a guard is tied to this endpoint when it READS a query whose key this endpoint's hook refreshes on success
              (hook.invalidates / hook.seeds → the query hook under that key → the guards whose conditions name that hook).
    `screens`: the forms pieces that live in the files of the components the lab's climb reaches from the fetching hook."""
    fe = fj.get("frontend") or {}
    F = forms_block.get("frontend")
    if not fe or F is None:
        return
    P = fe.get("pieces") or {}
    sites = {x.get("id"): x for x in ((fe.get("reasons") or {}).get("sites") or [])}
    exits = {x.get("id"): x for x in forms_block.get("exits") or []}
    readers = []
    for r in ((fe.get("reasons") or {}).get("readers") or {}).get(ID) or []:
        routes, by_site = [], collections.defaultdict(list)
        for rt in r.get("routes") or []:
            st, x = sites.get(rt.get("site")) or {}, exits.get(rt.get("exit")) or {}
            own = rt.get("site") != "rest"
            routes.append({"exit": rt.get("exit"), "status": rt.get("status"), "detail": x.get("detail"), "kind": x.get("kind"), "site": rt.get("site"), "own_branch": own,
                           "at": st.get("at"), "reads": st.get("reads"), "op": st.get("op"), "value": st.get("value"),
                           "does": st.get("does"), "does_state": st.get("does_state"), "does_more": st.get("does_more")})
            if own:
                by_site[rt.get("site")].append(rt.get("exit"))
        shared = [{"site": k, "at": (sites.get(k) or {}).get("at"), "reads": (sites.get(k) or {}).get("reads"), "exits": v,
                   "statuses": sorted({exits.get(e, {}).get("status") for e in v if exits.get(e, {}).get("status") is not None})} for k, v in by_site.items() if len(v) > 1]
        readers.append({"fn": r.get("fn"), "piece": r.get("piece"), "receiver": r.get("receiver"), "routes": routes, "shared": shared,
                        "n": {"routed": len(routes), "own_branch": sum(1 for x in routes if x["own_branch"]), "general": sum(1 for x in routes if not x["own_branch"])}})
    F["readers"] = readers
    # what each client branch DOES (Slice 11e), carried RAW by the place of its comparison — the probe recounts every route's rows against it
    F["branches"] = [{"site": k, "at": v.get("at"), "does": v.get("does"), "does_state": v.get("does_state"), "does_more": v.get("does_more")}
                     for k, v in sorted(sites.items()) if any(rt.get("site") == k for r in readers for rt in r["routes"])]
    F["does_state"] = ("present" if any(b["does_state"] is not None for b in F["branches"]) else "not_emitted") if F["branches"] else "absent"
    F["readers_state"] = "present" if readers else ("absent" if (fe.get("reasons") or {}).get("readers") is not None else "not_emitted")
    # what the success refreshes, and whether the call is tried again
    hook = F.get("hook") or {}
    call = next((c for c in hook.get("calls") or [] if c.get("endpoint") == ID), None) or {}
    touched = [{"key": x.get("key"), "how": "refetched", "at": x.get("at"), "when": x.get("when")} for x in call.get("invalidates") or []] + \
              [{"key": x.get("key"), "how": "filled in straight away", "at": x.get("at"), "when": x.get("when")} for x in call.get("seeds") or []]
    F["after_success"] = touched
    pol = (((fe.get("client") or {}).get("clients") or [{}])[0].get("policy") or {})
    side = "mutations" if call.get("kind") == "mutation" else "queries"
    F["retry"] = dict((pol.get(side) or {}).get("retry") or {"state": "unknown"}, kind=call.get("kind"), side=side)
    # the guards that read what this endpoint refreshes
    keys = [x["key"] for x in touched if isinstance(x.get("key"), list)]
    under = {}
    for pid, pc in P.items():
        if pc.get("form") != "hook":
            continue
        for c in pc.get("calls") or []:
            k = c.get("key")
            if c.get("kind") == "query" and isinstance(k, list):
                hit = next((key for key in keys if k[:len(key)] == key), None)
                if hit is not None:
                    under[pid] = {"key": hit, "endpoint": c.get("endpoint")}
    guards = []
    for pid in sorted(P):
        pc = P[pid]
        if pc.get("form") != "guard":
            continue
        reads = sorted({w.get("hook") for x in pc.get("exits") or [] for w in (x.get("when") or []) + (x.get("passed") or []) if w.get("hook") in under})
        if reads:
            guards.append(dict(pc, piece=pid, via=[dict(under[h], hook=h) for h in reads]))
    F["guards"] = guards
    F["guard"] = next((g for g in guards if g.get("effects")), guards[0] if guards else None)   # kept for the readers that take one; `guards` is the whole answer
    files = {str(c).split("#")[0] for c in climbed}
    F["screens"] = {pid: pc for pid, pc in P.items() if pid in climbed or pid.split("#")[0] in files}
    F["joins_rule"] = {"guards": "a guard reads a query whose key this endpoint's hook refetches or fills in on success",
                       "screens": "the pieces in the files of the components that reach the fetching hook", "typed_names": 0}
