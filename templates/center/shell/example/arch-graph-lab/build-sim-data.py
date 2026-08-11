#!/usr/bin/env python3
"""Enrich the change-simulation data (sim.data.js) with TYPED, iconed identifiers.

EXAMPLE SCAFFOLDING — not project-agnostic suite machinery, so it lives beside
the lab example, NOT under templates/center/generators/ (which must stay
twin-neutral). It reads gustify's committed archmap + the real commit and merges
typed identifier blocks into the existing sim.data.js, leaving every curated
narrative field (red assertions, review findings) untouched.

For each stage-piece it adds an ``ids`` block the panel renders as chips in the
command center's code-section visual language:
  { fn:[...], endpoint:[{m,p,fn}], model:[...], schema:[...],
    datatype:[{n,t}], structure:[...] }
plus a Red ``use_case`` line.

DERIVED vs CURATED (honest provenance):
  - datatype tokens .......... DERIVED from archmap models[].cols  (name+type)
  - endpoint m/p/fn .......... DERIVED from archmap endpoints        (by fn name)
  - model / schema names ..... the piece + its archmap neighbours
  - service-fn attribution ... CURATED from the C-case test bodies (cited below);
                               the service layer is NOT in the archmap endpoint
                               map, so which fns a red case exercises is read
                               from apps/api/tests/test_repertorio{,_api}.py.

Run:  python3 build-sim-data.py         (rewrites ./sim.data.js in place)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SIM_JS = HERE / "sim.data.js"
GUSTIFY = Path("/home/khujta/projects/apps/gustify")
ARCHMAP = GUSTIFY / "docs/site/center/archmap.json"
COMMIT = "fecb2ce3"

# --------------------------------------------------------------------------- #
# CURATED: which SERVICE functions / endpoints each stage-piece exercises.
# The service layer is absent from the archmap endpoint map, so this is read
# by hand from the real test bodies + the diff and cited to the source line.
#   Red    → apps/api/tests/test_repertorio.py  (C8134/5/6) + test_repertorio_api.py (C8142)
#   Execute→ git show fecb2ce3  (apps/api/services/repertorio.py, recipe_filter_modes.py)
#   Review → .kdbp/PENDING.md   (#209 post_plan_recipe · #211 attach_cupo)
# Endpoints listed by fn name are resolved to method+path from the archmap.
# --------------------------------------------------------------------------- #
CURATED: dict[str, dict[str, dict]] = {
    "model:PlannedRecipe": {
        "red": {
            # C8135 test_cupo_journey_stamps_and_derived_counters, C8136 downgrade,
            # C8142 test_plan_with_cupo_stamps_the_link (api)
            "fn": ["plan_into_cupo", "downgrade_to_free",
                   "planeadas_for_cupo", "cocinadas_for_cupo"],
            "endpoint_fns": ["post_plan_recipe", "get_cupos"],
            "model": ["PlannedRecipe"],
            "datatype_cols": [("PlannedRecipe", "cupo_id"),
                              ("PlannedRecipe", "planned_by_user_id"),
                              ("PlannedRecipe", "status")],
            "use_case": "Cook→cupo journey: plan stamps the link · "
                        "downgrade keeps one · log-derived history survives",
        },
        "execute": {
            # git show fecb2ce3 : + cupo_id Mapped[uuid.UUID|None] + Index
            "fn": ["plan_into_cupo"],
            "model": ["PlannedRecipe"],
            "datatype_cols": [("PlannedRecipe", "cupo_id")],
            "structure": ["Index ix_planned_recipes_cupo_id",
                          "FK → recipe_filter_modes.id (SET NULL)"],
        },
        "review": {
            # PENDING #209 cross-type plan unruled
            "fn": ["plan_into_cupo"],
            "endpoint_fns": ["post_plan_recipe"],
            "model": ["PlannedRecipe"],
            "datatype_cols": [("PlannedRecipe", "cupo_id")],
        },
    },
    "model:RecipeFilterMode": {
        "red": {
            # C8134 test_cupo_capacity_is_the_members_own_pool
            "fn": ["attach_cupo", "release_cupo"],
            "endpoint_fns": ["put_cupo", "delete_cupo"],
            "model": ["RecipeFilterMode"],
            "datatype_cols": [("RecipeFilterMode", "cupo_dish_type")],
            "use_case": "A member's cupo capacity is their OWN pool "
                        "(free 1 / chef 5), fail-closed",
        },
        "execute": {
            # git show fecb2ce3 : + cupo_dish_type Mapped[str|None] String(60)
            "fn": ["attach_cupo", "release_cupo"],
            "model": ["RecipeFilterMode"],
            "datatype_cols": [("RecipeFilterMode", "cupo_dish_type")],
            "structure": ["String(60), nullable"],
        },
        "review": {
            # PENDING #211 attach_cupo retype
            "fn": ["attach_cupo"],
            "endpoint_fns": ["put_cupo"],
            "model": ["RecipeFilterMode"],
            "datatype_cols": [("RecipeFilterMode", "cupo_dish_type")],
        },
    },
}

# Downstream (blast) link pieces: show the FK data type that couples them to the
# change. DERIVED — the FK col + its archmap type. Red stage only (that is where
# the sim already carries a guards line for CookingSession).
LINK_COLS = {
    "model:CookingSession": ("CookingSession", "recipe_id"),
    "model:CookingStepProgress": ("CookingStepProgress", "recipe_step_id"),
    "model:DishHistoryEvent": ("DishHistoryEvent", "recipe_id"),
}


def load_archmap() -> dict:
    if not ARCHMAP.exists():
        sys.exit(f"archmap not found: {ARCHMAP}")
    return json.loads(ARCHMAP.read_text())


def build_indexes(amap: dict):
    """cls -> {col: type}   and   fn -> {m,p,fn}   across all entities."""
    coltypes: dict[str, dict[str, str]] = {}
    endpoints: dict[str, dict] = {}
    for slug, ent in amap.get("entities", {}).items():
        for m in ent.get("models", []) or []:
            coltypes[m["cls"]] = {c[0]: c[1] for c in m.get("cols", []) or []}
        for ep in ent.get("endpoints", []) or []:
            fn = ep.get("fn")
            if fn:
                endpoints[fn] = {"m": ep.get("method", ""),
                                 "p": ep.get("path", ""), "fn": fn}
    return coltypes, endpoints


def dtype(coltypes, cls, col) -> dict | None:
    t = coltypes.get(cls, {}).get(col)
    if t is None:
        print(f"    ⚠ col not in archmap: {cls}.{col}")
        return None
    return {"n": col, "t": t}


def ids_from(spec: dict, coltypes, endpoints) -> dict:
    out: dict = {}
    if spec.get("fn"):
        out["fn"] = list(spec["fn"])
    eps = []
    for fn in spec.get("endpoint_fns", []):
        ep = endpoints.get(fn)
        if ep:
            eps.append(ep)
        else:
            print(f"    ⚠ endpoint fn not in archmap: {fn}")
    if eps:
        out["endpoint"] = eps
    if spec.get("model"):
        out["model"] = list(spec["model"])
    if spec.get("schema"):
        out["schema"] = list(spec["schema"])
    dts = [dtype(coltypes, c, col) for (c, col) in spec.get("datatype_cols", [])]
    dts = [d for d in dts if d]
    if dts:
        out["datatype"] = dts
    if spec.get("structure"):
        out["structure"] = list(spec["structure"])
    return out


def main() -> int:
    amap = load_archmap()
    coltypes, endpoints = build_indexes(amap)
    head = amap.get("head", "?")

    raw = SIM_JS.read_text()
    m = re.search(r"window\.GABE_SIM\s*=\s*(\{.*\});\s*$", raw, re.S)
    if not m:
        sys.exit("could not parse window.GABE_SIM from sim.data.js")
    sim = json.loads(m.group(1))

    stages = sim.get("stages", {})
    counts = {"red": 0, "execute": 0, "review": 0}
    chip_total = 0

    for pid, per_stage in CURATED.items():
        for stage, spec in per_stage.items():
            sd = stages.get(stage, {}).get("pieces", {}).get(pid)
            if sd is None:
                print(f"    ⚠ no {stage} record for {pid} — skipped")
                continue
            ids = ids_from(spec, coltypes, endpoints)
            sd["ids"] = ids
            if "use_case" in spec:
                sd["use_case"] = spec["use_case"]
            counts[stage] += 1
            chip_total += sum(len(v) for v in ids.values())

    # Link (blast) pieces — add the coupling datatype to the Red record.
    red_pieces = stages.get("red", {}).get("pieces", {})
    for pid, (cls, col) in LINK_COLS.items():
        sd = red_pieces.get(pid)
        if sd is None:
            continue
        d = dtype(coltypes, cls, col)
        if d:
            sd.setdefault("ids", {})["datatype"] = [d]
            sd["ids"]["model"] = [cls]
            chip_total += 2

    sim["ids_head"] = head  # provenance: which archmap head the types came from

    SIM_JS.write_text(
        "window.GABE_SIM = "
        + json.dumps(sim, indent=1, ensure_ascii=False)
        + ";\n"
    )

    print(f"archmap head : {head}")
    print(f"commit       : {COMMIT}")
    print(f"enriched     : red={counts['red']} execute={counts['execute']} "
          f"review={counts['review']} pieces")
    print(f"link pieces  : {len(LINK_COLS)} (datatype coupling)")
    print(f"typed chips  : {chip_total} total")
    print(f"wrote        : {SIM_JS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
