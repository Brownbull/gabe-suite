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

echo "stack-pydi: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
