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

WHAT THE BRANCH DOES (Slice 11e): every site — status, detail and code alike — keeps the rows inside its branch as
``does[]``: the call with its literal arguments, the value returned, the element rendered, a navigation, a retry, a cache
refresh, each with ``at``, in walk order, capped at ``FF.DOES_CAP`` (``does_more`` counts the rest), and a ``does_state``
(``FF.DOES_STATES``). The word above keeps its TEXTUAL selection, byte for byte; ``does[]`` is the STRUCTURAL subset of it
— a row whose guard stack is the comparison's own plus the branch condition, whose callback context never diverges, that
does not run only after the comparison was ruled out, and whose NEAREST preceding comparison of that reading is this one —
so ``does ⊆ inside`` and the word is never recomputed from it.
A class comes from a library binder or callee shape in ``_a3_forms_fe``, never a local name; ``other`` is always emitted
with its callee, and a call row says where its name came from (``from``). Rows carry no id (§A4 V33): ``at`` and order.

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
READ_M_RX = re.compile(r"\.(" + "|".join(FF.REASON_MEMBERS) + r")\b")
NAV_PLATFORM_RX, LOG_RX, STORAGE_RX = re.compile(FF.NAV_PLATFORM), re.compile(FF.LOG_CALLS), re.compile(FF.STORAGE_WRITES)
LIT_RX = re.compile(r"""(["'`])((?:(?!\1|\$\{).)*)\1""", re.S)      # one whole quoted literal, no interpolation
GROUP_WORDS = {"await", "typeof", "void", "return", "in", "of", "instanceof", "yield", "delete"}   # a `(` after one of these groups, it does not call
CLIP = 80                                                            # the extractor's clip on a value or a callee
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


def _pat(site: dict) -> "re.Pattern":
    """The branch condition as text: ``<left> <op> <literal>`` or ``<left> <op> <a dotted name>`` (a named constant). For a
    status the literal alternative is today's language, byte for byte; a string is quoted, as the source writes it."""
    v = site["right"]
    lit = (r"[\"'`]" + re.escape(v) + r"[\"'`]") if isinstance(v, str) else re.escape(str(v)) + r"\b"
    return re.compile(re.escape(site["left"]) + r"\s*" + re.escape(site["op"]) + r"\s*(?:(?P<lit>" + lit + r")|[A-Za-z_$][\w$.]*)")


def _inside(rows: list, site: dict) -> tuple:
    """``(pattern, later, inside)`` — the TEXTUAL selection the word rests on, unchanged."""
    pat = _pat(site)
    later = [r for r in rows if r is not site and r["line"] >= site["line"]]
    inside = [r for r in later if any(not g.get("neg") and pat.search(g["pred"]) for g in r.get("guards") or [])]
    return pat, later, inside


def _branch(later: list, inside: list, recv: str) -> str:
    if not inside:
        return "unread" if any(len(g["pred"]) >= 120 for r in later for g in r.get("guards") or []) else "value"
    if any(READ_RX.search(t) for r in inside for t in _texts(r)):
        return "reads"
    base = recv.split(".", 1)[0]
    if any(str(x).split(".", 1)[0] == base for r in inside if r["k"] == "call" for x in r.get("refs") or [] if x):
        return "passed"
    return "none"


def _binders(rows: list) -> dict:
    """``local name → (binder callee, member, index, binder line)`` from every call that binds names: ``const navigate =
    useNavigate()`` · ``const { error, refetch } = useMe()`` · ``const [note, setNote] = useState()``. A name two different
    callees bind is ambiguous and dropped."""
    out, clash = {}, set()
    for r in rows:
        if r["k"] != "call" or not r.get("binds"):
            continue
        for i, b in enumerate(r["binds"]):
            member, _, alias = str(b).partition(":")
            name = alias or member
            if not name:
                continue
            got = (str(r.get("callee") or ""), member if alias or len(r["binds"]) > 1 else None, i, r["line"])
            if name in out and out[name][0] != got[0]:
                clash.add(name)
            out.setdefault(name, got)
    return {k: v for k, v in out.items() if k not in clash}


