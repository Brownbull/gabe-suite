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
def t_order(pg):
    i=lambda s: pg.find(s)
    ks=[i('k:"show"'),i('k:"subs"'),i('k:"planets"'),i('k:"wires"'),i('k:"routes"'),i('k:"zDef"')]
    return -1 not in ks and ks==sorted(ks)
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
check('grp==="entLayout"' in page and 'grp==="coreByBE"||grp==="coreByFE"' in page, "applyCfg missing the entLayout/coreByBE|coreByFE branches")
check('d3ReheatSimulation' in page, "entity-layout change never reheats the sim (nodes would not move)")
check('window.__uniAddLayoutTab' in page and 'cfgtabbar' in page, "the Display|Layout config tab is missing")
check('recomputeEX(CFG.entLayout); (window.__uniAssignSplit?__uniAssignSplit():assignSub(CFG.coreByBE||"kind")); recomputeSubAnchors(); }catch(e){} build' in page, "boot does not assign the per-side cores before the sub-anchors")
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
check('__uniAssignSplit=function' in page and 'CFG.coreByBE' in page and 'CFG.coreByFE' in page,
      "the PER-SIDE core split (__uniAssignSplit / coreByBE / coreByFE) is gone")
check('{v:"guards"' not in page, "the guards core must be dropped (operator: no value backend or frontend)")
check('isFinite(n.x)) _npos' in page, "the _npos NaN guard is missing (a transient add would spew computeBoundingSphere NaN)")

# ── 10g. batch-5: config re-tabbed Planets|Universe · master planet-assets toggle · orbit-around-click ──
check('class="cfgtab' not in page and 'cfgnote' in page,
      "the config panel must be TABLESS (batch 31 — everything lives in the fleet; the note explains)")
check('__uniFlPanes.wires=' in page and '__uniFlPanes.routes=' in page and '"Transports"' in page,
      "the Connections/Transports drawer panes are gone")
check('(fr.right+10)' in page, "the drawer lost its docking gap beside the fleet")
# batch 32: compaction — one ×, icon pills, opacity dots, speed steppers, no repeated labels
check('class="flsx"' in page and 'flsmin' not in page,
      "the drawer must have ONE plain × (the boxed button pair is back)")
check('_opGlyph' in page and 'fill-opacity' in page,
      "transparency pills lost their opacity DOTS (faint/ghost/film words must ride the hover)")
check('id="trMinus"' in page.replace("'",'"') or '"trMinus"' in page,
      "the transport speed lost its −/+ steppers")
check('overflow-x:hidden' in page,
      "drawer panes may scroll horizontally again (compaction regression)")
check('rt.querySelector("#curveAmtRng")' in page,
      "REGRESSION: the curve slider bound via document.getElementById — rt is DETACHED, the listener never attaches")
# batch 33: the transport speed LADDER — 7 positions, ×√2 per stop, numbered-dot thumb
check('_ts.min="-2"; _ts.max="4"; _ts.step="1"; _ts.value="0";' in page and '0.1*Math.pow(Math.SQRT2,pos)' in page,
      "the speed ladder is gone (−2..+4 positions, default 0.1 = two stops under the old 0.3)")
check('id="trSpdBadge"' in page.replace("'",'"') or '"trSpdBadge"' in page,
      "the numbered-dot thumb (speed badge) is gone")
# batch 34: one-row wire kinds + per-kind on/off + honest glow label
check('data-wtog=' in page and '__uniBeamPrev' in page and 'class="cfgrow wkrow"' in page,
      "wire kinds lost their one-row layout or the per-kind on/off toggle")
check('NOT speed; speed lives in Transports' in page and 'per kind: sample' not in page,
      "the glow label must say it is NOT speed (and the old footer note stays gone)")
check('applies WHILE a focus highlight is active' in page,
      "the FOCUS group no longer explains WHEN it applies")
# batch 35: the entity gradient (the 2D lab device, ported) — per-kind toggle, vertex colors
check('vertexColors:_gr' in page and 'data-wgrad=' in page and 'ENT[_cs.ent]' in page,
      "the entity-gradient option is gone (vertex-color wires + per-row toggle + entity colors threaded)")
check('CONN[k].grad=!!CONN0[k].grad' in page,
      "wire reset must RESTORE the stock gradient flag (fk/calls default ON)")
check("style:'sparse',density:2.7,trust:0.9,grad:true" in page and "style:'solid',density:2,trust:0.6,grad:true" in page,
      "the operator's stock CONN config (2026-08-23) drifted")
check('{ fk:0.9, bridge:0.8, calls:0.5, imports:1 }' in page and '__uniCurveAmt=0.6' in page and 'lineStyle:"curved"' in page,
      "the operator's stock glow/curve defaults drifted")
check('function _raySegDist' in page and 'w=ray.origin.clone().sub(A)' in page and 'showLinkPanel(wbest.l)' in page,
      "wire clicking is gone (ray-segment pick → connection panel)")
check('__uniHLMode();       // a FOCUS option while glowing' in page,
      "focus options no longer BITE (auto-switch to focus mode on click)")
check('id="flscopy"' in page.replace("'",'"') or '"flscopy"' in page,
      "the Connections copy-settings button is gone")
check('window.__uniLastCopy=txt' in page and '(key==="wires")?"":"none"' in page,
      "copy-settings lost its payload stash or its Connections-only gate")
check('pillHTML("warOn"' not in page and 'zonehint' in page, "the Zones On/Off master pill must be GONE (fleet zone columns own it) with a zonehint in its place")

# ── 10h. batch-6: assets OFF default · Zones inline master toggle · core 2-col grid · connector throttle ──
check('zDef:0, zAtk:0' in page, "the four war zones must default OFF per entity (the fleet zone columns are the only control)")
check('zonesoff' in page, "zone icons do not dim when the master toggle is off")
check('data-grp="coreByBE"], #cfg .pill[data-grp="coreByFE"],' in page and '{ display:grid' in page, "the per-side core pills are not a 2-column grid (they would overflow)")
check('if(force || _wtick%3===0) updateConnectors' in page, "per-tick connector rebuild is not throttled (settle stays laggy)")

# ── 10i. batch-7: static fleets · motion master · freeze-on-drag · orbit re-pivot on pointerdown ──
check('var ANIM={ fleets:false' in page, "fleets are not static by default (ANIM.fleets should be false)")
check('if(!ANIM.all) return' in page and 'if(ANIM.fleets && FLEETTICK.length)' in page, "pulseLoop not gated by ANIM (master pause / fleet freeze)")
check('function __uniSetupOrbit' in page and '__uniSetupOrbit(); }catch' in page, "orbit-pivot setup not wired at boot")
check('intersectPlane' in page and 'function _rotRig' in page and 'ctrls.enabled=false' in page, "orbit rigid-rotation around the clicked point (no reposition, no zoom) missing")
check('cam.quaternion.premultiply(q)' in page, "orbit is not a true rigid rotation (P would drift on polar tilt)")
check('id="trSpeedRng"' in page and 'INTC.speed' in page, "transport-speed slider missing")
check('id="motionBtn"' in page, "config-header motion play/pause button missing")
check('id="freezeDragBtn"' in page and '__uniToggleFreezeDrag' in page, "topbar freeze-on-drag toggle missing")
check('zoneshd{ display:flex; align-items:center; justify-content:flex-start' in page, "Zones toggle not placed next to the title (flex-start)")

# ── 10j. batch-9 CLUSTERING: the core drives POSITION (sub-anchor ring + reheat), endpoints ring the
#         entity EDGE (per-kind radial), entities separate (typed link rests + capped charge + containment) ──
check('function recomputeSubAnchors' in page, "sub-anchor ring recompute missing (core cannot re-arrange nodes)")
check('(SUBANCHOR[n.ent]||{})[n.sub]' in page, "zForce does not read the sub anchor — n.sub still decoration-only")
check('else if(grp==="coreByBE"||grp==="coreByFE"){ __uniFreezeForSettle(); (window.__uniAssignSplit?__uniAssignSplit():assignSub(CFG.coreByBE||"kind")); recomputeSubAnchors(); if(window.__uniApplyCapsules) __uniApplyCapsules(); if(Graph){ try{ Graph.d3ReheatSimulation(); }catch(e){} }' in page,
      "the per-side core branch does not re-anchor + re-fold + REHEAT (core change would not move nodes)")
