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
# the LEGEND is structured into sections + carries the corner-map explaining the 3 badge slots
ck("LEGEND_CMAP" in js and "code&#8209;behind" in js and 'class=\'cmap\'' in js,
   "the legend has a corner-map diagram (code-behind top-left · tests top-right · used-by bottom-right)")
ck(js.count('"<div class=\'lg-h\'>"+_lgTag+') >= 3,
   "the legend is grouped into labeled sections (this level · node badges · wires · interaction)")
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

# ── AUDIT LOCKS: the badge-vs-panel consistency fixes (the graph badge must AGREE with
#    the node's own panel — verified 66/66 gustify · 54/54 gastify via playwright) ─────
# #3: FN_BEHIND is DUAL-KEYED (slug|name AND the fn id) so the Functions level (id-keyed)
#     and the Trace level (slug|name-keyed) both resolve the behind floor.
ck(re.search(r"FN_BEHIND\[n\.slug\s*\+\s*[\"']\|[\"']\s*\+\s*n\.name\]", js) is not None
   and re.search(r"FN_BEHIND\[n\.id\]", js) is not None,
   "AUDIT #3: FN_BEHIND dual-keyed (slug|name AND fn id)")
# #4/#15: schema in-degree counts DISTINCT endpoints (touch OR resp), deduped per
#     endpoint — NOT touch and resp separately (that double-counted a handler that both
#     takes and returns X → badge 11 vs panel 6).
ck("var _schemaIn" in js and re.search(r"var\s+refd\s*=\s*\{\}", js) is not None
   and re.search(r"Object\.keys\(refd\)\.forEach", js) is not None,
   "AUDIT #15: _schemaIn dedups per endpoint (touch OR resp counted once)")
# #16: a MODEL already set USAGE_BY_KEY to its fan-in; the schema loop must NOT clobber it.
ck(re.search(r"if\(USAGE_BY_KEY\[_k\]\s*==\s*null\)\s*USAGE_BY_KEY\[_k\]\s*=\s*_schemaIn", js) is not None,
   "AUDIT #16: schema usage does not overwrite a same-named model's fan-in (== null guard)")
# #14: the panel Tests count folds cases_more (the >cap overflow) so the section total ==
#     the proof badge (was badge 26 vs panel 6). ecpCidsMore renders the '+N more' note.
ck("function ecpCidsMore(" in js
   and re.search(r"ecpG\(\"api\",\"test\",\s*apiC\.length\s*\+\s*casesMore", js) is not None,
   "AUDIT #14: panel Tests api-group count = apiC.length + casesMore (matches the badge)")
ck(js.count("casesMore=det.cases_more||0") >= 2,
   "AUDIT #14: BOTH cards (showPiece + showEndpoint) read cases_more for the Tests total")
# #13: the endpoint's screen chip keys on the C4 web id VERBATIM (b.from already carries
#     the 'web:' prefix — a "web:"+b.from would double-prefix and break peek/jump).
ck(re.search(r"key:\s*b\.from\b", js) is not None
   and '"web:"+b.from' not in js and "'web:'+b.from" not in js,
   "AUDIT #13: screen chip uses b.from verbatim (no double web: prefix)")

# ── SWEEP LOCKS: the structural-audit page fixes (verified 66/66·54/54 held after) ──────
# SWEEP-A: showPiece reads the KIND-aware detail key (model cls:, schema sch:) so a schema
#   panel shows its own columns, not a same-named model's.
ck(re.search(r'it\.kind===["\']model["\']\s*\?\s*["\']cls:["\']\s*:\s*["\']sch:["\']', js) is not None,
   "SWEEP-A: showPiece reads the kind-aware detail key (cls: model / sch: schema)")
# SWEEP-B: showFn RE-RESOLVES the canonical fn_node so a cross-home draw shows real home
#   god/usage/behind (was god:false + drawn-slug → usage 0 on Trace/Layers).
ck(re.search(r"_fn0\s*=\s*_FN\.filter", js) is not None and "f.god=!!_fn0.god" in js,
   "SWEEP-B: showFn re-resolves the fn_node (god/hub/behind from the home node)")
# SWEEP-B guard: the NAME-ONLY fallback fires only when UNAMBIGUOUS — two entities may
# define a fn of the same name; picking the first would show a homonym's god/usage.
ck(re.search(r"_byName\.length===1", js) is not None,
   "SWEEP-B: showFn name-only fallback is unambiguous-only (homonym guard)")
# SWEEP-B: the cross-home draw sites pass the HOME slug to nodeMarks + real god to fGlyph
#   (a name-only fallback resolves a usefn drawn under a borrowing entity).
ck(js.count('nodeMarks(g, 9, "fn:"+(f2.slug||slug)') >= 1
   and 'nodeMarks(gu, 9, "fn:"+(fu.slug||slug)' in js,
   "SWEEP-B: fn draw sites key nodeMarks by the HOME slug (f2.slug/fu.slug fallback)")
ck('"var(--c-fn-services)", false, !!fu.god' in js and js.count("!!f2.god") >= 1,
   "SWEEP-B: fGlyph gets the real god flag (not hardcoded false) at the fn draw sites")
# SWEEP-D: a 0-case tests OBJECT renders HOLLOW (unproven), not a green "0 · all passing".
ck(re.search(r"if\(!tests\s*\|\|\s*!\(tests\.n>0\)\)", js) is not None,
   "SWEEP-D: proofBadge renders hollow when tests.n<=0 (no green '0 · all passing')")
