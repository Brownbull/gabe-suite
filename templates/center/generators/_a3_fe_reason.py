"""Element forms — the FRONTEND reason map: the frontend arm's ``reason`` part (amendment 1 §A2 Slice 11c).

A client tells refusals apart by the status, detail or code it compares. A SITE is a comparison of ``<receiver>.status``
with an HTTP status, or of ``<receiver>.detail`` / ``.code`` with a string, in any body outside the transport files the
client part reads. Its ORIGINS walk the receiver back to the requests it can hold, three hops deep:

* ``hook`` — a name a project hook call binds (``const m = useCompleteSetup()`` → ``m.error``): the hook's fetches;
* ``cache-call`` — a name a query or mutation call binds in the body, or the first parameter of an ``on*`` callback given
  to one — or to ``m.mutate(…)``, which is ``m``'s request;
* ``fetch`` — a name a call given a literal path binds (``const res = await fetch("/api/v1/me")``,
  ``const { response } = await apiClient.PATCH("/…")``): the endpoint its method and path name;
* ``alias`` — ``const active = redo ? save : complete``: every name it may hold;
* ``catch`` — a catch parameter: the literal-path fetches and ``.mutateAsync`` calls in its try block;
* ``param`` — a parameter: each call site's argument; a destructured one, the JSX prop or the object argument's property;
* ``unknown`` with a reason.

A fetch reaches the endpoint its method and normalised path name (``_a3_graph._norm_path``); a hook call with no such
fetch falls back to its bridge edge. For each endpoint a receiver reaches, every produced exit is ROUTED, in line order, to
the first site that covers it — a status comparison that holds for its status, a detail or code its text says — else
``rest``. A status site's ``branch`` says how the branch it opens reads the refusal: ``reads`` a detail or code ·
``passed`` hands the receiver to a call · ``none`` · ``value`` (the comparison is a value, no branch holds rows) ·
``unread`` (a clipped condition).

Findings: ``reason-collapsed`` (nag) — a status site whose branch is ``none`` or ``value`` while the endpoint's
``shared-status`` names that status; ``branch-unproduced`` (count) — a status site no reached endpoint produces;
``client-detail-unmatched`` (count) — a detail or code site whose text no reached exit says. Both need a complete
catalogue: every reached endpoint has a form, every exit a status, a status site ≥ 400, no exit text computed at runtime.
A site that reaches no endpoint fires nothing. Site ids ``r-<sha10>`` hashed per piece (§A1), no lines.
"""
from __future__ import annotations

import json
import operator
import re

import _a3_forms as F
import _a3_forms_fe as FF
from _a3_fe_forms import _leaf, _resolve, _rid
from _a3_graph import _norm_path

HOPS = 3
OPS = {"===": operator.eq, "==": operator.eq, "!==": operator.ne, "!=": operator.ne,
       "<": operator.lt, ">": operator.gt, "<=": operator.le, ">=": operator.ge}
SITE_RX = re.compile(r"(.+?)\??\.(status|" + "|".join(FF.REASON_MEMBERS) + r")")
READ_RX = re.compile(r"\.(?:" + "|".join(FF.REASON_MEMBERS) + r")\b")
NAME_RX = re.compile(r"[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*")
CAST_RX = re.compile(r"\(\s*([A-Za-z_$][\w$.]*)\s+as\s+[^()]*\)(.*)")
CACHE = FF.CACHE_QUERY_CALLS | FF.CACHE_MUTATION_CALLS
VERBS = ("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS")


def _norm_recv(text: str) -> str:
    """``error?.x`` → ``error.x``; ``(error as { status?: number })`` → ``error``."""
    t = text.replace("?.", ".")
    m = CAST_RX.fullmatch(t)
    return m.group(1) + m.group(2) if m else t


def _site(r: dict) -> tuple | None:
    if r["k"] != "cmp" or r.get("rx") or r.get("op") not in OPS:
        return None
    m = SITE_RX.fullmatch(str(r.get("left")))
    if not m:
        return None
    recv, member, v = _norm_recv(m.group(1)), m.group(2), r.get("right")
    ok = (isinstance(v, int) and not isinstance(v, bool) and 100 <= v <= 599) if member == "status" else isinstance(v, str)
    return (recv, member, v) if ok and NAME_RX.fullmatch(recv) else None


def _texts(r: dict) -> list[str]:
    out = [r.get("value"), r.get("callee"), r.get("left"), *(r.get("refs") or []), *(r.get("props") or {}).values()]
    return [t for t in out if isinstance(t, str)]