check('grp==="coreBy"){ assignSub(CFG.coreBy); buildClusters()' not in page,
      "REGRESSION: coreBy is decoration-only again (assignSub straight to buildClusters, no reheat)")
check('var KRADF={ endpoint:' in page, "per-kind radial factors missing (endpoints would not ring the edge)")
check('var rmax=R0*1.6; if(r>rmax){ var kc=0.6*alpha*(rmax-r)/r;' in page,
      "soft containment missing (nodes bleed across entity hulls) — boundary 1.6, above the outermost kind ring")
check('function tuneLinkForce' in page and '.ent!==t.ent)?280:40' in page,
      "typed link rest-lengths missing (default rest≈30 springs collapse entities into one mesh)")
check('strength(-60).distanceMax(150)' in page, "charge not range-capped (unbounded -150 balloons each cluster)")
check('.strength(-150)' not in page, "REGRESSION: the unbounded -150 charge is back")
check('DEF={x:150,y:80,z:780}' in page, "home camera not pulled back for the widened (SEP 1.55) scene")

# ── 10k. batch-10: freeze-through-settle · ROUTES tab · icon LINES + curve amount · per-kind BEAM ──
check('function __uniFreezeForSettle' in page and 'window.__uniSettleDone' in page, "freeze/resume machinery missing")
check('updateClusters(true); if(window.__uniSettleDone) window.__uniSettleDone();' in page,
      "the engine settle does not resume what the layout freeze paused")
check('grp==="coreByBE"||grp==="coreByFE"){ __uniFreezeForSettle();' in page and 'grp==="entLayout"){ __uniFreezeForSettle();' in page,
      "layout/core changes do not freeze animations before the reheat")
check('grp==="coreBy"){ assignSub' not in page and 'grp==="entLayout"){ recomputeEX' not in page,
      "REGRESSION: a layout/core branch reheats without freezing")
check('"Connections"' in page and '"Transports"' in page, "the Connections/Transports fleet panes are missing (ex-Routes tab)")
check('M4 19 20 5' in page and 'M4 19 C 8 5 16 5 20 12' in page, "the LINES pill icons (straight/curved SVG) are missing")
check('{v:"straight",t:"Straight"}' not in page, "REGRESSION: the LINES pill is back to text labels")
check('id="curveAmtRng"' in page and '*(window.__uniCurveAmt||1)' in page,
      "curve-amount slider missing or __uniCurve ignores it")
check('window.__uniBeam={ fk:0.9' in page and 'if(!_bm) return;' in page and 'cfg.trust*_bm' in page,
      "per-kind beam missing (declare + skip-at-0 + opacity multiply)")
check('wireRow("fk")+wireRow("bridge")+wireRow("calls")+wireRow("imports")' in page,
      "the four per-kind wire rows (sample · color · shape · beam) are not built")
# batch 11-A: wire styling — ONE shared style map, CONN-derived samples + legend (a sample must never lie)
check('var DASHMAP={ solid:' in page, "the shared style→dasharray map is missing")
check('data-wcol=' in page and 'data-wshape=' in page and 'data-wreset=' in page,
      "per-kind color / shape / reset controls missing")
check('{t:"ln",k:"fk"' in page and '{t:"ln",k:"bridge"' in page,
      "legend Connectors rows do not reference CONN kinds (frozen literals would lie after an edit)")
check('{t:"ln",c:0x5893ad' not in page, "REGRESSION: legend Connectors back to hardcoded literals")
check('case "ln": var lw=it.k?CONN[it.k]' in page, "legend ln sample not derived from CONN at render time")
check("'[data-itog=\"transports\"]'" in page, "the transports toggle is not DOM-moved into the Routes pane")
# review r2 (mutation-proven interleaves, all headless-verified):
check('mo.onclick=function(){ window.__uniSettleCancel();' in page,
      "motionBtn does not cancel the pending settle auto-resume (a pause DURING the settle gets stomped)")
check('if(window.__uniDragging) return;' in page and '__uniDragging=true;' in page,
      "the settle resume does not defer while a camera drag is held")
check('if(window.__uniSettleDone) window.__uniSettleDone(); }' in page and 'function _endDrag' in page,
      "the shared _endDrag release must fire the settle resume deferred mid-drag")
check(page.count('if(window.__uniAddLayoutTab) __uniAddLayoutTab()') == 3,
      "not all 3 buildCfg call sites re-tab (boot + URL-preset + ?drive) — a preset URL would drop the Routes tab")

# ── 10l. batch 11-B: FLEET panel — UNIVIS contract + six engine seams, all read through visEnt/visN ──
check('window.UNIVIS={ ent:{}, sub:{}, node:{}, meta:{} }' in page, "UNIVIS 4-namespace contract missing (sub = cluster overrides; node/meta = the in-flight seam)")
# batch 11-B3: CLUSTER rows — expand on the entity name, counter, per-cluster switches (distinct color)
check('(ev.show&&sv.show)?1:0' in page, "visN does not AND-combine entity and cluster flags")
check('data-fsub=' in page and 'flstog' in page and 'flcnt' in page and 'data-flx=' in page,
      "cluster rows / counter / expandable entity name missing")
check('window.__uniFleetRegroup=function' in page and 'updateClusters(true); if(window.__uniFleetRegroup) __uniFleetRegroup(); }' in page,
      "a core change does not regroup the panel (stale cluster overrides would linger)")
check('cluster hidden by the fleet panel' in page, "sub-hull seam misses the cluster-level skip")
check('sub-aware' in page, "transports do not resolve visibility at NODE level (cluster routes-off would leak)")
check('.fltog.flstog.on{ background:#0b7a63' in page,
      "cluster switches wear the entity color — the two levels must read differently")
# fleet backend/frontend split (operator ask): two group masters, each iterating its own subset;
# the split predicate is the capsule-proof display label (fe · …), not the fe· key prefix
check('window.__uniIsFeEnt=function(e){ return window.__uniEntLabel' in page,
      "the capsule-proof frontend predicate (__uniIsFeEnt via the display label) is gone")
check('_masterRow("backend", "*backend"' in page and '_masterRow("frontend", "*frontend"' in page,
      "the fleet lost its two group masters (backend + frontend)")
check('var beEnts=_ents.filter(function(e){ return !__uniIsFeEnt(e); });' in page
      and 'var feEnts=_ents.filter(function(e){ return __uniIsFeEnt(e); });' in page,
      "the fleet render does not split entities into backend + frontend groups")
check('cluster overrides follow only for the group' in page,
      "a group master must propagate ONLY into its own entities' cluster overrides")
check('#fleet .flmaster.flgroup2{' in page, "the frontend section break (flgroup2) styling is gone")
# backend-function community pass (operator fix): functions cluster over the call graph (ƒ·<hub>),
# functions JOIN the data cluster they serve (operator ruling — seed from the handler endpoint, propagate over the call graph)
check('function _fnAssignSub(mode){' in page and 'l.rel==="handler" && s.kind==="endpoint" && t.kind==="function"' in page and 'cur[t.id]=s.sub;' in page,
      "the backend-function pass no longer seeds from the handler endpoint's data cluster")
check('try{ _fnAssignSub(mode); }catch(e){}   // functions JOIN their served data cluster' in page,
      "the fn pass is not wired into the data cores (community/use-case/fk)")
# Show-Entity is a MASTER over its clusters (operator ask): off→all off · cluster-on re-enables entity · on→all on
check('SHOW ENTITY is a MASTER over its clusters' in page and 'function _entSubKeys(ent)' in page,
      "the show-entity master (entity toggle propagates to clusters) is gone")
check('a cluster turned ON re-enables its entity' in page,
      "a cluster turned on no longer re-enables its entity")
# aesthetic (operator): selected-option name after a section title · no left border · legend tabs IN the header
check('__uniSyncGrpSel=function' in page and 'className="grpsel"' in page,
      "the selected-option name after a section title (grpsel) is gone")
check('.grplbl .grpsel{' in page and '#cfg .grp.cgside, #flside .grp.cgside{ padding-left:0;' in page,
      "the backend/frontend left border was not removed (title-only sections)")
check('<div class="lghd"><b>\'+(typeof ico==="function"?ico("shape",13):"")+\'Legend</b><div class="lgtabs">' in page,
      "the legend tabs are not in the header (still a separate row)")
