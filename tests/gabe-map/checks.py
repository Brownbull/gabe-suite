#!/usr/bin/env python3
"""gabe-map battery — the server's executable contract (run by tests/gabe-map/run.sh).

Hermetic: a synthetic center (archmap · c4-graph · center.config · adoption) inside a temp git repo
with real commits (so freshness has a history), a FAKE `graft` on PATH returning canned JSON, real
`git grep`, and the battery client (read deadlines on every message). Proves FIRE and SILENT for the
wire laws, honest-empty, freshness, every `touches` kind, raw parity, and all five emit gates.

Env: SERVER_OVERRIDE (path to server.py — mutation proof; siblings resolve from that dir, shared
skills from GABE_SKILLS_DIR) · GABE_MAP_E2E=1 adds the API-billed harness run (opt-in).
"""
from __future__ import annotations
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SERVER = os.environ.get("SERVER_OVERRIDE") or os.path.join(REPO, "skills", "gabe-map", "scripts", "server.py")
os.environ.setdefault("GABE_SKILLS_DIR", os.path.join(REPO, "skills"))
sys.path.insert(0, HERE)
from client import Client, parse_text  # noqa: E402

PASS = FAIL = 0


def ok(cond: bool, msg: str, extra: str = ""):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
        print("FAIL: %s%s" % (msg, (" — " + str(extra)[:300]) if extra else ""))


def sh(args, cwd=None, env=None):
    return subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True)


def git(root, *args):
    r = sh(["git", "-C", root, *args])
    return r.stdout.strip()


# ── fixture ────────────────────────────────────────────────────────────────────
def write(root, rel, text):
    p = os.path.join(root, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)


def make_repo(T: str, seed_ignore: bool = True) -> str:
    root = os.path.join(T, "proj")
    os.makedirs(root)
    sh(["git", "init", "-q", root])
    git(root, "config", "user.email", "t@t"); git(root, "config", "user.name", "t")
    if seed_ignore:
        write(root, ".gitignore", ".kdbp/map-deltas.jsonl\n.kdbp/map-deltas-rollup.jsonl\n")
    os.makedirs(os.path.join(root, ".kdbp"), exist_ok=True)
    write(root, "apps/api/services/thing.py", '"""Service for things — see other.py which calls thing()."""\n\n\ndef thing():\n    return 1\n')
    write(root, "apps/api/other.py", 'from apps.api.services.thing import thing\n\n\nclass Caller:\n    def run(self):\n        return thing()\n\n\nclass Helper:\n    def run(self):\n        return 2\n')
    write(root, "apps/api/services/downstream.py", 'from apps.api.services.thing import thing\n\n\ndef down():\n    return thing()  # a caller the index missed\n')
    write(root, "apps/api/tests/test_thing.py", '"""Docstring mentions thing but never calls it."""\n\n\ndef test_other():\n    assert 1 == 1\n')
    write(root, "apps/api/api/things.py", 'def get_thing(item_id: int):\n    return {"id": item_id}\n')
    write(root, "apps/api/models/thing.py", 'class Thing:\n    pass\n')
    write(root, "apps/api/models/widget.py", 'class Widget:\n    pass\n')
    write(root, "apps/api/services/shared.py", 'X = 1\n')
    write(root, "apps/api/integrations/x.py", 'def a():\n    pass\n\n\ndef b():\n    pass\n')
    write(root, "apps/web/src/things.ts", 'export const Things = () => fetch("/api/v1/things/1");\n')
    write(root, "README.md", "fixture\n")
    git(root, "add", "-A"); git(root, "commit", "-q", "-m", "base")
    head = git(root, "rev-parse", "--short=8", "HEAD")
    center(root, head)
    git(root, "add", "-A"); git(root, "commit", "-q", "-m", "regen")          # the regen commit = freshness base
    write(root, "README.md", "fixture v2\n")
    git(root, "add", "-A"); git(root, "commit", "-q", "-m", "docs only")     # commits_since 2, nothing mapped → fresh
    return root


