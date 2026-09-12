#!/usr/bin/env bash
# Python port-seam battery — _a3_stacks_pydi's executable contract.
#
# Python cannot be read the way TypeScript was. A `Protocol` implementation declares NOTHING —
# `class FirebaseTokenVerifier:` has no base naming the port, conformance is structural — so there
# is no `implements` edge to join (gustify carries 1 across 25,220 calls, and it is TypeScript's).
# The FACTORY is the declaration instead: `get_verifier() -> TokenVerifier` returns
# `FirebaseTokenVerifier(settings)` under its predicate. Read with `ast`, so the shapes are exact.
#
# Every case below was a real defect first, measured on the study repos:
#   · accepting ANY return annotation as a port made `Any` a port and `MappingProxyType` its
#     implementation — 414 phantom edges on gustify, drawing `recipe_techniques → ApplicationDefault`
#   · accepting a non-abstract annotation made gastify's result dataclasses ports (`_raw_output → Agent`)
#   · the unguarded fallback `return MockTokenVerifier()` read as UNCONDITIONAL, which is the
#     opposite of true — it runs when the guard does NOT hold
# Hermetic: synthetic trees. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

mkdir -p "$T/app/auth"
cat > "$T/app/auth/verifier.py" <<'PYF'
from typing import Protocol


class TokenVerifier(Protocol):
    async def verify(self, token: str) -> str: ...


class MockVerifier:
    async def verify(self, token: str) -> str:
        return token


class RealVerifier:
    def __init__(self, settings): self.settings = settings

    async def verify(self, token: str) -> str:
        return token


def get_verifier(settings=None) -> TokenVerifier:
    if settings.provider is Mode.REAL:
        return RealVerifier(settings)
    return MockVerifier()
PYF
cat > "$T/app/auth/context.py" <<'PYF'
from auth.verifier import TokenVerifier


async def build_auth_context(token: str, verifier: TokenVerifier) -> str:
    return await verifier.verify(token)
PYF
# a result dataclass used as a return annotation is NOT a port (the gastify false positive)
cat > "$T/app/report.py" <<'PYF'
class Row:
    pass


class Agent:
    def run(self): return 1


def _raw_output(x) -> Row:
    return Agent()


def use(a: Row):
    return a.run()
PYF
# a factory annotated `-> Any` is NOT a port (the 414-edge gustify false positive)
cat > "$T/app/loose.py" <<'PYF'
from typing import Any


class Thing:
    def go(self): return 1


def make() -> Any:
    return Thing()


def caller(t: Any):
    return t.go()
PYF

if (cd "$GEN" && python3 - "$T/app" <<'PYDIPY'
import sys, pathlib
import _a3_stacks_pydi as P
o = P.parse(pathlib.Path(sys.argv[1]))
assert o["present"], o
st = o["stats"]
assert st["unparseable"] == 0, st

by = {}
for e in o["edges"]:
    by.setdefault(e["impl"], e)

# the hop the whole arm exists for, BOTH arms, with OPPOSITE predicates
assert set(by) == {"RealVerifier", "MockVerifier"}, f"resolved the wrong set: {sorted(by)}"
assert by["RealVerifier"]["s"] == "auth/context.py#build_auth_context", by["RealVerifier"]["s"]
assert by["RealVerifier"]["t"] == "auth/verifier.py#RealVerifier.verify", by["RealVerifier"]["t"]
assert by["RealVerifier"]["port"] == "TokenVerifier", by["RealVerifier"]
assert by["RealVerifier"]["predicate"] == "settings.provider is Mode.REAL", by["RealVerifier"]["predicate"]
assert by["MockVerifier"]["predicate"] == "not (settings.provider is Mode.REAL)", \
    f"the unguarded fallback must carry the NEGATION, not an empty predicate: {by['MockVerifier']['predicate']}"

# a PORT must be DECLARED ABSTRACT. A result dataclass and `Any` are not abstractions.
assert "Agent" not in by, "a result dataclass was read as a port (the gastify false positive)"
assert "Thing" not in by, "`Any` was read as a port (414 phantom edges on gustify)"
assert all(e["port"] == "TokenVerifier" for e in o["edges"]), \
    sorted({e["port"] for e in o["edges"]})
print("ok")
PYDIPY
) >/dev/null 2>&1; then ok; else bad "pydi: the factory declares · both arms · fallback negation · no false ports"; fi

