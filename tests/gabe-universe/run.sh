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
check('grp==="entLayout"' in page and 'grp==="coreBy"' in page, "applyCfg missing the entLayout/coreBy branches")
check('d3ReheatSimulation' in page, "entity-layout change never reheats the sim (nodes would not move)")
check('window.__uniAddLayoutTab' in page and 'cfgtabbar' in page, "the Display|Layout config tab is missing")
check('recomputeEX(CFG.entLayout); assignSub(CFG.coreBy); recomputeSubAnchors(); }catch(e){} build' in page, "boot does not assign the default core before the sub-anchors")
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
check('{ fk:0.9, bridge:0.8, calls:0.8, imports:1 }' in page and '__uniCurveAmt=0.6' in page and 'lineStyle:"curved"' in page,
      "the operator's stock glow/curve defaults drifted")
check('function _raySegDist' in page and 'w=ray.origin.clone().sub(A)' in page and 'showLinkPanel(wbest.l)' in page,
      "wire clicking is gone (ray-segment pick → connection panel)")
check('__uniHLMode();       // a FOCUS option while glowing' in page,
      "focus options no longer BITE (auto-switch to focus mode on click)")
check('id="flscopy"' in page.replace("'",'"') or '"flscopy"' in page,
      "the Connections copy-settings button is gone")
check('window.__uniLastCopy=txt' in page and '(key==="wires")?"":"none"' in page,
      "copy-settings lost its payload stash or its Connections-only gate")
check('pillHTML("warOn"' in page, "master planet-assets on/off toggle missing")

# ── 10h. batch-6: assets OFF default · Zones inline master toggle · core 2-col grid · connector throttle ──
check('warOn:false' in page, "planet assets are not OFF by default")
check('grplbl zoneshd' in page, "the Zones title does not carry the inline On/Off master toggle")
check('zonesoff' in page, "zone icons do not dim when the master toggle is off")
check('data-grp="coreBy"]{ display:grid' in page, "cluster-core pill is not a 2-column grid (it would overflow)")
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
check('assignSub(CFG.coreBy); recomputeSubAnchors(); if(Graph){ try{ Graph.d3ReheatSimulation()' in page,
      "the coreBy branch does not re-anchor + REHEAT (core change would not move nodes)")
check('grp==="coreBy"){ assignSub(CFG.coreBy); buildClusters()' not in page,
      "REGRESSION: coreBy is decoration-only again (assignSub straight to buildClusters, no reheat)")
check('var KRADF={ endpoint:' in page, "per-kind radial factors missing (endpoints would not ring the edge)")
check('rmax=R0*1.3' in page, "soft containment missing (nodes bleed across entity hulls)")
check('function tuneLinkForce' in page and '.ent!==t.ent)?280:40' in page,
      "typed link rest-lengths missing (default rest≈30 springs collapse entities into one mesh)")
check('strength(-60).distanceMax(150)' in page, "charge not range-capped (unbounded -150 balloons each cluster)")
check('.strength(-150)' not in page, "REGRESSION: the unbounded -150 charge is back")
check('DEF={x:150,y:80,z:780}' in page, "home camera not pulled back for the widened (SEP 1.55) scene")

# ── 10k. batch-10: freeze-through-settle · ROUTES tab · icon LINES + curve amount · per-kind BEAM ──
check('function __uniFreezeForSettle' in page and 'window.__uniSettleDone' in page, "freeze/resume machinery missing")
check('updateClusters(true); if(window.__uniSettleDone) window.__uniSettleDone();' in page,
      "the engine settle does not resume what the layout freeze paused")
check('grp==="coreBy"){ __uniFreezeForSettle();' in page and 'grp==="entLayout"){ __uniFreezeForSettle();' in page,
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
# batch 11-B4: the ALL row reaches cluster overrides; inherited-off dims; explainers live on hover
check('the ALL row is a bulk gesture' in page, "the ALL master row does not propagate into cluster overrides")
check('reads inherited-off (dim)' in page, "a cluster switch does not dim when its parent entity is off")
check("ti:\"Layer — group by the kind's architectural layer" in page and 'ti:"Chain — a flat layered ribbon' in page,
      "cluster-core / entity-layout options carry no hover explainers (word — meaning, since the icon-only pills)")
check('ti:"adds "+window.GABE_LEVELS.fn_nodes.length' in page, "the Functions option lost its count-bearing hover explainer")
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
check('__uniAddLayoutTab(); if(window.__uniFleetSync) __uniFleetSync(); } })();' in page,
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
check('setInterval(function _flyTick(){' in page and 'FK.up' in page and 'k==="control"' in page,
      "WASD/Space/Ctrl flight missing (setInterval tick — headless/background pages starve rAF)")
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
check('CFG.coreBy="community"' in page, "the community core is not the default when the levels feed is present")
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
check('id="ctlInv"' in page and 'id="ctlPvt"' in page, "invert / middle-orbit toggles missing")
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
check('camMode:"look"' in page and 'id="ctlCam"' in page,
      "the LEFT default must be LOOK (operator remap) with the dropdown present")
for v in ('value="tumble"','value="joystick"','value="arcball"','value="look"'):
    check(v in page, "camera dropdown lost a scheme: "+v)
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
check("ic:__uniCoreIco(" in page and page.count("ic:__uniCoreIco(")==7,
      "the seven cores must EACH carry their icon (layer·kind·tests·guards·usecase·community·fk)")
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
check('"fnsTog"' in page, "the FUNCTIONS icon toggle is gone (replaced the Hide/Show pill; starts OFF)")
check('"spreadRng"' in page, "the SPREAD slider is gone (element separation inside entities)")
check('(window.__uniSpread||1)' in page and 'min="0.4" max="2.8"' in page,
      "spread must scale RENT with the default at a quarter of the 0.4-2.8 bar")
check('className="cfgrow entcombo"' in page,
      "the entity combo/options rows are gone")
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
