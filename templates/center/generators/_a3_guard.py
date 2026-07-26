"""Testing Command Center — the GUARD lens: code that is used but unguarded.

A refactor is safe in proportion to what would go red if it broke. This module
answers, per file and per function, "if I change this, would anything tell me?"
— and it answers from data the center already commits, no new parser required.

THE JOIN. Both halves exist; nothing here re-reads source:

  LEFT  what the code declares
        · python  — `function_insight` (ast, per def, with a `usage` count)
        · ts/tsx  — `entities[*].defines` (the export grammar `parse_defines`
                    already runs for the code map)
  RIGHT what the tests name
        · python  — `test_insight.by_function` (function -> C-ids)
        · ts/tsx  — `test_insight.exercises[*].uses[].name`, the symbol-level
                    bindings web test files already emit

The web half was invisible before this, and not for want of config: the
per-function signal engine is gated on `.py`, so a 2,459-line model file
carrying 143 exported symbols priced only by LINE COUNT. The bindings to join
it against were already committed.

NAMED IS NOT GUARDED. A case that NAMES a symbol may still be unable to fail —
a severed assertion, a missing cleanup, a config exclusion. A twin measured its
own void rate at 1 in 6 while trying not to write one. This lens joins NAMES,
so on its own it can only ever say "something claims to watch this", and
rendering that as "guarded" overstates safety by exactly the void rate.

So there are THREE states, not two, and the middle one is the honest default:

    unguarded   no case names it
    named       a case names it, and nothing has shown that case can fail
    proven      a mutation of this code was observed to turn that case red
                (skills/gabe-red/scripts/prove-guard.py, recorded to
                .kdbp/guard-proofs.jsonl)

`guarded` is reserved for PROVEN. A project that has never run prove-guard sees
`named` everywhere, which is the truth about what the center knows.

HONESTY LINE. The web side is EXPORTED SYMBOLS matched BY NAME:

  * A symbol a test imports under an alias reads as unguarded.
  * A non-exported helper is not counted at all — absence here is not proof of
    absence in the file.
  * A name shared by two files credits both.

So a web file's number is a FLOOR on what is unguarded, never a coverage
percentage, and every surface that renders it says so. The python side is
exact: ast defs joined to recorded C-ids.
"""

from __future__ import annotations

# A card earns its place by being both LOAD-BEARING and UNWATCHED. The cuts are
# deliberately narrow — 551 unguarded web symbols is a fact, not a to-do list,
# and a board that lists all of them is a board nobody reads.
HOT_USAGE = 2           # a python fn called from >= 2 places with no test
BIG_FILE = 800          # the size budget: past here a file is a refactor risk
UNGUARDED_SHARE = 0.5   # ... and at least half its exports unnamed makes it one
CLUSTER = 10            # a pile this big is worth a sitting whatever the size


def _named_by_tests(exercises: dict) -> set[str]:
    """Every symbol any test names, from both binding shapes."""
    named: set[str] = set()
    for v in (exercises or {}).values():
        for u in (v.get("uses") or []):
            if u.get("name"):
                named.add(u["name"])
        for fn in (v.get("functions") or []):
            if fn.get("name"):
                named.add(fn["name"])
    return named