check('var LGTABICO={' in page and '(LGTABICO[t]||t)' in page,
      "the legend tabs lost their icons (Types/Connectors/Planet should be icon-only)")
check('#elegend .lgtab{ display:inline-flex' in page and 'border:1px solid var(--line)' in page
      and '#elegend .lgtab.on{ color:#fff; background:var(--accent)' in page,
      "the legend tab buttons do not match the fleet header button style (bordered, accent-on)")
# the assemble line-map guard (fragility catch — a spike-base line shift must fail loud, not ship broken JS)
_asm = open('docs/design/codebase-graph-consolidation/universe-build/assemble.py').read()
check('_ANCHORS = {' in _asm and 'line-map STALE at' in _asm,
      "the assemble.py line-map anchor guard is gone (a spike-base line shift would silently ship broken JS)")
check('rz.className="flresize"' in page and 'MINW=230, MAXW=520' in page and 'p.style.width=w+"px"' in page,
      "the fleet width-resize handle (drag + double-click restore) is gone")
check('#fleet .flent{ flex:1 1 88px' in page,
      "the fleet label column does not absorb width (cluster titles stay cramped)")
check('reads inherited-off (dim)' in page, "a cluster switch does not dim when its parent entity is off")
check('layer:"Layer — the kind' in page and 'ti:"Chain — a flat layered ribbon' in page,
      "cluster-core / entity-layout options carry no hover explainers (word — meaning, since the icon-only pills)")
check('fnsTog' not in page and 'the Functions boolean is GONE' in page,
      "the Functions boolean must be removed (operator: the legend Function row governs load)")
check('k==="function" && window.toggleFns' in page and 'window.__uniSetKindState=function' in page,
      "the legend Function row no longer loads/unloads functions (via __uniSetKindState)")
check('window.__uniKindState={}' in page and 'window.__uniGroupToggle=function' in page and 'n.__solo=(ks.length===1 && cs[ks[0]]===n.kind)' in page,
      "the 3-state legend (all/critical/off) + solo detection + group master are gone")
check('if(n.kind!=="function") cnt[n.ent]=(cnt[n.ent]||0)+1;' in page,
      "functions must NOT trip the capsule fold (review: loading them must not collapse their entity)")
check('chain = layered plane · force = coupling bubbles' not in page and 'joined from the levels feed by name' not in page,
      "REGRESSION: the note lines below the pills are back (explainers must live on hover)")
check('function visEnt' in page and 'function visN' in page, "vis accessors missing (seams must read through ONE pair)")
check('nodeVisibility(function(n){ return _nodeVisibleFn(n); })' in page, "node visibility seam not wired (fleet ∧ focus fn)")
check('if(!visEnt(e).show) return; var mem=' in page, "ent-hull seam missing (hidden entity keeps its hull)")
check('if(!visEnt(n.ent).show||!visEnt(n.ent).subs) return;' in page,
      "sub-hull seam wrong — must skip on !show OR !subs (ghost sub-hulls around a hidden entity)")
check('wires-off entity/cluster' in page, "connector seam missing (wires keep drawing to hidden / wires-off entities)")
check('routes-off entity' in page, "transport seam missing (ghost shuttles fly to hidden entities)")
check('function linkVisFn(l){ return !CFG.conns; }' not in page, "REGRESSION: linkVisFn back to conns-only (dormant seam dropped)")
check('if(all||s.nodes||s.zones){ try{ rebuildNodes' in page,
      "show/zone routing skips rebuildNodes — re-show duplicates FLEETTICK/PULSE/ORBIT/WAVE closures")
check('if(all||s.nodes||s.routes){ try{ buildTransports' in page,
      "show routing skips buildTransports — MOVERS rebuild nowhere else")
check('window.__uniBuildFleet) __uniBuildFleet()' in page and 'window.__uniApplyVisPreset=function' in page,
      "fleet panel not built at boot / preset entry point missing")
check('body.nav-min #fleet{ left:48px' in page, "fleet panel does not clear the nav-restore tab under nav-min")
check('.fleethid{' in page and 'fltog.mdim' in page, "card hidden-note CSS / masters-dim CSS missing")
# batch 11-B2: per-entity fleet-zone gates (global AND entity) + zones/routes columns
check('(CFG.zDef&&visN(n).zDef)? placeFleet(' in page and '(CFG.zAtk&&visN(n).zAtk)? placeFleet(' in page,
      "def/atk fleet gates are not per-entity")
check('(CFG.zCfl&&visN(n).zCfl)? cflSpec(' in page and 'CFG.zSat&&visN(n).zSat) for(var si=0;' in page,
      "cfl/sat gates are not per-entity")
check('var def=CFG.zDef? placeFleet(' not in page, "REGRESSION: a fleet-zone gate ignores the fleet panel")
check('k:"zDef"' in page and 'k:"routes"' in page and 'icon:"truck"' in page,
      "zones/routes matrix columns missing")
check('__uniAddLayoutTab(); if(window.__uniAddWireView) __uniAddWireView(); if(window.__uniAddFocusCfg) __uniAddFocusCfg(); if(window.__uniFleetSync) __uniFleetSync(); } })();' in page,
      "the URL-preset path rebuilds the config without re-syncing the fleet masters-dim")
# batch 11-C: the sim feed + presets row (the in-flight seam must exist before that batch, or it debugs a phantom)
check('<script src="./sim.data.js"></script>' in page,
      "sim.data.js not loaded — GABE_SIM undefined on EVERY deployment, the in-flight seam is dead")
check('data-fpre="all"' in page and 'data-fpre="none"' in page and 'data-fpre="inflight"' in page,
      "presets row (All/None/In-flight) missing")
check('no sim feed on this page' in page and 'no change in flight' in page,
      "the In-flight stub does not distinguish its two honest-empty states (undefined vs null)")

# ── 10n. batch 12: layer ruling (c) · depth highlight · journeys picker · topbar icons · chord pan ──
check('else n.sub=n.layer||"data"' in page, "layer core still collapses (ruling c: group by the kind's OWN layer)")
check('SUBOF[n.layer]' not in page and 'SUBOF[KINDS' not in page, "REGRESSION: the SUBOF collapse is back")
check('var SUBSHIFT={ endpoints:0.04' in page, "hull hue-shift map lacks the un-collapsed layer keys")
check('function _hlCompute' in page and 'window._hlLinkF' in page and 'function _nodeVisibleFn' in page,
      "depth-highlight machinery missing (BFS + wire factor + shared visibility fn)")
check('kind, R, hf, ea, eb, hov)' in page and "var _whf=(window._hlLinkF?_hlLinkF(l):1);" in page and "8, _whf," in page,
      "connector wires ignore the highlight factor (or lost the gradient entity args / selected-wire boost)")
check('.nodeVisibility(function(n){ return _nodeVisibleFn(n); })' in page,
      "node visibility does not go through the shared fn (focus mode dead)")
check('var hlGroup=' in page and '__uniHLTick' in page and 'if(window.__uniHLTick) __uniHLTick();' in page,
      "halos are not an independent scene group with a per-tick follow (node rebuilds would kill them)")
check('requestAnimationFrame(__uniHLReapply)' not in page, "REGRESSION: halos back to riding node objects via a rAF reapply")
check('id="depthBtn"' in page and 'id="hlModeBtn"' in page and 'id="jrnBtn"' in page, "topbar depth/mode/journeys buttons missing")
check(page.find('id="reset"') < page.find('<div class="statuspills">'), "repo pills are not at the FAR right of the topbar")
check('❄ Freeze on drag' not in page, "REGRESSION: freeze button back to text (icons only, explanation on hover)")
check('e.altKey&&(k==="q"||k==="e")' in page and 'key==="Escape"' in page,
      "Alt+Q/E depth / Esc clear not wired (Alt+scroll retired batch 38)")
check('WheelEvent' not in page or 'if(!e.altKey) return; e.preventDefault();' not in page,
      "the retired Alt+scroll depth wheel is back")
check('function _jrnCollect' in page and '__uniJrnToggle' in page, "journeys collector/picker missing")
check("drag.btn===1" in page and "*0.0011" in page, "MIDDLE pan (translate the rig, no rotation) missing")

