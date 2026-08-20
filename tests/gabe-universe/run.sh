#!/usr/bin/env bash
# Gabe Universe station battery — a STATIC/STRUCTURAL executable contract for the
# twin center's "Gabe Universe" station (templates/center/shell/gabe-universe.html):
# the 5C 3D graph (lifted from the graft-adoption spike) fed LIVE by window.GABE_C4,
# with the element-components card ported to read the real per-node dossier (det).
#
# WHY THIS EXISTS: the render gates never EXECUTE the station's inline engine, and a
# whole class of bug ships green — the data feed dropped, the live card reverting to
# a toy field, the chip-class collision, the journeys field-mismatch (j.entities vs the
# card's old j.to). This battery is node-stdlib/grep only (no browser required), zero-arg,
# and the doctor auto-runs it. Every invariant ships as a FIRE+SILENT pair where the
# structural form allows (a positive present-assert + a guard on the known-bad pattern).
# An OPTIONAL headless-chrome render proof runs against the committed example feed when
# playwright-core + google-chrome-stable are present; it SKIPs loudly otherwise
# (nothing-to-verify is not the same as verified).
# Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SHELL_SRC="$REPO/templates/center/shell"

python3 - "$SHELL_SRC" <<'PY'
import sys, re, pathlib
shell = pathlib.Path(sys.argv[1])
page  = (shell / "gabe-universe.html").read_text(encoding="utf-8")

pass_ = 0; fail = 0
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

# ── 1. data feed + 3D assets are loaded (the station is inert without them) ──
check('src="./c4-graph.js"' in page, "c4-graph.js data feed not loaded (adapter has no input)")
check('src="./assets/3d-bundle.js"' in page, "3d-bundle.js (three.js + ForceGraph3D) not loaded")
check('src="./assets/chip-assets.js"' in page, "chip-assets.js (GLB fleet models) not loaded")
check('window.GABE_C4' in page, "adapter does not read window.GABE_C4")

# ── 2. the live adapter flattens the C4 hierarchy (l1/l2/cross_edges), not the toy NODEDEF ──
check('var NODEDEF=' not in page, "toy NODEDEF survived — the live adapter did not replace the spike's fixed data")
check('_C4.l2' in page and 'cross_edges' in page, "adapter does not flatten l2 + cross_edges")

# ── 3. nav: Gabe Universe is the ACTIVE row, exactly once, and the crumb names it ──
check(page.count('class="navitem on" href="gabe-universe.html"') == 1, "Gabe Universe nav row is not the single active item")
check('<b>Gabe Universe</b>' in page, "topbar crumb does not name the station")

# ── 4. one-row topbar; the spike's title-bar/explorer/hint are hidden, but the CONFIG + LEGEND are REVEALED ──
check(re.search(r'\.bar,\s*#expl,\s*\.hint\{[^}]*display:\s*none', page) is not None,
      "the spike title-bar/explorer/hint are not hidden")
check('#cfg, #expl' not in page and '#cfg, #elegend' not in page,
      "regression: #cfg/#elegend still in the hidden-overlay list (config + legend must be revealed)")
check('<div class="topbar">' in page, "one-row topbar missing")
# config + legend revealed and repositioned clear of the nav/topbar
check('#cfg.cfg{ top:calc(var(--topbarh)' in page, "config panel not repositioned below the topbar")
check('#elegend{ left:calc(var(--navw)' in page, "legend not moved clear of the nav")
# nav minimize + config gear affordances
check('id="navgear"' in page and 'window.__uniCfgToggle' in page, "config gear affordance missing")
check('id="navmin"' in page and 'window.__uniNavToggle' in page, "nav minimize affordance missing")
check('id="navshow"' in page and 'body.nav-min' in page, "nav restore tab / collapse class missing")
# web nodes get a billboard ICON (in `order`), not the fallback primitive cube
check('"screen","web","endpoint"' in page, "web kind not in `order` — web nodes would render as the primitive cube, not the screen icon")

# ── 5. #g is inset by the nav + topbar (not the spike's full-viewport fixed) ──
check(re.search(r'#g\{[^}]*left:\s*var\(--navw\)', page) is not None, "#g not inset by the nav width")

# ── 6. LIVE CARD helpers present (the toy per-kind renderer was replaced) ──
for fn in ("testsSec(det)", "journeysSection(", "payloadSec(det)", "liveConns(n)", "structureSec(n)"):
    check(fn in page, "live card helper missing: "+fn)
check('var cids=function' not in page, "toy cids() single-state test renderer survived")

# ── 7. FIRE+SILENT: journeys read the LIVE field j.entities, NOT the card's stale j.to ──
check('journeyFaces(home, j.entities' in page, "journeys do not read the live det field j.entities")
check('journeyFaces(home, j.to' not in page, "REGRESSION: journeys still read the stale j.to (dead on live det)")

