#!/usr/bin/env bash
# Center-generator fixture battery — the executable contract of the center's
# guard layer (2026-07-22 alignment review M01/M02/M04/M05/M09/M12).
#
# Every deterministic guard the generators ship is proven able to both FIRE and
# stay SILENT here: the refresh driver's capture→gates chaining (M01), the
# crawl gate's dead-href / estate-probe / empty-crawl / paths.center cases
# (M02, M04), the D123 unknown-slug abort, the lens-card completeness abort,
# the shell-missing exit 2 and the a3.css .xtbl guard exit 3, and the flow
# grammar + classifier honesty rules (M05, M12). Hermetic: temp fixture
# projects, env-override lab pattern (GABE_REPO_ROOT / GABE_SHELL_SRC), no
# network, cleans up after itself. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="$REPO/templates/center/generators"
SHELL_SRC="$REPO/templates/center/shell"

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

# --- fixture project ------------------------------------------------------
mk_fixture() { # $1 = dir, $2 = center rel path (default docs/site/center)
  python3 - "$1" "${2:-docs/site/center}" <<'PY'
import base64, json, sys
from pathlib import Path
root, center_rel = Path(sys.argv[1]), sys.argv[2]
c = root / center_rel
(c / "cards").mkdir(parents=True)
(root / "src").mkdir(parents=True)
# A real FastAPI endpoint so the endpoints lens has rows: MODELS USED links
# must route through the xpage map on the architecture pages (parsed via ast,
# never imported, so no fastapi dependency needed).
(root / "src" / "api.py").write_text(
    "from src.schemas import GadgetOut\n\n"
    'router = APIRouter(prefix="/gadgets")\n\n\n'
    '@router.get("/one", response_model=GadgetOut)\n'
    "def get_gadget():\n"
    '    """Fetch one gadget."""\n'
    "    return GadgetOut()\n\n\n"
    "def handler():\n    return 1\n")
# An over-budget file so the Code area's action table has a structure row
# (the folded-price shape needs rows to render).
(root / "src" / "big.py").write_text("# filler\n" * 810)
# Functions for the FUNCTIONS lens: a base helper used same-file, an orphan,
# and a god-length def.
(root / "src" / "funcs.py").write_text(
    "from src.widgets import PendingThing\n\n\n"
    "def plan_widget(p: PendingThing) -> PendingThing:\n    return p\n\n\n"
    "def make_gid():\n    return 'g-1'\n\n\n"
    "def build_gadget(seed):\n    return make_gid() + seed\n\n\n"
    "def lonely_helper():\n    return 0\n\n\n"
    "def emit_gadget(d: GadgetDraft) -> GadgetDraft:\n    return d\n\n\n"
    "def sprawler():\n" + "    x = 1\n" * 52 + "    return x\n")
# A schema whose fields carry machine-readable descriptions (kwarg + trailing
# comment) for the data-model Description column.
(root / "src" / "schemas.py").write_text(
    "class GadgetOut:\n"
    "    gid: str  # the gadget's public identifier\n"
    "    size: int = Field(description=\"measured footprint in mm\")\n"
    "    raw: bytes\n"
    "\n\nclass GadgetIn:  # 100% structural twin of GadgetOut -> merge candidate\n"
    "    gid: str\n"
    "    size: int\n"
    "    raw: bytes\n"
    "\n\nclass GadgetDraft:  # used by emit_gadget as param AND return -> in-out\n"
    "    gid: str\n"
    "    note: str\n")
(root / "tests" / "results").mkdir(parents=True, exist_ok=True)
(root / "tests" / "test_gadgets.py").write_text(
    "from src.schemas import GadgetOut\n"
    "from src.funcs import make_gid\n\n\n"
    "def test_lists_gadgets_C11(client):\n"
    '    client.get("/gadgets/one")\n\n\n'
    "def test_gid_format_C12():\n"
    "    make_gid()\n"
    "    GadgetOut()\n\n\n"
    # No own facts and no C-id: FIRES the ledger's via-file inherited chips
    # (Q1) and the unminted honesty tag (Q2).
    "def test_unlabeled():\n"
    "    assert True\n")
# A WEB corpus slice: a ts source in the entity's code map + a vitest-shaped
# junit whose describe carries provenance tokens — FIRES the tag facet
# (DF3/W1 -> data-tag + .ltag pills + the tag filter) and the uses·T3 chips
# (imported symbols are the closest file-tier gets to naming what is under
# test).
# WSeed lives in a file the TEST never imports — its link in planWidget's
# signature must resolve through the GLOBAL ts-export index.
(root / "src" / "kinds.ts").write_text(
    "export type WSeed = { gid: string };\n")
(root / "src" / "widget.ts").write_text(
    'import type { WSeed } from "./kinds";\n\n'
    "export function planWidget(seed: WSeed): GadgetOut {\n"
    "  return { gid: seed.gid } as GadgetOut;\n}\n"
    'export const WIDGET_KIND = "w";\n')
(root / "tests" / "widget.test.ts").write_text(
    'import { planWidget, WIDGET_KIND } from "../src/widget";\n\n'
    'it("arms", () => planWidget(WIDGET_KIND));\n')
(root / "tests" / "results" / "web-junit.xml").write_text(
    '<testsuites><testsuite name="vitest" timestamp="2026-07-23T00:00:00">'
    '<testcase classname="tests/widget.test.ts" '
    'name="DF3 widget guard (review W1) &gt; C14 · arms on edit" '
    'time="0.01"/>'
    "</testsuite></testsuites>")
(root / "tests" / "results" / "api-junit.xml").write_text(
    '<testsuites><testsuite name="pytest" timestamp="2026-07-23T00:00:00">'
    '<testcase classname="tests.test_gadgets" '
    'name="test_lists_gadgets_C11" time="0.1"/>'
    # C12 ran as two parametrize executions: ONE identity, one ledger row —
    # inside a pytest class so the card's # CLAIMS line can join it by NAME.
    '<testcase classname="tests.test_gadgets.TestGadgets" '
    'name="test_gid_format_C12[a]" time="0.1"/>'
    '<testcase classname="tests.test_gadgets.TestGadgets" '
    'name="test_gid_format_C12[b]" time="0.1"/>'
    '<testcase classname="tests.test_gadgets" '
    'name="test_unlabeled" time="0.1"/>'
    "</testsuite></testsuites>")
cfg = {"project": {"name": "Fixture", "domain": "battery"},
       "paths": {"center": center_rel, "kdbp": ".kdbp",
                 "results": "tests/results", "proof": "tests/web-e2e/proof"},
       "corpora": [{"key": "api", "runner": "pytest",
                    "kind": "integration", "kind_detail": "HTTP surface",
                    "tag_class": "l-api", "kpi_detail": "pytest"},
                   {"key": "web", "runner": "vitest",
                    "kind": "unit", "kind_detail": "components",
                    "tag_class": "l-web", "kpi_detail": "vitest"}],
       "entities": {"gadget": {"test_rx": "gadget|widget",
                               "proofs": ["g1", "solo"],
                               "code": {"api": ["src/api.py"],
                                        "services": ["src/big.py",
                                                     "src/funcs.py"],
                                        "schemas": ["src/schemas.py"],
                                        "web": ["src/widget.ts",
                                                "src/kinds.ts"]},
                               "models": []}}}
# The config ALWAYS lives at the DEFAULT center path — it is where paths.center
# itself is read from (_center_data: "CENTER_DIR is where config lives, so it
# cannot itself come from config"); everything else follows the override.
cfg_home = root / "docs/site/center"
cfg_home.mkdir(parents=True, exist_ok=True)
(cfg_home / "center.config.json").write_text(json.dumps(cfg, indent=1))
(c / "adoption.json").write_text(json.dumps(
    {"sections": [{"entity": "gadget", "display_name": "Gadget",
                   "status": "adopted", "rank": "high",
                   "signals": "fixture", "notes": ""}]}, indent=1))
(c / "cards" / "gadget.md").write_text("""# HANDLE
The gadget ledger.
# WHAT & WHY
Tracks gadgets end to end.
# FOR WHOM
Fixture people.
# FLOWS
- scan ★ → receipt into the ledger
- manual → typed entry path
# IS
The gadget slice.
# IS NOT
Everything else.
# DECIDED
- D1 fixture ruling.
# CLAIMS
- TestGadgets — gid format keeps its shape
""")
png = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
    "YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
g1 = root / "tests/web-e2e/proof/g1"
g1.mkdir(parents=True)
(g1 / "01-walk.png").write_bytes(png)
# The spec points at a CAPTURED test file — the evidence seam joins it to
# the corpus record (C14) and renders the Verified-by line.
(g1 / "manifest.json").write_text(json.dumps(
    {"feature": "Gadget scan walk", "spec": "tests/widget.test.ts",
     "proof_form": "recorded journey", "source_run": "local 2026-07-22",
     "role": "principal", "flows": ["scan"],
     "legs": {"walk": ["01"]},
     "narration": {"story": "One pass through the scan flow.",
                   "legs": {"walk": "start to finish"}}}, indent=1))
# A single-FILE proof set: loose at the proof root (M04's exact case).
(root / "tests/web-e2e/proof/solo.png").write_bytes(png)
PY
}

