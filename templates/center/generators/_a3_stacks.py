#!/usr/bin/env python3
"""_a3_stacks.py — the ARMS REGISTER: which module claims which map CONCEPT, for which stack.

The pipeline grew around FastAPI + Python, so "0 tables" has always meant two different things —
*this app has none* and *nobody ever wrote a detector for this app's idiom* — and the map said the
same number for both. The register is the first half of fixing that: a declaration of who claims
what, so a later census (step 3) can name a concept nobody covers instead of rendering an empty
column that reads as a fact.

THE REGISTER NEVER SELECTS. Every registered module's producers run unconditionally, exactly as
build_center_a3 runs them today; `probe()` only ever REPORTS. This is a deliberate refusal of the
winner-take-all shape in _a3_web._detect_idiom, whose `max(...)` already forced SSE out of its
roster into a separate always-on pass. Forcing any probe to zero must leave every feed
byte-identical — tests/arms/run.sh pins exactly that.

FLAT MODULE, not a `stacks/` package, ON PURPOSE: bootstrap_center.sh:38 and propagate.sh:25 copy
generators with a flat `*.py *.mjs *.sh` glob, so a subdirectory would be silently dropped on every
adopting project and its build would die on the import the day the census started calling this.
"""
from __future__ import annotations

from typing import NamedTuple


class Stack(NamedTuple):
    """One arm: a named idiom, the language it reads, the module that implements it, the CONCEPTS
    it claims, and the archmap keys it is allowed to fill."""
    name: str
    lang: str
    module: str
    concepts: tuple[str, ...]
    keys: tuple[str, ...]


# The concept vocabulary — what a codebase map needs to know about ANY backend, independent of
# framework. A concept with no row for a project's stack is the thing the census must say out loud.
CONCEPTS: tuple[str, ...] = (
    "request_roots",   # what a request can enter through (handler · boot · task · server action)
    "mounts",          # how a router's prefix composes into the final URL
    "gates",           # what runs before the handler body and can refuse
    "tables",          # the persisted shapes
    "access",          # which function reads or writes which table
    "queues",          # work handed off by name to another process
    "providers",       # the external systems reached out to
    "schemas",         # the request/response contracts
    "census",          # what the scan could and could not see
    "call_graph",      # function calls, across languages
    "fetch_bridge",    # a frontend call site joined to the endpoint it names
    "fe_structure",    # the frontend's own pieces and wires
)

# A route record's `method` is an HTTP verb OR one of these pseudo-roots. They are NOT URLs, and
# consumers that split a path into URL domains must skip them (wired in step 5).
PSEUDO_ROOTS = frozenset({"BOOT", "TASK", "ACTION"})

# Phase 1 relocates NOTHING: `_a3_code` appears repeatedly because that is where these arms live
# today. The rows are a map of the territory as it is, not as it will be.
REGISTER: tuple[Stack, ...] = (
    Stack("py_fastapi", "py", "_a3_code",
          ("request_roots", "mounts", "gates", "schemas"),
          ("entities", "route_mounts", "app_middleware", "guard_insight", "schema_homing")),
    Stack("py_sqlalchemy", "py", "_a3_code",
          ("tables", "access"),
          ("entities", "model_insight", "function_insight")),
    Stack("py_queues", "py", "_a3_code",
          ("queues", "request_roots"),
          ("tasks", "task_roots", "dispatch")),
    Stack("py_boot", "py", "_a3_code",
          ("request_roots",),
          ("boot_roots",)),
    Stack("py_providers", "py", "_a3_code",
          ("providers",),
          ("function_insight",)),
    Stack("py_census", "py", "_a3_code",
          ("census",),
          ("element_census", "file_census", "route_census", "unparseable", "flags")),
    Stack("ts_next", "ts", "_a3_code",           # → _a3_stacks_next in step 6
          ("request_roots",),
          ("action_roots",)),
    Stack("ts_fetch", "ts", "_a3_web",
          ("fetch_bridge",), ()),
    Stack("ts_structure", "ts", "_a3_fe",
          ("fe_structure",), ()),
    Stack("multi_graft", "*", "_a3_graft",
          ("call_graph",), ("module_calls", "fn_similarity")),
)


def resolve(concept: str) -> tuple[Stack, ...]:
    """Every arm claiming `concept`. Empty = no detector exists for it at all — the state the
    census exists to report, and the reason this returns a tuple rather than one winner."""
    return tuple(s for s in REGISTER if concept in s.concepts)


def claimed_keys() -> frozenset[str]:
    """Every archmap key some arm admits to filling. The battery fails when a producer writes a
    key nobody declared — a silent widening of the contract is how the map drifts."""
    return frozenset(k for s in REGISTER for k in s.keys)


def langs_for(concept: str) -> tuple[str, ...]:
    """The languages covered for `concept`, so the census can separate "no detector for YOUR
    language" from "a detector ran and found nothing"."""
    return tuple(sorted({s.lang for s in resolve(concept)}))