# ── 8. FIRE+SILENT: tri-state test credits attach to .pchip, NOT .chip (explorer-chip collision) ──
check('"pchip st-"+st' in page, "test credits do not use the .pchip class")
check('"chip st-"+st' not in page, "REGRESSION: test credits use .chip — collides with the explorer encoding chips")

# ── 9. ported CSS present (else st-fail / ttag / journeys render uncolored) ──
for css in (".pchip.st-pass", ".pchip.filecov", ".ttag.inferred", ".connbox .cinf .pchip", ".jfaces", ".face.fhome"):
    check(css in page, "ported CSS rule missing: "+css)

# ── 10. the tokens the ported CSS references are DEFINED (missing var → uncolored border) ──
for tok in ("--red:", "--edge:", "--god:", "--font-ui:", "--font-mono:"):
    check(tok in page, "token not defined (ported CSS would render uncolored): "+tok)

# ── 10b. curved connectors: geometry branch present; the control lives in the config LINES pill (NOT the topbar) ──
check('QuadraticBezierCurve3' in page, "curved geometry (QuadraticBezierCurve3 arc) missing")
check('window.__uniCurved?__uniCurve' in page, "connectorWire does not branch straight/curved on the flag")
check('id="curveToggle"' not in page, "the topbar Curved button should be REMOVED (moved into the config LINES pill)")
check('pillHTML("lineStyle"' in page and '__uniSetCurve' in page, "the config LINES (Straight/Curved) control is missing")

# ── 10c. all 5 documented C4 piece kinds are drawable + a silent-drop is impossible ──
check('if(!KINDS.web)' in page, "web kind not injected — c4 web pieces would be silently dropped")
check('dropped "+_dropped+" piece' in page, "adapter does not warn on dropping an unknown kind (silent drop)")

# ── 10d. batch-2 layout engine: entity-layout (chain/force/spread) + cluster-core (layer/kind/tests) + 2nd tab ──
check('entLayout:"force"' in page and 'coreBy:"layer"' in page, "CFG missing entLayout/coreBy fields")
check('function recomputeEX' in page and 'function assignSub' in page, "layout recompute/assignSub functions missing")
check('__chainMode' in page, "mode-aware zForce (chain vs force/spread) missing")
check('grp==="entLayout"' in page and 'grp==="coreBy"' in page, "applyCfg missing the entLayout/coreBy branches")
check('d3ReheatSimulation' in page, "entity-layout change never reheats the sim (nodes would not move)")
check('window.__uniAddLayoutTab' in page and 'cfgtabbar' in page, "the Display|Layout config tab is missing")
check('recomputeEX(CFG.entLayout); }catch(e){} build' in page, "the initial layout is not applied before build()")
# FIRE+SILENT: force/spread compute 3D anchors (EY/EZ), not just a flat X band
check('EY[e]=0; EZ[e]=0;' in page and ('EY[s]=Math.round' in page or 'EZ[s]=Math.round' in page),
      "EY/EZ 3D entity anchors not computed — force/spread would stay flat")

# ── 10e. batch-3: the levels feed drives Use-case / Community / FK-join cores (Guards dropped — no data) ──
check('src="./levels.js"' in page, "levels feed not loaded — usecase/community/fk cores have no source")
check('function _levelsGroupMap' in page and 'window.GABE_LEVELS' in page, "levels group-map join missing")
check('mode==="usecase"' in page and 'mode==="community"' in page and 'mode==="fk"' in page,
      "assignSub missing the usecase/community/fk levels-backed branches")
check('fk_communities' in page and 'usecases' in page and 'communities' in page, "levels map fields not read")

# ── 10f. batch-4: functions layer toggle · Guards core (data-backed) · LINES in config ──
check('function _buildFnData' in page and 'function toggleFns' in page, "functions layer (fn_nodes toggle) missing")
check('fn_nodes' in page and 'fn_edges' in page, "functions do not read the levels fn_nodes/fn_edges")
check('grp==="showFns"' in page and 'grp==="lineStyle"' in page, "applyCfg missing the showFns/lineStyle branches")
check('mode==="guards"' in page and '{v:"guards"' in page, "Guards cluster-core missing (it is data-backed via endpoint.guards)")
check('isFinite(n.x)) _npos' in page, "the _npos NaN guard is missing (a transient add would spew computeBoundingSphere NaN)")

# ── 10g. batch-5: config re-tabbed Planets|Universe · master planet-assets toggle · orbit-around-click ──
check('data-pane="planets"' in page and 'data-pane="universe"' in page, "config not re-tabbed into Planets | Universe")
check('pillHTML("warOn"' in page, "master planet-assets on/off toggle missing")
check('onBackgroundClick' in page and 'intersectPlane' in page, "orbit-around-cursor (background raycast pivot) missing")
check('Graph.cameraPosition(_cp,{x:n.x' in page, "node-click orbit pivot (re-aim camera on the clicked node) missing")

