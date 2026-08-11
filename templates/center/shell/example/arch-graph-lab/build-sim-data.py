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
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SIM_JS = HERE / "sim.data.js"
# The twin checkout whose archmap + junit digests seed this example. Passed in —
# NEVER hardcoded (portability invariant P6: no operator-machine path in a shipped
# surface). Usage:  python3 build-sim-data.py <twin-repo>   or   GABE_TWIN_REPO=… …
_TWIN = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("GABE_TWIN_REPO", "")).strip()
if not _TWIN:
    sys.exit("usage: build-sim-data.py <twin-repo-path>   (or set GABE_TWIN_REPO)\n"
             "  a gustify checkout — its docs/site/center/archmap.json + tests/results/"
             "*-junit.xml.digest.json seed the change-simulation example.")
GUSTIFY = Path(_TWIN).expanduser()
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

# TESTS + EVIDENCE — which tests prove each changed piece. The C-cases are this
# commit's own (fecb2ce3); `kind` is read from the file (…_api.py = integration,
# a service test = unit, a .test.tsx = web/journey). Names come from case_own,
# files from case_home, and pass-state from test_insight — all in the archmap.
# The junit DIGESTS are the evidence the tests produce (passed/failed @ head).
TEST_MAP = {
    "model:PlannedRecipe": [
        {"cid": "C8135", "kind": "unit"},
        {"cid": "C8136", "kind": "unit"},
        {"cid": "C8142", "kind": "integration"},
    ],
    "model:RecipeFilterMode": [
        {"cid": "C8134", "kind": "unit"},
        # the web-side rollback test that exercises recipe-filter-modes (corpus=web)
        {"web": "apps/web/src/features/cooking/useRecipeFilterModes.rollback.test.tsx",
         "kind": "web"},
    ],
}
JUNIT_DIGESTS = {"api": "api-junit.xml.digest.json", "web": "web-junit.xml.digest.json"}


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


def load_evidence() -> dict:
    """The junit digests — the evidence the tests produced (passed/failed @ head)."""
    out = {}
    res = GUSTIFY / "tests" / "results"
    for label, fn in JUNIT_DIGESTS.items():
        p = res / fn
        if not p.exists():
            print(f"    ⚠ junit digest missing: {p}")
            continue
        d = json.loads(p.read_text())
        out[label] = {k: d.get(k) for k in
                      ("passed", "failed", "skipped", "exit", "head", "duration_s")}
    return out


def build_case_index(amap: dict):
    """cid -> {name, tfile}, from test_insight.case_home + case_own keys."""
    ti = amap.get("test_insight", {}) or {}
    home = ti.get("case_home", {}) or {}
    own = ti.get("case_own", {}) or {}
    names = {}
    for key in own:                        # "<file>::<test_name_Cid>"
        if "::" in key:
            f, name = key.split("::", 1)
            m = name.rsplit("_C", 1)
            if len(m) == 2 and m[1].isdigit():
                names["C" + m[1]] = name
    return home, names


def tests_for(pid: str, state: str, home, names) -> list:
    entries = []
    for t in TEST_MAP.get(pid, []):
        if "web" in t:                      # a web/e2e test, no C-id
            entries.append({"cid": "web", "kind": t["kind"], "state": state,
                            "name": t["web"].split("/")[-1], "tfile": t["web"]})
            continue
        cid = t["cid"]
        entries.append({"cid": cid, "kind": t["kind"], "state": state,
                        "name": names.get(cid, ""), "tfile": home.get(cid, "")})
    return entries


def main() -> int:
    amap = load_archmap()
    coltypes, endpoints = build_indexes(amap)
    head = amap.get("head", "?")
    home, case_names = build_case_index(amap)
    evidence = load_evidence()

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

    # TESTS: born red in the Red beat, green in Execute (and thus Commit, which
    # reads the Execute ids). The junit digests ride the top level as evidence.
    test_chips = 0
    for pid in TEST_MAP:
        for stage, state in (("red", "red"), ("execute", "pass")):
            sd = stages.get(stage, {}).get("pieces", {}).get(pid)
            if sd is None:
                continue
            entries = tests_for(pid, state, home, case_names)
            if entries:
                sd.setdefault("ids", {})["test"] = entries
                test_chips += len(entries)
    sim["evidence"] = evidence

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
    print(f"tests        : {test_chips} test chips (red born-red + execute green)")
    print(f"evidence     : " + " · ".join(
        f"{k} {v.get('passed')}✓/{v.get('failed')}✗ @{v.get('head')}"
        for k, v in evidence.items()) or "none")
    print(f"typed chips  : {chip_total} total")
    print(f"wrote        : {SIM_JS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