# ── 10o. batch 13: journeys LEFT+grouped+NAMED · banner · the WALK (steps + trail) · panel footer ·
#         clusters-only + wires toggles · graph decoupled from the panel · chip-hover halo · gear sync ──
check('#jrn{ position:fixed; left:50%' in page, "journeys dropdown is not centered under the topbar middle")
check('function _caseNames' in page and '(aggregated)' in page and 'jrngrp' in page,
      "journeys are not named (det.cases join) / aggregates not labeled / groups missing")
check("j.e2e=!!j.corpora.e2e" in page, "end-to-end journeys are not detected across corpora (aggregate rows span e2e+web)")
check('id="jrnpill"' in page and 'function _walkRender' in page and 'var WALK={' in page,
      "journey step PILL / walk machinery missing")
check('id="jrnhud"' not in page, "REGRESSION: the topbar HUD is back (the step pill floats over the diagram)")
check(page.count('<div class="spacer"></div>') == 2 and page.find('id="jrnBtn"') < page.find('id="hlModeBtn"') < page.find('id="depthBtn"'),
      "topbar order wrong (journeys · style middle; depth/freeze/reset right)")
check('<span id="jrnpill"' in page and page.find('id="hlModeBtn"') < page.find('id="jrnpill"') < page.find('id="depthBtn"'),
      "the journey step controls are not centered in the header bar")
check('#jrnpill .wname{' in page and 'm15 18-6-6 6-6' in page and 'm9 18 6-6-6-6' in page,
      "step buttons are not proper Lucide chevrons (the text glyphs sat skewed)")
check('window.__uniFlyStep=function _flyTick(){' in page and 'setInterval(window.__uniFlyStep, 16)' in page
      and 'FK.up' in page and 'k==="control"' in page and 'window.__uniFlyStep(); }catch(_fe){}' in page,
      "WASD/Space/Ctrl flight missing (interval tick + IMMEDIATE first step + elapsed-time scaling — batch 48)")
check('id="depthRng"' in page and 'ArrowUp' in page and 'ArrowDown' in page,
      "depth is not a draggable 1–5 bar with arrow-key fallback")
check('?0:1' in page and 'return 2.6;' in page, "glow must brighten the set and leave the rest ALONE (dim belongs to focus only)")
check('?0:0.05' not in page and '?0:0.18' not in page, "REGRESSION: glow dims the rest of the graph again")
check('shuttles fly the lit path only' in page, "transports roam off the lit path during a highlight")
check('function _frameSet' in page, "journey select does not frame the whole carrier set (the camera dived into the wire jungle)")
check('body.panel-open .panel .pbody{ overflow-y:auto' in page, "the card body does not scroll — the footer chevron leaves the screen on tall cards")
check('.panel .minbar .pmin{ order:2; margin-top:auto; }' in page,
      "the collapsed rail's expand chevron is not at the BOTTOM (parity with the expanded footer)")
check('function _rigStart' in page and 'ev.button===2' in page and 'ev.button===1' in page,
      "the three-button map (LEFT scheme · RIGHT tumble · MIDDLE pan) is not wired in pointerdown")
check('ev.buttons!==0' in page and '(ev.buttons&_bit)===0' in page and 'function _endDrag' in page,
      "chord-safe release missing: the LAST pointerup must end the drag and the move stream must release on owner-bit loss (stranded-drag fix)")
check('data-wgo=' in page and 'wchip' in page and 'function _aimAt' in page,
      "walk stepping (journey ‹›/trail chips + camera aim) missing")
check('class="pfoot"><button class="pmin"' in page and "<button class='pmin' title='minimize'" not in page,
      "the panel collapse chevron is not footer-only (it collides with the walk bar at the top)")
check('planets:1, wires:1' in page and 'k:"planets"' in page and 'k:"wires"' in page,
      "planets/wires are not fleet MATRIX columns (per entity AND cluster, master row included)")
check('(!_nodeVisibleFn(_cs)||!visN(_cs).wires)' in page, "the connector seam ignores the per-entity/cluster wires flag")
check('#g{ right:0 !important; }' in page, "the graph still resizes with the right panel")
check('__uniHoverHL(x.id)' in page and 'userData.__hov' in page, "connection-chip hover halo missing")
check('if(hidden) c.classList.remove("min");' in page, "the nav gear does not un-minimize the config on show (state drift)")

# ── 10q. batch 17: community default · ring layout · wider spacing ──
# ── operator polish (2026-08-25): method badge · spinning focus ring · zone header toggle · trail focus ──
check('function methodBadge(' in page and 'grp.add(methodBadge(' in page and 'c.arc(64,64,58' in page and "m==='DELETE'" in page,
      "the endpoint METHOD badge (coloured circle + method GLYPH, stacked at the icon corner) is gone")
check('if(!was && sv[col] && UNIVIS.ent[ent] && !UNIVIS.ent[ent][col]) UNIVIS.ent[ent][col]=1;' in page,
      "a cluster toggle no longer re-enables its entity for THAT column (must match the entity-column behaviour)")
check('id="mbOpRng"' in page and 'BADGE OPACITY (operator)' in page and 'if(CFG.mbOp==null) CFG.mbOp=0.6' in page and 'id="badgecfg"' not in page,
      "the GLOBAL badge-opacity slider must live in the Planets pane (not #cfg); the #cfg badge panel must be gone")
check("Temporary Config</span>" in page, "the top-right config panel must be renamed 'Temporary Config'")
check('__uniAddFocusCfg=function' in page and 'id="focuscfg"' in page and 'srow("speed","focSpeed",0.05,4' in page and 'trow("ring","focRing")' in page and 'trow("glow","focGlow")' in page and 'trow("glow","othGlow")' in page and 'trow("ring","othRing")' in page and 'trow("const","focThickConst")' in page and 'row("pattern","focPat",["spinner","solid","dashed"])' in page and 'row("color","focColor"' not in page and 'class="focbtn focreset"' in page and 'class="focbtn foccopy"' in page,
      "the FOCUS RING config is wrong (need ring+glow layer toggles on both sections, speed 0.05, const toggle, spinner/solid/dashed, no color, restore+copy)")
check('srow("falloff","focGlowFall"' in page and 'focGlowFall!=null?CFG.focGlowFall:0' in page,
      "the FOCUS glow falloff slider is missing")
check('dashN=(pat==="dashed")?Math.max(10, Math.round(sz*0.8))' in page and 'Math.round(sz/16)*128' in page and '_ringTex(typeof CFG!=="undefined"?CFG.focPat:null, thick, sz)' in page,
      "the dashed ring must scale its resolution + dash COUNT with the sphere size (big spheres pixelated)")
check('if(CFG.othRing && n.ent!=null && _selEnts[n.ent]) _add(n, _ringSprite(n, (CFG.othRingInt!=null?CFG.othRingInt:0.35)), false);' in page and 'var _selEnts={};' in page,
      "the non-selected dim ring must be STATIC and confined to the selected element's entity (outer entities glow-only)")
check('row("pulse","pulseMode",["prop","const"])' in page and 'srow("p.amp","pulseAmp",0.02,0.8' in page and 'CFG.pulseMode==="const"' in page and 'bs+amp*18*s2' in page,
      "the pulse amplitude mode (prop/const) + p.amp slider is missing (constant-swing pulse)")
check('function _ringTex(' in page and 'function _ringSprite(' in page and 'function _glowFor(' in page and 'CFG.focAnim' in page,
      "the configurable focus-ring engine (pattern texture · size mode · animation · non-selected marker) is gone")
check('WALK.mode==="trail" && HL.on){ HL.origin=[n.id]' in page,
      "the focus ring does not transport to the selected TRAIL step")
check('the Zones config section is GONE' in page and 'grplbl zoneshd' not in page,
      "the Zones config section must be removed from the Planets pane (zones are fleet-only now)")
check('window.__uniBadges=[]' in page and 'function _mbTick()' in page and 'e[0]*ox+e[4]*oy+e[8]*3' in page and 'window.__uniBadges.push(s)' in page,
      "the method badge is not ICON-relative (must ride the camera right/up basis, pinned to the component icon, never the sphere)")
check('new T.Vector3(0,1,0).applyQuaternion(cam.quaternion)' in page and 'if(FK.up) off.add(_upv); if(FK.dn) off.sub(_upv);' in page,
      "Space/Ctrl up-down is not camera-relative (must move along the camera up axis like WASD, not world-Y)")