build() { # $1 = fixture root, $2 = shell dir; echoes exit code
  (cd "$T" && GABE_REPO_ROOT="$1" GABE_SHELL_SRC="$2" \
     python3 "$GEN/build_center_a3.py" >"$T/build.out" 2>&1; echo $?)
}
gate() { # $1 = fixture root; echoes exit code
  (cd "$T" && GABE_REPO_ROOT="$1" \
     python3 "$GEN/check_center_links.py" >"$T/gate.out" 2>&1; echo $?)
}

# --- builder guards: SILENT (happy build) + every FIRE ---------------------
FIX="$T/fix"; mk_fixture "$FIX"
[ "$(build "$FIX" "$SHELL_SRC")" = 0 ] && ok || { bad "builder: happy fixture must build (see $T/build.out)"; cat "$T/build.out"; }
[ -f "$FIX/docs/site/center/feature-gadget.html" ] && ok || bad "builder: feature page written for carded entity"
# Data-model Description column: kwarg + trailing-comment sources render,
# a bare field stays an em dash (never invented).
grep -q '<th>Description</th>' "$FIX/docs/site/center/feature-gadget.html" \
  && ok || bad "dm: Description column header renders"
grep -q "the gadget&#x27;s public identifier\|the gadget's public identifier" "$FIX/docs/site/center/feature-gadget.html" \
  && ok || bad "dm: trailing-# comment becomes the field description"
grep -q 'measured footprint in mm' "$FIX/docs/site/center/feature-gadget.html" \
  && ok || bad "dm: Field(description=) becomes the field description"
# Folded prices: Code + Evidence area tables drop the three price columns and
# state the shared price once under ⊕; Tests/Other keep the full shape.
python3 - "$FIX/docs/site/center/feature-gadget.html" <<'PY' && ok || bad "fold: Code/Evidence lean tables + shared-price info (see above)"
import re, sys
html = open(sys.argv[1]).read()
def section(anchor):
    i = html.find(f'id="{anchor}"')
    assert i != -1, anchor
    j = html.find('class="sechead"', i + 1)
    return html[i:j if j != -1 else len(html)]
code, ev = section("sec-code-actions"), section("sec-ev-actions")
for name, sec in (("code", code), ("evidence", ev)):
    assert "Cost / run after" not in sec, f"{name}: price column survived"
    assert "Shared price for every move here" in sec, f"{name}: shared price missing from info"
assert "Cost / run after" in html, "full-shape tables (Tests/Other) lost their price columns"
PY
# Model-insight lens (operator ruling 2026-07-23): icon tags, filter chips,
# two-bar usage, candidates table, archmap serialization.
python3 - "$FIX" <<'PY' && ok || bad "model insight: page + archmap signals (see above)"
import json, sys
from pathlib import Path
root = Path(sys.argv[1])
html = (root / "docs/site/center/feature-gadget.html").read_text()
assert 'id="dm-chips"' in html, "filter chips missing"
assert html.count('class="tag ic') >= 6, "icon chips missing"
assert 'title="base class' in html, "base tag missing (GadgetOut is base)"
assert 'title="orphan' in html, "orphan tag missing"
assert "u-int" in html and "ubar" in html, "two-bar usage missing"
assert "Data-model candidates" in html, "candidates table missing"
assert 'title="merge candidate"' in html, "twin pair must yield a merge candidate"
assert 'title="deprecation candidate"' in html, "orphan must yield a deprecation candidate"
assert "What the candidate icons mean" in html, "candidates icon dictionary missing"
assert "Insight icons" in html, "section icon dictionary missing"
assert '<ul class="iclist">' in html, "icon dictionary must render as a LIST"
assert "<span>Entity</span>" in html, "consolidated tables need the Entity column"
assert "<span>Touched by</span>" not in html and "<span>Used by</span>" not in html, \
    "touched-by/used-by columns must move into the row detail"