# ── 10h. batch-6: assets OFF default · Zones inline master toggle · core 2-col grid · connector throttle ──
check('warOn:false' in page, "planet assets are not OFF by default")
check('grplbl zoneshd' in page, "the Zones title does not carry the inline On/Off master toggle")
check('zonesoff' in page, "zone icons do not dim when the master toggle is off")
check('data-grp="coreBy"]{ display:grid' in page, "cluster-core pill is not a 2-column grid (it would overflow)")
check('if(force || _wtick%3===0) updateConnectors' in page, "per-tick connector rebuild is not throttled (settle stays laggy)")

# ── 11. every remaining {{TOKEN}} is a token the GLOB loop fills on EVERY page (HUB_TITLE/SYNC_AGE are
#        PER_FILE / unused here → deliberately EXCLUDED so an accidental orphan is caught, not waved through) ──
SHARED = {"LANG","PROJECT_NAME","HEAD_SHA","REGEN_STAMP","GENERATOR_NAME","ENTITY_COUNT","TESTS_COUNT",
          "SIDEBAR_ENTITIES","SIDEBAR_CODE","SIDEBAR_LEAF","STATUS_PILLS"}
toks = set(re.findall(r'\{\{([A-Z_]+)\}\}', page))
orphan = toks - SHARED
check(not orphan, "page carries tokens the glob build cannot fill on every page: "+", ".join(sorted(orphan)))

# ── 11b. reverse nav symmetry: the station's OWN nav links back to the core sibling stations ──
for href in ('href="index.html"', 'href="codebase-graph.html"', 'href="codebase-archive-lab.html"', 'href="tests.html"'):
    check(href in page, "station nav missing a sibling backlink: "+href)

print(f"  static: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY
STATIC=$?

# ── 12. nav consistency: every sibling full-nav page carries the Gabe Universe item ──
MISS=0
for f in index board architecture entity-index docs codebase-archive tests releases codebase-graph ledger codebase-archive-lab feature; do
  grep -q 'href="gabe-universe.html"' "$SHELL_SRC/$f.html" || { echo "  FAIL: $f.html nav missing the Gabe Universe item"; MISS=1; }
done
[ "$MISS" = 0 ] && echo "  nav-consistency: 12/12 sibling pages carry the item"

# ── 13. OPTIONAL headless render proof against the committed example feed ──
EXPAGE="$SHELL_SRC/example/codebase-graph-station/gabe-universe.html"
CHROME=/usr/bin/google-chrome-stable
PWDIR="$REPO/docs/design/graft-adoption/spike/_build/node_modules/playwright-core"
if [ -x "$CHROME" ] && [ -d "$PWDIR" ] && [ -f "$EXPAGE" ]; then
  node - "$EXPAGE" "$PWDIR" <<'JS'
const path=require('path');
const { chromium } = require(process.argv[3]);
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome-stable',args:['--use-angle=swiftshader','--no-sandbox','--disable-gpu-sandbox']});
  const p=await b.newPage({viewport:{width:1100,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('file://'+path.resolve(process.argv[2]));
  await p.waitForFunction('window.__spikeKindsReady===true',{timeout:30000}).catch(()=>{});
  await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>{ const pick=(typeof nodes!=='undefined'&&nodes)?nodes.find(n=>n.kind==='endpoint'&&n.det&&n.det.cases&&n.det.cases.length):null;
    if(pick) showPanel(pick); const pb=document.getElementById('pbody');
    return { nodes:(typeof nodes!=='undefined'&&nodes)?nodes.length:-1, err:!!document.getElementById('err'),
      cardOpen:document.body.classList.contains('panel-open'),
      stPass:!!(pb&&pb.querySelector('.pchip.st-pass')), face:!!(pb&&pb.querySelector('.jfaces .face')) }; });
  await b.close();
  const ok = r.nodes>0 && !r.err && errs.length===0 && r.cardOpen && r.stPass;
  if(ok) console.log(`  render: PASS — ${r.nodes} live nodes, 0 errors, card renders (st-pass=${r.stPass}, faces=${r.face})`);
  else { console.error('  render FAIL:', JSON.stringify(r), 'errs='+errs.slice(0,4).join(' | ')); process.exit(1); }
})();
JS
  RENDER=$?
else
  echo "  render: SKIP ⚠ — RENDER COVERAGE DID NOT RUN (no chrome/playwright-core/example on this host)."
  echo "           the static contract above still holds, but the inline-engine execution path is UNVERIFIED here."
  RENDER=0
fi

[ "$STATIC" = 0 ] && [ "$MISS" = 0 ] && [ "$RENDER" = 0 ] && { echo "gabe-universe battery: ALL PASS"; exit 0; }
echo "gabe-universe battery: FAILURES ABOVE"; exit 1