check('function _ringSprite(' in page and 'HL.rings.push(' in page and 'material.rotation=_hlPhase' in page and '_hlPhase + 0.05*spd' in page and 'br*rad*fall' in page,
      "the configurable focus ring is gone (replaces the glow on the selected element)")
check('flztog' in page and '__uniFleetToggle(hs.ent||"*"' in page,
      "the ZONE column headers are not click-to-toggle (bulk zone show from the fleet)")
check('n.ent&&EX[n.ent]!=null?{x:EX[n.ent]' in page,
      "trail focus lost its entity-anchor fallback (an unpositioned step must still fly the camera)")
check('CFG.coreByBE=lv?"usecase":"kind"' in page and 'CFG.coreByFE="screen"' in page,
      "the per-side defaults (backend=community, frontend=screen) are gone")
check('{v:"ring",t:""' in page and 'Ring —' in page and 'mode==="ring"' in page,
      "the RING entity layout is missing (icon-only pill, word on hover)")
check('{v:"spread"' not in page and 'mode==="spread"' not in page, "REGRESSION: the useless spread layout is back")
check('SEP=(mode==="ring")?1.0:1.85' in page, "force-layout anchors are not widened (operator: entities too close)")
check('RENT[e]*0.78' in page, "sub-cluster rings are not widened (operator: clusters too close inside entities)")

# ── 10r. batch 18: focus rest behaviors · controls panel · Q/E yaw · invert mouse · middle=selection ──
check('rest:"hide"' in page and 'pillHTML("focusRest"' in page and page.count('{v:"dim",t:""')==1 and page.count('{v:"hide",t:""')==1
      and '{v:"fade"' not in page and '{v:"wires"' not in page,
      "FOCUS rest must offer DIM + HIDE only, as icon pills (hide default)")
check('HL.rest==="hide"' in page, "only the HIDE behavior may remove planets (dim/fade/wires keep them)")
check('id="ctrlp"' in page and '__uniBuildCtrl' in page and 'class="kbd"' in page,
      "the bottom-right CONTROLS panel is missing")
check('id="ctlInv"' not in page and 'id="ctlPvt"' not in page and 'UNICTL={ invert:false, selPivot:true' in page,
      "the invert / orbit-selection toggles are RETIRED (batch 50) — their behaviors ride the defaults")
check('__uniApplyMouseMap' not in page, "REGRESSION: invert swaps the mouse buttons again (it must flip ONLY the vertical axis)")
check('UNICTL.invert?1:-1' in page, "flight-style vertical inversion missing from the drag's polar term")
check('function _zoomDist' in page and 'addScaledVector(vdir, zd)' in page,
      "the drag pivot ignores the current zoom (the giant-sphere depth)")
check('_flyFreeze' in page and '_flyThaw' in page and '{passive:true});' in page,
      "camera controls (keys + wheel) do not freeze the decorations")
check('k==="q"' in page and 'ya*0.022' in page and '_rotRig(cam, ctrls.target, pv,' in page,
      "Q/E must orbit INWARD around the view centre at the zoom depth")
check('var ya=(FK.e?1:0)-(FK.q?1:0);' in page,
      "Q/E spin directions must stay SWAPPED (operator ruling: E spins Q's old way)")
check('drag.btn=1' in page and 'UNICTL.selPivot' in page and 'drag.btn=2' in page,
      "button remap incomplete: middle must own pan (btn=1) and right must own tumble (btn=2, orbit-selection lives there)")

# ── 10s. batch 20: the CAMERA-MODE dropdown — tumble (stock) · joystick (WoW anchor-velocity) · arcball · look ──
check('camMode:"look"' in page and 'id="ctlCam"' not in page and 'look — turn in place' in page,
      "LMB is FIXED to LOOK (batch 50) — the dropdown is retired, the engine default stays look")
for v in ('(drag.btn===2)?"tumble":(UNICTL.camMode||"look")','!=="joystick"','"arcball"'):
    check(v in page, "the camera-scheme ENGINE lost a mode (UI retired, engine kept): "+v)
check('ax:cx, ay:cy' in page and 'drag.cx-drag.ax' in page,
      "joystick anchor (ax/ay) or its offset velocity is gone")
check('JOYSTICK tick' in page and '(UNICTL.camMode||"look")!=="joystick"' in page,
      "the joystick per-frame velocity tick is gone (offset must KEEP turning while held)")
check('if(Math.abs(ox)<8) ox=0' in page, "the joystick deadzone (8px around the anchor) is gone")
check('crossVectors(v1, v0)' in page and 'z=d2<1?Math.sqrt(1-d2):0' in page,
      "the arcball virtual-trackball mapping is gone")
check('mode==="look"' in page and 'var eye=cam.position.clone()' in page,
      "look mode must rotate about the CAMERA (turn in place)")
check('(drag.btn===2)?"tumble"' in page, "the RIGHT button must always tumble regardless of the chosen LEFT scheme")
check('vs*dy*0.66' in page and '-vs*dy*0.66' not in page,
      "LOOK must start vertically INVERTED (aviation convention) — the old sign is back")

# ── 10t. batch 22: the PANEL HIERARCHY — Everything → Entity → Cluster → Element, two-way nav ──
for lit in ('window.__uniPanelAll=panelAll','window.__uniPanelEnt=panelEnt','window.__uniPanelClu=panelClu'):
    check(lit in page, "panel-hierarchy builder missing: "+lit)
check('class="pnav"' in page or "class:\"pnav\"" in page or '{class:"pnav"}' in page,
      "clickable panel nav rows (.pnav) are gone")
check('if(e.key==="Escape"){ __uniHLClear();' in page and 'if(window.__uniPanelAll) __uniPanelAll(); }' in page,
      "Esc must clear the selection AND land on the Everything panel")
check('setTimeout(function(){ if(window.__uniPanelAll) __uniPanelAll(); }, 0);' in page,
      "boot must open the Everything panel (deferred one tick past the card IIFE)")
check('Graph.onBackgroundClick(window.__uniBgClick)' in page,
      "background clicks are not wired to the hull picker")
check('{ekey:e}' in page and '{ekey:e, skey:sub}' in page,
      "cluster hulls lost their routing keys (ekey/skey) — the picker cannot name a panel")
check('"— no hidden functions here"' in page, "the Stars section lost its honest-empty line")
# batch 23 (Everything tuning): navigable first · kind rows w/ meaning · paged stars · Sources
check('var KINDTIP=' in page and 'function kindRow' in page,
      "Elements rows lost their kind glyphs + meaning tooltips (KINDTIP/kindRow)")
check('function fnChips' in page and '"show less"' in page and 'shown+PAGE' in page,
      "the Stars paging wall (preview → +30 → show less) is gone")
check('Array.isArray(st.web.unmatched)' in page,
      "REGRESSION: the web-bridge row stringifies the unmatched ARRAY ([object Object])")
check('"Sources"' in page and 'sechd("entity","Entities"' in page,
      "Sources section or the leading Entities section is gone")
check('{class:"tipico "+(t.cls||"info")}' in page and '"info"),title:t.text' not in page,
      "REGRESSION: tipIcon carries a native title again — info icons must show ONLY the styled dark tip")
check('function _tipPlace' in page and 'r.right>iw-8' in page and 'tip.style.bottom="19px"' in page,
      "edge-aware tip placement is gone — tips clip at the viewport edges again")
# batch 24: direction markers + per-strategy core icons (pills + inherited by cluster surfaces)
check('window.__uniCoreIco=' in page and "(o.ic||'')+o.t" in page,
      "core-strategy icons are gone from the config pills (__uniCoreIco / pillHTML ic slot)")
check("ic:__uniCoreIco(k,12)" in page and '_coreOpts(["community","usecase","kind","fk","layer","tests"])' in page
      and '_coreOpts(["screen","community","kind","usecase"])' in page,
      "the per-side core lists (backend 6 · frontend 4) must each map through __uniCoreIco")
check('P.drill=' in page and 'P.up=' in page and 'function dirIco' in page,
      "drill-down / go-up direction markers are gone from the nav rows")
check('"__core"' in page and 'function coreLead' in page,
      "cluster rows no longer inherit the ACTIVE core strategy's icon")
# batch 25: hull selection light — containers brighten per panel level, rebuild-proof, Esc clears
check('window.__uniApplyHullSel=' in page and 'm.__baseOp=m.opacity' in page,
      "the hull selection light is gone (apply engine + lazy stock capture)")