assert "dm-meta" in html, "row detail must lead with the metadata block"
assert "Usage by API" in html and "Usage by internal" in html, \
    "usage facts must render as TITLED tables in the detail"
assert 'class="dmh"' in html, "detail subsections need their iconed titles"
assert "Structure" in html and html.count('class="dmh"') >= 3, \
    "structure needs its own titled block"
assert "the teal bar is empty" in html or "<th>Endpoint</th>" in html, \
    "api usage table (or its honest-empty line) must render"
assert "the violet bar is empty" in html or "<th>Referencing function(s)</th>" in html, \
    "internal usage table (or its honest-empty line) must render"
# The FUNCTIONS lens (sibling section)
assert 'id="sec-code-fns"' in html, "functions section missing"
assert 'id="fn-chips"' in html, "functions filter chips missing"
fn_i = html.find('id="sec-code-fns"')
fns_html = html[fn_i:]
assert "make_gid" in fns_html and "sprawler" in fns_html, "fixture defs must list"
assert 'title="base — calls no other documented function"' in fns_html, \
    "make_gid must wear the base tag"
assert 'id="sec-code-model-cands"' in html and 'id="sec-code-fn-cands"' in html, \
    "both candidates sections need their own anchored secheads"
assert html.count("What the candidate icons mean") >= 2, \
    "both candidates sections need their icon dictionary in the section info"
assert "Function candidates" in fns_html, "function candidates section missing"
assert "lonely_helper" in fns_html.split("Function candidates")[1], \
    "lonely_helper must be a deprecation candidate"
assert "52" in fns_html or "53" in fns_html, "sprawler god-length must show"
assert "Signature" in fns_html and "Calls" in fns_html, \
    "detail needs Calls + Signature titled blocks"
fi = json.loads((root / "docs/site/center/archmap.json").read_text())["function_insight"]
mg = fi["src/funcs.py::make_gid"]
assert mg["base"] and mg["internal"] >= 1 and not mg["orphan"], mg
assert fi["src/funcs.py::lonely_helper"]["orphan"]
assert fi["src/funcs.py::sprawler"]["god"]
# in/out dialect + linked references (entity-icons round)
assert fi["src/funcs.py::emit_gadget"]["returns"] == "GadgetDraft"
assert 'class="tag t-io"' in html, \
    "GadgetDraft's referencing fn must wear in·out (param AND return)"
assert "<i>returns</i>" in html and 'class="tag t-out"' in html, \
    "Signature must state the return with its out role"
assert 'class="tag t-in"' in html, "params must carry the in role"
# to-be-designed pending links (app-internal import, documented nowhere)
assert 'class="tag ic t-tbd"' in html, \
    "PendingThing must render the to-be-designed pending link"
assert "AsyncSession" not in html or 't-tbd">tbd</span></a>' in html  # sanity
# endpoints + code map row details (the dm dialect everywhere)
assert "MODELS USED" not in html or "PURPOSE" in html
assert "FUNCTIONS DEFINED" in html and "CLASSES DEFINED" in html, \
    "code-map details must split defines into linked functions/classes"
assert "<span>Defines</span>" not in html, \
    "the Defines column must move into the row detail"
assert "BUDGET" in html, "code-map detail needs the budget row"
a = json.loads((root / "docs/site/center/archmap.json").read_text())
mi = a["model_insight"]
assert mi["GadgetOut"]["base"] and not mi["GadgetOut"]["orphan"], mi["GadgetOut"]
assert mi["GadgetOut"]["internal_refs"][0]["file"] == "src/api.py", \
    "endpoint handler must appear as a usage receipt"
assert mi["GadgetIn"]["orphan"], mi["GadgetIn"]
assert mi["GadgetOut"]["sim"]["cls"] == "GadgetIn" and mi["GadgetOut"]["sim"]["j"] == 1.0
assert mi["GadgetIn"]["kind"] == "schema"
PY

# M04: the single-file set's href carries NO set-name segment.
grep -q 'proof/solo.png"' "$FIX/docs/site/center/feature-gadget.html" \
  && ok || bad "single-file set: href must be proof-root relative"
grep -q 'proof/solo/solo.png' "$FIX/docs/site/center/feature-gadget.html" \
  && bad "single-file set: minted a dead <set>/<file> href (M04 regression)" || ok

# D123 unknown-slug abort.
D123="$T/d123"; mk_fixture "$D123"
python3 - "$D123" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1]) / "docs/site/center/center.config.json"
cfg = json.loads(p.read_text())
cfg["entities"]["bogus"] = {"test_rx": "bogus"}
p.write_text(json.dumps(cfg))
PY
[ "$(build "$D123" "$SHELL_SRC")" != 0 ] && ok || bad "D123: unknown config slug must abort"
grep -q "not entities in adoption.json" "$T/build.out" && ok || bad "D123: abort names the registry"

# Lens-card completeness abort.
CARD="$T/card"; mk_fixture "$CARD"
sed -i '/# DECIDED/,$d' "$CARD/docs/site/center/cards/gadget.md"
[ "$(build "$CARD" "$SHELL_SRC")" != 0 ] && ok || bad "card: missing required section must abort"
grep -q "missing section" "$T/build.out" && ok || bad "card: abort names the missing section"

# Shell missing → exit 2.
[ "$(build "$FIX" "$T/no-such-shell")" = 2 ] && ok || bad "shell missing must exit 2"

# a3.css without .xtbl → exit 3.
BROKEN="$T/shell-broken"; cp -a "$SHELL_SRC" "$BROKEN"
python3 - "$BROKEN/assets/a3.css" <<'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
p.write_text(p.read_text().replace(".xtbl", ".gone"))
PY
XFIX="$T/xfix"; mk_fixture "$XFIX"
[ "$(build "$XFIX" "$BROKEN")" = 3 ] && ok || bad "a3.css without .xtbl must exit 3"

# M05: malformed FLOWS lines surface as a build warning, never vanish.
M5="$T/m5"; mk_fixture "$M5"
sed -i 's/- manual → typed entry path/- manual entry with no arrow/' \
  "$M5/docs/site/center/cards/gadget.md"