def center(root: str, head: str):
    ents = {
        "thing": {
            "defines": {"apps/api/services/thing.py": ["thing()"], "apps/api/other.py": ["Caller", "Helper"]},
            "endpoints": [{"method": "GET", "path": "/things/{item_id}", "fn": "get_thing", "file": "apps/api/api/things.py",
                           "status": "200", "resp": "ThingOut", "doc": "One thing", "touches": ["Thing"], "touches_x": ["Annotated"],
                           "middleware": [{"name": "auth", "gate": True, "via": "param-dep"}]}],
            "files": [["services", "apps/api/services/thing.py", 5], ["api", "apps/api/api/things.py", 2],
                      ["services", "apps/api/services/shared.py", 1], ["services", "apps/api/other.py", 11],
                      ["models", "apps/api/models/thing.py", 2], ["services", "apps/api/services/downstream.py", 5]],
            "models": [{"cls": "Thing", "table": "things", "file": "apps/api/models/thing.py",
                        "cols": [["id", "int", ""], ["name", "str", ""]], "fks": {}, "doc": "A thing", "uqs": [], "rels": []}],
            "schemas": [{"cls": "ThingOut", "file": "apps/api/schemas/thing.py", "fields": [["id", "int", ""]], "doc": ""}],
        },
        "other": {
            "defines": {"apps/api/models/widget.py": ["Widget"]},
            "endpoints": [],
            "files": [["services", "apps/api/services/shared.py", 1], ["models", "apps/api/models/widget.py", 2]],
            "models": [{"cls": "Widget", "table": "widgets", "file": "apps/api/models/widget.py",
                        "cols": [["id", "int", ""], ["thing_id", "int", ""]], "fks": {"thing_id": "things.id"}, "doc": "", "uqs": [], "rels": []}],
            "schemas": [],
        },
    }
    fi = {
        "apps/api/services/thing.py::thing": {"name": "thing", "fn": "thing", "file": "apps/api/services/thing.py", "entity": "thing",
                                              "layer": "services", "handler": False, "async": False, "lines": 2, "returns": "int",
                                              "doc": "—", "usage": 2, "access": {"commits": False, "ops": [{"model": "Thing", "table": "things", "rw": "r"}]}},
        "apps/api/api/things.py::get_thing": {"name": "get_thing", "fn": "get_thing", "file": "apps/api/api/things.py", "entity": "thing",
                                              "layer": "api", "handler": True, "async": False, "lines": 2, "returns": "dict", "doc": "—",
                                              "usage": 0, "access": {"commits": False, "ops": [{"model": "Thing", "table": "things", "rw": "r"}]}},
        "apps/api/other.py::Caller.run": {"name": "run", "fn": "Caller.run", "file": "apps/api/other.py", "entity": "thing", "layer": "services",
                                          "handler": False, "async": False, "lines": 2, "returns": "int", "doc": "—", "usage": 0, "access": {"commits": False, "ops": []}},
        "apps/api/other.py::Helper.run": {"name": "run", "fn": "Helper.run", "file": "apps/api/other.py", "entity": "thing", "layer": "services",
                                          "handler": False, "async": False, "lines": 2, "returns": "int", "doc": "—", "usage": 0, "access": {"commits": False, "ops": []}},
    }
    mi = {"Thing": {"kind": "model", "entity": "thing", "file": "apps/api/models/thing.py", "fk_in": 1, "internal": 1, "touches": 1, "usage": 1,
                    "internal_refs": [{"file": "apps/api/services/thing.py", "defs": ["thing"]}]},
          "Widget": {"kind": "model", "entity": "other", "file": "apps/api/models/widget.py", "fk_in": 0, "internal": 0, "touches": 0, "usage": 0, "internal_refs": []},
          "ThingOut": {"kind": "schema", "entity": "thing", "file": "apps/api/schemas/thing.py", "fk_in": 0, "internal": 1, "touches": 0, "usage": 0,
                       "internal_refs": [{"file": "apps/api/api/things.py", "defs": ["get_thing"]}]}}
    ti = {"by_function": {"apps/api/services/thing.py::thing": {"direct": [{"cid": "C7", "name": "test_thing_C7", "state": "pass", "corpus": "api", "tfile": "apps/api/tests/test_thing.py"}]}},
          "by_model": {"Thing": {"via_route": [{"cid": "C8", "name": "test_get_thing_C8", "state": "pass", "corpus": "api", "tfile": "apps/api/tests/test_things_api.py"}]}},
          "by_endpoint": {"apps/api/api/things.py::get_thing": {"api": [{"cid": "C8", "name": "test_get_thing_C8", "state": "pass", "corpus": "api", "tfile": "apps/api/tests/test_things_api.py"}],
                                                                "e2e": [{"cid": "", "name": "3 case(s)", "state": "file", "corpus": "e2e", "tfile": "apps/web/e2e/things.spec.ts", "n": 3}]}},
          "by_file": {"apps/api/services/thing.py": {"coverage": None, "reach": ["apps/api/tests/test_thing.py"]}},
          "case_home": {"C7": "apps/api/tests/test_thing.py", "C8": "apps/api/tests/test_things_api.py"},
          "case_own": {}, "exercises": {}}
    archmap = {"version": 2, "head": head, "generated": "2026-09-02 00:00Z", "entities": ents, "function_insight": fi, "model_insight": mi,
               "test_insight": ti, "guard_insight": {"files": {}, "functions": {}, "totals": {}},
               "file_census": {"claimed": 8, "scanned_dirs": ["apps/api"],
                               "unclaimed": [{"file": "apps/api/integrations/x.py", "fns": 2, "reason": "file not in any entity's code map", "routes": 0, "tables": 0}]},
               "coverage": {"thing": {"total": 2, "covered": 1, "unproven": ["x"], "golden_total": 1, "golden_covered": 0, "inferred": [], "malformed": 0, "unclassified": []}},
               "model_census": {"claimed": 2, "scanned_dirs": 1, "unclaimed": []}, "schema_homing": {}}
    ep_id = "endpoint:GET /things/{item_id}"
    c4 = {"version": 1, "head": head, "colors": {},
          "l1": {"nodes": [{"id": "thing", "kind": "entity", "slug": "thing"}, {"id": "other", "kind": "entity", "slug": "other"}],
                 "edges": [{"source": "other", "target": "thing", "weight": 1, "kinds": {"fk": 1}}]},
          "l2": {"thing": {"nodes": [{"id": ep_id, "kind": "endpoint", "fn": "get_thing", "label": "GET /things/{item_id}",
                                      "behind": {"fns": 2, "depth": 1, "names": ["thing", "AuthContext.require"]},
                                      "access": {"commits": False, "ops": [{"model": "Thing", "rw": "r", "table": "things"}]}, "det": {"cases": []}},
                                     {"id": "model:Thing", "kind": "model"}, {"id": "schema:ThingOut", "kind": "schema"},
                                     {"id": "web:apps/web/src/things", "kind": "web"}],
                           "edges": [{"kind": "reads_from", "source": ep_id, "target": "model:Thing"},
                                     {"kind": "touches", "source": ep_id, "target": "schema:ThingOut"}]},
                 "other": {"nodes": [{"id": "model:Widget", "kind": "model"}], "edges": []}},
          "cross_edges": [{"from": "model:Widget", "to": "model:Thing", "via": "thing_id", "from_slug": "other", "to_slug": "thing"},
                          {"kind": "bridge", "from": "web:apps/web/src/things", "to": ep_id, "from_slug": "thing", "to_slug": "thing"}],
          "fe": {"pieces": [{"id": "fe:apps/web/src/things.ts#Things", "file": "apps/web/src/things.ts", "name": "Things"}], "edges": [],
                 "homes": [{"id": "fe·thing", "kind": "fe", "pair": "thing", "pieces": 1, "areas": 1}]},
          "stats": {"graft": {"present": True, "index_hash": "abc123abc123"}, "web": {"present": True, "unmatched": []}}, "layout": {}}
    cfg = {"entities": {"thing": {"test_rx": "test_", "proofs": [], "models": ["Thing"],
                                  "code": {"services": ["apps/api/services/*.py", "apps/api/other.py"], "api": ["apps/api/api/*.py"], "models": ["apps/api/models/thing.py"]}},
                        "other": {"test_rx": "test_", "proofs": [], "models": ["Widget"], "code": {"models": ["apps/api/models/widget.py"]}}},
           "url_domain_map": {}}
    adoption = {"sections": [{"entity": "thing", "display_name": "Thing", "rank": "critical", "status": "approved",
                              "checklist": {"a": True, "b": False}, "signals": {}, "notes": ""}]}
    for name, data in (("archmap.json", archmap), ("c4-graph.json", c4), ("center.config.json", cfg), ("adoption.json", adoption)):
        write(root, "docs/site/center/" + name, json.dumps(data, indent=1, sort_keys=True))


