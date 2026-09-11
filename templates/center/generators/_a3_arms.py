#!/usr/bin/env python3
"""_a3_arms.py — the ARMS CENSUS: what the map looked for, what it found, and what nobody looked for.

The defect this exists to kill: every concept the pipeline cannot extract renders as a zero, and a
zero reads as a fact. keypro-front (Next.js, raw `pg` SQL) drew an empty STORE column on every
journey step — not because the app has no tables, but because `CREATE TABLE` lives in a string
literal and no line of code in this pipeline was capable of noticing. The operator read the column
and asked why there were no data structures. That question is the bug.

So each concept gets a STATE WORD, and the surfaces render the word instead of the bare zero:

  present               an arm ran and produced records
  empty                 every installed arm ran (scanned > 0), found nothing, and no sentinel
                        fired — the HONEST zero, the only one that means "this app has none"
  unmatched             produced nothing AND (nothing was scanned, or a sentinel saw the concept
                        in an idiom no arm covers) — the keypro state
  unsupported_language  no arm claims this concept for any language present in the tree
  contested             arms disagree — reported, never silently resolved

SENTINELS are the half a state word cannot reach. A state word can only describe arms that EXIST;
a sentinel is a literal substring that says "this concept is plainly here, in an idiom nobody
implemented". They run ONLY for a concept that produced zero, over one bounded pass of the tree, so
a healthy project pays nothing for them.

IMPLIES catches the shape where one arm works and its dependent silently does not: tables without
access, roots without gates. Report-never-gate throughout — this module only ever adds a block to
the archmap.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import _a3_stacks as _stacks

# The three arms that ALREADY state their own presence — _a3_graft, _a3_web and _a3_fe each emit
# {present, reason} into c4-graph.json stats. They were never the silent ones, and duplicating
# their verdict here would put one truth in two files and invite it to drift. The block POINTS at
# them instead; the census covers the archmap-side concepts, which had no honesty surface at all.
ELSEWHERE: dict[str, str] = {
    "call_graph": "c4-graph.json stats.graft",
    "fetch_bridge": "c4-graph.json stats.web",
    "fe_structure": "c4-graph.json stats.fe",
}

# concept → (literal markers, the language/idiom they point at). A hit means the concept is
# PRESENT IN THE TREE in a form no registered arm reads — the honest "we do not cover your stack".
SENTINELS: dict[str, tuple[tuple[str, ...], str]] = {
    "tables": (("CREATE TABLE", "pgTable(", "@Entity(", "models.Model", "createTable(",
                "schema.prisma", "ActiveRecord::Base", "db.Model"),
               "raw SQL DDL / Prisma / TypeORM / Django / Rails / SQLAlchemy-declarative"),
    "access": (("$queryRaw", "INSERT INTO", "DELETE FROM", "UPDATE SET", ".objects.filter(",
                "knex(", "prisma."),
               "raw SQL or a query builder"),
    "request_roots": (("@Controller", "urlpatterns", "@Get(", "@Post(", "use server",
                       "createFileRoute", "http.HandleFunc", "Rails.application.routes"),
                      "NestJS / Django / Next server actions / TanStack / Go / Rails"),
    "gates": (("@UseGuards", "before_action", "@login_required", "LoginRequiredMixin",
               "middleware.ts", "authMiddleware"),
              "NestJS guards / Rails filters / Django decorators / Next middleware"),
    "queues": (("new Queue(", "BullMQ", "sidekiq", "ActiveJob", "@Processor("),
               "BullMQ / Sidekiq / ActiveJob / NestJS processors"),
    "schemas": (("z.object(", "zod", "@IsString(", "serializers.Serializer", "strawberry.type"),
                "zod / class-validator / DRF serializers / strawberry"),
    "providers": (("openai", "anthropic", "@aws-sdk", "stripe", "twilio"),
                  "an SDK imported from a language no arm reads"),
}

# left concept produced records ⇒ right concept producing NOTHING is suspicious, not neutral
IMPLIES: tuple[tuple[str, str], ...] = (
    ("tables", "access"),
    ("request_roots", "gates"),
    ("request_roots", "access"),
    ("fe_structure", "fetch_bridge"),
)

# what a sentinel pass is allowed to read — source, not vendor, not the center's own machinery
_SRC_EXT = (".py", ".ts", ".tsx", ".js", ".jsx", ".rb", ".go", ".java", ".kt", ".php", ".sql", ".prisma")
_SKIP = ("/.venv/", "/venv/", "/node_modules/", "/site-packages/", "/__pycache__/", "/.git/",
         "/build/", "/dist/", "/scripts/", "/docs/site/", "/templates/", "/graft/", "/.next/",
         "/vendor/", "/target/", "/.mypy_cache/")
_SENTINEL_FILE_CAP = 6000        # a bound, stated on the block — never a silent truncation


def _walk(repo: Path, concepts: list[str]) -> tuple[set[str], int, bool, dict[str, dict]]:
    """ONE bounded pass: the languages present, and — for the concepts that produced nothing — the
    sentinel hits. Two passes cost 11.7s on gustify (2,717 files) before this was merged; the census
    runs on every build, so it pays for itself in seconds, not principle. Never raises.

    `(langs, files_seen, capped, {concept: {hits, files[<=5], idiom}})`."""
    ext2lang = {".py": "py", ".ts": "ts", ".tsx": "ts", ".js": "ts", ".jsx": "ts",
                ".rb": "rb", ".go": "go", ".java": "jvm", ".kt": "jvm", ".php": "php"}
    want = {c: SENTINELS[c] for c in concepts if c in SENTINELS}
    sent: dict[str, dict] = {c: {"hits": 0, "files": [], "idiom": v[1]} for c, v in want.items()}
    langs: set[str] = set()
    seen = 0
    capped = False
    try:
        for p in sorted(repo.rglob("*")):
            if seen >= _SENTINEL_FILE_CAP:
                capped = True
                break
            if not p.is_file() or p.suffix not in _SRC_EXT:
                continue
            rel = p.relative_to(repo).as_posix()
            if any(sk in "/" + rel for sk in _SKIP):
                continue
            seen += 1
            lang = ext2lang.get(p.suffix)
            if lang:
                langs.add(lang)
            if not want:
                continue
            try:
                text = p.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for c, (markers, _idiom) in want.items():
                if any(m in text for m in markers):
                    sent[c]["hits"] += 1
                    if len(sent[c]["files"]) < 5:
                        sent[c]["files"].append(rel)
    except Exception:  # noqa: BLE001 — a census that raises would take the build with it
        pass
    return langs, seen, capped, sent


def _produced(amap: dict, c4_stats: dict | None, concept: str) -> int:
    """How many records this concept actually contributed to the emitted map."""
    ents = (amap.get("entities") or {}).values()
    st = c4_stats or {}
    if concept == "request_roots":
        return (sum(len((e or {}).get("endpoints") or []) for e in ents)
                + len(amap.get("boot_roots") or []) + len(amap.get("task_roots") or [])
                + len(amap.get("action_roots") or []))
    if concept == "mounts":
        return len(amap.get("route_mounts") or [])
    if concept == "gates":
        # a gate is recorded on the ENDPOINT that it guards (via param-dep), not only on the app.
        # Counting app_middleware alone read 0 on gustify while 81 endpoint gates were drawn —
        # a false "empty" on a concept that is plainly present, which is the lie this file exists
        # to kill, told by this file.
        return (sum(1 for e in ents for x in ((e or {}).get("endpoints") or [])
                    for m in (x.get("middleware") or []) if (m or {}).get("gate"))
                + sum(1 for m in (amap.get("app_middleware") or []) if (m or {}).get("gate")))
    if concept == "tables":
        return sum(len((e or {}).get("models") or []) for e in ents)
    if concept == "access":
        return sum(1 for v in (amap.get("function_insight") or {}).values()
                   if ((v or {}).get("access") or {}).get("ops"))
    if concept == "queues":
        return len(((amap.get("tasks") or {}).get("tasks")) or [])
    if concept == "providers":
        return sum(1 for v in (amap.get("function_insight") or {}).values() if (v or {}).get("externals"))
    if concept == "schemas":
        return sum(len((e or {}).get("schemas") or []) for e in ents)
    if concept == "census":
        fc = amap.get("file_census") or {}
        claimed = fc.get("claimed")
        if isinstance(claimed, int):
            return claimed                      # this pipeline records a COUNT, not a roster
        return len(claimed) if isinstance(claimed, (list, dict)) else (1 if fc else 0)
    return 0


def census(amap: dict, repo: Path, c4_stats: dict | None = None) -> dict[str, Any]:
    """The arms block: one state record per concept. Pure addition to the archmap — it reads what
    the producers already wrote and never changes it."""
    repo = Path(repo)
    measured = [c for c in _stacks.CONCEPTS if c not in ELSEWHERE]
    prod: dict[str, int] = {}
    probes: dict[str, dict] = {}
    for c in measured:
        prod[c] = _produced(amap, c4_stats, c)

    # probe only the modules that expose one (Phase 1: _a3_code), and only for their own concepts
    try:
        import _a3_code as _code
        for c in getattr(_code, "CONCEPTS", ()):
            probes[c] = _code.probe(c, repo)
    except Exception:  # noqa: BLE001
        probes = {}

    zero = [c for c in measured if not prod.get(c)]
    langs, files_seen, capped, sentinels = _walk(repo, zero)

    out: dict[str, Any] = {"concepts": {}, "files_seen": files_seen, "langs": sorted(langs),
                           "capped": capped, "cap": _SENTINEL_FILE_CAP, "elsewhere": dict(ELSEWHERE)}
    for c in measured:
        arms = _stacks.resolve(c)
        arm_langs = set(_stacks.langs_for(c))
        pr = probes.get(c) or {}
        sent = sentinels.get(c) or {}
        n = prod.get(c, 0)
        rec: dict[str, Any] = {"produced": n, "by": sorted({a.module for a in arms}),
                               "langs": sorted(arm_langs)}
        if pr:
            rec["scanned"] = pr.get("scanned", 0)
            rec["matched"] = pr.get("matched", 0)
            if pr.get("evidence"):
                rec["evidence"] = pr["evidence"]
        if n:
            rec["state"] = "present"
        elif pr.get("matched"):
            # The arm's OWN idiom is right there and it still produced nothing. That is a broken
            # or partial arm, not a clean zero — the case mapquery's hand-written schemas_zero
            # note was invented for ("an EMPTY arm, not a clean one"). tier3 reads pydantic in its
            # tree and emitted 0 schemas; before this branch that rendered as a tidy "empty".
            rec["state"] = "unmatched"
            rec["reason"] = (f"the arm's own idiom appears in {pr['matched']} of {pr['scanned']} "
                             "scanned file(s), yet it extracted nothing — an EMPTY arm, not a clean one")
        elif c in ("tables", "access") and (amap.get("sql_arm") or {}).get("role") == "fallback" \
                and (amap["sql_arm"].get("tables") or amap["sql_arm"].get("access")):
            # the raw-SQL fallback CAN see this concept, so the zero is no longer "nobody reads
            # your idiom" — it is an arm that ran and found the data layer another arm could not
            _sq = amap["sql_arm"]
            rec["state"] = "unmatched"
            rec["by"] = sorted(set(rec["by"]) | {"_a3_stacks_sql"})
            rec["reason"] = (f"the raw-SQL fallback reads {len(_sq.get('tables') or [])} table(s) "
                             f"and {(_sq.get('stats') or {}).get('statements', 0)} statement(s) here "
                             "— they are recorded on archmap.sql_arm, not yet joined to the "
                             "function graph (that join is Python-only today)")
        elif sent.get("hits"):
            rec["state"] = "unmatched"
            rec["sentinel"] = {"hits": sent["hits"], "files": sent["files"], "idiom": sent["idiom"]}
            rec["reason"] = (f"{sent['hits']} file(s) show this concept as {sent['idiom']} — "
                             "no registered arm reads that idiom")
        elif (arm_langs and "*" not in arm_langs and langs and not capped
              and not (arm_langs & langs)):
            # `capped` means the walk stopped early, so `langs` is a floor — calling a concept
            # unsupported on a partial language census would be a confident wrong answer.
            rec["state"] = "unsupported_language"
            rec["reason"] = (f"arms cover {sorted(arm_langs)}; this tree is {sorted(langs)} — "
                             "nothing here could be read")
        elif pr and not pr.get("scanned"):
            rec["state"] = "unmatched"
            rec["reason"] = pr.get("reason") or "nothing was scanned for this concept"
        else:
            rec["state"] = "empty"
            rec["reason"] = (pr.get("reason") or "") if pr else ""
        out["concepts"][c] = rec

    notes = []
    for left, right in IMPLIES:
        if left in ELSEWHERE or right in ELSEWHERE:
            continue                              # their own arms already say so, in c4 stats
        if prod.get(left) and not prod.get(right):
            notes.append(f"{left} produced {prod[left]} record(s) but {right} produced none — "
                         f"an EMPTY arm, not a clean one")
    if notes:
        out["implies"] = notes
    return out