check('window.__uniFleetSpot=' in page and 'data-fle=' in page and '_flOpen[ent]=1; __uniFleetRender(); return;' in page,
      "the fleet spot is gone (selection no longer mirrors into the fleet panel / cluster no longer opens its entity)")
check('__uniFleetSpot(hs.ent, hs.sub)' in page and '.flrow.spot' in page,
      "the hull engine no longer drives the fleet spot (or its CSS is gone)")
# batch 27: number-key fleet toggles (1–8 → columns 2–9, selection-scoped) + row-background spot
check('window.__uniFleetToggle=' in page and page.count('__uniFleetToggle(')>=2,
      "the shared fleet toggle is gone (clicks + number keys must use ONE path)")
check("k>=\"1\"&&k<=\"8\"" in page and 'hs.ent||"*"' in page,
      "the 1–8 number keys no longer toggle fleet columns for the selection")
check('class="flkey"' in page and 'rgba(76,110,245,.26)' in page,
      "fleet header key labels or the row-background spot styling are gone")
# batch 29/30: config-into-fleet — the SIDE DRAWER with per-column panes; zone buttons deprecated
check('data-pane="planets"' not in page and 'data-pane="universe"' not in page and 'window.__uniFlPanes=' in page,
      "the Planets AND Universe tabs must be GONE — their config lives in the fleet side drawer")
check('CFG.zDef=CFG.zAtk=CFG.zCfl=CFG.zSat=true;' in page,
      "the deprecated per-zone gates must be forced ON (fleet columns are the only zone control)")
check('window.__uniFlOpen=' in page and 'id="flstash"' in page and 'document.body.appendChild(side)' in page
      and 'window.__uniFlDock=' in page,
      "the fleet side drawer must be a FREE-STANDING body-level add-on docked to the fleet (__uniFlDock)")
check('flcfgbtn' in page and page.count('flcfgbtn')>=2,
      "the fleet header icons no longer open the drawer")
check('k:"show"' in page and t_order(page),
      "fleet column order must be Entity(show) · Sub-cluster(subs) · Planets · Connections(wires)")
check('Math.max(m.__baseOp*2, floor)' in page and 'm.__baseEm' in page,
      "the entity light lost its absolute floor / emissive glow (a bare ×factor is invisible on big shells)")
check('window.__uniHLSelectLink=' in page and '_whf=Math.max(_whf,1)*2.6' in page,
      "wire selection lost its glow boost or its BFS highlight (batch 38)")
check('var _lchip=function' in page and page.count('__uniHoverHL(id)')>=1,
      "the link card endpoint chips lost their hover halo (element-card parity, batch 39)")
# batch 40: F mode toggle · focus keeps the selected glow · hover lights the wire
check('(e.key==="f"||e.key==="F")' in page and 'HL.mode!=="glow" && !d0' in page,
      "F mode toggle or the focus-keeps-selected-glow rule is gone")
check('window.__uniHovLink===l' in page and page.count('__uniHovLink')>=4,
      "chip hover no longer lights the wire to the hovered element")
# batch 41: theme toggle + theme-aware highlight wires
check('id="themeBtn"' in page.replace("'",'"') and 'window.__uniApplyTheme=' in page and ':root[data-theme="light"]' in page,
      "the dark/light theme toggle is gone (button + apply + light var block)")
# batch 42: entity pane rebuild — combo row · options icon-toggles · the SPREAD slider
check('getElementById("fnsTog")' not in page and '"typesTog"' in page, "the Functions boolean must be gone while the Types boolean stays (operator: functions via the legend, types deferred)")
# batch 45: consumes + nests rels flow through the universe (the floating-schema fix)
# batch 46: endpoint→handler wires (Functions ON) + the honest empty-connections message
# batch 47: fleet clicks SELECT — name = panel+camera · count badge = expand · cluster name = cluster
check('class="flcnt flexp"' in page and 'ev.stopPropagation();' in page and '_frameSet(ids)' in page,
      "fleet selection clicks are gone (name must select+fly; the count badge must own expansion)")
check('data-fse=' in page and 'data-fss=' in page,
      "cluster fleet rows lost their select keys")
check('rel:"handler"' in page and 'fn:p.fn' in page,
      "endpoint→handler wires are gone (the fn field or the _buildFnData join)")
check('behavior lives in the call tree' in page and 'DYNAMIC (unmatchable templates' in page,
      "the empty-Connections message no longer explains WHERE the behavior lives")
check("consumes:'calls'" in page and "nests:'fk'" in page,
      "REL2KIND lost the consumes/nests mappings — the new wires would fall to the calls default silently")
check('consumes:"consumed by"' in page.replace("'",'"') or 'consumes:"consumes"' in page,
      "the card labels for consumes/nests rels are gone")
check('"spreadRng"' in page, "the SPREAD slider is gone (element separation inside entities)")
check('(window.__uniSpread||1)' in page and 'min="0.55" max="2.8"' in page and 'className="cfgrow rsrow"' in page,
      "spread must scale RENT (default at a FIFTH of the 0.55-2.8 bar) sharing one row with radius")
check('className="cfgrow entcombo"' in page,
      "the entity combo/options rows are gone")
check("'Legend</b>" in page.replace('"',"'") and '#elegend .lghd b svg' in page,
      "the legend lost its panel-chrome refit (iconed caps title + station styling)")
check('height:330px !important' in page,
      "the legend must hold ONE fixed size across every tab")
check("lgbody lg-" in page and 'lg-types' in page and 'grid-template-columns:1fr 1fr' in page,
      "the legend Types two-column compaction is gone (per-tab body class + grid)")
check('_hlc=hov?' in page and '0x4f46e5:0xffffff' in page and '_hlc||(_gr?0xffffff:cfg.color)' in page,
      "highlighted wires lost their theme highlight color (white dark · indigo light)")
check('--chip-bg:#0e1524' in page and page.count('var(--chip-bg)')>=15,
      "the station's dark surfaces are hardcoded again (light theme cannot flip them)")
check('if(window.__uniSelHulls) __uniSelHulls(n);' in page,
      "element displays no longer light their cluster+entity hulls (showPanel hook)")
check('buildClusters=function(){ _bcOrig();' in page,
      "hull rebuilds drop the selection light (buildClusters wrap missing)")
check('out.push(aboveSec(n)); return out;' in page,
      "element cards lost their Above section (the way back up)")

# ── 10u. batch 48: the FRONTEND fold — c4.fe pieces (component · hook · store · route · type · module) + typed
#        wires on a SEPARATE key; screens absorbed into their principal piece; Types held back (toggle, OFF) ──
check('KINDS.module={' in page and 'form:"slab"' in page and 'if(f==="slab")' in page,
      "the `module` kind (slab form) is gone — plain TS modules have no glyph")
check("GLYPH.module='<rect x=\"3\" y=\"3\"" in page, "the module legend glyph (grid) is gone")
check('var FE_KIND={ "fe-type":"type" };' in page and 'var FE_REL={ "uses-hook":"uses", "uses-store":"reads" };' in page,
      "the feed→spike kind/rel vocabulary maps are gone")
check('var _FE=(_C4.fe&&_C4.fe.pieces&&_C4.fe.pieces.length)?_C4.fe:null' in page,
      "the fe fold must gate on a NON-EMPTY pieces list (honest-empty feed = no fold)")
check('ENT[h.id]=(h.pair&&ENT[h.pair])?' in page and 'var FE_HOME_COL={ bucket:' in page,
      "non-entity homes (buckets · candidate features) must become their own coloured clusters")
check('var _P=_FE.pieces; (_FE.edges||[]).forEach(function(e){ var a=_P[e[0]], b=_P[e[1]];' in page,
      "fe wires must be read as COMPACT index triples over fe.pieces")
check('NIDS[n.screen].kind==="web") ABS[n.screen]=n.id;' in page and 'window.__uniFeAbsorbed=' in page,
      "screen absorption is gone (a fetching file would draw TWO nodes: web + piece)")
check('var _FETYPES=[], _FETYPELINKS=[];' in page and 'function toggleTypes(on){' in page and '"typesTog"' in page,
      "the Types toggle (fe-type pieces held back at boot, seeded on demand) is gone")
check('showTypes:"off"' in page and 'else if(grp==="showTypes"){ toggleTypes(CFG.showTypes==="on"); }' in page,
      "CFG.showTypes must default OFF and route through applyCfg")