def _branch(rows: list, site: dict, recv: str) -> str:
    pat = re.compile(re.escape(site["left"]) + r"\s*" + re.escape(site["op"]) + r"\s*(?:" + re.escape(str(site["right"])) + r"\b|[A-Za-z_$][\w$.]*)")
    later = [r for r in rows if r is not site and r["line"] >= site["line"]]
    inside = [r for r in later if any(not g.get("neg") and pat.search(g["pred"]) for g in r.get("guards") or [])]
    if not inside:
        return "unread" if any(len(g["pred"]) >= 120 for r in later for g in r.get("guards") or []) else "value"
    if any(READ_RX.search(t) for r in inside for t in _texts(r)):
        return "reads"
    base = recv.split(".", 1)[0]
    if any(str(x).split(".", 1)[0] == base for r in inside if r["k"] == "call" for x in r.get("refs") or [] if x):
        return "passed"
    return "none"


def _covers(site: dict, x: dict) -> bool:
    if site["reads"] == "status":
        return isinstance(x.get("status"), int) and OPS[site["op"]](x["status"], site["value"])
    said = x.get(site["reads"])
    return site["op"] in ("===", "==") and isinstance(said, str) and (
        said == site["value"] or f"'{site['value']}'" in said or f'"{site["value"]}"' in said)


def _provable(site: dict, exits: list) -> bool:
    """A site's miss is a finding only against a complete catalogue: every exit has a status (an app handler that sets it at
    runtime proves nothing absent); a status site names a refusal, ≥ 400 (the catalogue lists no success); a detail or code
    site is an equality and no exit's text is computed at runtime (``form: dynamic``)."""
    if any(not isinstance(x.get("status"), int) for x in exits):
        return False
    if site["reads"] == "status":
        return site["value"] >= 400
    return site["op"] in ("===", "==") and not any(x.get("form") == "dynamic" for x in exits)


def _o(kind: str, via: list, eps: list, reason: str) -> dict:
    return {"kind": kind, "via": via, "endpoints": eps} if eps else {"kind": kind, "via": via, "endpoints": [], "reason": reason}


def _param0(row: dict, key: str):
    v = (row.get("opts") or {}).get(key)
    ps = v.get("params") if isinstance(v, dict) else None
    return ps[0] if ps else None


def _fetch_call(r: dict) -> tuple | None:
    """``(method, path)`` when a call is given a literal path: its ``method`` option, else an HTTP-verb callee
    (``apiClient.GET``, ``axios.post``), else GET."""
    args = r.get("args") or []
    if r["k"] != "call" or not args or not isinstance(args[0], str) or not args[0].startswith(("/", "http", "*/")):
        return None
    method, leaf = (r.get("opts") or {}).get("method"), _leaf(r.get("callee")).upper()
    return (method if isinstance(method, str) else leaf if leaf in VERBS else "GET"), args[0]


def _prop_arg(row: dict, key: str):
    """A destructured parameter's value at a call site: the JSX prop, or the property of the call's object argument."""
    v = (row.get("props") or {}).get(key) if row["k"] == "jsx" else (row.get("opts") or {}).get(key)
    return v.get("ref") if isinstance(v, dict) else v


def _declares(r: dict, base: str) -> bool:
    return any((b.partition(":")[2] or b.partition(":")[0]) == base for b in r.get("binds") or [])


