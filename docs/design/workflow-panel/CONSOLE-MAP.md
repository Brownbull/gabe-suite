# The SC2 console, region by region — and what the Gabe Suite already has

The operator asked: *"I would like to inspect this panel again, identify the pieces, and then
identify in our graph, our structure, and the Gabe Suite what we have in place."*

Region names below are Blizzard's own, read from `GameUI.SC2Layout` in
`core.sc2mod/base.sc2data/UI/Layout/UI/`. Station line numbers refer to
`templates/center/shell/gabe-universe.html`.

## What the layout file settles

- **`MinimapPanel` is 395 x 327 layout units, anchored to `$parent` only.** No selection state can
  reach it — which is *why* the operator's two screenshots show a pixel-identical minimap. By
  construction, not coincidence.
- **`InfoPanel` is 580 x 199, and it never moves.** Inside it, **five of its seven panes occupy the
  byte-identical 402 x 199 rect** (`InfoPaneUnit`, `Hero`, `Queue`, `Progress`, `Cargo`).
  *"The fields stay in the same position"* is literally how Blizzard built it.
- **`CommandPanel` is 400 x 242 with exactly fifteen 76 x 76 buttons and a 1-unit gap.** The box and
  all fifteen cell rectangles are hard-anchored and never move, resize, reflow or hide in any state.
- **`ResourcePanel` is not in the console at all** — it lives in the sibling `FullscreenUpperContainer`
  at the *top* of the screen. Global facts go to a global corner.
- **The console band is ~27.25% of screen height** (the minimap is its tallest region). The reserved
  world strip, `ConsoleWorldBottomOffset val="200"`, is 16.7%.

### The one genuine shape change
`InfoPaneGroup` (multi-select) takes the **full 580** — the unit wireframe column disappears, because
there is no single unit to wireframe. Six pages of 8 x 3 = 24 buttons each. `InfoPaneCargo` is the
second, with explicit `NormalCapacity` (402) and `HighCapacity` (580) animations.

*This answers the screenshot question outright: multi-select **replaces** the single-unit block rather
than sitting beside it. No further screenshot needed.*

---

## The mapping

| SC2 region | status | station equivalent |
|---|---|---|
| GameUI/UIContainer/ConsoleUIContainer — the fu | **PARTIAL** | The page chrome: .topbar (:995-1019) · #g (:1022) · .panel 340px right rail (:1026-1033) · #cfg (:1023) · #expl (:1024) · #elegend (:1034) · body-appe |
| MinimapPanel (CMinimapPanel) — bottom-left 395 | **MISSING** | NONE. The station has __uniCamFit and nothing else (FINDINGS F8). |
| MinimapCameraViewFrustumFrame — the bright cam | **MISSING** | NONE |
| MinimapPanel's four 42×42 buttons — PingButton | **PARTIAL** | Terrain ≈ the layout switch; Color ≈ entity colour; ClearSelection ≈ Escape. Ping ≈ nothing. |
| InfoPanel (CInfoPanel) — the fixed 580×199 out | **PARTIAL** | The .panel right rail (:1026-1033) with #phead + #pbody, driven by showPanel(n) :6102-6124 |
| UnitPanel/UnitWireframe — the 140×140 per-unit | **PARTIAL** | A 15px static KIND glyph in #phead |
| InfoPaneUnit/NameLabel — the unit's name, top  | **HAVE-DRAWN** | .pname in #phead |
| SubtitleLabel / TypeLabel — "Light - Biologica | **HAVE-DRAWN** | K.type + the head badge |
| ShieldLabel / LifeLabel / EnergyLabel — the vi | **HAVE-DATA-NOT-DRAWN** | n.m — computed for every node, drawn as fleet decoration and three warning rows |
| BehaviorBar — the buff/debuff strip at the pan | **HAVE-DRAWN** | flagsSec — three risk rows with their real 3D graph asset |
| InfoLabel / Kills / Rank / the medal icons — t | **PARTIAL** | Three unlabelled verdict rows |
| InfoPaneGroup — the multi-select roster: the F | **PARTIAL** | No multi-select exists. Nearest: panelClu's "Inside — elements" list, makeupSec's kind census, and the Trail panel's 7 chips. |
| InfoPaneProgress / InfoPaneQueue — the product | **HAVE-DATA-NOT-DRAWN** | The in-flight feed is LOADED and reaches exactly one disabled button's tooltip |
| InfoPaneCargo — the 64×64 CargoButton grid wit | **HAVE-DATA-NOT-DRAWN** | det.cols exists and is drawn only as a WIRE's payload |
| CommandPanel (CCommandPanel) — 400×242, fiftee | **HAVE-DATA-NOT-DRAWN** | Fifteen-plus verbs exist as callable functions with no card, no grid and no letters |
| CommandPanel's disabled state — a button that  | **HAVE-DRAWN** | Implemented twice, in the two panels nobody was designing a command card in |
| ConsolePanel/PortraitPanel (CPortraitPanel) —  | **PARTIAL** | The animated-3D-thumbnail renderer exists and is spent on the legend |
| ControlGroupPanel (CControlGroupPanel) — 766×6 | **PARTIAL** | A persistent roster exists (the Fleet panel) but nothing is assignable; the pin mechanism exists and does not survive |
| IdleButton (CIdleButton, F1) — 92×72 at the co | **HAVE-DATA-NOT-DRAWN** | Every counter exists; all of them live inside the panel a selection erases; no cycle verb exists |
| ArmyButton / PylonButton — 92×72, the race gly | **PARTIAL** | The composition census, drawn at every container level, in the panel that vanishes on select |
| MissionTimePanel (CMissionTimePanel) — 200×44, | **HAVE-DRAWN** | The nav footer's regen stamp + HEAD sha |
| MenuBar (CMenuBar) at MenuBarConsoleAnchor — H | **PARTIAL** | Help and Menu exist as a topbar button row plus three floating helper panels; the message log does not exist |
| ResourcePanel (CResourcePanel) — NOT a console | **HAVE-DRAWN** | {{STATUS_PILLS}} in the topbar — and it is structurally in exactly the right place |
| AlertDisplay (CAlertPanel) — 600×64 mid-screen | **MISSING** | A JS-error banner and a transient walk note |

