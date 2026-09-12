#!/usr/bin/env python3
"""_a3_stacks_pydi.py — the PORT SEAM for Python: resolve a call through an injected abstraction.

The TypeScript arm (_a3_stacks_di) joins a constructor parameter property to graft's `implements`
edges. Python cannot be read that way, and the difference is not cosmetic:

  · A `Protocol` implementation declares NOTHING. `class FirebaseTokenVerifier:` has no base naming
    `TokenVerifier` — conformance is structural — so there is no `implements` edge to join on
    (gustify carries exactly 1 across 25,220 calls, and it is TypeScript's).
  · The binding is a FACTORY, not a constructor. `get_verifier() -> TokenVerifier` returns
    `FirebaseTokenVerifier(settings)` or `MockTokenVerifier()` on a condition.

So the factory IS the declaration, and it is a better one: its return annotation names the port, its
body names the implementations, and the branch it returns from names the predicate. Read with `ast`,
not regex — the shapes are exact and Python hands them over.

THE FOUR FACTS
  1. PORT      a class whose bases include Protocol / ABC, OR any class used as a factory's return
               annotation. `TokenVerifier`.
  2. IMPL      a class CONSTRUCTED and RETURNED by a function annotated `-> Port`, carrying the
               `if` test it returns under. Also a class that SUBCLASSES the port (`class X(BaseABC)`)
               — the abc idiom, where inheritance is declared.
  3. RECEIVER  a name annotated with the port: a function parameter (`verifier: TokenVerifier`), an
               annotated assignment, or an annotated attribute.
  4. CALL      `<receiver>.<method>(...)` inside a function — that function is the edge's source.

FLOORS, stated:
  · A port with several implementations and no distinguishing predicate yields an edge to EACH,
    marked `binding: "ambiguous"`. Reported, never resolved to one.
  · A receiver that arrives without an annotation is not traced — no inference from a name.
  · A factory returning a union, a dict lookup, or a class chosen at runtime is not read; the
    construction must be a literal `return Class(...)`.
  · `ast` only: a file that does not parse is skipped and counted, never guessed at.
"""
from __future__ import annotations

import ast
from pathlib import Path
from typing import Any

_SKIP = ("/.venv/", "/venv/", "/node_modules/", "/site-packages/", "/__pycache__/", "/.git/",
         "/build/", "/dist/", "/scripts/", "/docs/site/", "/templates/", "/graft/", "/migrations/",
         "/alembic/", "/vendor/")
_FILE_CAP = 6000
_ABSTRACT_BASES = frozenset({"Protocol", "ABC", "ABCMeta", "Generic"})
# `dict[str, CacheBackend]` is a DICT, not a cache backend. Unwrapping any subscript to its first
# capitalised element registered the container as a receiver, so `caches.get(name)` resolved to
# `RedisCacheBackend.get` — 76 such edges on tier3, every one of them a call on the container.
_CONTAINERS = frozenset({
    "list", "List", "dict", "Dict", "set", "Set", "frozenset", "FrozenSet", "tuple", "Tuple",
    "Sequence", "MutableSequence", "Mapping", "MutableMapping", "Iterable", "Iterator",
    "AsyncIterable", "AsyncIterator", "Collection", "Deque", "DefaultDict", "Counter"})
# A PORT must be an abstraction the PROJECT declares. Without this floor a factory annotated
# `-> Any` made `Any` a port and `MappingProxyType` its implementation — 414 phantom edges on
# gustify, drawing `recipe_techniques → ApplicationDefault`. Two guards: the name must be a class
# DEFINED in the scanned tree, and it must not be a typing or stdlib shape that means "some value".
_NOT_A_PORT = frozenset({
    "Any", "Optional", "Union", "Type", "Self", "None", "Object", "Dict", "List", "Tuple", "Set",
    "FrozenSet", "Sequence", "Mapping", "MutableMapping", "Iterable", "Iterator", "Awaitable",
    "Coroutine", "Callable", "Generator", "AsyncGenerator", "AsyncIterator", "Literal", "Final",
    "ClassVar", "Annotated", "TypeVar", "Generic", "Protocol", "ABC", "ABCMeta",
    "UUID", "Decimal", "Path", "Enum", "IntEnum", "StrEnum", "BaseModel", "Exception",
    "datetime", "date", "time", "timedelta", "Session", "AsyncSession", "Request", "Response"})