def _own(r: dict, site: dict, pat, rows: list):
    """The match when ``r`` sits in the site's OWN branch: the comparison's guards plus the condition, one deeper; a
    callback context that never diverges; not a row that runs only after this comparison was ruled out; and the site is the
    NEAREST preceding comparison that reads the same (same left · operator · value — any value for a match through the
    named-constant alternative — equal guards, a context the row's can sit in). A comparison that only picks a value
    (``const ended = a && e.status === 403``) opens no branch: the identical ``if`` further down owns its own rows."""
    sg, sa, sc = site.get("guards") or [], site.get("after") or [], site.get("ctx") or []
    g, af, cx = r.get("guards") or [], r.get("after") or [], r.get("ctx") or []
    n = len(sg)
    if len(g) <= n or g[:n] != sg or g[n].get("neg"):
        return None
    m = pat.search(g[n]["pred"])
    if not m or any(a != b for a, b in zip(sc, cx)):
        return None
    if af[:len(sa)] != sa or any(pat.search(x["pred"]) for x in af[len(sa):]):
        return None
    lit = m.group("lit") is not None
    near = [c for c in rows if c["k"] == "cmp" and c.get("left") == site.get("left") and c.get("op") == site.get("op")
            and (not lit or c.get("right") == site.get("right")) and (c.get("guards") or []) == sg and c["line"] <= r["line"]
            and all(a == b for a, b in zip(c.get("ctx") or [], cx))]
    if not near or max(c["line"] for c in near) != site["line"]:   # two that read the same on ONE line both keep the rows, and say `mixed`
        return None
    return m


def _from(base: str, binders: dict, params: set, bindings: dict, file: str, local: set) -> str | None:
    if base in binders:
        return "bind:" + _leaf(binders[base][0])
    if base in params:
        return "param"
    got = _resolve(base, bindings, file, local)
    return got if got.startswith(("fe:", "ext:")) else None