---

## What we have and draw

Fourteen. The station is further along than it looks.

- The name line — n.label (:1246 backend / :1305 frontend) → #phead .pname (:6108), mirrored to #prailname (:6122); project-worded via __uniNameOf (:1273) and __uniEntLabel (:1284). SC2's NameLabel, in a fixed place, from a stable source.
- The type + badge line — K.type plus the _bk badge (:6103-6106): endpoint→n.m.method, function→n.role, provider→n.pclass, drawn as a 32px canvas at graph badge opacity (:6113) and explained by __badgePop on hover (:6116). SC2's TypeLabel.
- The buff bar — flagsSec (:5965): god-object · unguarded · conflict, each carrying its ACTUAL 3D raider asset via _hdAsset (:5490) → __uniAssets.god()/.ung() (:6156); appended to every card by the decorator loop (:5974). SC2's BehaviorBar.
- The clock — regen {{REGEN_STAMP}} · HEAD {{HEAD_SHA}} in the nav foot (:992), filled by build_center_a3.py (:1487). SC2's MissionTimePanel.
- The top resource strip — {{STATUS_PILLS}} (:1018) in .topbar: 'repo · N tests · N failed' + 'phase X', warn/ok, from build_center_a3.py (:1477-1481). Structurally SC2's FullscreenUpperContainer/ResourcePanel, in the right corner, selection-independent.
- The selection ladder — panelAll (:5865) → panelEnt (:5921) → panelClu (:5939) → showPanel (:6102), with aboveSec (:5959) rendering the way back up on every card. The README's CONSOLE RIM, already built.
- The composition census — kindCounts (:5800) + makeupSec (:5822), drawn at all three container levels (:5871, :5925, :5943) with the field's own glyphs. SC2's army-composition half of ArmyButton.
- The tier control — #tiersel (:998-1003) + __uniSetTier (:4283) over _TIER_PRESETS (:4268-4272), keys Alt+1..4 (:4330), with the __uniScaleGuard boot-at-T0 fallback (:3948-3951). No RTS equivalent — see SURPRISES.
- The search — #tsrch (:1005-1009), whose entity branch already does exactly what a minimap click must do: __uniPanelEnt(e) then _frameSet(that entity's node ids) at :4432-4434; cluster branch the same at :4437-4438.
- The journeys picker and the walk — jrnBtn (:1010), _jrnPaint (:2965) with kind tabs and collapsible level groups, #walkbar chips (:3075-3104, .wchip 20×20 at :388), step-number badges drawn onto the 3D nodes themselves (:2317-2339), Alt+A/D to step (:3177).
- The Fleet roster + its 9-column toggle matrix — #fleet (__uniBuildFleet :3347), _FCOLS (:3332-3341), rows (:3457-3480), __uniFleetToggle (:3530) — including the only greyed-but-present cell state in the station (the g() master gate dims rather than removes).
- The Controls cheat-sheet — #ctrlp (__uniBuildCtrl :3139-3157), ten key-binding rows, minimizable. SC2's Help button, as a standing panel.
- The legend with live 3D asset thumbnails — buildLegend (:6241), legThumb (:6135) over the shared palR()/palLoop renderer (:6128-6133), LEGEND.Types/Connectors (:6163+). The suite's own law: legends render the ACTUAL glyph as drawn.
- The camera home — #reset (:1017) → __uniCamFit(600) (:5226), which recomputes the field extent from EX/EY/EZ + RENT rather than a constant (:1891-1894).