def guard_insight(*, function_insight: dict, by_function: dict,
                  exercises: dict, entities: dict,
                  by_endpoint: dict | None = None,
                  by_model: dict | None = None,
                  model_insight: dict | None = None,
                  proofs: list | None = None) -> dict:
    """Per-file and per-function guard facts. Pure — every input is already
    computed by this build, so the lens costs one pass and no re-parse."""
    named = _named_by_tests(exercises)
    by_endpoint = by_endpoint or {}

    # A proof names the SYMBOL it mutated ("file::fn") and/or its file. Only a
    # `proven` result counts — a recorded VOID is evidence the guard does NOT
    # hold, so it must never upgrade anything.
    proven_syms: set[str] = set()
    proven_files: dict[str, int] = {}
    for pr in (proofs or []):
        if (pr or {}).get("result") != "proven":
            continue
        sym = pr.get("symbol") or ""
        if sym:
            proven_syms.add(sym)
        f = pr.get("file") or (sym.split("::")[0] if "::" in sym else "")
        if f:
            proven_files[f] = proven_files.get(f, 0) + 1

    def _guarded(key: str) -> bool:
        """Either binding guards a def. A route test credits the handler under
        `by_endpoint` (same `file::fn` key shape), and reading only
        `by_function` would report every route-tested endpoint as unguarded."""
        return bool(by_function.get(key) or by_endpoint.get(key))

    # file -> line count, from the entity map (function_insight's own `lines`
    # is the FUNCTION's length, not the file's)
    file_lines: dict[str, int] = {}
    for ent in (entities or {}).values():
        for f in (ent.get("files") or []):
            if isinstance(f, (list, tuple)) and len(f) > 2:
                file_lines.setdefault(f[1], f[2])

    # ---- python: exact, ast defs joined to recorded C-ids -----------------
    functions: dict[str, dict] = {}
    for key, v in (function_insight or {}).items():
        if _guarded(key):
            continue                      # a case names it — guarded
        usage = v.get("usage") or 0
        functions[key] = {
            "fn": v.get("fn", ""), "file": v.get("file", ""),
            "entity": v.get("entity", ""), "layer": v.get("layer", ""),
            "usage": usage, "lines": v.get("lines") or 0,
            "api": bool(v.get("api") or v.get("handler")),
            "god": bool(v.get("god")),
            # why THIS one is worth a card, in the order a reader would ask
            "hot": usage >= HOT_USAGE,
        }
    # A def a case NAMES sits in neither bucket above: it is not unguarded, but
    # nothing has shown the case can fail. Count it, so the totals can say how
    # much of the "guarded" population is actually only claimed.
    named_defs = [k for k in (function_insight or {}) if _guarded(k)]
    proven_defs = [k for k in named_defs if k in proven_syms]

    # ---- per file: python from the fn index, ts/tsx from `defines` --------
    files: dict[str, dict] = {}
    for slug, ent in (entities or {}).items():
        lines = {f[1]: (f[2] if len(f) > 2 else 0)
                 for f in (ent.get("files") or [])
                 if isinstance(f, (list, tuple)) and len(f) >= 2}
        for path, decls in (ent.get("defines") or {}).items():
            if not path.endswith((".ts", ".tsx")):
                continue                  # python is covered exactly, below
            declared = [d.rstrip("()") for d in decls]
            if not declared:
                continue
            unguarded = [d for d in declared if d not in named]
            files[path] = {
                "path": path, "entity": slug, "kind": "web",
                "lines": lines.get(path, 0),
                "declared": len(declared), "unguarded": len(unguarded),
                "names": unguarded[:12],
                "proven": proven_files.get(path, 0),
                "share": round(len(unguarded) / len(declared), 3),
                # a name-matched floor, never a coverage number
                "exact": False,
            }
    py_files: dict[str, dict] = {}
    for key, v in (function_insight or {}).items():
        f = v.get("file", "")
        if not f:
            continue
        slot = py_files.setdefault(f, {"declared": 0, "unguarded": 0,
                                       "names": [], "entity": v.get("entity", ""),
                                       "lines": 0})
        slot["declared"] += 1
        slot["lines"] = file_lines.get(f, 0)
        if not _guarded(key):
            slot["unguarded"] += 1
            if len(slot["names"]) < 12:
                slot["names"].append(v.get("fn", ""))
    for f, slot in py_files.items():
        files[f] = {
            "path": f, "entity": slot["entity"], "kind": "api",
            "lines": slot["lines"], "declared": slot["declared"],
            "unguarded": slot["unguarded"], "names": slot["names"],
            "proven": proven_files.get(f, 0),
            "share": round(slot["unguarded"] / slot["declared"], 3)
            if slot["declared"] else 0.0,
            "exact": True,
        }

    # ---- classes: ONLY where the file has no function-level chip ----------
    # A models/ or schemas/ file declares classes and no defs, so it never
    # entered `py_files` above and rendered NO guard signal at all — 14 files
    # on one twin, 4 on the other. Those are the rows the data-model level
    # exists to cover. Where a file already has defs, its function rollup
    # already speaks and a second class-level number would just restate it.
    by_model = by_model or {}
    model_insight = model_insight or {}
    classes: dict[str, dict] = {}
    for cls, v in model_insight.items():
        f = v.get("file", "")
        if not f or f in files:
            continue                      # the file already carries a chip
        slot = classes.setdefault(f, {"path": f, "entity": v.get("entity", ""),
                                      "kind": "model", "lines": file_lines.get(f, 0),
                                      "declared": 0, "unguarded": 0,
                                      "orphan_unguarded": 0, "names": [],
                                      "proven": proven_files.get(f, 0),
                                      "exact": True})
        slot["declared"] += 1
        if not by_model.get(cls):
            # An ORPHAN is not a test candidate. Nothing uses it, so the move
            # is to delete it, not to guard it — counted apart so the two never
            # get added into one misleading number.
            if v.get("orphan"):
                slot["orphan_unguarded"] += 1
            else:
                slot["unguarded"] += 1
                if len(slot["names"]) < 12:
                    slot["names"].append(cls)
    for f, slot in classes.items():
        slot["share"] = (round(slot["unguarded"] / slot["declared"], 3)
                         if slot["declared"] else 0.0)
        files[f] = slot

    totals = {
        "fn_named": len(named_defs),
        "fn_proven": len(proven_defs),
        "proofs_seen": len(proofs or []),
        "cls_files": len(classes),
        "cls_unguarded": sum(v["unguarded"] for v in classes.values()),
        "cls_orphan": sum(v["orphan_unguarded"] for v in classes.values()),
        "fn_mapped": len(function_insight or {}),
        "fn_guarded": sum(1 for k in (function_insight or {}) if _guarded(k)),
        "fn_unguarded": len(functions),
        "fn_hot": sum(1 for v in functions.values() if v["hot"]),
        "web_declared": sum(v["declared"] for v in files.values()
                            if v["kind"] == "web"),
        "web_unguarded": sum(v["unguarded"] for v in files.values()
                             if v["kind"] == "web"),
    }
    return {"files": files, "functions": functions, "totals": totals}