def _does_row(r: dict, sibs: list, recv: str, eps: list, reach, binders: dict, params: set, bindings: dict, file: str, local: set, stores: set) -> dict:
    """One row of the branch, classed by the ladder ``FF.DOES_CLASSES`` (first match wins)."""
    k = r["k"]
    row = {"k": k, "at": f"{file}:{r['line']}"}
    raw = str(r.get("callee") or "")
    callee = re.sub(r"\s*(\?\.|\.)\s*", r"\1", raw)       # the extractor folds a wrapped chain to `res .json`: join it to match, keep the row's text
    base, leaf = callee.split(".", 1)[0].split("(", 1)[0], _leaf(callee) if callee else ""
    if k in ("call", "new", "throw") and callee:
        row["callee"] = raw
        if len(callee) >= CLIP or (k == "throw" and len(callee) >= 60):
            row["clipped"] = True
    if r.get("args"):
        row["args"] = r["args"]
    if r.get("props"):
        row["props"] = r["props"]
    if k in ("call", "new") and base and (src := _from(base, binders, params, bindings, file, local)):
        row["from"] = src

    def nav_to():
        jsx = next((x for x in sibs if x["k"] == "jsx" and x.get("tag") in FF.NAV_ELEMENTS), None)
        to = ((jsx or {}).get("props") or {}).get("to") or (r.get("props") or {}).get("to")
        if to is None and r.get("args") and isinstance(r["args"][0], str):
            to = r["args"][0]
        return to if isinstance(to, str) else None

    if k == "throw":
        if leaf in FF.NAV_THROWS:
            row.update({"class": "navigate", "to": nav_to()})
        else:
            row.update({"class": "throw", "value": r.get("value")})
            if isinstance(r.get("value"), str) and len(r["value"]) >= CLIP:
                row["clipped"] = True
            sib = next((x for x in sibs if x["k"] in ("new", "call") and x.get("callee") == r.get("callee")), None)
            for key in ("args", "props"):
                if sib and sib.get(key):
                    row[key] = sib[key]
    elif k == "ret":
        v = r.get("value")
        if r.get("jsx") in FF.NAV_ELEMENTS:
            row.update({"class": "navigate", "tag": r["jsx"], "to": nav_to()})
        elif r.get("jsx"):
            row.update({"class": "render", "tag": r["jsx"], **({"tags": r["tags"]} if r.get("tags") else {})})
        else:
            row.update({"class": "return", "value": v})
            lit = LIT_RX.fullmatch(v) if isinstance(v, str) and len(v) < CLIP else None
            if v is None:
                row["bare"] = True
            elif r.get("null"):
                row["null"] = True
            elif lit:
                row["literal"] = lit.group(2)
            elif r.get("obj"):
                row["obj"] = r["obj"]
            if isinstance(v, str) and len(v) >= CLIP:
                row["clipped"] = True
    elif k == "jsx":
        row.update({"class": "navigate", "tag": r.get("tag"), "to": ((r.get("props") or {}).get("to") if isinstance((r.get("props") or {}).get("to"), str) else None)}
                   if r.get("tag") in FF.NAV_ELEMENTS else {"class": "render", "tag": r.get("tag")})
    else:                                                   # call · new
        rb = recv.split(".", 1)[0]
        bound = binders.get(base)
        fetch = _fetch_call(r) if k == "call" else None
        ep = reach.endpoint(*fetch) if fetch else None
        shaped = leaf == "fetch" or leaf.upper() in VERBS or isinstance((r.get("opts") or {}).get("method"), str)
        client = "." in callee or str(row.get("from") or "").startswith(("fe:", "ext:"))
        if fetch and not (shaped or (ep and client)):
            fetch = ep = None                               # a literal path alone is not a request: `navigate("/me")` handed in as a prop joins GET /me by accident — a request has the shape of one, or reaches a known endpoint through a client
        undotted_bound = "." not in callee and bound
        member = leaf if "." in callee else ((bound[1] or base) if bound else None)   # `const { error, refetch } = useMe()` — the member is the binder's key
        pair = bound and rb in binders and binders[rb][3] == bound[3] and binders[rb][0] == bound[0]
        same = (base == rb or pair) if "." in callee else bool(pair)
        if ((undotted_bound and _leaf(bound[0]) in FF.NAV_BINDERS) or (bound and _leaf(bound[0]) in FF.NAV_ROUTER_BINDERS and member in FF.NAV_ROUTER_METHODS)
                or callee in FF.NAV_STATIC or ("." not in callee and callee in FF.NAV_CALLS) or NAV_PLATFORM_RX.fullmatch(callee)):
            row.update({"class": "navigate", "to": nav_to()})
        elif (member in (FF.MUTATE_CALLS | FF.REFETCH_MEMBERS) and same) or (ep and ep in eps):
            row.update({"class": "retry", "how": "fetch" if ep and ep in eps and not same else member})
        elif "." in callee and leaf in FF.INVALIDATE_CALLS:
            row.update({"class": "refresh", "how": "invalidate", "key": (r.get("props") or {}).get("queryKey") or (r.get("args") or [None])[0]})
        elif "." in callee and leaf in (FF.CACHE_WRITE_CALLS | FF.SEED_CALLS):
            row.update({"class": "refresh", "how": "write", "key": (r.get("args") or [None])[0]})
        elif ("." in callee or bound) and member in FF.REFETCH_MEMBERS:
            row.update({"class": "refresh", "how": "refetch"})
        elif fetch or (("." in callee or bound) and member in FF.MUTATE_CALLS):
            row.update({"class": "request", **({"method": fetch[0], "path": fetch[1]} if fetch else {}), **({"endpoint": ep} if ep else {})})
        elif undotted_bound and _leaf(bound[0]) in FF.MESSAGE_BINDERS and FF.MESSAGE_BINDERS[_leaf(bound[0])] in (None, bound[1]):
            row.update({"class": "message", "key": r["args"][0] if r.get("args") and isinstance(r["args"][0], str) else None})
        elif base in FF.SURFACE_CALLS and (callee == base or leaf in FF.SURFACE_LEVELS):
            row.update({"class": "surface", "level": leaf if leaf in FF.SURFACE_LEVELS else None})
        elif (undotted_bound and _leaf(bound[0]) in FF.STATE_BINDERS and bound[2] == 1):
            row.update({"class": "state", "how": "setter"})
        elif bound and _resolve(bound[0], bindings, file, local) in stores:
            row.update({"class": "state", "how": "store"})
        elif STORAGE_RX.fullmatch(callee):
            row.update({"class": "state", "how": "storage"})
        elif LOG_RX.fullmatch(callee):
            row.update({"class": "log", "level": leaf})
        else:
            row["class"] = "other"
    reads = sorted({m for t in _texts(r) for m in READ_M_RX.findall(t)})
    if reads:
        row["reads"] = reads
    if k == "call" and any(str(x).split(".", 1)[0] == recv.split(".", 1)[0] for x in r.get("refs") or [] if x):
        row["passes"] = True
    return row