---

## What we have as data and do NOT draw

Ten. This is the actionable list.

- THE VITALS BLOCK. n.m = {behind, depth, tests, cols, fanin, god, method} at :1245, fanin filled by real in-degree at :1344, large/hot derived at :1352 — computed for every node, and there is no meter anywhere. Measured: POST /…/relief-accept = behind 42 · depth 5 · tests 3; Recipe = tests 67 · fan-in 22; Auth (external) = fan-in 29.
- THE FRONTEND VITALS, discarded on the way in. fed2w · write · wsites · sites · client (:1307-1310) and cache · ops · via (:1302-1303) are carried on the node while m is minted as all-zeros at :1306. RecipeBrowseContainer carries fed2w 1 · write true · fan-in 3; the bundle shows four zeros and a false 'unguarded' warning.
- WHICH TABLES AN ENDPOINT TOUCHES. access rides 79 of 81 L2 endpoint nodes in the feed; the adapter at :1248-1251 copies resp · ids · table · sites · fn · middleware · stream · pclass · home_ev · fns and NOT access, so accessSec (:5572) can never fire on an endpoint — n.access is only ever set at :2077 for levels-derived function nodes. One line. F6, the highest-value fix in the analysis.
- THE PRODUCTION QUEUE. window.GABE_SIM is loaded at :1041 and read at :3348-3349 for a tooltip on a disabled button (:3355). The join is confirmed by the state contract itself at :3231-3233 — 'GABE_SIM keys its stages by piece id and the universe node ids are the SAME strings.' Nothing draws a progress bar.
- THE MIDDLEWARE AND FLAG DOSSIERS. middleware.det = {file, gates, line, order, scope} names the endpoints it stands in front of; flag.det = {default, line, src, walls} names the endpoints it can close. KINDCARD (:5356) has no key for either, so :6119 builds an empty body — no sections, and not even the flag rows, because the decorator at :5974 only wraps builders that exist. F1.
- EVERY WORLD-STATE COUNTER, in the one place a selection destroys. __uniBudgetHit :5879 · st.elements :5933 · st.cross_touches :5936 · st.unparseable :5937 · st.route_mounts.unresolved :5938 · st.fn_similarity :5940 · st.web.unmatched/dynamic/unhomed/other_roots :5942 · st.graft :5944 · st.fe :5945 · st.homing.move/shared :5947 — all inside panelAll's Sources (:5877-5957). F7.
- THE VERB ROSTER. _aimAt (:3045) · _frameSet (:3052) · __uniCamFit (:1891) · __uniRevealNeighbors (:2366) · __uniFleetToggle (:3530) · __uniSetTier (:4283) · panelAll/Ent/Clu (:5865/:5921/:5939) · __uniHLDepth · __uniHLMode · __uniSetKindState · __uniGoto · __uniJrnToggle · __uniCapExpand/Collapse · __uniSelectLink. Fifteen-plus callable verbs, no grid, no letters, and the best one gated behind a 350ms double-click (:5201).
- EVERY MINIMAP INGREDIENT. _npos rebuilt each engine tick (:5166, wired :5210) · camera basis with its columns named (:4183) · the settle hook .onEngineStop → __uniSettleDone (:5212) · the NDC inverse-projection recipe (:2219) · the idle-frame early return (:4176-4181) · the shared thumbnail renderer (:6128-6133) · EX/EY/EZ + RENT (:1227-1228, :1919) · __uniCamFit's own maxR (:1892). Nothing draws a map.
- THE PER-ELEMENT 3D PORTRAIT. __uniAssets {sat, ship(corpus), testchip, cargo, god, ung} (:6156) + __uniAssetThumb via _hdAsset (:5490) + the rotating shared renderer palLoop (:6129-6133) — spent on legend cells and two risk-flag hover thumbs, never on identity.
- THE ELEMENT'S OWN INVENTORY. det.cols (:1245 backend, :1302 for a store's fields / a type's members) is drawn only as a wire's payload in carriesSec (:5983); n.ids (:1248) — data types · endpoints · principal fn — has no fixed slot. And det.cols is feed-capped at 10 with the remainder in det.cols_more, so Recipe's 38 columns report 10 (F3).