class _Reach:
    """The flow indexed for origin walks: bodies, callers by piece id, endpoints by (method, normalised path)."""

    def __init__(self, flow: dict, forms: dict, hooks: dict):
        self.files, self.hooks = flow.get("byFile") or {}, hooks
        self.local = {f: set(self.bodies(f)) for f in self.files}
        self.eps: dict = {}
        for key in sorted((forms or {}).get("endpoints") or {}):
            method, _, path = key.split(":", 1)[-1].partition(" ")
            self.eps.setdefault((method.upper(), _norm_path(path)), key)
        self.callers: dict = {}
        for f in sorted(self.files):
            bindings = self.files[f].get("bindings") or {}
            for name, body in sorted(self.bodies(f).items()):
                for r in body.get("rows") or []:
                    target = r.get("callee") if r["k"] == "call" else r.get("tag") if r["k"] == "jsx" else None
                    if target:
                        self.callers.setdefault(_resolve(target, bindings, f, self.local[f]), []).append((f, name, r))

    def bodies(self, file: str) -> dict:
        return ((self.files.get(file) or {}).get("flow") or {}).get("bodies") or {}

    def endpoint(self, method, path) -> str | None:
        return self.eps.get((str(method if isinstance(method, str) else "GET").upper(), _norm_path(str(path).replace("*", "{}"))))

    def hook_eps(self, pid: str, at: str | None = None) -> list:
        out: set = set()
        for c in (self.hooks.get(pid) or {}).get("calls") or []:
            if at is None or c["at"] == at:
                got = {e for f in c.get("fetch") or [] if (e := self.endpoint(f["method"], f["path"]))}
                out |= got or ({c["endpoint"]} if c.get("endpoint") else set())
        return sorted(out)

    def origins(self, file: str, name: str, row: dict, text: str, hops: int = 0, via: list = ()) -> list[dict]:
        """The requests the receiver ``text`` can hold where ``row`` of body ``(file, name)`` reads it."""
        via = [*via, f"{file}:{row['line']}"]
        if hops > HOPS:
            return [{"kind": "unknown", "via": via, "reason": f"past {HOPS} hops"}]
        base, _, rest = text.partition(".")
        body, bindings = self.bodies(file).get(name) or {}, self.files[file].get("bindings") or {}
        rows, owner, ctx = body.get("rows") or [], f"fe:{file}#{name.split('.', 1)[0]}", row.get("ctx") or []
        for depth in range(len(ctx) - 1, -1, -1):
            c = ctx[depth]
            if c.startswith("prop:"):
                host, _, key = c[5:].rpartition(".")
                calls = [r for r in rows if r["k"] == "call" and r.get("callee") == host and r["line"] <= row["line"] and _param0(r, key) == base]
                if not calls:
                    continue
                hc = max(calls, key=lambda r: r["line"])
                if _leaf(host) in CACHE:
                    return [_o("cache-call", via, self.hook_eps(owner, f"{file}:{hc['line']}"), f"{host} fetches no endpoint the forms hold")]
                if _leaf(host) in FF.MUTATE_CALLS and "." in host:
                    return self.origins(file, name, hc, host.rsplit(".", 1)[0], hops + 1, via)
                return [{"kind": "unknown", "via": via, "reason": f"a parameter of {host}'s {key} callback is not followed"}]
            if c == f"catch:{base}":
                i, eps, inner = next(j for j, r in enumerate(rows) if r is row), set(), []
                while i >= 0 and (rows[i].get("ctx") or [])[: depth + 1] == [*ctx[:depth], c]:
                    i -= 1
                while i >= 0 and (rows[i].get("ctx") or [])[: depth + 1] == [*ctx[:depth], "try"]:
                    r = rows[i]
                    if (fc := _fetch_call(r)):
                        eps |= {e for e in [self.endpoint(*fc)] if e}
                    elif r["k"] == "call" and _leaf(r.get("callee")) in FF.MUTATE_CALLS and "." in r["callee"]:
                        inner += self.origins(file, name, r, r["callee"].rsplit(".", 1)[0], hops + 1, via)
                    i -= 1
                return [_o("catch", via, sorted(eps), "the try block fetches nothing the forms hold"), *inner]
        decl = [r for r in rows if r["line"] <= row["line"] and r["k"] in ("let", "call") and _declares(r, base)
                and (r.get("ctx") or []) == ctx[: len(r.get("ctx") or [])]]
        if decl:
            d = max(decl, key=lambda r: r["line"])
            if d["k"] == "let":
                return [o for alt in d["alts"] for o in self.origins(file, name, d, alt, hops + 1, via)]
            if _leaf(d["callee"]) in CACHE:
                return [_o("cache-call", via, self.hook_eps(owner, f"{file}:{d['line']}"), f"{d['callee']} fetches no endpoint the forms hold")]
            if (fc := _fetch_call(d)):
                return [_o("fetch", via, [e for e in [self.endpoint(*fc)] if e], f"{fc[0]} {fc[1]} names no endpoint the forms hold")]
            target = _resolve(d["callee"], bindings, file, self.local[file])
            if target in self.hooks:
                return [_o("hook", via, self.hook_eps(target), f"{target} fetches no endpoint the forms hold")]
            return [{"kind": "unknown", "via": via, "reason": f"what {d['callee']} returns is not followed"}]
        for i, p in enumerate(body.get("params") or [] if "." not in name else []):
            if p == base:
                sites = [(f, n, r, (r.get("refs") or [])[i] if i < len(r.get("refs") or []) else None)
                         for f, n, r in self.callers.get(owner, []) if r["k"] == "call"]
            elif isinstance(p, list) and (key := next((x.partition(":")[0] for x in p if (x.partition(":")[2] or x) == base), None)):
                sites = [(f, n, r, _prop_arg(r, key)) for f, n, r in self.callers.get(owner, [])]
            else:
                continue
            out = []
            for f, n, r, arg in sites:
                arg = arg.replace("?.", ".") if isinstance(arg, str) else None
                if arg and NAME_RX.fullmatch(arg):
                    out += self.origins(f, n, r, arg + (f".{rest}" if rest else ""), hops + 1, via)
                else:
                    out.append({"kind": "unknown", "via": [*via, f"{f}:{r['line']}"], "reason": "the argument is not a name"})
            return out or [{"kind": "unknown", "via": via, "reason": f"no call site passes {base}"}]
        return [{"kind": "unknown", "via": via, "reason": f"{base} is not a hook value, alias, parameter or caught error"}]