# SILENT: a tree with an abstraction but no implementation, and an unparseable file
mkdir -p "$T/bare"
printf 'from typing import Protocol\n\n\nclass P(Protocol):\n    def go(self) -> int: ...\n' > "$T/bare/p.py"
printf 'def broken(:\n' > "$T/bare/bad.py"
if (cd "$GEN" && python3 - "$T/bare" <<'BAREPY'
import sys, pathlib
import _a3_stacks_pydi as P
o = P.parse(pathlib.Path(sys.argv[1]))
assert o["present"] is False, o
assert o["reason"], "silence must state itself"
assert o["stats"]["unparseable"] == 1, f"an unparseable file must be COUNTED, not guessed: {o['stats']}"
assert P.parse(pathlib.Path(sys.argv[1] + "-nope"))["present"] is False    # never raises
print("ok")
BAREPY
) >/dev/null 2>&1; then ok; else bad "pydi: honest-empty · unparseable counted · never raises"; fi

# ── the three fixes the port-seam review measured ──────────────────────────────
# Each was a real defect on the study repos, each is mutation-provable by reverting its guard.
mkdir -p "$T/shapes"
cat > "$T/shapes/ports.py" <<'PYF'
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar("T")


class Store(ABC):
    @abstractmethod
    def read(self) -> str: ...


class Tool(ABC, Generic[T]):
    @abstractmethod
    def run(self) -> T: ...


class DiskStore(Store):
    def read(self) -> str:
        return "disk"

    def flush(self) -> None:
        return None


class MemStore(Store):
    def read(self) -> str:
        return "mem"


class SearchTool(Tool[str]):
    def run(self) -> str:
        return "hit"
PYF
cat > "$T/shapes/use.py" <<'PYF'
from shapes.ports import Store, Tool


class Service:
    # constructor injection — the dominant Python port shape
    def __init__(self, store: Store, tools: dict[str, Tool]):
        self.store = store
        self.tools = tools

    def load(self) -> str:
        return self.store.read()

    def drop(self) -> None:
        # only DiskStore defines flush(); MemStore must NOT be a target
        return self.store.flush()

    def purge(self) -> None:
        # NO implementation defines purge() — the site must abstain, and say so
        return self.store.purge()

    def shadowed(self) -> str:
        # a LOCAL of the same name shadows the class field — this call is not the port's
        store = OtherThing()
        return store.read()

    def count(self) -> int:
        # `tools` is a DICT of ports, not a port
        return self.tools.get("x")


def run_tool(t: Tool) -> str:
    return t.run()
PYF
if (cd "$GEN" && python3 - "$T/shapes" <<'SHAPEPY'
import sys, pathlib
import _a3_stacks_pydi as P
o = P.parse(pathlib.Path(sys.argv[1]))
E = o["edges"]
pair = lambda: {(e["s"].split("#")[-1], e["t"].split("#")[-1]) for e in E}
got = pair()

# 1 · CONSTRUCTOR INJECTION resolves. `def __init__(self, store: Store)` then `self.store.read()`
#     in a SIBLING method: the param belongs to the CLASS, not to `__init__`. Filed under
#     `Service.__init__`, 41 tier3 sites resolved to nothing.
assert ("Service.load", "DiskStore.read") in got, f"constructor injection resolved nothing: {sorted(got)}"
assert ("Service.load", "MemStore.read") in got, sorted(got)

# 2 · the TARGET METHOD must EXIST on the implementation. `self.store.flush()` is DiskStore's
#     alone — MemStore.flush does not exist and must not be drawn. 115 of tier3's 180 resolutions
#     named an attribute the class never defines.
assert ("Service.drop", "DiskStore.flush") in got, f"a real method was dropped: {sorted(got)}"
assert ("Service.drop", "MemStore.flush") not in got, "drew a method the implementation never defines"
assert not [e for e in E if e["s"].endswith("Service.purge")], \
    "drew a method NO implementation defines"
assert o["stats"]["no_such_method"] == 1, f"an abstaining site must be COUNTED: {o['stats']}"

# 4 · SHADOWING. `store = OtherThing()` rebinds the name inside the method; the class field's
#     annotation describes a different object, and taking it draws a hop that never happens.
assert not [e for e in E if e["s"].endswith("Service.shadowed")], \
    f"a local shadowing the field took the field's port: {[e['t'] for e in E if e['s'].endswith('Service.shadowed')]}"

# 3a · a CONTAINER of ports is not a port. `dict[str, Tool]` receiving `.get(...)` resolved to
#      `SearchTool.get` — every such edge was a call on the container, 76 of them on tier3.
assert not [e for e in E if e["s"].endswith("Service.count")], \
    f"a dict[str, Tool] registered as a port receiver: {[e['t'] for e in E if e['s'].endswith('Service.count')]}"

# 3b · but a SUBSCRIPTED BASE still declares inheritance. `class SearchTool(Tool[str])` is only
#      visible through the subscript — the container guard ALONE deletes this correct edge.
assert ("run_tool", "SearchTool.run") in got, \
    f"the container guard took a generic-base implementation with it: {sorted(got)}"
print("ok")
SHAPEPY
) >/dev/null 2>&1; then ok; else bad "pydi: ctor injection · target method exists · container≠port, generic base IS a base"; fi


echo "stack-pydi: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