---

## What is genuinely missing

Eleven.

- A minimap — or any where-instrument at all. Every game surveyed ships a persistent, selection-independent overview in a screen corner; the station has __uniCamFit (:1891) and nothing else. F8.
- The camera-frustum rectangle. The basis is read sixty times a second at :4183 to position badge sprites, and nothing draws the wedge.
- A ping / annotate / mark verb. SC2's PingButton has no station analogue of any kind — nothing lets an operator leave a mark on the field.
- A command card. No 15-cell grid, no hotkey letters, no cell that keeps its position when the verb does not apply — and the key space for a grid card is already spent (1-8 are fleet columns at :3182-3184, Alt+1..4 are tiers at :4330), so the station must take the mnemonic-letter route. F9.
- Multi-select. SEL is a single node (_selNode :5863, also set inline at :5201). No group selection state exists, so there is no group roster, no 'select all of kind', and SC2's one genuine console shape change (InfoPaneGroup taking the full 580) has nothing to correspond to.
- Assignable control groups. __uniPin[id] exists (set :2371, honoured by visN :3278-3288) but is not a user verb, and is wiped by __uniHLClear (:2653) and by every tier press (:4285) — __uniSetTier explicitly preserves a journey while wiping the pin. F10.
- A progress bar or queue display of any kind — despite GABE_SIM being loaded, keyed to the node ids by contract (:3231-3233), and given a slot that is `disabled` (:3355).
- An idle-worker-class counter-plus-cycle. There is no persistent badge and no 'go to the next unmeasured / unguarded / unmatched element' anywhere in the station.
- A message log with an unread badge. Nothing accumulates on the page; the suite's nearest equivalent is pulse's one-line angle report printed at the end of a terminal beat.
- A data-driven alert overlay. The only banner is window.onerror (:1043-1048), which fires on a JS exception and is not even theme-aware.
- A positive vital. Every flagsSec row (:5965-5971) is a warning; a well-tested, low-fan-in, shallow element gets no row at all — and on frontend the one that always fires is reading a hardcoded 0 (F2).

---

## Surprises — where the Suite has something SC2 does not