def reason_part(flow: dict, forms: dict, hooks: dict, transport: dict) -> tuple[dict, dict, list]:
    """``({sites[], readers{endpoint: [...]}}, stats, findings)`` — every status, detail and code comparison a client makes,
    the endpoints its receiver reaches, each endpoint's exits routed to the site that catches them."""
    reach = _Reach(flow, forms, hooks)
    endpoints = (forms or {}).get("endpoints") or {}
    sites, groups = [], {}
    for file in sorted(reach.files):
        if file in (transport or {}):
            continue
        for name, body in sorted(reach.bodies(file).items()):
            if "." in name and name.split(".", 1)[0] in reach.bodies(file):   # a store action: its rows are the store body's
                continue
            rows, pid, n = body.get("rows") or [], f"fe:{file}#{name.split('.', 1)[0]}", 0
            for r in rows:
                if not (got := _site(r)):
                    continue
                recv, member, value = got
                s = {"id": _rid("r", pid, [name, recv, member, r["op"], value, n]), "piece": pid, "at": f"{file}:{r['line']}",
                     "receiver": recv, "reads": member, "op": r["op"], "value": value}
                n += 1
                if member == "status":
                    s["branch"] = _branch(rows, r, recv)
                unique = {json.dumps(o, sort_keys=True): o for o in reach.origins(file, name, r, recv)}
                s["origins"] = [{"endpoints": [], **unique[k]} for k in sorted(unique)]
                s["endpoints"] = sorted({e for o in s["origins"] for e in o["endpoints"]})
                sites.append(s)
                groups.setdefault((pid, name, recv), []).append(s)

    def produced(ep: str) -> list:
        e = endpoints.get(ep) or {}
        return e.get("produced") or (e.get("variants") or [{}])[0].get("produced") or []
    readers: dict = {}
    found = []
    for (pid, name, recv), group in groups.items():
        for ep in sorted({e for s in group for e in s["endpoints"]}):
            mine = [s for s in group if ep in s["endpoints"]]
            routes = [{"exit": x.get("id"), "status": x.get("status"), "site": next((s["id"] for s in mine if _covers(s, x)), "rest")} for x in produced(ep)]
            readers.setdefault(ep, []).append({"piece": pid, "fn": name, "receiver": recv, "routes": routes})
            shared = {f.get("status"): f for f in (endpoints.get(ep) or {}).get("findings") or [] if f.get("id") == "shared-status"}
            for s in mine:
                if s["reads"] == "status" and s["op"] in ("===", "==") and s["value"] in shared and s["branch"] in ("none", "value"):
                    found.append({"id": "reason-collapsed", "slot": F.FINDINGS["reason-collapsed"]["slot"], "piece": pid, "at": s["at"], "site": s["id"],
                                  "endpoint": ep, "status": s["value"], "details": shared[s["value"]].get("details") or []})
    for s in sites:                                   # an endpoint with no form, or an incomplete catalogue, proves nothing unproduced
        exits = [x for ep in s["endpoints"] for x in produced(ep)]
        if s["endpoints"] and all(ep in endpoints for ep in s["endpoints"]) and _provable(s, exits) and not any(_covers(s, x) for x in exits):
            fid = "branch-unproduced" if s["reads"] == "status" else "client-detail-unmatched"
            found.append({"id": fid, "slot": F.FINDINGS[fid]["slot"], "piece": s["piece"], "at": s["at"], "site": s["id"], "value": s["value"], "endpoints": s["endpoints"]})
    routed = [x["site"] for rs in readers.values() for rd in rs for x in rd["routes"]]
    stats = {"sites": len(sites), **{f"reads_{k}": sum(1 for s in sites if s["reads"] == k) for k in ("status", *FF.REASON_MEMBERS)},
             "joined": sum(1 for s in sites if s["endpoints"]), "unknown": sum(1 for s in sites if not s["endpoints"]),
             "endpoints": len(readers), "routed": sum(1 for x in routed if x != "rest"), "rest": routed.count("rest")}
    found.sort(key=lambda f: (f["id"], f["at"], f.get("endpoint") or ""))
    return {"sites": sites, "readers": dict(sorted(readers.items()))}, stats, found