# SWEEP-D: Connections verb follows edge DIRECTION — active when the node is the source,
#   passive (…-by) when it is the target (was always active → target nodes read backwards).
ck("function edgeWordIn(" in js
   and re.search(r"out\s*\?\s*edgeWord\(e\.kind\)\s*:\s*edgeWordIn\(e\.kind\)", js) is not None,
   "SWEEP-D: ecpGraphConns inverts the verb for a target node (edgeWordIn on e.to===key)")

# ── POLISH LOCKS: frontend color/force + element finder + visual legend (2026-08-16) ──
# Frontend takes its backend entity's hue, a shade darker (was one hardcoded web-orange).
ck("function darken(" in js and re.search(r"darken\(COLORS\[slug\]", js) is not None,
   "POLISH: frontend bubble colour = darken(entity colour), not a fixed web-orange")
# Screens FORCE-spread (readable), not a tight ring.
ck("function forceScreens(" in js and "var pos=forceScreens(ids)" in js,
   "POLISH: frontend screens are force-distributed (forceScreens), not a fixed ring")
# The backend↔frontend bridge is fine-DOTTED + wears the entity hue.
ck(re.search(r'"stroke-dasharray":"1 4"', js) is not None and "var bc=scCol[e.from]" in js,
   "POLISH: bridge wire is fine-dotted (1 4) in the screen's entity colour")
# The top-right element FINDER: input + travels to matches (jumpToNode) + Enter/▲▼ nav.
ck('id="findinput"' in page and "function forceScreens(" in js,
   "POLISH: the element finder input is present")
ck(re.search(r"function recompute\(\)", js) is not None
   and re.search(r"if\(!jumpToNode\(k\)\)\s*peekNode\(k\)", js) is not None,
   "POLISH: the finder matches SELREG.nodes + travels to each match (jumpToNode/peekNode)")
# The legend SHOWS the real glyph/wire, never a word-description of it (operator ruling).
ck("function _lgS(" in js and "class='lgico'" in js and js.count("_lgS(") >= 8,
   "POLISH: legend rows render the real glyph/wire swatch (_lgS · svg.lgico), not words")
# the retired word-descriptions are GONE from the legend tail (shield/thick ring/red halo).
ck("<b>shield</b> = validator guard" not in js and "<b>red halo</b> = god piece" not in js,
   "POLISH: the word-description legend rows (shield=/red halo=) are removed")

# P1b (graft adoption): the panels render graft's raw signature (det.gsig from node_facts) —
# the endpoint Handler/Purpose signature row + the model/schema Definition row prefer it.
ck(js.count("det.gsig") >= 3 and re.search(r"det\.gsig\?", js) is not None,
   "P1b: showEndpoint + showPiece render graft's signature (det.gsig)")
ck('ecpSechd("function","Definition")' in js and "exported · public API" in js,
   "P1b: showPiece shows a Definition row (graft class signature) + the exported/public-API flag")

# operator ruling 2026-08-16: a LONG/complex kv value stacks — label+icon on top as a title,
# value full-width below (uses the whole panel column); short values stay inline side-by-side.
ck(".kv.stack{" in style and re.search(r'"kv"\s*\+\s*\(stack\?" stack"', js) is not None,
   "kv: a long value stacks (label on top, value full-width) — short values stay inline")

# P2b — the FRONTEND render (companion circle per entity + FE-native bucket circles)
ck(".fenode polygon.febody{" in style, "P2b: the frontend companion/bucket HEXAGON is styled (.fenode .febody)")
ck("function octPts(" in js, "P2b: the octagon-points helper is defined")
ck("D.frontend && D.frontend.present" in js,
   "P2b: the FE render is HONEST-EMPTY guarded — skipped when the graft arm is absent")
ck('"fe:"+en.slug' in js and "showFrontend(" in js,
   "P2b: each entity draws a clickable frontend companion → showFrontend()")
ck("D.fe_buckets" in js and "candidate" in js,
   "P2b: FE-native buckets draw as their own circles, candidate entities flagged")
ck("function feKindSummary(" in js and "function showFrontend(" in js,
   "P2b: the frontend panel helpers are defined")
# P2b — the FRONTEND FORCE-GRAPH level (vendored library render) + the motion toggle
ck('src="./assets/force-graph.min.js"' in page,
   "P2b-fg: the force-graph library is vendored + loaded")
ck('data-lvl="frontend"' in page and "function drawFrontendGraph(" in js,
   "P2b-fg: a '2 · Frontend' level renders the frontend force-graph")
ck("ForceGraph()" in js and "linkDirectionalParticles" in js,
   "P2b-fg: nodes/links from GABE_LEVELS, animated link particles (the movement)")
ck("function showFePiece(" in js and ".onNodeClick(" in js,
   "P2b-fg: a node click opens its piece panel")
ck("_FG.pauseAnimation()" in js and 'level==="frontend"' in js,
   "P2b-fg: the pause button freezes the force-graph; the SVG stage swaps for the canvas host")
ck('id="motionbtn"' in page and "svg.pauseAnimations()" in js and "[data-motion=" in style,
   "motion toggle: the pause button freezes both SMIL (pauseAnimations) and CSS (data-motion)")
ck('id="overlaysbtn"' in page and "themebtn" not in page,
   "toolbar: guards/hubs/pressure in an overlays dropdown; theme moved to the global cog")

print(f"levels-page battery: {p} passed, {f} failed")
sys.exit(1 if f else 0)
PY