def fake_graft(T: str) -> str:
    d = os.path.join(T, "bin")
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, "graft")
    with open(p, "w") as f:
        f.write('''#!/usr/bin/env bash
# fake graft: `graft callers <sym> . --json --no-refresh`
sym="$2"
case "$sym" in
  thing) cat <<'JSON'
{"query":"thing","matches":[{"symbol":{"id":"apps/api/services/thing.py#thing","name":"thing","kind":"function","path":"apps/api/services/thing.py","span":"L4-L5"},
 "hits":[{"id":"apps/api/other.py#Caller.run","relation":"calls","depth":1,"name":"run","kind":"function","path":"apps/api/other.py","span":"L5-L6"}]}],"saved":{"files":1,"baselineChars":10}}
JSON
  ;;
  *) echo '{"query":"'"$sym"'","matches":[]}' ;;
esac
''')
    os.chmod(p, 0o755)
    return d


def spawn(root, T, env_extra=None, cwd=None, graft_dir=None):
    env = {"PATH": ((graft_dir + ":") if graft_dir else "") + os.environ.get("PATH", ""), "GABE_SKILLS_DIR": os.environ["GABE_SKILLS_DIR"]}
    if env_extra:
        env.update(env_extra)
    return Client(SERVER, root, env=env, cwd=cwd or T)


def call_json(c, name, args):
    text, is_err, raw = c.call(name, args)
    return parse_text(text), is_err, text, raw


def live_lines(root):
    p = os.path.join(root, ".kdbp", "map-deltas.jsonl")
    return open(p).read().splitlines() if os.path.exists(p) else []


def main() -> int:
    T = tempfile.mkdtemp(prefix="gabe-map-")
    try:
        run(T)
    finally:
        shutil.rmtree(T, ignore_errors=True)
    print("gabe-map battery: %d passed, %d failed" % (PASS, FAIL))
    return 0 if FAIL == 0 else 1