- The station has TWO resource strips and put the wrong one outside the selection. {{STATUS_PILLS}} (:1018) sits exactly where SC2's ResourcePanel sits — top of the screen, outside the console, selection-independent — carrying the PROJECT's resources (tests · failures · phase). The GRAPH's world state (tier · node budget · unmatched fetches · move candidates · unparseable files) sits in panelAll's Sources (:5877-5957) and is destroyed by a click. Blizzard put those two in physically separate compiled dialog files precisely so this could not happen (F7).
- The animated 3D portrait renderer already ships — and is spent on the legend. palR() (:6128) is ONE shared WebGLRenderer, 236×208, preserveDrawingBuffer, built with an explicit comment that a canvas each would blow the browser's context cap; palLoop (:6129-6133) rotates each cell 0.012 rad/frame and drawImage-copies it into many small canvases. That is the same engineering answer SC2's PortraitPanel needs, built for legend cells and two hover thumbs. SC2 has one 152×232 portrait; this pipeline can fill forty.
- The station needs a fourth availability state SC2 has no name for. LIT · BLANK (wrong question — BEHIND on a model) · GREY (no answer — CALLERS 0) · HATCHED (never measured — TABLES on every endpoint, TESTED on all 1,078 frontend pieces). A game knows its own unit data; this feed is partial, and today the station renders 'never measured' as 'measured zero', which is F2 and F6 in one sentence.
- SC2's greyed-but-present cell is already implemented in the station — twice, in the two panels nobody was designing a command card in. _FCOLS[].g() (:3333-3341) dims a Fleet matrix cell when its global master gate is off rather than removing it (:3476), and the in-flight preset button (:3355) keeps its slot with a `disabled` attribute and a tooltip that states which of three reasons applies. The element card, which needs this most, has no such state.
- The station's saved selection is a URL, not a keypress. ?journey=<name|cid> and ?ent=<slug> via __uniApplyDeepLinks (:3952, applied at boot :6365) do what Ctrl+1 does — restore a named view — but survive the session, the machine and the operator. SC2 control groups die with the game.
- The queue is not missing; it is loaded, keyed, slotted and greyed. The UNIVIS state contract carries a written reservation at :3231-3233 stating that GABE_SIM keys its stages by piece id and the universe node ids are the SAME strings, 'so a later per-piece join is direct'. Someone designed the production display, wired the join, built the button and disabled it.
- Every SC2 badge is a game fact; the station's badges are epistemics. delivery:stream, pclass (eight provider classes under a root-scope rule), home_ev (three witnesses disagreeing about where a piece lives), conf per trace hop, truncated:True when a walk hit its cap, fe-unknown as an honest kind rather than a `module` claim. No RTS has a 'we did not measure this' glyph — and the station needs one on 1,078 elements.
- The console's regions are draggable. _dragPanel(panel, head) (:3324) lets #cfg, #fleet and #ctrlp be moved anywhere on the page, and #navmin / #cfgmin / #fleetmin / #ctrlpmin collapse them. SC2's entire muscle-memory contract is that a region cannot move; the station's panels are furniture, which is the deepest structural inversion in the comparison and the reason the fixed-slot dock is worth building.
- The tier has no RTS analogue at all — because it changes what EXISTS, not what is shown. _TIER_PRESETS (:4268-4272) sets __uniKindState per kind, but for `function` and `type` it also calls toggleFns/toggleTypes (:4287-4288), which ADD or REMOVE nodes from the array: 844 nodes at T0/T1, 1,136 at T2, 1,644 at T3. An RTS never changes the census of the world; this station changes it four times from a keypress, which is why a minimap must state which tier's floor it is drawing.
- The station's journey walk already draws SC2's subgroup tab BETTER than SC2 does. The trail chips in #walkbar (:3075-3104) are mirrored onto the 3D nodes themselves as step-number overlays (:2317-2339), with the current step drawn brighter and thicker-ringed in the entity colour (:2329). SC2's ControlGroupPanel tells you a group exists; the station's trail tells you where in the world the step IS.

---

## The finding that decides the build order

**Every ingredient a minimap needs already exists in the station. Nothing draws a map.** Verified
line by line:

| ingredient | where it already lives |
|---|---|
| node positions, rebuilt every tick | `_npos` — the wire renderer's own cache (`:1718`, `:2227`, `:2294`) |
| the camera basis, read 60x/sec | `:4183` — `cam.matrixWorld.elements`, columns commented `[0..2]=right · [4..6]=up · [8..10]=toward-viewer` |
| the settle hook | `.onEngineStop(...)` at `:5212` -> `__uniSettleDone` |
| the map's scale | `__uniCamFit`'s `maxR` at `:1892`, from `EX/EY/EZ` + `RENT` |
| the NDC inverse projection | `:2219` |
| click-to-navigate | the search's entity branch at `:4432-4434` — `__uniPanelEnt(e)` then `_frameSet(ids)`, verbatim what a minimap click must do |

The camera-basis comment at `:4183` is the whole rotating-minimap projection, already computed every
frame to place badge sprites. A minimap is a **renderer over things that exist** — no new math, no new
lifecycle, no new data.

## The information / action law

The operator's observation — *"this entire panel is dedicated to the information about what you have
selected. The right-hand side panel is dedicated to the actions"* — is the axis SC2 is built on. It
yields three testable invariants:

```
LEFT = WORLD (selection-independent) | CENTRE = INFORMATION | RIGHT = ACTIONS
```

- **INV-A** — no click left of the accent rule may change `nodes.length`, `__uniKindState`,
  `__uniTier`, `UNIVIS` or `__uniFeClassState`.
- **INV-B** — every fact in the STANDING set must render in a surface `showPanel(n)` (`:6102`) does
  not rebuild.
- **INV-C** — the minimap's content is a pure function of (`_npos`, `_ents`, camera) and never of `SEL`.

**Five things sit on the wrong side today.** The worst: every world-state counter renders inside
`panelAll`'s Sources rows (`:5877-5957`), so selecting any element erases the entire global picture.
Suite-side these are real persistent nags — pulse angles S10, S13, S15, S16, S17, S18 — but they print
as one terminal line at the end of a beat and never reach the station.
