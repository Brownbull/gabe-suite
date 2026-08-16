#!/usr/bin/env bash
# Levels-page panel battery — a STATIC/STRUCTURAL executable contract for the
# consolidated codebase-graph page (templates/center/shell/codebase-archive-lab.html)
# after the Phase-2 ECP panel port (element-components.html → the levels page).
#
# WHY THIS EXISTS: the render gates never EXECUTE the page's inline panel JS
# (verify_center_chrome.mjs runs only rowclick.js against a stub DOM, check_center_links
# only resolves srcs), so a whole class of panel bug ships green. This battery is
# node/python-stdlib + grep only (no browser, no twin), zero-arg, doctor-auto-run.
# It locks the port's invariants:
#   * the page reads BOTH feeds — levels.js (GABE_LEVELS) AND c4-graph.js (GABE_C4,
#     the endpoint `behind` floor + web bridges), with an honest-empty C4 guard.
#   * every element card is built through the ECP kit (mountCard) — no show* falls
#     back to the retired string-builders (which are GONE, asserted).
#   * the tab rule: Tests + Code-behind use ecpTabbed; Connections use ecpConns
#     (never tabbed); behind renders its NAMED callees (derive_behind.names).
#   * the ECP panel CSS is SCOPED under #panel (a bare global .chip/.sec/.ecp rule
#     would leak into the rest of the center) — MUTATION-PROVEN.
#   * the chips wire into the diagram (ECP.onPeek=peekNode · onJump=jumpToNode).
# Exit 0 = all pass. Add a FIRE+SILENT pair with every new panel invariant.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
PAGE="$REPO/templates/center/shell/codebase-archive-lab.html"

python3 - "$PAGE" <<'PY'
import sys, re, pathlib
page = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")

p = f = 0
def ck(cond, msg):
    global p, f
    if cond: p += 1
    else: f += 1; print("  FAIL:", msg)

# split the main IIFE script (the panel JS) from the <style> block, cheaply
style = "\n".join(re.findall(r"<style>(.*?)</style>", page, re.S))
scripts = re.findall(r"<script>(.*?)</script>", page, re.S)
js = next((s for s in scripts if '"use strict"' in s), "")

# ── BOTH FEEDS loaded ────────────────────────────────────────────────────────
ck('src="./levels.js"' in page, "levels.js (GABE_LEVELS) is loaded")
ck('src="./c4-graph.js"' in page, "c4-graph.js (GABE_C4) is loaded — the second feed the panel reads")
ck(re.search(r"var\s+C4\s*=\s*window\.GABE_C4\s*\|\|\s*null", js) is not None,
   "honest-empty C4 guard: window.GABE_C4 || null (C4 absent ⇒ card rows go empty, never throw)")

# ── the ECP kit is present ───────────────────────────────────────────────────
for fn in ("function mountCard(", "function ecpHeader(", "function ecpUsage(",
           "function ecpConns(", "function ecpTabbed(", "function ecpBehind(",
           "function ecpChipList(", "function ecpColsTable(", "function ecpGraphConns("):
    ck(fn in js, f"ECP kit defines {fn.split('(')[0].split()[-1]}()")

# ── every element card is built through mountCard (no string-builder fallback) ──
for show in ("showEntity", "showPiece", "showEndpoint", "showFn"):
    m = re.search(rf"function {show}\(.*?\n(.*?)\n(?=function |/\* )", js, re.S)
    body = m.group(1) if m else ""
    ck("mountCard(" in body, f"{show}() renders an ECP card via mountCard()")

# ── the retired pre-port string-builders are GONE (removed, not left dead) ──────
for gone in ("function indicatorHTML(", "function kindIcon(", "function structSect(",
             "function fkSect(", "function connectionsHTML(", "function wireConnRows(",
             "function detailOf("):
    ck(gone not in js, f"retired builder {gone.split('(')[0].split()[-1]} is removed")

# ── the tab rule + the behind floor ──────────────────────────────────────────
ck('ecpTabbed("test","Tests"' in js, "Tests are built with ecpTabbed (tab-when->1-corpus rule)")
ck('ecpConns("link","Connections"' in js, "Connections use ecpConns (NEVER tabbed)")
ck("b.names" in js and 'ecpSechd("layers","Code behind"' in js,
   "ecpBehind renders the NAMED callees (derive_behind.names) under a Code-behind section")