[ "$(build "$M5" "$SHELL_SRC")" = 0 ] && ok || bad "m5: malformed FLOWS still builds"
grep -q "FLOWS line(s) did not parse" "$T/build.out" && ok || bad "m5: build must WARN on malformed FLOWS"
grep -q "FLOWS line(s) did not parse" "$M5/docs/site/center/feature-gadget.html" \
  && ok || bad "m5: the page's coverage note must carry the malformed count"

# --- crawl gate: SILENT + every FIRE --------------------------------------
[ "$(gate "$FIX")" = 0 ] && ok || { bad "gate: clean center must pass"; cat "$T/gate.out"; }
grep -q " 0 dead" "$T/gate.out" && ok || bad "gate: clean center reports 0 dead"
grep -q "to-be-designed reference" "$T/gate.out" \
  && ok || bad "gate: the pending-links sweep must WARN on t-tbd references"

# Dead internal href → exit 1.
DEAD="$T/dead"; mk_fixture "$DEAD"
build "$DEAD" "$SHELL_SRC" >/dev/null
echo '<a href="nope-missing.html">x</a>' >> "$DEAD/docs/site/center/index.html"
[ "$(gate "$DEAD")" = 1 ] && ok || bad "gate: dead internal href must exit 1"

# Duplicate ids are DEAD (review H1): the set-based anchor check is blind to
# them, so the gate counts occurrences per page.
DUP="$T/dup"; mk_fixture "$DUP"
build "$DUP" "$SHELL_SRC" >/dev/null
printf '<i id="dm-chips"></i>' >> "$DUP/docs/site/center/feature-gadget.html"
[ "$(gate "$DUP")" = 1 ] && ok || bad "gate: a duplicated id must FAIL the crawl"
grep -q "duplicate id" "$T/gate.out" && ok || bad "gate: dup-id failure names itself"
# File-qualified fn anchors (H1): same-named defs in different files can't collide.
grep -q 'id="fn-gadget-src-funcs-py-make-gid"' "$FIX/docs/site/center/feature-gadget.html" \
  && ok || bad "fn anchors must carry the defining file"

# Estate (../) ref probed on disk → missing target is DEAD, not exempt (M04).
EST="$T/est"; mk_fixture "$EST"
build "$EST" "$SHELL_SRC" >/dev/null
echo '<a href="../../../tests/web-e2e/proof/never.png">x</a>' >> "$EST/docs/site/center/index.html"
[ "$(gate "$EST")" = 1 ] && ok || bad "gate: missing estate target must exit 1"
grep -q "estate target missing" "$T/gate.out" && ok || bad "gate: estate probe names its finding"

# paths.center override honored end to end (M02: no hardcoded center path).
PANEL="$T/panel"; mk_fixture "$PANEL" "docs/site/panel"
[ "$(build "$PANEL" "$SHELL_SRC")" = 0 ] && ok || bad "panel: paths.center build"
[ -f "$PANEL/docs/site/panel/index.html" ] && ok || bad "panel: pages land under paths.center"
[ "$(gate "$PANEL")" = 0 ] && ok || bad "gate: must crawl the CONFIGURED center dir"
grep -q " 0 pages" "$T/gate.out" && bad "gate: crawled the hardcoded default instead of paths.center (M02 regression)" || ok

# Empty crawl → refuse the vacuous pass (M02).
EMPTY="$T/empty"; mkdir -p "$EMPTY"
[ "$(gate "$EMPTY")" = 1 ] && ok || bad "gate: 0 pages must exit 1, not pass green"
grep -q "refusing the vacuous pass" "$T/gate.out" && ok || bad "gate: empty crawl says why it failed"

# --- refresh driver wiring (M01) — stubbed builders isolate the shell logic -
RF="$T/rf"; mkdir -p "$RF/scripts" "$RF/docs/site/center"
cp "$GEN/refresh_center.sh" "$RF/scripts/"
cat > "$RF/scripts/build_center_a3.py" <<'PY'
open("gates-ran.marker", "w").write("build")
print("stub build")
PY
cat > "$RF/scripts/check_center_links.py" <<'PY'
print("stub gate")
PY
cat > "$RF/docs/site/center/center.config.json" <<'JSON'
{"commands": {"junit": ["echo capture-ran"], "coverage": ["echo cov-ran"],
              "e2e": ["echo e2e-ran"]}}
JSON
run_rf() { (cd "$RF" && bash scripts/refresh_center.sh "$@" >"$T/rf.out" 2>&1; echo $?); }

rm -f "$RF/gates-ran.marker"
[ "$(run_rf junit)" = 0 ] && ok || bad "refresh junit: must exit 0 (M01: was exit 1 before the gates)"
grep -q "capture-ran" "$T/rf.out" && ok || bad "refresh junit: capture ran"
[ -f "$RF/gates-ran.marker" ] && ok || bad "refresh junit: regenerate+gates block must be REACHED (M01)"

rm -f "$RF/gates-ran.marker"
[ "$(run_rf all)" = 0 ] && ok || bad "refresh all: must exit 0"
grep -q "cov-ran" "$T/rf.out" && grep -q "e2e-ran" "$T/rf.out" \
  && ok || bad "refresh all: must not die after the first group (M01)"
[ -f "$RF/gates-ran.marker" ] && ok || bad "refresh all: gates reached"

# No-commands group: says so, still reaches the gates.
cat > "$RF/docs/site/center/center.config.json" <<'JSON'
{"commands": {}}
JSON
rm -f "$RF/gates-ran.marker"
[ "$(run_rf junit)" = 0 ] && ok || bad "refresh junit(no cmds): exit 0"
grep -q "no commands declared" "$T/rf.out" && ok || bad "refresh junit(no cmds): says so"
[ -f "$RF/gates-ran.marker" ] && ok || bad "refresh junit(no cmds): gates reached"

[ "$(run_rf bogus-mode)" = 2 ] && ok || bad "refresh: unknown mode must exit 2"