def _handed_back(value: str, left: str) -> bool:
    """The returned text hands the comparison itself back — ``isApiError(e) && e.status === 409`` — and not a value the
    comparison picks (``e.status === 401 ? null : "kept"``) or an argument of a call (``set({ token: e.status === … })``)."""
    i = value.find(left)
    if i < 0:
        return False
    stack = []                                              # "c" a call, an object or an array the comparison sits inside · "g" a grouping parenthesis
    for j, ch in enumerate(value[:i]):
        if ch in "({[":
            word = re.search(r"([\w$]+|[)\]])\s*$", value[:j])
            stack.append("c" if ch != "(" or (word and word.group(1) not in GROUP_WORDS) else "g")
        elif ch in ")}]" and stack:
            stack.pop()
    return "c" not in stack and "?" not in value[i:].replace("?.", "")


def _does(rows: list, body: dict, site: dict, pat, inside: list, recv: str, eps: list, reach, file: str, stores: set) -> tuple:
    """``(does[], state, narrowed, more)`` for one site — see the module docstring."""
    bindings, local = reach.files[file].get("bindings") or {}, reach.local[file]
    ps = body.get("params") or []
    binders = _binders(rows)
    params = {p for p in ps if isinstance(p, str)} | {(x.partition(":")[2] or x) for p in ps if isinstance(p, list) for x in p if isinstance(x, str)}
    sg, sa, sc = site.get("guards") or [], site.get("after") or [], site.get("ctx") or []
    own = [(r, m) for r in inside if (m := _own(r, site, pat, rows))]
    acts = [(r, m) for r, m in own if r["k"] not in ("cmp", "let")]
    out, skip = [], set()
    for i, (r, m) in enumerate(acts):
        if id(r) in skip:
            continue
        sibs = [x for x, _ in acts if x is not r and x["line"] == r["line"]]
        if r["k"] == "throw":                                 # the same-line `new Error(…)` is the throw's own
            skip.update(id(x) for x in sibs if x["k"] in ("new", "call") and x.get("callee") == r.get("callee"))
        if r["k"] == "ret":
            v = re.sub(r"^(?:await|void)\s+", "", str(r.get("value") or ""))
            call = next((x for x in sibs if x["k"] in ("call", "new") and x.get("callee") and v.startswith(("new " if x["k"] == "new" else "") + x["callee"] + "(")), None)
            if call is not None and not r.get("jsx"):        # `return describe(err)` · `return new Response("")` — one row: the call, marked returned
                continue
            if r.get("jsx"):                                  # a returned tree is ONE row
                skip.update(id(x) for x, _ in acts if x["k"] == "jsx" and x["line"] >= r["line"] and (x.get("ctx") or []) == (r.get("ctx") or []))
        row = _does_row(r, sibs, recv, eps, reach, binders, params, bindings, file, local, stores)
        nxt = acts[i + 1][0] if i + 1 < len(acts) else None   # `NextResponse.redirect(new URL("/path", base))` — the walker emits the argument's row next, on its own line when wrapped
        if (row.get("class") == "navigate" and row.get("to") is None and nxt is not None and nxt["k"] == "new" and nxt.get("callee") == "URL"
                and (nxt.get("guards") or []) == (r.get("guards") or []) and (nxt.get("ctx") or []) == (r.get("ctx") or [])
                and nxt.get("args") and isinstance(nxt["args"][0], str)):
            row["to"] = nxt["args"][0]
            skip.add(id(nxt))
        if r["k"] in ("call", "new") and any(x["k"] == "ret" and not x.get("jsx") and re.sub(r"^(?:await|void)\s+", "", str(x.get("value") or "")).startswith(("new " if r["k"] == "new" else "") + str(r.get("callee")) + "(") for x in sibs):
            row["returned"] = True
        if len(r.get("ctx") or []) > len(sc):
            row["in"] = (r.get("ctx") or [])[len(sc):]
        when = (r.get("guards") or [])[len(sg) + 1:] + (r.get("after") or [])[len(sa):]
        if when:
            row["when"] = when
        if m.group("lit") is None:
            row["by"] = "name"
        out.append(row)
    more = max(0, len(out) - FF.DOES_CAP)
    out = out[:FF.DOES_CAP]
    if out:
        twin = any(c is not site and c["k"] == "cmp" and c.get("left") == site.get("left") and c.get("op") == site.get("op") and c.get("right") == site.get("right")
                   and (c.get("guards") or []) == sg and c["line"] == site["line"]
                   and all(a == b for a, b in zip(sc, c.get("ctx") or [])) for c in rows)
        state = "mixed" if twin else "read"                   # two comparisons that read the same ON ONE LINE: the nearest rule cannot part their rows
    elif own:
        state = "empty"
    elif any(x["k"] == "ret" and (x.get("guards") or []) == sg and (x.get("ctx") or []) == sc and x["line"] <= site["line"] and _handed_back(str(x.get("value") or ""), str(site.get("left"))) for x in rows):
        state = "beyond one level"                            # the comparison IS the function's return value: its callers decide, and that is not followed
    elif body.get("truncated") or any(len(g["pred"]) >= 120 for r in rows if r["line"] >= site["line"] for g in (r.get("guards") or [])[len(sg):]):
        state = "unread"
    else:
        state = "no-rows"
    return out, state, len(own) < len(inside), more


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