# the FUNCTION card also shows Code-behind (the hidden mass a fn pulls in — per-fn floor)
_sf = re.search(r"function showFn\(.*?\n(.*?)\n(?=function |/\* )", js, re.S)
ck(_sf is not None and re.search(r"if\(f\.behind\)\s*body\.push\(ecpBehind\(f\.behind\)\)", _sf.group(1)) is not None,
   "showFn renders Code behind (ecpBehind) when the fn carries a behind floor")
ck("function c4Endpoint(" in js and "function c4BridgesTo(" in js,
   "the endpoint card reads C4: c4Endpoint (behind/det) + c4BridgesTo (screens)")

# ── chips wire into the diagram (peek + travel) ──────────────────────────────
ck(re.search(r"ECP\.onPeek\s*=\s*peekNode", js) is not None, "chip hover → peekNode (highlights the graph node)")
ck(re.search(r"ECP\.onJump\s*=\s*jumpToNode", js) is not None, "chip click → jumpToNode (travels to the node)")
ck("navFwd" in js and "function ecpTraceGo(" in js, "the header trace is back/forward (navStack + navFwd)")
# jumpToNode must handle "ent:" keys (entities are not in SELREG) or a FORWARD-trace hop
# onto an entity silently drops the trace — the exact review-caught bug.
_jtn = re.search(r"function jumpToNode\(.*?\n(.*?)\n(?=function |/\* )", js, re.S)
ck(_jtn is not None and 'ent:' in _jtn.group(1) and 'showEntity(' in _jtn.group(1),
   "jumpToNode lands on 'ent:' keys directly (forward-trace onto an entity works)")

# ── the honest-empty WHY-UNLINKED explainer survives the port (an unlinked piece/
#    endpoint says WHY it draws no connector, from the layout-independent LINKED table) ──
ck("function ecpUnlinked(" in js and "var LINKED" in js,
   "the why-unlinked explainer (ecpUnlinked over the LINKED table) is present")
ck(js.count('ecpUnlinked("cls"') >= 1 and js.count('ecpUnlinked("ep"') >= 1,
   "showPiece + showEndpoint wire the why-unlinked section (honest-empty on no connectors)")

# ── second-review fixes (all in NEW code paths) ─────────────────────────────
# F2: BOTH trace variants pair show* with attachSelection (drawTrace AND drawTraceFlow),
#     else the flow variant leaves #ecp-conns empty + drops an endpoint's bridged screens.
_flow = re.search(r"function drawTraceFlow\(.*?\n(.*?)\nfunction ", js, re.S)
_flowbody = _flow.group(1) if _flow else ""
ck(_flowbody.count("attachSelection(") >= 3,
   "drawTraceFlow pairs every element show* with attachSelection (fills #ecp-conns + screens)")
# F1: a direct entity click enters the trace (navTouch) so the header back/forward is its own
ck(re.search(r'function showEntity\(.*?navTouch\("ent:"\+en\.slug\)', js, re.S) is not None,
   "showEntity enters the node trace (navTouch) — the header trace reflects the entity, not a stale node")
# F3: schema usage is a real in-degree (endpoints referencing it), not a false 0 from a missing hub
ck("reference this body/response" in js,
   "schema Usage derives a real in-degree (endpoints touching/returning it), not hub-0")
# F4: the fn Tests section no longer shows a contradictory 0 pill / false 'N cases cover' note
ck("no cases claimed for a function" in js and "case(s) cover this function" not in js,
   "the function Tests section is honest-empty (no self-contradictory count pill)")
# F6: the dead #navback control is gone (the ECP header owns the trace now)
ck('id="navback"' not in page and 'getElementById("navback")' not in js,
   "the retired #navback control is removed (no dead hidden button + handler)")
# F5: jumpToNode reports whether it landed; the forward-trace pops navFwd only on success
ck("return false" in js and "if(ok!==false) navFwd.pop()" in js,
   "the forward-trace peeks then pops navFwd only on a successful land (no lost key / desync)")

# ── FRONTEND MAPPING (frontend-placement option 2: a dedicated Frontend entity) ──
ck("function drawFrontend(" in js and "function showWeb(" in js and "function c4Screens(" in js,
   "the frontend overlay is present: drawFrontend (entity + bridges) + showWeb (screen card)")
ck(js.count("drawFrontend(defs, contLayer, interLayer, layer, b, radii)") >= 2,
   "drawFrontend is hooked into BOTH trace variants (drawTrace + drawTraceFlow), per-entity radii-placed")
ck('kind==="web"' in js and 'e.kind==="bridge"' in js,
   "screens read from GABE_C4 web nodes; bridge wires from cross_edges kind:'bridge'")