check("fecall:'calls'" in page and 'LINKMETA.fecall={w:3,pv:1}; LINKMETA.imports={w:2,pv:1};' in page,
      "the fecall/imports rels lost their wire-kind / meta mapping")
check('["component","hook","store","route","type","module"].forEach(function(k){ if(!C[k]) C[k]=feBuilder; });' in page
      and 'function feSec(n){' in page, "the shared frontend card builder is gone")
check('"frontend arm",' in page and 'screens absorbed' in page, "the Everything panel's frontend-arm Sources row is gone")
check('var order=["route","component","hook","type","store","module","screen","web",' in page,
      "the legend roster lost `module`")

# ── 10v. batch 49: journeys walk a FRONTEND leg (bridge+uses/renders, client-side) · the header SEARCH ──
check('function _jrnFeLeg(carriers)' in page and 'l.rel==="bridge"' in page
      and '(l.rel==="uses"||l.rel==="renders"||l.rel==="fecall"||l.rel==="reads")' in page,
      "the journey frontend-leg derivation is gone (bridge -> screens -> users incl. fecall/reads callers)")
check('j.fe=_jrnFeLeg(j.carriers); j.feN=' in page, "journeys no longer precompute their fe leg (row/pill chips would lie)")
check('window.__uniJrnStart=function(cid)' in page and '__uniJrnStart(r.getAttribute("data-jr"))' in page,
      "the factored journey starter is gone (picker rows + search must share ONE start path)")
check('fe.concat(j.carriers)' in page and 'WALK.mode="journey"; WALK.steps=fe.concat(j.carriers)' in page,
      "the walk no longer steps the frontend leg FIRST (users -> screens -> carriers)")
check('if(HL.exact){' in page and 'HL.exact=true; HL.origin=fe.concat(j.carriers)' in page,
      "journeys lost the EXACT-set highlight (a depth-BFS from the dense fe cluster lit 2,824 wires — screen noise)")
check('HL.depth=Math.max(1,Math.min(5,d)); HL.exact=false;' in page,
      "widening depth during a journey must opt INTO the BFS neighborhood (exact stays the default)")
check('class="wfe"' in page and 'class="jrnfe"' in page and "svgInline(\"component\", KINDCOL.component" in page,
      "the fe chips (pill + picker rows) lost their ACTUAL component glyph (legend-visual rule)")
check('id="tsin"' in page and 'id="tsdd"' in page and 'id="tsrch"' in page and '.topsearch' in page,
      "the header search markup/styles are gone")
check('window.__uniSrchInit' in page and 'e.key==="/"' in page and 'inp.focus(); inp.select();' in page,
      "the / shortcut no longer focuses the search")
check('CFG.showTypes="on"; try{ toggleTypes(true); }catch(e){}' in page and 'turns Types ON' in page,
      "a held fe-type found via search must turn Types ON before selecting")
check('window.__uniSelNode=_selNode' in page, "the search lost the ONE node-select path (card export)")
check('_jrnCollect().forEach' in page and 'Object.keys(SUBANCHOR).forEach' in page,
      "the search index dropped journeys or clusters")
# 10v-b: the adversarial-review fixes (15 confirmed findings, 2026-08-23)
check('var _esc=function(x)' in page and '_esc(r.label)' in page and '_esc(inp.value.trim())' in page,
      "search innerHTML lost its escaper (labels are code identifiers; the echo is raw keyboard text)")
check('_jp.style.display="none";   // exclusive surfaces' in page,
      "opening the search dropdown must CLOSE the journeys picker (#jrn z-55 paints over the trapped dropdown)")
check('"functions (off)"' in page and 'turns ƒ ON' in page,
      "held functions (ƒ off) lost their search group — a function search would flat-line at no match")
check('visN(NIDS[id]).show' in page, "the journey fe leg no longer respects fleet visibility")
check('addEventListener("focusout"' in page, "keyboard blur no longer closes the search dropdown")
check('_seen.reduce(function(a,gk)' in page, "search group headers can fragment again (regroup after the cap)")
check('#jrn .jrnrow.on .jrnfe{ color:#fff; }' in page, "the selected journey row's fe chip lost its contrast override")

# ── 10w. batch 50: fe· home identifier · FE community/usecase clusters · scaffold cut · controls trim ──
check('window.__uniEntLabel=function(e){ if(e&&e.indexOf("fe·")===0) return "fe · "+e.slice(3);' in page,
      "the fe-home display identifier is gone")
check('__uniEntLabel(e):e' in page and '__uniEntLabel(ent):ent' in page and '__uniEntLabel(label):label' in page,
      "an entity-name surface (fleet / panels / hull sprite) lost the fe· prefix")
check('function _feAssignSub(mode)' in page and 'if(l.rel!=="bridge") return;' in page and '"c·"+' in page,
      "FE community/usecase clustering is gone (every core except Kind would collapse fe pieces to one blob)")
check('try{ _feAssignSub(mode); }catch(e){}' in page, "assignSub no longer routes fe pieces through _feAssignSub")
check('#ctrlp .ctlrow{ flex-wrap:wrap; }' in page, "controls rows can overflow the border again")
check('measureText(txt).width' in page and 'cv.width=Math.max(256, tw);' in page,
      "labelSprite lost its text-fitted canvas (a long label clips both ends — 'fe · design-system' rendered '· design-syst')")
check('c.lbl.scale.set(_lh*_la, _lh, 1);' in page,
      "cluster label rescale lost the canvas-aspect rule (a text-fitted canvas squeezes at fixed 50x12.5)")

# ── 10x. batch 51: card-chip navigation (the 7-step trail) · legend hide-by-kind · fe/backend groups ──
check('window.__uniGoto=function(id)' in page and 'if(window.__uniGoto) __uniGoto(x.id);' in page
      and 'if(window.__uniGoto) __uniGoto(id);' in page,
      "card/link chips lost their click navigation (select + frame + the 7-step trail)")
check('window.__uniKindOff={};' in page and 'if(_st==="critical" && n.__solo) return _KOFF;' in page,
      "the 3-state visN gate (off · critical-hides-solo · all) is gone")
check('window.__uniKindToggle=function(k)' in page and '__uniKindToggle(rw.dataset.lgk)' in page,
      "the legend rows are no longer hide-by-kind controls")
check('lghd2 lggrp gs-' in page and '{t:"hd",l:"frontend"}' in page and '{t:"hd",l:"backend"}' in page
      and '__uniGroupToggle(hd.dataset.lggrp)' in page,
      "the legend frontend/backend headers are no longer clickable 3-state masters")
check('.lgrow.lgoff{ opacity:.32; }' in page and 'data-lgk=' in page,
      "a hidden kind's legend row no longer dims")

# ── 10y. batch 52: the C SPLIT (paired fe· entities) + the WIRE VIEW R-lab in the config ──
check('FE_PAIR={}' in page and 'if(h.pair) FE_PAIR[h.id]=h.pair;' in page,
      "the fe·X pairing map is gone (nothing would seat a split home beside its backend twin)")
check('lerp(new T.Color("#ffffff"),0.38)' in page,
      "a paired fe entity lost its TINT of the backend twin's colour (the pairing must be visible as family)")
check('E2.push([fh, FE_PAIR[fh], 8]);' in page and 'ord.splice(bi+1,0,fh);' in page,
      "pair seating is gone (force spring + ring adjacency)")
check('return "fe · "+e.slice(3);' in page, "a fe· home's display name lost its opened dot")
check('window.UNIWIRE={ r1:false, r2:false, r3:false, r4:false };' in page
      and 'window.__uniRelHide=function(l)' in page
      and 'if(window.__uniRelHide&&__uniRelHide(l)&&!(HL.on&&HL.links&&HL.links.has(l))&&l!==window.__uniSelLink) return; var _whf=' in page,
      "the WIRE VIEW rel-hide gate (with the light-on-demand exemption) is gone from the connector build")
check('window.__uniDrawBundles=function(grp)' in page and 'if(window.__uniDrawBundles) __uniDrawBundles(connGroup);' in page
      and 'userData.kind="bundle"' in page,
      "R3 bundling is gone (one line per cluster-pair, brightness = count)")
check('UNIWIRE.r4&&l.rel==="renders"&&_SOLEP' in page and 'return 14;' in page,
      "R4 lost its tight sole-child spring in tuneLinkForce")