def reason_part(flow: dict, forms: dict, hooks: dict, transport: dict, fe_ids: set | None = None, store_ids: set | None = None) -> tuple[dict, dict, list]:
    """``({sites[], readers{endpoint: [...]}}, stats, findings)`` — every status, detail and code comparison a client makes,
    the endpoints its receiver reaches, each endpoint's exits routed to the site that catches them."""
    reach = _Reach(flow, forms, hooks)
    endpoints = (forms or {}).get("endpoints") or {}
    sites, groups, narrowed = [], {}, 0
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
                     "receiver": recv, "reads": member, "op": r["op"], "value": value,
                     **({} if fe_ids is None or pid in fe_ids else {"classified": False})}   # §A4 V34: a body no arm classified
                n += 1
                pat, later, inside = _inside(rows, r)            # lifted above the member test: detail and code sites get does[] too
                if member == "status":
                    s["branch"] = _branch(later, inside, recv)   # the word: unchanged
                unique = {json.dumps(o, sort_keys=True): o for o in reach.origins(file, name, r, recv)}
                s["origins"] = [{"endpoints": [], **unique[k]} for k in sorted(unique)]
                s["endpoints"] = sorted({e for o in s["origins"] for e in o["endpoints"]})
                if r.get("ctx"):
                    s["ctx"] = list(r["ctx"])
                s["does"], s["does_state"], nar, more = _does(rows, body, r, pat, inside, recv, s["endpoints"], reach, file, store_ids or set())
                narrowed += 1 if nar else 0
                if more:
                    s["does_more"] = more
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
             "endpoints": len(readers), "routed": sum(1 for x in routed if x != "rest"), "rest": routed.count("rest"),
             "does": {"rows": sum(len(s["does"]) for s in sites), "narrowed": narrowed,
                      "sites": {k: sum(1 for s in sites if s["does_state"] == k) for k in FF.DOES_STATES},
                      "classes": {c: sum(1 for s in sites for d in s["does"] if d["class"] == c) for c in FF.DOES_CLASSES}}}
    found.sort(key=lambda f: (f["id"], f["at"], f.get("endpoint") or ""))
    return {"sites": sites, "readers": dict(sorted(readers.items()))}, stats, found