# --- render/consume wiring (M19 Decisions · M40 coverage · M38 · M30) ------
DEP="$T/dep"; mk_fixture "$DEP"
mkdir -p "$DEP/.kdbp" "$DEP/tests/results"
cat > "$DEP/.kdbp/DEPLOYMENTS.md" <<'MD'
| # | Date | Branch → Target | PR | CI result | Notes | Decisions |
|---|------|-----------------|----|-----------|-------|-----------|
| d0 | 2026-07-21 | main → staging | — | green | first |
| d1 | 2026-07-22 | main → prod | PR#5 | green | notes here | D42 chose the estate probe |
MD
python3 - "$DEP" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1]) / "docs/site/center/center.config.json"
cfg = json.loads(p.read_text())
cfg["coverage"] = {"api": {"json": "tests/results/api-coverage.json"}}
p.write_text(json.dumps(cfg))
(Path(sys.argv[1]) / "tests/results/api-coverage.json").write_text(
    json.dumps({"totals": {"percent_covered": 78.31}}))
PY
[ "$(build "$DEP" "$SHELL_SRC")" = 0 ] && ok || bad "dep: wired fixture builds"
grep -q 'D42 chose the estate probe' "$DEP/docs/site/center/releases.html" \
  && ok || bad "M19: the Decisions column must render on the releases station"
grep -q '78.3% api' "$DEP/docs/site/center/tests.html" \
  && ok || bad "M40: a wired coverage reporter must ride the Testing KPI row"
# Silent halves on the plain fixture: no reporter -> named gap; no 7th column
# -> no decisions cell invented.
grep -q 'no reporter wired' "$FIX/docs/site/center/tests.html" \
  && ok || bad "M40: no reporter must stay the honest named gap"