def _ann_name(node: ast.AST | None) -> str | None:
    """The bare class name of an annotation: `TokenVerifier`, `TokenVerifier | None`,
    `Optional[TokenVerifier]`, `Annotated[TokenVerifier, ...]` — the first Name that looks like a
    class. `None` when the annotation is not a plain class reference."""
    if node is None:
        return None
    if isinstance(node, ast.Name):
        return node.id if node.id[:1].isupper() else None
    if isinstance(node, ast.Attribute):
        return node.attr if node.attr[:1].isupper() else None
    if isinstance(node, ast.Subscript):
        outer = node.value
        base = outer.id if isinstance(outer, ast.Name) else (
            outer.attr if isinstance(outer, ast.Attribute) else None)
        if base in _CONTAINERS:
            return None                  # a container OF ports is not a port — see _CONTAINERS
        inner = _ann_name(node.slice)
        return inner or _ann_name(outer)
    if isinstance(node, ast.BinOp):                      # `X | None`
        return _ann_name(node.left) or _ann_name(node.right)
    if isinstance(node, ast.Tuple):
        for el in node.elts:
            got = _ann_name(el)
            if got:
                return got
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value if node.value[:1].isupper() else None
    return None


class _Walker(ast.NodeVisitor):
    """One pass per file: ports, factories, annotated receivers, and the calls on them."""

    def __init__(self, rel: str) -> None:
        self.rel = rel
        self.ports: dict[str, str] = {}          # PortName → rel (declared abstract)
        self.bases: dict[str, list[str]] = {}    # ClassName → [base names]
        self.factories: list[dict] = []          # {port, impl, pred, fn}
        self.recv: dict[str, dict[str, str]] = {}   # scope key → {name → PortName}
        self.calls: list[dict] = []              # {scope, name, method, line}
        self.methods: set[tuple[str, str]] = set()   # (ClassName, method) actually DEFINED here
        # names BOUND in each scope (assignments + parameters) — the shadowing guard reads this
        self.locals_of: dict[str, set[str]] = {}
        self._scope: list[str] = []

    # ── scope bookkeeping ────────────────────────────────────────────────
    def _key(self) -> str:
        return ".".join(self._scope)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        bases = [b.id for b in node.bases if isinstance(b, ast.Name)]
        bases += [b.attr for b in node.bases if isinstance(b, ast.Attribute)]
        # a generic base is still a base: `class SearchTool(Tool[str])` subclasses Tool. The
        # container guard in _ann_name would otherwise take these with it.
        for b in node.bases:
            if isinstance(b, ast.Subscript):
                v = b.value
                nm = v.id if isinstance(v, ast.Name) else (v.attr if isinstance(v, ast.Attribute) else None)
                if nm:
                    bases.append(nm)
        self.bases[node.name] = bases
        if _ABSTRACT_BASES & set(bases):
            self.ports[node.name] = self.rel
        self._scope.append(node.name)
        self.generic_visit(node)
        self._scope.pop()

    def _fn(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> None:
        if self._scope:                               # a def directly inside a class IS a method
            self.methods.add((self._scope[-1], node.name))
        # 3 · RECEIVERS — a parameter annotated with a class
        self._scope.append(node.name)
        key = self._key()
        # a constructor's annotated parameters belong to the CLASS: `def __init__(self, cache:
        # CacheBackend)` then `self.cache.get(...)` in a sibling method. Filing them under
        # `Class.__init__` left 41 tier3 sites — the dominant Python port shape — resolving nothing.
        _recv_key = ".".join(self._scope[:-1]) if node.name == "__init__" and len(self._scope) > 1 else key
        _loc = self.locals_of.setdefault(key, set())
        for a in list(node.args.args) + list(node.args.kwonlyargs) + list(node.args.posonlyargs):
            _loc.add(a.arg)
            port = _ann_name(a.annotation)
            if port:
                self.recv.setdefault(_recv_key, {})[a.arg] = port
        for sub in ast.walk(node):
            if isinstance(sub, ast.Assign):
                for t in sub.targets:
                    if isinstance(t, ast.Name):
                        _loc.add(t.id)
            elif isinstance(sub, (ast.For, ast.AsyncFor)) and isinstance(sub.target, ast.Name):
                _loc.add(sub.target.id)
        # 2 · FACTORY — a function whose RETURN annotation names a class, returning constructions
        ret = _ann_name(node.returns)
        if ret:
            # every `if` test in this function, and the returns that sit inside its BODY
            guards: list[tuple[str, set[int]]] = []
            for parent in ast.walk(node):
                if not isinstance(parent, ast.If):
                    continue
                try:
                    test = ast.unparse(parent.test)
                except Exception:  # noqa: BLE001
                    test = "<unparseable test>"
                inside = {id(s) for b in parent.body for s in ast.walk(b)}
                guards.append((test, inside))
            picked: list[dict] = []
            for sub in ast.walk(node):
                if not isinstance(sub, ast.Return) or not isinstance(sub.value, ast.Call):
                    continue
                fnode = sub.value.func
                cls = fnode.id if isinstance(fnode, ast.Name) else (
                    fnode.attr if isinstance(fnode, ast.Attribute) else None)
                if not cls or not cls[:1].isupper() or cls == ret:
                    continue
                pred = ""
                for test, inside in guards:
                    if id(sub) in inside:
                        pred = test                      # the innermost guard wins
                picked.append({"port": ret, "impl": cls, "pred": pred,
                               "fn": key, "file": self.rel})
            # A return with NO guard, in a factory whose OTHER return is guarded, is the FALLBACK
            # arm — `if REAL: return Firebase` / `return Mock`. Leaving its predicate empty read as
            # "unconditional", which is the opposite of true: it runs when the guard does NOT hold.
            _guarded = [x["pred"] for x in picked if x["pred"]]
            if len(picked) > 1 and _guarded:
                _neg = " and ".join("not (%s)" % g for g in dict.fromkeys(_guarded))
                for x in picked:
                    if not x["pred"]:
                        x["pred"] = _neg
            self.factories.extend(picked)
        self.generic_visit(node)
        self._scope.pop()

    visit_FunctionDef = _fn          # type: ignore[assignment]
    visit_AsyncFunctionDef = _fn     # type: ignore[assignment]

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        port = _ann_name(node.annotation)
        tgt = node.target
        name = tgt.id if isinstance(tgt, ast.Name) else (
            tgt.attr if isinstance(tgt, ast.Attribute) else None)
        if port and name:
            # `self.x: Port` inside a method describes the CLASS, not that method
            _k = self._key()
            if isinstance(tgt, ast.Attribute) and isinstance(tgt.value, ast.Name) \
                    and tgt.value.id == "self" and len(self._scope) > 1:
                _k = ".".join(self._scope[:-1])
            self.recv.setdefault(_k, {})[name] = port
        self.generic_visit(node)

    # 4 · CALL SITES — `<name>.<method>(` / `self.<name>.<method>(`
    def visit_Call(self, node: ast.Call) -> None:
        f = node.func
        if isinstance(f, ast.Attribute):
            base = f.value
            nm = None
            if isinstance(base, ast.Name):
                nm = base.id
            elif isinstance(base, ast.Attribute) and isinstance(base.value, ast.Name) \
                    and base.value.id == "self":
                nm = base.attr
            if nm:
                self.calls.append({"scope": self._key(), "name": nm, "method": f.attr,
                                   "line": getattr(node, "lineno", 0)})
        self.generic_visit(node)


def parse(repo: Path, wiring: dict[str, Any] | None = None) -> dict:
    """`{present, reason, edges[{s, t, via, port, impl, predicate, binding}], stats}`.

    `s`/`t` are graft-style `<file>#<qualname>` ids so the result folds into the calls substrate
    exactly like the TypeScript arm's. Never raises."""
    repo = Path(repo)
    res: dict = {"present": False, "reason": "", "edges": [], "stats": {
        "files": 0, "unparseable": 0, "ports": 0, "impls": 0, "receivers": 0, "sites": 0,
        "resolved": 0, "ambiguous": 0, "no_such_method": 0}}
    try:
        walkers: list[_Walker] = []
        n = 0
        for p in sorted(repo.rglob("*.py")):
            if n >= _FILE_CAP:
                break
            rel = p.relative_to(repo).as_posix()
            if any(s in "/" + rel for s in _SKIP) or rel.endswith(("_test.py",)) \
                    or "/tests/" in "/" + rel or p.name.startswith("test_"):
                continue
            n += 1
            try:
                tree = ast.parse(p.read_text(encoding="utf-8", errors="replace"))
            except Exception:  # noqa: BLE001
                res["stats"]["unparseable"] += 1
                continue
            w = _Walker(rel)
            w.visit(tree)
            walkers.append(w)
        res["stats"]["files"] = n
        res["stats"]["capped"] = n >= _FILE_CAP
        if res["stats"]["capped"]:
            res["stats"]["caveat"] = ("scan clipped at %d files — any port seam past the cap is "
                                      "unread" % _FILE_CAP)
        # MEASURE BEFORE ANY EARLY RETURN. These two are free — `w.recv`/`w.calls` are already
        # populated — and emitting them from inside the resolution loop published a 0 for
        # "never computed" on exactly the repos that return early. A zero that means two
        # different things is the defect `_a3_arms` exists to kill.
        res["stats"]["receivers"] = sum(len(v) for w in walkers for v in w.recv.values())
        res["stats"]["sites"] = sum(len(w.calls) for w in walkers)
        if n == 0:
            res["reason"] = "no Python files scanned — this tree carries none the scan admits"
            return res

        # ── the PORT registry: declared-abstract classes, plus every class a factory returns for
        ports: dict[str, str] = {}
        for w in walkers:
            ports.update({k: v for k, v in w.ports.items() if k not in _NOT_A_PORT})
        declared = {cls for w in walkers for cls in w.bases}   # every class the scan actually saw
        impls: dict[str, list[dict]] = {}        # PortName → [{cls, file, pred}]
        for w in walkers:
            for f in w.factories:
                port = f["port"]
                # A PORT MUST BE DECLARED ABSTRACT (Protocol / ABC). Accepting any return
                # annotation made every result dataclass a port: gastify read
                # RawGeminiExtractionResult / TransactionListItem as abstractions and drew
                # `_raw_output → Agent`. A factory only NAMES implementations for a port that
                # already declared itself one.
                # FLOOR: a concrete base used as an injected type, with no Protocol/ABC, is not
                # read — the census says the concept is present and this arm stayed silent.
                if f["impl"] == port or port in _NOT_A_PORT or port not in ports \
                        or port not in declared:
                    continue
                impls.setdefault(port, []).append(
                    {"cls": f["impl"], "file": f["file"], "pred": f["pred"]})
                ports.setdefault(port, f["file"])
        # the abc idiom: a class that SUBCLASSES a port is an implementation, declared
        for w in walkers:
            for cls, bases in w.bases.items():
                for b in bases:
                    if b in ports and b != cls:
                        if not any(x["cls"] == cls for x in impls.get(b, [])):
                            impls.setdefault(b, []).append({"cls": cls, "file": w.rel, "pred": ""})
        res["stats"]["ports"] = len(ports)
        res["stats"]["impls"] = sum(len(v) for v in impls.values())
        if not impls:
            res["reason"] = ("no abstraction has a known implementation: no factory returns a class "
                             "under a port-annotated return, and no class subclasses one")
            return res

        # WHICH METHODS EACH IMPLEMENTATION ACTUALLY DEFINES. Emitting `<Impl>.<method>` for every
        # registered implementation, unchecked, named an absent attribute in 115 of tier3's 507
        # edges (22.7%) — `.append`, `.extend`, `.setdefault`, `.load_from_state` — because the
        # roster is one level deep and the method lives on a sibling or a subclass.
        # Built from DEFINITIONS, never from call sites: a call-site roster would drop 12
        # legitimate call-free targets (PostgresCacheLock.owned, RedisCacheBackend.__init__, …).
        defines: set[tuple[str, str]] = set()
        for w in walkers:
            defines |= w.methods
        cls_file: dict[str, str] = {}
        for w in walkers:
            for cls in w.bases:
                cls_file.setdefault(cls, w.rel)
        for w in walkers:
            for f in w.factories:
                cls_file.setdefault(f["impl"], f["file"])

        for w in walkers:
            for c in w.calls:
                scope = c["scope"]
                port = None
                # the nearest enclosing scope that annotated this name. A name annotated in the
                # INNER scope shadows the class field of the same name — the outer annotation
                # describes a different object, and taking it draws a hop that never happens.
                parts = scope.split(".")
                while parts and port is None:
                    port = (w.recv.get(".".join(parts)) or {}).get(c["name"])
                    if port is None and c["name"] in (w.locals_of.get(".".join(parts)) or ()):
                        break                      # shadowed by a local — this call is not the port's
                    parts = parts[:-1]
                if not port or port not in impls:
                    continue
                targets = [t for t in impls[port] if (t["cls"], c["method"]) in defines]
                if not targets:
                    # the port has implementations, none of which defines this method — ABSTAIN and
                    # COUNT. The method is usually on a subclass the one-level roster never reached
                    # (onyx: 52 concrete connectors under BaseConnector), and naming a target that
                    # has no such attribute is worse than drawing nothing.
                    res["stats"]["no_such_method"] += 1
                    continue
                many = len(targets) > 1
                for t in sorted(targets, key=lambda x: x["cls"]):
                    f = cls_file.get(t["cls"]) or t["file"]
                    res["edges"].append({
                        "s": f"{w.rel}#{scope}", "t": f"{f}#{t['cls']}.{c['method']}",
                        "via": "binding", "port": port, "impl": t["cls"],
                        "predicate": t["pred"],
                        "binding": "ambiguous" if (many and not t["pred"]) else "selected",
                    })
                res["stats"]["resolved"] += 1
                if many:
                    res["stats"]["ambiguous"] += 1
        res["present"] = bool(res["edges"])
        if not res["present"]:
            res["reason"] = ("no call through a port-annotated receiver resolved: either no name is "
                             "annotated with an abstraction, or no such name is called")
    except Exception as exc:  # noqa: BLE001 — its own try/except, like every sibling arm
        return {"present": False, "reason": f"pydi arm error: {exc}", "edges": [],
                "stats": res["stats"]}
    return res