ck("function epKeyOf(" in js,
   "bridges resolve the endpoint by its M-path label (aspect dedup: C4 home ≠ drawn home)")
# per-entity DISTRIBUTION: screens group beside their backend entity (homed by where their
# endpoints DRAW, not the C4 file-home) — the operator's "closer" ruling, short bridges
ck("var byEnt={}" in js and "tally[s]=(tally[s]||0)+1" in js,
   "drawFrontend homes each screen to its primary DRAWN-endpoint entity (per-entity clusters)")
# the screen card wires the bridged fetches as hot chips (hover peeks the endpoint node)
_sw = re.search(r"function showWeb\(.*?\n(.*?)\n(?=function |/\* )", js, re.S)
ck(_sw is not None and "epKeyOf(x.to, x.to_slug)" in _sw.group(1) and 'ecpConns("link","Reaches"' in _sw.group(1),
   "showWeb: bridged fetch chips carry the endpoint key (peek/travel) + a Reaches-entities section")
# bridges are shown from C4 as a card EXTRA, never double-counted from the drawn 1-hop
ck('if(e.kind==="bridge") return;' in js,
   "ecpGraphConns skips bridge edges (fetches come from the complete C4 set, not the drawn subset)")

# ── NODE BADGES: toggle buttons for CODE-BEHIND (top-left) + USED-BY (bottom-right) ──
ck('id="behindbtn"' in page and 'id="usagebtn"' in page,
   "the behind + used-by toggle buttons exist in the toolbar (siblings of the Tests toggle)")
ck("function behindBadge(" in js and "function usageBadge(" in js and "function nodeMarks(" in js,
   "the badge renderers exist: behindBadge (top-left) + usageBadge (bottom-right) + nodeMarks dispatcher")
ck('var showBehind' in js and 'var showUsage' in js
   and 'lensBtn("behindbtn"' in js and 'lensBtn("usagebtn"' in js,
   "the toggles are wired (showBehind/showUsage flags via lensBtn, off by default)")
# the badges sit at DIFFERENT corners than Tests (top-right): behind top-left, usage bottom-right
ck("var bx=-(r*0.95+3), by=-r*0.95-3;" in js and "var bx=r*0.95+3, by=r*0.95+3;" in js,
   "behind badge is TOP-LEFT, usage badge is BOTTOM-RIGHT (Tests stays top-right)")
# nodeMarks is called at the node draw sites (endpoints/models/functions), not just defined
ck(js.count("nodeMarks(") >= 12, "nodeMarks is wired at every node draw site (>=12 calls)")

# ── the ECP panel CSS is SCOPED under #panel (no global leak) ─────────────────
# Every ECP panel rule must be prefixed with #panel. A BARE global rule (a line that
# starts one of these class selectors with no #panel ancestor) would leak the card
# styles into the rest of the center — the exact regression this guards.
ecp_selectors = (".ecp{", ".phead{", ".pname{", ".sechd{", ".chip{", ".tabbar{", ".ubar{", ".tipico{")
bare = []
for line in style.splitlines():
    s = line.strip()
    for sel in ecp_selectors:
        # a rule opening with the selector, not scoped by #panel earlier on the line
        if sel in s and "#panel" not in s.split(sel)[0]:
            # allow it only if the selector is a substring of a longer class (e.g. .chip.hot handled via #panel)
            if re.search(r'(^|[\s,>])' + re.escape(sel), s):
                bare.append(s[:60])
ck(not bare, f"every ECP panel CSS rule is scoped under #panel (bare leaks: {bare[:3]})")
ck("#panel .ecp{" in style, "the ECP card root is scoped: #panel .ecp{…}")
ck("#panel .chip.hot:hover{" in style, "the connection-chip peek-hover style is present + scoped")

# ── MUTATION intent: prove the scope check can FIRE. Inject a bare `.chip{…}` rule
#    into a COPY of the style and confirm the same predicate would flag it. ───────
mutated = style + "\n.chip{ color:red; }\n"
bare_m = []
for line in mutated.splitlines():
    s = line.strip()
    if ".chip{" in s and "#panel" not in s.split(".chip{")[0] and re.search(r'(^|[\s,>])\.chip\{', s):
        bare_m.append(s)
ck(bool(bare_m), "MUTATION: a bare unscoped .chip{…} rule IS detected by the scope guard (guard can fire)")

# font follows the center settings (a3-settings.js writes --font-content/--root-size)
ck("--font-content" in style and "--root-size" in style,
   "the card follows the center content font/size (--font-content / --root-size, with fallbacks)")

print(f"levels-page battery: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