# Entity icons: semantic keyword match first, hash pool only as fallback.
(cd "$GEN" && python3 -c "
import _a3_render as R
assert R.entity_glyph_name('transaction') == 'card'
assert R.entity_glyph_name('allergen') == 'alert'
assert R.entity_glyph_name('card-alias') == 'tag'   # alias beats card — order
assert R.entity_glyph_name('auth') == 'lock'
assert R.entity_glyph_name('zzz-mystery') == ''      # fallback path
assert '<svg' in R.entity_icon('zzz-mystery')
") && ok || bad "entity icons: semantic map must fit the twins' vocabulary"

# Architecture ESTATE (2026-07-23): a dashboard + six subpages, each running
# its entity-dialect section app-wide with the entity filter bar + icon-only
# entity column; nav lists every subpage.
python3 - "$FIX/docs/site/center" <<'PY2' && ok || bad "architecture estate: dashboard + six subpages (see above)"
import sys
from pathlib import Path
c = Path(sys.argv[1])
dash = (c / "architecture.html").read_text()
assert "archgrid" in dash and 'href="arch-endpoints.html"' in dash, "dashboard cards missing"
assert 'id="sec-code-endpoints"' not in dash, "dashboard must not inline the sections"
pages = {"arch-endpoints.html": "sec-code-endpoints",
         "arch-code-map.html": "sec-code-map",
         "arch-data-model.html": "sec-code-model",
         "arch-dm-candidates.html": "sec-code-model-cands",
         "arch-functions.html": "sec-code-fns",
         "arch-fn-candidates.html": "sec-code-fn-cands"}
for fname, anchor in pages.items():
    h = (c / fname).read_text()
    assert f'id="{anchor}"' in h, f"{fname}: missing {anchor}"
    assert 'class="entchips"' in h, f"{fname}: entity filter bar missing"
    assert "navsubitem" in h, f"{fname}: nav subpages missing"
h = (c / "arch-data-model.html").read_text()
assert 'class="entb ent-gadget"' in h, "icon-only entity column missing"
assert "dm-app-" in h, "app-scoped anchors missing"
# Cross-section links must route to the OWNING page — a bare same-page
# #dm-app-… anchor on the endpoints page is a dead link (gastify dry-run
# caught exactly this on 2026-07-23).
h = (c / "arch-endpoints.html").read_text()
assert 'href="arch-data-model.html#dm-app-' in h, \
    "endpoint model links must route via the xpage map"
assert 'href="#dm-app-' not in h, "unrouted same-page dm anchor on endpoints page"
# The filter must actually FIRE (2026-07-23 operator catch: the script bound
# rows before the tables existed, so clicking filtered nothing) and compose
# with the kind filter via classes, never a display-style tug-of-war.
for fname in pages:
    h = (c / fname).read_text()
    assert "classList.toggle('ehide'" in h, f"{fname}: entity filter not class-based"
    assert "var rows=[].slice.call" not in h.split("</h1>")[-1].split("sechead")[0], \
        f"{fname}: bar script must collect rows at click time, not eagerly"
h = (c / "arch-data-model.html").read_text()
assert "classList.toggle('khide'" in h, "kind filter must compose via khide"
css = (c / "assets" / "a3.css").read_text()
assert "position:sticky" in css.split(".entchips{", 1)[1].split("}")[0], \
    "the entity bar must stick while the page scrolls"
assert ".xrow.khide,.xrow.ehide" in css, "filter compose rule missing from css"
PY2

# The test↔code thread (spike ruling 2026-07-23): kind chips + tier-labeled
# receipts on code rows, from the fixture's junit + AST joins. FIRE proof:
# the endpoint chip, the handler's via-route credit, the C-id receipts, the
# named gaps (untested fn, coverage not captured), file reach, 4+ Tests cols.
python3 - "$FIX/docs/site/center/feature-gadget.html" <<'PY3' && ok || bad "thread: code rows carry kind chips + receipts (see above)"
import sys
html = open(sys.argv[1]).read()
assert 'title="integration' in html and "· 1" in html, \
    "endpoint kind chip (icon-only + count) missing"
assert "<b>Tests</b>" in html and "What it asserts" in html, \
    "endpoint Tests titled section with receipts table missing"
assert "<b>Models used</b>" in html, "Models-used titled section missing"
assert '<th>Model</th><th>Role</th>' in html, "MODELS USED must be a table"
assert 'l-api">' in html and "</svg> integration" in html, \
    "kind chip must carry its center-wide icon + color"
assert "via route · 1" in html, "handler via-route credit missing"
assert ">C11</span>" in html and ">C12</span>" in html, "C-id receipts missing"
assert "no case" in html, "untested-function gap chip missing"
assert "cov —" in html, "coverage named-gap chip missing"
assert "reach · " in html, "file reach chip missing"
assert html.count(">Tests</span>") >= 4, "Tests column missing from a table"
PY3

# The case LEDGER (rulings R1–R3 + Q1–Q6, 2026-07-24): the C-id is the row
# and the canonical anchor; dropdown filters (R2) incl. per-element datalists;
# solid T1 chips vs dashed via-file inheritance (Q1); the unminted honesty
# tag (Q2); parametrize variants grouped under their id; test-elements.html
# is the GAPS page — untested rows FIRE, tested elements stay SILENT — and
# the Shape-A element roster is gone from the entity tab.
python3 - "$FIX/docs/site/center" <<'PY4' && ok || bad "testing estate: case ledger + gaps page (see above)"
import sys
from pathlib import Path
c = Path(sys.argv[1])
dash = (c / "tests.html").read_text()
assert 'href="test-matrix.html"' in dash and "archgrid" in dash, "dashboard cards missing"
assert "Gaps" in dash and 'href="test-elements.html"' in dash, "Gaps card missing"
m = (c / "test-matrix.html").read_text()
assert 'id="ledbar"' in m and "<select" in m and "<datalist" in m, \
    "dropdown filter bar missing (R2)"
assert 'id="C11"' in m, "C-id row anchor missing (the canonical anchor)"
assert 'data-ep="get /gadgets/one"' in m, "own T1 endpoint fact missing on C11"
assert "lc-via" in m, "inherited via-file chip missing (Q1: test_unlabeled)"
assert ">unminted<" in m, "unminted honesty tag missing (Q2)"
assert "×2</small>" in m, "parametrize executions must group under C12"
assert 'href="arch-endpoints.html#ep-app-' in m, "chips must LINK the code estate"
assert 'data-ent="gadget"' in m, "entity data attribute missing"
assert 'id="sec-tests-files"' in m, "file-altitude table missing below the ledger"
assert 'class="ledmeta"' in m, "fold must be the labeled metadata grid"
assert 'class="k">entities<' in m, "fold must name the entities the case relates to"
assert 'in reach<details class="tinfo"' in m and "lonely_helper()" in m, \
    "in-reach chips (what reached files define) missing from the fold"
assert 'id="led-tag"' in m and 'data-tag="df3|w1"' in m, \
    "tag facet missing (tokens from the group name must be filterable)"
assert "tokenMatch" in m, \
    "exact-option inputs must token-match (GET /x must not catch GET /x/{id})"
assert 'data-for="led-ep"' in m and "closest('.lx')" in m, \
    "per-filter clear × missing (a filtered-to-zero ledger must never strand)"
assert 'class="ltit"' in m, "clear × must ride the title line, not the control"
assert 'class="ltag">DF3</span>' in m, "group tokens must render highlighted"
assert "<span>Exercises</span>" not in m, \
    "Exercises column retired — the fold carries what a case exercises"
assert 'class="tinfo"' in m and 'class="k">uses · T3<' not in m, \
    "tier codes must move off the labels into the ⓘ explainer"
assert 'uses<details class="tinfo"' in m and 'class="k kwide"' in m, \
    "the uses ⓘ must ride the label and the block must span the fold width"
assert "<b>functions</b>" in m and "<th>Signature</th>" in m \
    and ">planWidget<" in m and "seed: <a" in m, \
    "functions subsection must show typed signatures with linked types"
assert 'href="arch-code-map.html#cm-app-src-kinds-ts">WSeed</a>' in m, \
    "a signature type must link home via the GLOBAL ts-export index"
assert 'class="tclose"' in m and "d2._t=setTimeout" in m, \
    "the ⓘ popover needs its × and the auto-dismiss timer"
assert "<b>constants</b>" in m and ">WIDGET_KIND<" in m \
    and "<th>Declared as</th>" in m, \
    "constants subsection missing its declared-as column"
assert 'class="entb ent-gadget"' in m, "entity icon must lead the ledger row"
f = (c / "feature-gadget.html").read_text()
assert 'id="sec-tests-cases"' in f and 'id="C11"' in f, \
    "entity tab must carry the scoped ledger with C-id anchors"
assert 'title="integration · api corpus"' in f, \
    "Files kind cell must be icon-only (kind + corpus ride the title)"
assert '<a class="cid" href="#C11">' in f, \
    "Files rows must open onto their cases with C-ids linking the ledger"
assert ">running<" in f and "Cases · C-ids" not in f, \
    "claims must join the fixture class and drop the cases column"
assert '<a class="cid" href="#C12">' in f, \
    "claim fold C-ids must link their ledger rows"
# The EVIDENCE SEAM: g1's spec joins the corpus (C14 pill -> ledger row);
# the manifest-less solo set reads its named gap; sets carry anchors.
assert "<b>Verified by</b> <code>tests/widget.test.ts</code>" in f \
    and 'href="#C14"' in f, "evidence seam: spec must join its C-ids"
assert "no spec pointer joins the corpus record" in f, \
    "a set without a joinable spec must read its named gap"
assert 'id="ev-g1"' in f, "proof sets need anchors (the reverse link's target)"
# The triangle's last leg: dm card folds carry Tested-by receipts (the fn
# folds already did → count ≥ 2), and code-side C-id pills stay in-page on
# entity pages while the arch estate keeps the Cases-page link.
assert f.count("Tested by") >= 2, "dm fold must carry Tested-by receipts"
af = (c / "arch-functions.html").read_text()
assert 'href="test-matrix.html#C12"' in af, \
    "arch-estate receipts must link the Cases page ledger row"
# The truncation BAN (operator ruling 2026-07-25): never "… N more" with no
# reference — every receipts block links its FILTERED ledger view, and the
# ledger pre-applies filters arriving as URL params.
import re as _re2
for _pg, _h in (("feature", f), ("matrix", m), ("arch-fn", af)):
    assert not _re2.search(r"… \d+ more", _h) and \
        not _re2.search(r"\+\d+ more<", _h), f"dangling truncation on {_pg}"
assert "test-matrix.html?led-mdl=GadgetOut#sec-tests-cases" in f, \
    "dm Tested-by must link the model-filtered ledger"
assert "test-matrix.html?led-fn=make_gid%28%29#sec-tests-cases" in f, \
    "fn Tested-by must link the function-filtered ledger"
assert "test-matrix.html?led-ep=GET%20%2Fgadgets%2Fone#sec-tests-cases" in f, \
    "endpoint fold must link the route-filtered ledger"
assert "URLSearchParams" in m, "the ledger must pre-apply URL-param filters"
assert _re2.search(r'id="C11"[^>]*data-mdl="[^"]*gadgetout', m), \
    "T2 route credits must join the filter surface (C11 -> GadgetOut)"
assert "test-matrix.html?led-q=" in f, \
    "the evidence Verified-by must link the spec-filtered ledger"
assert 'id="sec-tests-gaps"' in f and "lonely_helper" in f, \
    "entity Untested-surface section missing"
assert 'id="sec-tests-elements"' not in f, \
    "Shape A element roster must be GONE from the entity tab"
el = (c / "test-elements.html").read_text()
assert 'class="entchips"' in el and "Untested surface" in el, "Gaps page missing"
assert "lonely_helper" in el, "untested function gap row must FIRE"
assert "/gadgets/one" not in el, "tested endpoint must stay SILENT on the Gaps page"
assert (c / "test-claims.html").exists() and (c / "test-corpora.html").exists()
PY4

# Gabe Center branding: the suite icon + subtitle ship in every skeleton.
grep -q "gabe-icon.png" "$FIX/docs/site/center/index.html" \
  && ok || bad "brand: the Gabe icon must ride the sidebar logo tile"
grep -q "Gabe Center" "$FIX/docs/site/center/index.html" \
  && ok || bad "brand: the subtitle must read Gabe Center"
[ -f "$FIX/docs/site/center/assets/gabe-icon.png" ] \
  && ok || bad "brand: gabe-icon.png must copy with the shell assets"
# M38: the architecture station fills its OWN skeleton, completely.
[ -f "$SHELL_SRC/architecture.html" ] && ok || bad "M38: shell/architecture.html skeleton must ship"
grep -q '<h1>Architecture</h1>' "$FIX/docs/site/center/architecture.html" \
  && ok || bad "M38: architecture.html renders"
grep -q '{{' "$FIX/docs/site/center/architecture.html" \
  && bad "M38: architecture.html left unfilled slot tokens" || ok
# M30: archmap.json carries the machine-readable flow-coverage verdict.
python3 - "$FIX" <<'PY' && ok || bad "M30: archmap coverage block wrong (see above)"
import json, sys
from pathlib import Path
a = json.loads((Path(sys.argv[1]) / "docs/site/center/archmap.json").read_text())
c = a["coverage"]["gadget"]
assert (c["covered"], c["total"]) == (1, 2), c
assert (c["golden_covered"], c["golden_total"]) == (1, 1), c
assert c["unproven"] == ["manual"], c
assert "solo" in c["unclassified"], c
PY
# M30 gate warns: malformed FLOWS card (reuse the M5 fixture) + a typo'd role.
gate "$M5" >/dev/null 2>&1
grep -q 'FLOWS line(s) do not parse' "$T/gate.out" \
  && ok || bad "M30: gate must WARN on a card FLOWS line that does not parse"
ROLE="$T/role"; mk_fixture "$ROLE"
python3 - "$ROLE" <<'PY'
import json, sys
from pathlib import Path
m = Path(sys.argv[1]) / "tests/web-e2e/proof/g1/manifest.json"
man = json.loads(m.read_text())
man["role"] = "Principal"
man["flows"] = ["scam"]
m.write_text(json.dumps(man))
PY
build "$ROLE" "$SHELL_SRC" >/dev/null
gate "$ROLE" >/dev/null 2>&1
grep -q "role 'Principal' is not one of" "$T/gate.out" \
  && ok || bad "M30: gate must WARN on a role outside the role set"
grep -q 'names key(s) the card lacks: scam' "$T/gate.out" \
  && ok || bad "M30: gate must WARN on flows naming a card-unknown key"

# --- walk subjects: bare slug AND adopt:<slug> both credit the entity ------
# (the walk-briefing reshape: /gabe-walk transaction and /gabe-adopt's
#  adopt:transaction are the same witness — an exact adopt:-only match left
#  honest walks invisible on the very page they walked)
WK="$T/walk"; mk_fixture "$WK"
mkdir -p "$WK/.kdbp"
printf '{"subject":"gadget","who":"t","when":"2026-07-23T00:00:00Z","result":"pass","evidence":null,"note":"walked"}\n' \
  > "$WK/.kdbp/walks.jsonl"
[ "$(build "$WK" "$SHELL_SRC")" = 0 ] && ok || bad "walk: fixture builds"
grep -q 'manual — walked 2026-07-23' "$WK/docs/site/center/feature-gadget.html" \
  && ok || bad "walk: BARE-slug subject must close the manual angle"
printf '{"subject":"adopt:gadget","who":"t","when":"2026-07-23T00:00:00Z","result":"pass","evidence":null,"note":"approved"}\n' \
  > "$WK/.kdbp/walks.jsonl"
build "$WK" "$SHELL_SRC" >/dev/null
grep -q 'manual — walked 2026-07-23' "$WK/docs/site/center/feature-gadget.html" \
  && ok || bad "walk: adopt:-prefixed subject must still close the manual angle"
printf '{"subject":"other-thing","who":"t","when":"2026-07-23T00:00:00Z","result":"pass","evidence":null,"note":"x"}\n' \
  > "$WK/.kdbp/walks.jsonl"
build "$WK" "$SHELL_SRC" >/dev/null
grep -q 'no walk on record' "$WK/docs/site/center/feature-gadget.html" \
  && ok || bad "walk: an unrelated subject must NOT credit the entity"

# --- NEW-row badges: the rowmarks engine (gastify trial 824bf7e, absorbed) --
if (cd "$GEN" && python3 - <<'PY'
import _a3_render as R

def snapshot_of(render):
    R.init_rowmarks(None)
    render()
    return R.rowmarks_seen()

# bootstrap: no baseline at HEAD -> record only, badge nothing
R.init_rowmarks(None)
assert "t-new" not in R.table(["A"], [["brand-new row"]])
# armed empty baseline -> everything badges
R.init_rowmarks({})
assert 'class="tag t-new">NEW</span>' in R.table(["A"], [["fresh row"]])
# known unchanged row stays clean
base = snapshot_of(lambda: R.table(["A", "B"], [["row-1", "same"]]))
R.init_rowmarks(base)
assert "t-new" not in R.table(["A", "B"], [["row-1", "same"]])
# touched row re-badges
base = snapshot_of(lambda: R.table(["A", "B"], [["row-1", "before"]]))
R.init_rowmarks(base)
assert "t-new" in R.table(["A", "B"], [["row-1", "after"]])
# a relative-time tick is the clock moving, not the row
base = snapshot_of(lambda: R.table(["Corpus", "Last run"],
                                   [["api", "T−27h"], ["proof", "47d ago"]]))
R.init_rowmarks(base)
assert "t-new" not in R.table(["Corpus", "Last run"],
                              [["api", "T−28h"], ["proof", "48d ago"]])
# xtable rows badge too — exactly the new one
base = snapshot_of(lambda: R.xtable(["Set", "Role"], [(["old-set", "principal"], "")]))
R.init_rowmarks(base)
out = R.xtable(["Set", "Role"], [(["old-set", "principal"], ""),
                                 (["new-set", "edge"], "<p>detail</p>")])
assert out.count("t-new") == 1
# duplicate first cells (LEDGER dates) key apart via the occurrence counter
rows = [["2026-07-22", "first"], ["2026-07-22", "second"]]
base = snapshot_of(lambda: R.table(["Date", "What"], rows))
R.init_rowmarks(base)
assert "t-new" not in R.table(["Date", "What"], rows)
PY
) >"$T/rowmarks.out" 2>&1; then ok; else bad "rowmarks unit cases (see below)"; cat "$T/rowmarks.out"; fi

# End to end: iteration boundary = commit boundary. Bootstrap badges nothing;
# committing the snapshot arms it; one appended LEDGER row badges exactly once;
# a same-iteration regen is idempotent.
RM="$T/rowmark-e2e"; mk_fixture "$RM"
(cd "$RM" && git init -q && git config user.email t@t && git config user.name t)
mkdir -p "$RM/.kdbp"
printf '| Date | What | Phase | Review | Push |\n|---|---|---|---|---|\n| 2026-07-22 | first row | 1 | ok | — |\n' > "$RM/.kdbp/LEDGER.md"
[ "$(build "$RM" "$SHELL_SRC")" = 0 ] && ok || bad "rowmark-e2e: bootstrap build"
grep -q "bootstrap — badges off" "$T/build.out" && ok || bad "rowmark-e2e: bootstrap says badges off"
grep -rl "t-new\">NEW" "$RM/docs/site/center" --include="*.html" >/dev/null \
  && bad "rowmark-e2e: bootstrap must badge NOTHING" || ok
(cd "$RM" && git add -A >/dev/null && git commit -qm baseline)
printf '| 2026-07-23 | second row | 2 | ok | — |\n' >> "$RM/.kdbp/LEDGER.md"
build "$RM" "$SHELL_SRC" >/dev/null
# The appended row may legitimately render (and badge) in more than one table;
# the contract is: badges exist, and EVERY badge in the estate belongs to the
# one changed row — nothing untouched lights up.
python3 - "$RM/docs/site/center" <<'PY' && ok || bad "rowmark-e2e: badges must mark ONLY the appended row (see above)"
import sys
from pathlib import Path
total, stray = 0, 0
for p in Path(sys.argv[1]).glob("*.html"):
    html = p.read_text()
    i = 0
    while (i := html.find('t-new">NEW', i)) != -1:
        total += 1
        # the badge sits IN the first cell — row context spans both sides
        around = html[max(0, i - 400):i + 400]
        # legitimate NEW content this iteration: the appended LEDGER row, and
        # the baseline COMMIT itself (git-derived tables see new history too)
        if not any(m in around for m in ("second row", "2026-07-23", "baseline")):
            stray += 1
            print(f"STRAY badge in {p.name}: …{around[-120:]!r}")
        i += 1
assert total >= 1, "no badge rendered at all"
assert stray == 0, f"{stray} stray badge(s) of {total}"
print(f"{total} badge(s), all on the appended row")
PY
cp "$RM/docs/site/center/rows-seen.json" "$T/rows-seen.1"
build "$RM" "$SHELL_SRC" >/dev/null
diff -q "$T/rows-seen.1" "$RM/docs/site/center/rows-seen.json" >/dev/null \
  && ok || bad "rowmark-e2e: same-iteration regen must be idempotent"
grep -q 't-new">NEW' "$RM/docs/site/center/ledger.html" \
  && ok || bad "rowmark-e2e: badges stable across same-iteration regens"

# --- flow grammar + classifier honesty (M05/M12/M03) -----------------------
if (cd "$GEN" && python3 - <<'PY'
import sys
import _a3_evidence as ev

flows, bad = ev.parse_flows(
    ["- scan ★ → receipt to ledger", "- browse the list",
     "- two words → x", "- manual → typed entry"])
assert [f[0] for f in flows] == ["scan", "manual"]
assert flows[0][2] is True and flows[1][2] is False
assert len(bad) == 2, bad

F = [("scan", "receipt into the ledger pipeline", True),
     ("manual", "typed entry path", False)]
S = lambda man, name="x": {"man": man, "name": name, "legs": []}
c = ev._classify(S({"role": "Principal"}), F)
assert c["role"] == "" and "role" in c["reason"]           # typo'd role → unclear
c = ev._classify(S({"role": "principal", "flows": "scan"}), F)
assert c["role"] == "" and "LIST" in c["reason"]           # string flows → unclear
c = ev._classify(S({"flows": ["scam"]}), F)
assert c["role"] == "" and "scam" in c["reason"]           # unknown key → unclear
c = ev._classify(S({"role": "principal", "flows": ["scan"]}), F)
assert (c["role"], c["flows"], c["golden"], c["explicit_match"]) == \
       ("principal", ["scan"], True, True)                 # explicit wins
c = ev._classify(S({"feature": "the scan journey", "proof_form": "recorded"},
                   name="scan-walk"), F)
assert c["role"] == "principal" and c["inferred"] and not c["explicit_match"]
c = ev._classify(S({}), F)
assert c["role"] == "" and c["reason"] == "no manifest"
# explicit EMPTY flows: [] declares "covers nothing" — inference stays shut
# (gastify 6ed1292: ca0's story once inferred five phantom flows)
c = ev._classify(S({"role": "supporting", "flows": [],
                    "narration": {"story": "the scan and manual paths"}}), F)
assert c["role"] == "supporting" and c["flows"] == []
# inference reads IDENTITY ONLY — a story mentioning a flow must not match
# (suite ruling 2026-07-23, handoff §9)
c = ev._classify(S({"feature": "context shots", "proof_form": "stills",
                    "narration": {"story": "user runs the scan pipeline"}},
                   name="ctx-set"), F)
assert c["flows"] == [], c
sys.exit(0)
PY
) >"$T/py.out" 2>&1; then ok; else bad "flow grammar/classifier unit asserts (see below)"; cat "$T/py.out"; fi

echo
echo "center battery: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