check('window.__uniAddWireView=function()' in page and 'id="wireview"' in page.replace("'",'"')
      and '__uniAddWireView();' in page,
      "the WIRE VIEW config group is not built at boot / preset re-tabs")

# ── 10z. batch 52 review fixes (7 confirmed → 6 distinct) ──
check(page.count('__uniRelHide(l)&&!(HL.on&&HL.links&&HL.links.has(l))') >= 3,
      "the light-on-demand contract is gone — R-hidden wires must DRAW when lit and stay unpickable/unflown otherwise (draw + picker + transports)")
check('b.classList.toggle("on", d[0]==="cap"?!!UNICAP.on:!!UNIWIRE[d[0]]);' in page, "WIRE VIEW/CAP buttons lose their lit state on a config rebuild")
check('try{ buildTransports(); }catch(e){}' in page.split("wv-")[1][:1600],
      "a WIRE VIEW flip no longer re-derives the shuttles (ghosts would fly hidden wires)")
check('window.__uniCamFit=function(ms)' in page and '__uniCamFit(600); else Graph.cameraPosition(DEF' in page
      and '__uniCamFit(0); }, 400);' in page,
      "the camera no longer fits the live field (19 clusters outgrew the fixed 780) on boot + reset")
check('" (frontend of "+' in page.replace("'",'"'), "a paired piece's card no longer names its backend twin")

# ── 10aa. batch 53: capsules (S1+S3) · areas (S2) · the screen core (S4) · alias/fixture de-noisers ──
check('window.UNICAP={ on:true, threshold:80, open:{} };' in page and 'window.__uniApplyCapsules=function()' in page,
      "the capsule mechanism is gone (big entities would boot as label clouds again)")
check('rel:"bundle"' in page and 'count:g2.n' in page, "capsule wires lost their aggregated bundles")
check('try{ rebuildNodes(); }catch(e){}' in page.split('__uniApplyCapsules=function')[1][:5000],
      "the capsule surgery lost its decoration reset (stale FLEETTICK closures threw)")
check('if(n&&n.kind==="capsule"){ if(window.__uniCapExpand) __uniCapExpand(n.ent); return; }' in page,
      "one click on a capsule must EXPAND its entity")
check('if(_CAPST&&_CAPST.byPiece[id])' in page, "goto/search into a folded piece no longer auto-expands")
check('g:"collapsed"' in page and 'opens the capsule' in page,
      "stashed pieces vanished from search (the index must list them and expand on open)")
check('__uniSetKindState("function","critical"); }catch(e){} if(window.__uniApplyCapsules) __uniApplyCapsules(); if(window.__uniCamFit) __uniCamFit(0); }, 400);' in page,
      "the boot must, in the 400ms settle (AFTER build + first tick), load functions to critical THEN fold")
check('KINDS.capsule={' in page and 'f==="pod"' in page and 'C.capsule=function(n)' in page,
      "the capsule kind lost its form/card")
check('if(mode==="screen"){' in page and 'screen:"Screen — pieces group by the SCREEN' in page,
      "the SCREEN core strategy (S4) is gone")
check('"area": _area_of(path, home)' in open('templates/center/generators/_a3_fe.py').read()
      and 'apiAlias' in open('templates/center/generators/_a3_fe_extract.mjs').read(),
      "the emitter lost areas (S2) or the API-alias flag")
# ── the review-53 fix wave (13 confirmed findings → 10 subjects) ──
check('in alias_cut or (path, ex.get("name") or "") in scaffold_cut' in open('templates/center/generators/_a3_fe.py').read(),
      "review 53[5]: cut exports must never act as edge SOURCES")
check('elif home == "app-shell":' in open('templates/center/generators/_a3_fe.py').read(),
      "review 53[6]: the app-shell area keeps its discriminating first segment")
check('function assignSub(mode){ _assignSubImpl(mode);' in page and 'if(n.__cap) n.sub=n.area||n.sub;' in page,
      "review 53[2]/[10]: the assignSub wrapper must restamp capsule areas")
check(page.count('try{ __uniAssignSplit(); }catch(e){}') >= 1 and 'grpOf' not in page,
      "review 53[11]: capsules fold from FRESH per-side subs (restore → __uniAssignSplit → fold); grpOf deleted")
check('function _fieldNodes()' in page and '_fieldLinks()' in page and '_fieldN(' in page,
      "review 53[0]: the journey machinery reads the WHOLE field (stash included)")
check('function _stashPurge(flag)' in page and page.count('_stashPurge(') == 3,
      "review 53[9]: BOTH toggles purge their pieces from the capsule stash")
check(page.count('__uniApplyCapsules&&_CAPST!==undefined) try{ __uniApplyCapsules(); }catch(e){}') == 2,
      "review 53[1]: toggleFns AND toggleTypes re-fold a collapsed entity")
check("nodes.some(function(n){ return n.__cap&&n.ent===e; })" in page,
      "review 53[3]: the fleet NAME click expands a folded entity")
check('_CAPST) _CAPST.nodes.forEach(function(n){ live[n.ent+"|"+n.sub]=1; });' in page,
      "review 53[4]: fleet overrides survive the fold round-trip")
check('capsule:"a FOLDED area' in page and '" folded"' in page and '__uniPanelAll) try{ __uniPanelAll(); }catch(e){}' in page,
      "review 53[12]: KINDTIP.capsule + the folded annotation + the census refresh")

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
    const fePresent=!!(window.GABE_C4&&GABE_C4.fe&&GABE_C4.fe.pieces&&GABE_C4.fe.pieces.length);
    const fe={ present:fePresent, feNodes:nodes.filter(n=>n.fe).length, webLeft:nodes.filter(n=>n.kind==='web').length,
      absorbed:window.__uniFeAbsorbed||0, typesHeld:(typeof _FETYPES!=='undefined')?_FETYPES.length:-1, typesDrawn:nodes.filter(n=>n.kind==='type').length,
      feRels:links.filter(l=>l.fe).length, bridge:links.filter(l=>l.rel==='bridge').length, tog:!!document.getElementById('typesTog') };
    return { nodes:(typeof nodes!=='undefined'&&nodes)?nodes.length:-1, err:!!document.getElementById('err'),
      cardOpen:document.body.classList.contains('panel-open'),
      stPass:!!(pb&&pb.querySelector('.pchip.st-pass')), face:!!(pb&&pb.querySelector('.jfaces .face')), fe }; });
  await b.close();
  // the frontend fold, when the feed carries it: pieces drawn · every web node absorbed · bridge wires survive ·
  // types held back (toggle present) — a feed WITHOUT fe must leave all of that at zero (honest-empty)
  const f=r.fe, feOk = f.present ? (f.feNodes>0 && f.webLeft===0 && f.absorbed>0 && f.typesHeld>0 && f.typesDrawn===0 && f.feRels>0 && f.bridge>0 && f.tog)
                                 : (f.feNodes===0 && f.absorbed===0 && f.typesHeld===0 && !f.tog);
  const ok = r.nodes>0 && !r.err && errs.length===0 && r.cardOpen && r.stPass && feOk;
  if(ok) console.log(`  render: PASS — ${r.nodes} live nodes, 0 errors, card renders (st-pass=${r.stPass}, faces=${r.face}); frontend ${f.present?`${f.feNodes} pieces · ${f.absorbed} screens absorbed · ${f.typesHeld} types held`:'absent (honest-empty)'}`);
  else { console.error('  render FAIL:', JSON.stringify(r), 'errs='+errs.slice(0,4).join(' | ')); process.exit(1); }
})();
JS
  RENDER=$?
else
  echo "  render: SKIP ⚠ — RENDER COVERAGE DID NOT RUN (no chrome/playwright-core/example on this host)."
  echo "         provision: mkdir -p docs/design/graft-adoption/spike/_build && (cd \$_ && npm i playwright-core) ; system chrome, or set GABE_CHROME_BIN/GABE_PW_DIR (see docs/design/graft-adoption/spike/README.md §Rebuild)."
  echo "           the static contract above still holds, but the inline-engine execution path is UNVERIFIED here."
  RENDER=0
fi

[ "$STATIC" = 0 ] && [ "$MISS" = 0 ] && [ "$RENDER" = 0 ] && { echo "gabe-universe battery: ALL PASS"; exit 0; }
echo "gabe-universe battery: FAILURES ABOVE"; exit 1