def guard_moves(gi: dict) -> list[dict]:
    """The subset that earns an ACTION ITEM, priced and reasoned.

    Shaped the way the work is actually done. Writing guards is a FILE-sized
    sitting, so a file with a dozen unguarded defs is ONE move, not a dozen —
    46 individually-listed untested handlers is a report, not a to-do list. The
    exception is a HOT function: called from several places, small, and
    specific enough that the guard is a single named test.
    """
    moves: list[dict] = []
    for key, v in (gi.get("functions") or {}).items():
        if not v["hot"]:
            continue
        why = [f"called from {v['usage']} places"]
        if v["api"]:
            why.append("on the HTTP surface")
        if v["god"]:
            why.append("inside a god file")
        moves.append({
            "id": f"guard:{key}", "kind": "function", "key": key,
            "title": f"{v['fn']}() is load-bearing and unguarded",
            "detail": "Nothing fails if this breaks — " + ", ".join(why) + ".",
            "entity": v["entity"], "file": v["file"], "usage": v["usage"],
            "lines": v["lines"], "unguarded": 1, "declared": 1, "exact": True,
            "effort": "S" if v["lines"] <= 60 else "M",
            "effort_basis": f"the function is {v['lines']} lines",
            "score": 1000 + v["usage"] * 10 + (5 if v["api"] else 0),
        })
    for path, v in (gi.get("files") or {}).items():
        # Either a CLUSTER worth a sitting, or a file past the size budget
        # that is mostly unwatched. Requiring only "3+ unguarded and half the
        # file" admitted every small module and produced 64 cards on one twin —
        # a report again, which is the thing this was meant to replace.
        if not (v["unguarded"] >= CLUSTER
                or (v["lines"] >= BIG_FILE and v["share"] >= UNGUARDED_SHARE)):
            continue
        what = ("handlers/defs" if v["kind"] == "api"
                else "used classes" if v["kind"] == "model"
                else "exported symbols")
        moves.append({
            "id": f"guard:{path}", "kind": "file", "key": path,
            "title": f"{path.rsplit('/', 1)[-1]} — {v['unguarded']} unguarded "
                     f"{what}",
            "detail": (f"{v['unguarded']} of {v['declared']} {what} are named "
                       f"by no test, across {v['lines']:,} lines. A refactor "
                       f"here moves in the dark."
                       + ("" if v["exact"] else
                          " Name-matched, so this is a floor, not a coverage "
                          "figure.")),
            "entity": v["entity"], "file": path, "usage": None,
            "lines": v["lines"], "unguarded": v["unguarded"],
            "declared": v["declared"], "exact": v["exact"],
            "effort": "L" if v["lines"] >= BIG_FILE else "M",
            "effort_basis": f"{v['lines']:,} lines, {v['unguarded']} unguarded",
            "score": v["unguarded"] * 5 + v["lines"] // 100,
        })
    moves.sort(key=lambda m: -m["score"])
    return moves