def run(T):
    root = make_repo(T)
    gdir = fake_graft(T)
    os.makedirs(os.path.join(root, "graft", ".graph"), exist_ok=True)
    write(root, "graft/.graph/wiring.json", '{"meta":{},"nodes":[],"edges":[]}')

    # ── wire laws ──────────────────────────────────────────────────────────────
    c = spawn(root, T, graft_dir=gdir)
    r = c.request("server/discover", {"_meta": {}}, id_="server-discover-probe-1")           # auto-negotiation probe FIRST
    ok(r is not None and r.get("error", {}).get("code") == -32601 and r.get("id") == "server-discover-probe-1",
       "pre-initialize unknown method → -32601 with the STRING id echoed", r)
    r = c.request("tools/list")
    ok(r is not None and r.get("error", {}).get("code") == -32602, "tools/list before initialize → -32602", r)
    r = c.request("ping")
    ok(r is not None and r.get("result") == {}, "ping before initialize → {}", r)
    init = c.initialize("2025-11-25")
    res = (init or {}).get("result") or {}
    ok(res.get("protocolVersion") == "2025-11-25", "initialize echoes a supported version", init)
    ok((res.get("serverInfo") or {}).get("name") == "gabe-map", "serverInfo.name is gabe-map", res.get("serverInfo"))
    ok("mcp__gabe-map__who_calls" in (res.get("instructions") or ""), "instructions route to the full tool ids", (res.get("instructions") or "")[:80])
    ok(res.get("capabilities") == {"tools": {}}, "declares only tools", res.get("capabilities"))
    ok(any(m.get("method") == "roots/list" for m in c.server_requests), "server asked for roots after initialized", c.server_requests)
    tools = c.tools()
    names = sorted(t["name"] for t in tools)
    V1 = {"map_status", "entity_context", "touches", "who_calls", "entity_shape", "cases_for", "owner_of"}
    W2 = {"find", "outline", "center_overview", "blast_radius", "map_census", "map_diff", "center_status", "review_drift"}
    ok(set(names) == V1 | W2 and len(names) == 15, "v1 seven + wave-2 eight tools listed (15)", names)
    ok(all(t["inputSchema"].get("type") == "object" for t in tools), "every inputSchema is an object schema")
    ok(all("annotations" in t and "readOnlyHint" in t["annotations"] for t in tools), "every tool carries annotations")
    ok(next(t for t in tools if t["name"] == "who_calls")["annotations"]["readOnlyHint"] is False, "who_calls is not readOnly (the emit)")
    ok(all(len(t.get("description", "")) <= 200 for t in tools), "descriptions ≤ 200 chars", [(t["name"], len(t["description"])) for t in tools if len(t["description"]) > 200])
    r = c.request("nonsense/method")
    ok(r is not None and r.get("error", {}).get("code") == -32601, "unknown method → -32601", r)
    text, is_err, raw = c.call("no_such_tool", {})
    ok(is_err and (raw or {}).get("error", {}).get("code") == -32602, "unknown tool → -32602", raw)
    c.send_raw("this is not json")                                                  # garbage line → skipped
    c.send({"jsonrpc": "2.0", "method": "notifications/whatever"})                  # unknown notification → silence
    r = c.request("ping")
    ok(r is not None and r.get("result") == {}, "server survives a garbage line and an unknown notification", r)
    d, is_err, text, raw = call_json(c, "touches", {})
    ok(is_err and d and "stop" in d, "missing required argument → isError result with a stop message (not a JSON-RPC error)", text[:120])
    ok("structuredContent" not in ((raw or {}).get("result") or {}), "results carry NO structuredContent (one channel)")
    ok(text.startswith("gabe-map · touches"), "result text starts with the header line", text[:40])
    c.close()

    c = spawn(root, T, graft_dir=gdir)
    init = c.initialize("1999-01-01")
    ok(((init or {}).get("result") or {}).get("protocolVersion") == "2025-11-25", "unsupported version → the server's latest", init)
    c.close()

    # ── root law: CLAUDE_PROJECT_DIR wins over a foreign cwd; toplevel from a subdir ──
    sub = os.path.join(root, "apps", "api")
    c = spawn(sub, T, graft_dir=gdir, cwd=T)
    c.initialize()
    d, is_err, text, _ = call_json(c, "map_status", {})
    ok(d and d.get("present") is True and d.get("root") == root and d.get("root_source") == "CLAUDE_PROJECT_DIR",
       "CLAUDE_PROJECT_DIR (a subdir) resolves to the git toplevel, cwd ignored", {k: d.get(k) for k in ("present", "root", "root_source")} if d else text)
    ok(d and d["counts"]["endpoints"] == 1 and d["counts"]["models"] == 2 and d["counts"]["fe_pieces"] == 1, "map_status counts", d and d.get("counts"))
    ok(d and d["freshness"]["freshness"] == "fresh" and d["freshness"]["commits_since"] == 2, "docs-only commits after the regen read FRESH (base = regen commit)", d and d.get("freshness"))
    ok(d and d["graft"]["index_present"] and d["graft"]["match"] is False and "note" in d["graft"], "graft index hash mismatch is explained, never called stale", d and d.get("graft"))
    ok(d and d["file_census"] == {"claimed": 8, "unclaimed": 1}, "file_census summarized", d and d.get("file_census"))
    ok(d and isinstance(d.get("server_sha"), str) and len(d["server_sha"]) == 12, "server_sha present")
    # stale: edit a MAPPED file in the worktree (uncommitted) → stale
    write(root, "apps/api/other.py", open(os.path.join(root, "apps/api/other.py")).read() + "\n# touched\n")
    d, _, _, _ = call_json(c, "map_status", {})
    ok(d and d["freshness"]["freshness"] == "stale" and "apps/api/other.py" in d["freshness"]["mapped_files_changed"], "an uncommitted edit to a mapped file reads STALE (worktree-aware)", d and d.get("freshness"))
    git(root, "checkout", "--", "apps/api/other.py")
    # unknown head → tristate unknown
    a = json.load(open(os.path.join(root, "docs/site/center/archmap.json")))
    a["head"] = "deadbeef"
    write(root, "docs/site/center/archmap.json", json.dumps(a))
    d, _, _, _ = call_json(c, "map_status", {})
    ok(d and d["freshness"]["stale"] is None and d["freshness"]["freshness"] == "unknown", "head not in history → stale null / unknown", d and d.get("freshness"))
    git(root, "checkout", "--", "docs/site/center/archmap.json")
    c.close()

    # ── honest-empty ──────────────────────────────────────────────────────────
    nocenter = os.path.join(T, "plain"); os.makedirs(nocenter); sh(["git", "init", "-q", nocenter])
    c = spawn(nocenter, T)
    c.initialize()
    d, is_err, text, _ = call_json(c, "map_status", {})
    ok(d and d.get("present") is False and not is_err and "/gabe-cc-init" in d.get("hint", "") and "Grep" in d.get("hint", ""),
       "no center → present:false, isError:false, hint to Grep + cc-init", text[:200])
    d, is_err, _, _ = call_json(c, "touches", {"target": "Thing"})
    ok(d and d.get("present") is False and not is_err, "every tool answers honest-empty without a center", d)
    c.close()
    suite = os.path.join(T, "suite"); os.makedirs(os.path.join(suite, "docs", "center")); sh(["git", "init", "-q", suite])
    write(suite, "docs/center/suite-center.config.json", "{}")
    c = spawn(suite, T); c.initialize()
    d, _, _, _ = call_json(c, "map_status", {})
    ok(d and d.get("present") is False and "R8" in d.get("reason", "") and "hint" not in d, "suite-center repo → ruling R8, no cc-init hint", d)
    c.close()

    # ── tools on the fixture ──────────────────────────────────────────────────
    c = spawn(root, T, graft_dir=gdir)
    c.initialize()
    # entity_context
    d, _, _, _ = call_json(c, "entity_context", {})
    ok(d and len(d.get("entities", [])) == 2 and any(e["slug"] == "other" and e.get("note") for e in d["entities"]), "entity list = adoption ∪ archmap, unregistered flagged", d and d.get("entities"))
    d, _, _, _ = call_json(c, "entity_context", {"slug": "thing"})
    ok(d and d["entity"]["code"]["counts"]["endpoints"] == 1 and d["entity"]["code"]["endpoints"] == ["GET /things/{item_id}"], "brief carries counts + endpoint names", d and d.get("entity", {}).get("code"))
    ok(d and d["c4"]["l1_edges"] and d["c4"]["fe_home"]["id"] == "fe·thing" and d["coverage"]["total"] == 2, "brief adds c4 l1 edges, fe home, coverage", d and d.get("c4"))
    ok(d and d["entity"]["relations"] == {"related_entities": [], "unresolved_tables": [], "fk_out": 0}, "brief collapses relations to counts", d and d["entity"].get("relations"))
    d, _, _, _ = call_json(c, "entity_context", {"slug": "thing", "detail": "raw"})
    ref = sh([sys.executable, os.path.join(os.environ["GABE_SKILLS_DIR"], "gabe-cc-entity", "scripts", "entity-context.py"), "thing",
              "--center", os.path.join(root, "docs/site/center"), "--json"])
    ok(d and d.get("entity") == json.loads(ref.stdout), "raw detail is byte-parity with entity-context.py --json")
    d, is_err, _, _ = call_json(c, "entity_context", {"slug": "nope"})
    ok(is_err and d and "not found" in d.get("stop", "") and "thing" in d.get("stop", ""), "unknown slug → the reader's STOP text with the registered list", d)
    d, is_err, _, _ = call_json(c, "entity_context", {"slug": "thing", "detail": "huge"})
    ok(is_err and d and "detail must be" in d.get("stop", ""), "bad detail → stop", d)
    # touches: model with fk_in + r/w fns + cross-entity edge + cases split
    d, _, _, _ = call_json(c, "touches", {"target": "Thing"})
    ok(d and d["kind"] == "model" and d["fk_in_models"] == [{"model": "Widget", "col": "thing_id", "entity": "other"}], "model: fk_in computed from every model's fks", d and d.get("fk_in_models"))
    ok(d and {f["fn"] for f in d["functions_rw"]} == {"apps/api/services/thing.py::thing", "apps/api/api/things.py::get_thing"}, "model: functions r/w from access.ops", d and d.get("functions_rw"))
    ok(d and "reads_from" in d["endpoint_edges"] and "fk" in d["endpoint_edges"], "model: l2 edges ∪ cross_edges (kind-less FK row → fk)", d and d.get("endpoint_edges"))
    ok(d and d["tests"]["cases"][0]["cid"] == "C8", "model: cases from by_model", d and d.get("tests"))
    # touches: endpoint normalization + file-state rows split
    d, _, _, _ = call_json(c, "touches", {"target": "get /api/v1/things/${id}"})
    ok(d and d["matched"] and d["entity"] == "thing" and d["endpoint"]["handler"] == "apps/api/api/things.py::get_thing", "endpoint matched through normalization (/api/vN, ${x})", d)
    ok(d and d["behind"]["fns"] == 2 and d["screens_in"] and d["tests"]["cases"] == [{"cid": "C8", "name": "test_get_thing_C8", "state": "pass", "corpus": "api", "tfile": "apps/api/tests/test_things_api.py"}]
       and d["tests"]["covered_by_test_files"][0]["tfile"] == "apps/web/e2e/things.spec.ts", "endpoint: behind, bridge in-edge, state=file rows split off", d and d.get("tests"))
    ok(d and "touches_x" not in json.dumps(d), "touches_x is never surfaced")
    d, _, _, _ = call_json(c, "touches", {"target": "POST /things/1"})
    ok(d and d.get("matched") is False and "normalization" in d.get("reason", ""), "unmatched endpoint is named, not empty", d)
    # touches: file with two owners + census; unclaimed file
    d, _, _, _ = call_json(c, "touches", {"target": "apps/api/services/shared.py"})
    ok(d and {o["entity"] for o in d["owners"]} == {"thing", "other"}, "file: BOTH owners returned", d and d.get("owners"))
    d, _, _, _ = call_json(c, "touches", {"target": "apps/api/integrations/x.py"})
    ok(d and d["owned"] is False and d["census"]["claimed"] is False, "file: unclaimed census row surfaces", d and d.get("census"))
    # touches: bare function ambiguous / unique / qualified / define / case / entity
    d, _, _, _ = call_json(c, "touches", {"target": "run"})
    ok(d and len(d.get("ambiguous", [])) == 2, "bare name with 2 keys → ambiguous, never a silent pick", d)
    d, _, _, _ = call_json(c, "touches", {"target": "thing"})
    ok(d and d.get("kind") == "entity" and d.get("entity", {}).get("slug") == "thing", "bare 'thing' resolves to the ENTITY (slug wins over the function by rule order)", d and d.get("kind"))
    d, _, _, _ = call_json(c, "touches", {"target": "apps/api/services/thing.py#thing"})
    ok(d and d["function"]["access_ops"][0]["model"] == "Thing" and d["function"]["endpoints_reaching"]["found"] == ["endpoint:GET /things/{item_id}"]
       and "floor" in d["function"]["endpoints_reaching"], "qualified fn via #: access ops + endpoints reaching with the FLOOR label", d and d.get("function"))
    d, _, _, _ = call_json(c, "touches", {"target": "Caller"})
    ok(d and d["kind"] == "define" and d["methods"] == ["apps/api/other.py::Caller.run"], "define branch: a non-model class → methods", d)
    d, _, _, _ = call_json(c, "touches", {"target": "C7"})
    ok(d and d["kind"] == "case" and d["home"] == "apps/api/tests/test_thing.py", "case id → home test file", d)
    d, _, _, _ = call_json(c, "touches", {"target": "nothing_here"})
    ok(d and d.get("found") is False and "grep" in d.get("reason", ""), "unknown name → found:false naming the grep floor", d)
    # cases_for
    d, _, _, _ = call_json(c, "cases_for", {"target": "thing"})
    ok(d and d.get("via") in ("by_function", "case_home") or d.get("kind") == "entity", "cases_for resolves the target", d and {k: d.get(k) for k in ("kind", "via")})
    d, _, _, _ = call_json(c, "cases_for", {"target": "apps/api/api/things.py::get_thing"})
    ok(d and [x["cid"] for x in d["cases"]] == ["C8"] and d["covered_by_test_files"][0]["n"] == 3, "cases_for endpoint handler: cases vs file rows split", d)
    ok(d and d["max_cid_in_map"] == 8 and d["corpus"]["next_cid_floor"] is None or d["corpus"].get("max_cid_seen") is None, "corpus grep runs (fixture has no C-ids in test names → floor None)", d and d.get("corpus"))
    # owner_of
    d, _, _, _ = call_json(c, "owner_of", {"paths": ["apps/api/services/shared.py", "apps/api/integrations/x.py", "apps/api/"]})
    r0, r1, r2 = d["results"]
    ok({o["entity"] for o in r0["owners"]} == {"thing", "other"} and set(r0["config_glob_owners"]) == {"thing"}, "owner_of: map owners (2) + config-glob owners", r0)
    ok(r1["owned"] is False and r1["census"]["claimed"] is False and r1["note"], "owner_of: unowned file names the blind spot", r1)
    ok(r2["kind"] == "dir" and r2["owners"].get("thing") and r2["unclaimed_in_census"] == ["apps/api/integrations/x.py"], "owner_of: directory aggregate", r2)
    # entity_shape
    d, _, _, _ = call_json(c, "entity_shape", {"domain": "things"})
    ok(d and d.get("one_line") and d["domain"]["owners"] == {"thing": 1}, "entity_shape: domain owner lookup", d and d.get("domain"))

    # ── wave 2: the graft equivalents + map lifecycle ─────────────────────────
    d, _, _, _ = call_json(c, "find", {"query": "thing"})
    ok(d and d["hits"] and d["hits"][0]["kind"] == "entity" and d["hits"][0]["name"] == "thing" and d["total"] >= 4, "find: exact entity ranks first, total counts every kind", d and {k: d.get(k) for k in ("total",)} | {"top": (d or {}).get("hits", [])[:3]})
    d, _, _, _ = call_json(c, "find", {"query": "thing", "kind": "model", "limit": 1})
    ok(d and [h["kind"] for h in d["hits"]] == ["model"] and d["hits"][0]["name"] == "Thing", "find: kind filter + limit", d and d.get("hits"))
    d, is_err, _, _ = call_json(c, "find", {"query": "x"})
    ok(is_err and "2 characters" in (d or {}).get("stop", ""), "find: a 1-char query is a stop", d)
    d, _, _, _ = call_json(c, "outline", {"file": "apps/api/other.py"})
    ok(d and d["signatures"].startswith("unavailable") and {x["name"] for x in d["definitions"]} == {"Caller.run", "Helper.run"} and d["owners"], "outline without a graft index: definitions from function_insight, signatures named unavailable", d and {k: d.get(k) for k in ("signatures", "definitions")})
    write(root, "graft/.graph/wiring.json", json.dumps({"meta": {}, "nodes": [{"id": "apps/api/other.py#Caller.run", "name": "Caller.run", "kind": "method", "path": "apps/api/other.py", "span": "L5-L6", "signature": "def run(self) -> int", "exported": True}], "edges": []}))
    d, _, _, _ = call_json(c, "outline", {"file": "apps/api/other.py"})
    ok(d and d["signatures"].startswith("graft index") and d["definitions"][0]["signature"] == "def run(self) -> int" and d["definitions"][0]["span"] == "L5-L6", "outline with a graft index: span + signature from wiring.json", d and d.get("definitions"))
    d, _, _, _ = call_json(c, "center_overview", {})
    ok(d and len(d["entities"]) == 2 and d["entities"][1]["entity"] == "thing" and d["entities"][1]["coverage"] == "1/2" and d["census_gaps"]["files_unclaimed"] == 1 and d["unregistered"] == ["other"], "center_overview: entities with coverage, census gaps, unregistered", d and {k: d.get(k) for k in ("census_gaps", "unregistered")})
    d, _, _, _ = call_json(c, "blast_radius", {"files": ["apps/api/services/thing.py"]})
    ok(d and d["touched_entities"] == {"thing": 1} and "endpoint:GET /things/{item_id}" in d["endpoints_reached"] and d["reading"] == "contained" and "floor" in d, "blast_radius: owners + endpoints via behind.names (floor) + reading", d and {k: d.get(k) for k in ("touched_entities", "endpoints_reached", "reading")})
    d, _, _, _ = call_json(c, "blast_radius", {"files": ["apps/api/integrations/x.py"]})
    ok(d and d["reading"] == "unmapped" and d["unowned_files"] == ["apps/api/integrations/x.py"], "blast_radius: unmapped files are named, reading = unmapped", d)
    d, _, _, _ = call_json(c, "map_census", {})
    ok(d and d["census"]["file"]["unclaimed"][0]["file"] == "apps/api/integrations/x.py" and "reason" in d["census"]["route"], "map_census: unclaimed file listed, absent route census named", d and d.get("census"))
    d, is_err, _, _ = call_json(c, "map_census", {"kind": "bogus"})
    ok(is_err, "map_census: bad kind is a stop")
    d, _, _, _ = call_json(c, "map_diff", {"base": "HEAD"})
    ok(d and d["regenerated"] is False and "not regenerated" in d["note"], "map_diff: same head → regenerated:false, named", d)
    d, _, _, _ = call_json(c, "map_diff", {"base": "HEAD~2"})
    ok(d and d.get("regenerated") is None and "git show failed" in (d.get("reason") or ""), "map_diff: a ref without a committed map → reason, never a crash", d)
    d, _, _, _ = call_json(c, "center_status", {})
    ok(d and "reason" in d["status"] and "center_status.py" in d["status"]["reason"], "center_status: no installed script → reason", d and d.get("status"))
    d, _, _, _ = call_json(c, "review_drift", {"base": "HEAD~1"})
    ok(d and d["subjects"]["entity_shape"]["ran"] and d["subjects"]["web_bridge"]["ran"] and not d["subjects"]["reach"]["ran"] and not d["subjects"]["entity"]["ran"] and set(d["not_run"]) == {"reach", "entity", "workflow_census"},
       "review_drift: script-backed subjects run, record-backed ones NOT RUN with reasons", d and {k: v.get("ran") for k, v in (d or {}).get("subjects", {}).items()})
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "thing", "direction": "out", "depth": "2"})
    ok(d and d["direction"] == "out" and "callees" in d and "callers" not in d and d["emitted"] == 0 and any("transitive" in s for s in d["emit_skipped"]), "who_calls direction=out: callees named, never emits", d and {k: d.get(k) for k in ("direction", "emitted", "emit_skipped")})
    ok(d and d["map_confidence"]["active_missed_edges"] is None and "no map-delta ledger" in d["map_confidence"]["note"], "who_calls: map_confidence field present (no ledger → honest)", d and d.get("map_confidence"))

    # ── who_calls: the five emit gates ────────────────────────────────────────
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "thing"})
    ok(d and d["map_claim"] == "present" and d["callers"] == ["apps/api/other.py"] and d["defs"] == ["apps/api/services/thing.py"], "who_calls: graft arm parsed", d and {k: d.get(k) for k in ("map_claim", "callers", "defs", "callers_status")})
    ok(d and "apps/api/services/downstream.py" in d["grep_code_files"] and "apps/api/tests/test_thing.py" in d["grep_prose_files"],
       "who_calls: code hit vs docstring-only file classified (tokenize)", d and {k: d.get(k) for k in ("grep_code_files", "grep_prose_files", "grep_status")})
    ok(d and d["missed_by_map"] == ["apps/api/services/downstream.py"] and d["emitted"] == 1, "who_calls: the missed code caller is emitted (once)", d and {k: d.get(k) for k in ("missed_by_map", "emitted", "emit_skipped", "gates")})
    lines = live_lines(root)
    ok(len(lines) == 1 and '"cmd":"mcp"' in lines[0] and '"subject":"callers(thing)"' in lines[0] and "downstream.py" in lines[0], "delta line written with cmd:mcp", lines)
    ok(d and d["reach_line"].startswith("- **Reach:** ") and "graft@" in d["reach_line"] and "downstream.py" in d["reach_line"], "reach line includes the grep-found code file", d and d.get("reach_line"))
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "thing"})
    ok(len(live_lines(root)) == 1 and d["emitted"] == 0, "repeat call → 0 new lines (--once in the writer)", live_lines(root))
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "nothing_indexed"})
    ok(d and d["map_claim"].startswith("absent") and d["emitted"] == 0 and len(live_lines(root)) == 1, "empty graft arm → no claim → no emit", d and {k: d.get(k) for k in ("map_claim", "emitted", "emit_skipped")})
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "thing", "emit": False})
    ok(d and d["emitted"] == 0 and d["gates"]["emit_requested"] is False, "emit:false → no write", d and d.get("gates"))
    # F1: a rollup ledger present must not crash who_calls (json was unimported) — map_confidence answers
    with open(os.path.join(root, ".kdbp", "map-deltas-rollup.jsonl"), "w") as fh:
        fh.write(json.dumps({"v": 2, "gen": "_a3_graft.calls", "subject": "callers(x)", "file": "a.py", "count": 3, "last_n": 999999}) + "\n")
    d, is_err, _, _ = call_json(c, "who_calls", {"symbol": "thing", "emit": False})
    ok(not is_err and d and (d.get("map_confidence") or {}).get("active_missed_edges") == 1, "who_calls with a rollup ledger → map_confidence (F1: json import)", d and d.get("map_confidence"))
    os.remove(os.path.join(root, ".kdbp", "map-deltas-rollup.jsonl"))
    d, is_err, _, _ = call_json(c, "who_calls", {"symbol": "bad symbol; rm -rf"})
    ok(is_err and d and "identifier" in d.get("stop", ""), "non-identifier symbol → stop", d)
    c.close()
    # GABE_MAP_NO_EMIT
    os.remove(os.path.join(root, ".kdbp", "map-deltas.jsonl"))
    c = spawn(root, T, graft_dir=gdir, env_extra={"GABE_MAP_NO_EMIT": "1"}); c.initialize()
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "thing"})
    ok(d and d["emitted"] == 0 and not live_lines(root), "GABE_MAP_NO_EMIT=1 → nothing written (the twin dry-run switch)", d and d.get("emitted"))
    c.close()
    # not gitignored → skipped and named
    noign = make_repo(os.path.join(T, "b"), seed_ignore=False)
    os.makedirs(os.path.join(noign, "graft"), exist_ok=True)
    c = spawn(noign, T, graft_dir=gdir); c.initialize()
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "thing"})
    ok(d and d["emitted"] == 0 and any("not gitignored" in s for s in d["emit_skipped"]) and not live_lines(noign), "un-ignored accumulator → emit skipped + named", d and d.get("emit_skipped"))
    c.close()
    # no graft dir → grep arm still answers, no emit, reach line honest
    nograft = make_repo(os.path.join(T, "c"))
    c = spawn(nograft, T, graft_dir=gdir); c.initialize()
    d, _, _, _ = call_json(c, "who_calls", {"symbol": "thing"})
    ok(d and d["callers_status"].startswith("no index") and d["grep_code_files"] and d["emitted"] == 0 and d["reach_line"] == "no index",
       "no graft/ → grep arm answers, no emit, reach_line 'no index'", d and {k: d.get(k) for k in ("callers_status", "grep_code_files", "emitted", "reach_line")})
    c.close()

    # ── opt-in harness e2e (API-billed) ───────────────────────────────────────
    if os.environ.get("GABE_MAP_E2E"):
        cfg = os.path.join(T, "mcp.json")
        write(T, "mcp.json", json.dumps({"mcpServers": {"gabe-map": {"type": "stdio", "command": sys.executable, "args": [SERVER]}}}))
        env = {k: v for k, v in os.environ.items() if k not in ("CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT")}
        env["PATH"] = gdir + ":" + env.get("PATH", "")
        r = subprocess.run(["claude", "-p", "Call the gabe-map map_status tool once and print only the word DONE.", "--mcp-config", cfg,
                            "--strict-mcp-config", "--allowedTools", "mcp__gabe-map", "--max-turns", "3", "--output-format", "stream-json", "--verbose"],
                           cwd=root, env=env, capture_output=True, text=True, timeout=240)
        # the stream carries the assistant's tool_use blocks — the ONLY place the call is visible from outside the server
        called = '"name":"mcp__gabe-map__map_status"' in r.stdout.replace(" ", "")
        ok(r.returncode == 0 and called, "harness e2e: the model called mcp__gabe-map__map_status through the real client", r.stdout[-400:] + r.stderr[-300:])


if __name__ == "__main__":
    sys.exit(main())
