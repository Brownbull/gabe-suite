#!/usr/bin/env python3
"""build-bridge.py — Cognos · Bridge: the meaning → abstraction link for ONE endpoint, as the operator drew it.

  CLAUDE side: fields → gravity wells → meanings (dE/dx = the ranking)
  ····· the gap ·····
  OPERATOR side: abstractions — what sight grasps without reading (read · 3D · time)

Sections: the door (context first, brief) · the alphabet (drawn) · the bridge (12 rows, each with its sketch
and a mark control) · the derivatives (speed · acceleration · expectation, the operator's additions) · the
dimensions a door touches (a fixed strip) · your marks (kept on the page via the db capability; read back
with read_db). Numbers are the feed's, pinned to the bench POST /setup/complete @ 8356f531.
"""
import json, re, html, pathlib, importlib.util
HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("cognos_lib", HERE / "cognos_lib.py"); L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
E, ico, scope_sketch = L.E, L.ico, L.scope_sketch
spec2 = importlib.util.spec_from_file_location("simple_sketches", HERE / "simple_sketches.py"); SS = importlib.util.module_from_spec(spec2); spec2.loader.exec_module(SS)
SIMPLE = SS.SIMPLE   # the twelve drawings, simple and big, from the accepted letters only (operator 2026-09-10)
def sk_block(svg_text, slug):
    """a sketch frame: static drawings get no replay (nothing to replay); animated ones register FXREPLAY[slug]"""
    static = 'data-static="1"' in svg_text
    return ('<div class="sk%s" data-mode="once"><template>%s</template><div class="stage"></div>%s</div>'
            % (" static" if static else "", svg_text, "" if static else '<button class="replay" type="button" data-fx-replay="%s" title="replay">%s</button>' % (E(slug), ico("replay"))))
R = json.load(open(HERE / "cognos-endpoint.json", encoding="utf-8"))
wells = {w["key"]: w for w in R["wells"]}; encs = {e["well"]: e for e in R["encodings"]}
FIELDSTATE = {f["key"]: f["state"] for f in R["facts_fields"]}
def norm(s): return re.sub(r"[^a-z0-9]+", "", s.lower())
def ev_state(ev):
    k = norm(re.split(r"[\s(:]", ev.strip())[0])
    for key, st in FIELDSTATE.items():
        if norm(key) == k: return st
    return "live"

# ── the bridge rows, in dE/dx order (the judge's rank), with the abstraction letters per row ─────────────
ROWS = [
  ("footprint",  "A B H",  "13 tables, 11 written, 8 in four other houses; the write is real"),
  ("dependents", "D A",    "one screen, one story; I am its second step"),
  ("response",   "A E F",  "6 fields, 5 nested, all at once"),
  ("request",    "A",      "7 things to assemble, 6 of them structured"),
  ("chain",      "E A G",  "wide one hop down — and that is where it writes"),
  ("gate",       "H D",    "one thing can stop it; nothing walls it"),
  ("errors",     "A G",    "four proven exits; 401 nobody checked"),
  ("tests",      "A G",    "26 named, 15 unnamed, none end-to-end"),
  ("after",      "D I",    "one write; a retry does not write twice"),
  ("home",       "B A",    "auth by file; the data leans settings"),
  ("motion",     "D F",    "quiet lane; the houses it writes into moved"),
  ("runtime",    "G",      "nobody measures this here — the hatch is the message"),
]
SHORT_FIELDS = {
  "footprint": "access.ops 13 tables (11 w) · access.commits · tables' owning entities",
  "dependents": "bridge: 1 hook (useCompleteSetup) · workflows.js step 2 of 4 · usage.internal 0",
  "response": "resp MeResponse · payload.n 6 · nests 5 · status 200 · stream no",
  "request": "gsig body: SetupCompleteRequest · cols 7 · nests 6 · consumer complete_setup",
  "chain": "calls walk 22 fns · 4 layers (2 · 15 · 4 · 1) · 7 calls inferred · 12 write · 16 read · c4 behind.fns 29 (graft hops too)",
  "gate": "middleware gate:true get_auth_context · deps 3 · flags 0 · ASGI 3 (app scope)",
  "errors": "det.status 200 · statuses in test names: 400 · 409 · 422×2 · 401 never",
  "tests": "det.cases 26 api · case_files web 15 (count only) · test_journeys 27",
  "after": "access.commits · hook cache · next step GET /me · sinks 0 · IdempotencyKey r+w",
  "home": "slug auth · home_ev file/users/data — data leans settings 10 : 9 · models keep the claim",
  "motion": "commits.js 0 of 30 touch it · sim.data.js none in flight · neighbours moved",
  "runtime": "— no field: latency · rate · errors · callers are not in a static map",
}

# ── the alphabet — the circles on the operator's side; each letter drawn, never described ────────────────
def g(inner, w=120, h=44, fx=None, extra=""):
    return ('<svg viewBox="0 0 %d %d" preserveAspectRatio="xMinYMid meet" fill="none" stroke="currentColor" stroke-width="1.6" '
            'stroke-linecap="round" stroke-linejoin="round"%s%s>%s</svg>' % (w, h, (' data-fx="%s"' % fx) if fx else "", extra, inner))
ALPHA = [
  ("A", "how many", "repeated tiles up to ~5 you count without counting; above that, a bar length",
   g('<rect x="4" y="14" width="12" height="12" rx="2"/><rect x="20" y="14" width="12" height="12" rx="2"/><rect x="36" y="14" width="12" height="12" rx="2"/><rect x="52" y="14" width="12" height="12" rx="2"/>'
     '<rect x="76" y="16" width="40" height="8" rx="2" fill="currentColor" fill-opacity=".15"/><rect x="76" y="16" width="28" height="8" rx="2" fill="currentColor"/>')),
  ("B", "whose · where", "the ground colour is the entity; the slot is fixed, so the same fact sits in the same place",
   g('<rect x="4" y="8" width="52" height="28" rx="4" fill="#5a53a8" fill-opacity=".28" stroke="#5a53a8"/><rect x="62" y="8" width="52" height="28" rx="4" fill="#8e4585" fill-opacity=".28" stroke="#8e4585"/>'
     '<circle cx="30" cy="22" r="5" fill="currentColor"/><circle cx="88" cy="22" r="5" stroke="currentColor" stroke-dasharray="2 2"/>')),
  ("C", "which kind", "the silhouette — a bolt is a door, braces a shape, a cylinder a table",
   g('<polygon points="22 6 12 22 22 22 20 38 32 18 22 18" fill="currentColor" fill-opacity=".2"/>'
     '<path d="M56 9c-6 0-6 5-6 9s0 4-4 4 4 0 4 4 0 9 6 9"/><path d="M70 9c6 0 6 5 6 9s0 4 4 4-4 0-4 4 0 9-6 9"/>'
     '<ellipse cx="100" cy="12" rx="12" ry="4"/><path d="M88 12v20a12 4 0 0 0 24 0V12"/>')),
  ("D", "in what order", "left→right or top→bottom is the sequence a request follows — your native axis",
   g('<circle cx="14" cy="22" r="7"/><path d="M22 22h20m-5-5 5 5-5 5"/><circle cx="52" cy="22" r="7"/><path d="M60 22h20m-5-5 5 5-5 5"/><circle cx="90" cy="22" r="7" fill="currentColor" fill-opacity=".25"/>')),
  ("E", "how deep · how far", "rows down are depth; distance along a lane is hops",
   g('<rect x="6" y="4" width="60" height="6" rx="1" fill="currentColor"/><rect x="6" y="14" width="80" height="6" rx="1" fill="currentColor" fill-opacity=".7"/>'
     '<rect x="6" y="24" width="40" height="6" rx="1" fill="currentColor" fill-opacity=".5"/><rect x="6" y="34" width="16" height="6" rx="1" fill="currentColor" fill-opacity=".35"/>'
     '<path d="M104 6v32m-4-4 4 4 4-4"/>')),
  ("F", "did something happen", "a bead travelling is an event; its arrival is the consequence",
   g('<path d="M8 22h104"/><circle cx="20" cy="22" r="6" fill="currentColor" class="bd"/><circle cx="106" cy="22" r="9"/>'
     '<style>svg[data-fx="al-F"] .bd{animation:k_al_F 3s linear infinite}@keyframes k_al_F{0%{transform:translateX(0)}70%,100%{transform:translateX(86px)}}</style>', fx="al-F")),
  ("G", "how sure", "solid is measured · dashed is inferred · hatched was never measured · hollow is measured zero",
   g('<path d="M6 10h36" stroke-width="3"/><path d="M6 22h36" stroke-width="3" stroke-dasharray="6 4"/>'
     '<rect x="6" y="30" width="36" height="8" fill="url(#al-G-h)" stroke="none"/><defs><pattern id="al-G-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="6" fill="currentColor" fill-opacity=".6"/></pattern></defs>'
     '<rect x="60" y="8" width="26" height="26" rx="4"/><rect x="92" y="8" width="26" height="26" rx="4" fill="currentColor"/>')),
  ("H", "open · closed · full · empty", "a turnstile, a wall, a container and its level",
   g('<path d="M6 22h30"/><path d="M22 8v28"/><path d="M22 22l12-8M22 22l-12-8" stroke-width="2.4"/>'
     '<rect x="56" y="6" width="14" height="32" fill="currentColor" fill-opacity=".5"/>'
     '<rect x="84" y="8" width="30" height="30" rx="3"/><rect x="86" y="24" width="26" height="12" fill="currentColor" fill-opacity=".45" stroke="none"/>')),
  ("I", "pulse", "an event AT a place — a ring expands once where the write lands; no second ring means it did not happen twice",
   g('<circle cx="40" cy="22" r="6" fill="currentColor"/><circle cx="40" cy="22" r="6" class="rg"/>'
     '<style>svg[data-fx="al-I"] .rg{transform-origin:40px 22px;animation:k_al_I 2.4s ease-out infinite}@keyframes k_al_I{0%{transform:scale(1);opacity:.9}60%,100%{transform:scale(3);opacity:0}}</style>', fx="al-I")),
  ("J", "mutation", "the thing itself changes — fill, shape, colour — so a state change is seen on the piece, not read beside it",
   g('<rect x="14" y="10" width="24" height="24" rx="3" class="mu"/><path d="M50 22h18m-5-5 5 5-5 5"/><rect x="80" y="10" width="24" height="24" rx="12" fill="currentColor" fill-opacity=".6"/>'
     '<style>svg[data-fx="al-J"] .mu{transform-origin:26px 22px;animation:k_al_J 3s ease-in-out infinite}@keyframes k_al_J{0%,20%{transform:rotate(0) scale(1);opacity:1}60%,100%{transform:rotate(45deg) scale(.72);opacity:.45}}</style>', fx="al-J")),
  ("K", "speed  (mass)", "a heavy door — big payload in, many steps behind — is crossed slowly; a light one, fast",
   g('<path d="M8 14h104M8 32h104"/><circle cx="18" cy="14" r="8" fill="currentColor" fill-opacity=".85" class="hv"/><circle cx="18" cy="32" r="3.5" fill="currentColor" class="lt"/>'
     '<style>svg[data-fx="al-K"] .hv{animation:k_al_K1 4s linear infinite}svg[data-fx="al-K"] .lt{animation:k_al_K2 4s linear infinite}@keyframes k_al_K1{0%{transform:translateX(0)}100%{transform:translateX(86px)}}@keyframes k_al_K2{0%{transform:translateX(0)}45%,100%{transform:translateX(90px)}}</style>', fx="al-K")),
  ("L", "acceleration", "how much MORE leaves than arrived (payload), how much MORE runs than was called (process): a funnel in, a fan out",
   g('<path d="M6 16h24l16 6-16 6H6z" fill="currentColor" fill-opacity=".25"/><path d="M50 22h14"/><path d="M64 22l30-14M64 22l30 0M64 22l30 14" stroke-width="1.2"/><path d="M94 8h18M94 22h18M94 36h18" stroke-width="2.6"/>')),
  ("M", "waiting · expectation", "a hollow bead paused at the door with a dotted continuation — something is owed later; beads that keep coming are a stream",
   g('<path d="M8 22h50"/><circle cx="58" cy="22" r="6" class="wt"/><path d="M68 22h44" stroke-dasharray="2 5"/><path d="M58 8a8 8 0 0 1 8 8" stroke-width="1.2"/><path d="M58 12v4h3" stroke-width="1.2"/>'
     '<style>svg[data-fx="al-M"] .wt{transform-origin:58px 22px;animation:k_al_M 2s ease-in-out infinite}@keyframes k_al_M{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.45);opacity:.55}}</style>', fx="al-M")),
]
ALPHA_NAME = {a[0]: a[1] for a in ALPHA}
RULING = {   # the operator's reading of each letter (2026-09-10) — the page carries it beside the proposal
  "A": "crucial. Fields group into DIMENSIONS — data (tables r/w · schemas · foreign entities) · functions · tests (cases · files · journeys) · widening (screens in · direct calls) · flags/security. A counts inside each.",
  "B": "not yet graspable as an application — examples wanted (see Applied, below).",
  "C": "not a picture: the LABELLING RULE. Icons instead of words on every title and label; the word on hover.",
  "D": "agreed. Limit: one or two D pictures per element, always in the same place; a kind may spend them on different dimensions.",
  "E": "the DATA axis — stack structures, show growth and shrinking. D stays for the ephemeral: functions, states.",
  "F": "absorbed into D: a sequence with a bead is an animated D.",
  "G": "nice; intuition says ephemeral / in-transit / deleted-later data — examples wanted (see Applied: G is trust in the MAP; in-transit belongs to the motion layer).",
  "H": "no intuitive application seen yet — examples wanted (see Applied).",
  "I": "agreed, with the question answered: commit here is the DATABASE transaction commit (the write becomes permanent), never a git commit — git history is 'git touches'.",
  "J": "agreed 100%: mutation for states, for API verbs, for writes to a table.",
  "K": "agreed.",
  "L": "harder to grasp — examples wanted (see Applied: L is the SHAPE between two counts in sequence).",
  "M": "agreed.",
}

# ── which of the 55 endpoint fields each letter can carry (judgement; the chip's state is the bench's, from FACTS) ──
FIELDS_BY_LETTER = {
  "A": ["access.ops[]", "det.payload {schema,n}", "nested schemas, one hop (derived)", "behind.fns", "det.cases[] {cid,corpus,name,state} (tests)",
        "det.case_files[] {corpus,name}", "det.test_journeys[] {cid,comp,corpus,entities} + test_journeys_more", "middleware[]", "flags", "bridges in (screens)",
        "handler chain (direct out-edges)", "schemas touched (derived)", "tables read (derived)", "tables written (derived)", "cross-entity data reach (derived)"],
  "B": ["slug", "home_ev (homing)", "entity-model homes", "cross-entity data reach (derived)", "det.file / det.flines", "x / y"],
  "C": ["kind", "label", "stream", "resp", "handler fn_node"],
  "D": ["journeys (curated workflows)", "middleware[]", "handler chain (transitive BFS)", "fe render chain behind the bridge", "commits (touched)"],
  "E": ["behind.depth", "nested schemas, one hop (derived)", "handler fn_node", "cross-entity data reach (derived)", "fe render chain behind the bridge", "behind.truncated"],
  "F": ["commits (touched)", "in-flight (sim)", "bridges in (screens)", "handler chain (direct out-edges)", "access.commits"],
  "G": ["handler chain (direct out-edges)", "det.case_files[] {corpus,name}", "app middleware (ASGI)", "l1 entity edges", "levels.pressure", "behind.truncated", "home_ev (homing)", "consumes"],
  "H": ["middleware[].gate (derived: gates)", "walls (flags via edges)", "flags", "access.commits", "stream", "det.usage {api,internal}"],
  "I": ["access.commits", "tables written (derived)", "access.sinks", "in-flight (sim)"],
  "J": ["tables written (derived)", "label", "serializes, one hop (derived)", "det.status"],
  "K": ["det.gsig", "behind.fns", "behind.depth", "det.payload {schema,n}", "det.sig {async,lines,returns}", "det.file / det.flines"],
  "L": ["det.payload {schema,n}", "det.gsig", "behind.fns", "handler chain (direct out-edges)", "access.sinks", "tables written (derived)"],
  "M": ["det.sig {async,lines,returns}", "stream", "access.sinks", "det.status", "bridges in (screens)", "journeys (curated workflows)", "det.usage {api,internal}"],
}
SHORT = {"access.ops[]": "tables r/w", "behind.names / names_more": "names behind", "det.doc": "docstring", "levels.schema_edges": "schema handler", "det.payload {schema,n}": "payload out", "nested schemas, one hop (derived)": "nested shapes", "behind.fns": "fns behind",
  "det.cases[] {cid,corpus,name,state} (tests)": "test cases", "det.case_files[] {corpus,name}": "case files", "det.test_journeys[] {cid,comp,corpus,entities} + test_journeys_more": "test journeys",
  "middleware[]": "dependencies", "flags": "flags", "bridges in (screens)": "screens in", "handler chain (direct out-edges)": "direct calls", "schemas touched (derived)": "schemas",
  "tables read (derived)": "tables read", "tables written (derived)": "tables written", "cross-entity data reach (derived)": "foreign entities", "slug": "entity", "home_ev (homing)": "homing votes",
  "entity-model homes": "model homes", "det.file / det.flines": "file · lines", "x / y": "slot", "kind": "kind", "label": "method + path", "stream": "stream", "resp": "response shape",
  "handler fn_node": "handler role · d2w", "journeys (curated workflows)": "story step", "handler chain (transitive BFS)": "chain layers", "fe render chain behind the bridge": "route→screen→hook",
  "commits (touched)": "git touches", "behind.depth": "depth", "behind.truncated": "walk cap", "in-flight (sim)": "in flight", "access.commits": "DB commit", "app middleware (ASGI)": "ASGI tie",
  "l1 entity edges": "entity edges", "levels.pressure": "pressure", "consumes": "consumes edge", "middleware[].gate (derived: gates)": "gate", "walls (flags via edges)": "walls",
  "det.usage {api,internal}": "internal callers", "access.sinks": "sinks", "serializes, one hop (derived)": "serializes", "det.status": "status", "det.gsig": "request body",
  "det.sig {async,lines,returns}": "async · lines · returns"}
FACT = {f["key"]: f for f in R["facts_fields"]}
FIELDS_BY_WELL = {
  "footprint": ["access.ops[]", "tables read (derived)", "tables written (derived)", "access.commits", "cross-entity data reach (derived)"],
  "dependents": ["bridges in (screens)", "fe render chain behind the bridge", "journeys (curated workflows)", "det.usage {api,internal}"],
  "response": ["resp", "det.payload {schema,n}", "nested schemas, one hop (derived)", "det.status", "stream", "serializes, one hop (derived)"],
  "request": ["det.gsig", "nested schemas, one hop (derived)", "consumes", "levels.schema_edges"],
  "chain": ["behind.fns", "behind.depth", "behind.names / names_more", "handler chain (direct out-edges)", "handler chain (transitive BFS)", "handler fn_node", "behind.truncated"],
  "gate": ["middleware[].gate (derived: gates)", "middleware[]", "flags", "walls (flags via edges)", "app middleware (ASGI)"],
  "errors": ["det.status", "det.cases[] {cid,corpus,name,state} (tests)", "det.doc"],
  "tests": ["det.cases[] {cid,corpus,name,state} (tests)", "det.case_files[] {corpus,name}", "det.test_journeys[] {cid,comp,corpus,entities} + test_journeys_more"],
  "after": ["access.commits", "bridges in (screens)", "journeys (curated workflows)", "access.sinks", "det.usage {api,internal}", "stream"],
  "home": ["slug", "home_ev (homing)", "entity-model homes", "l1 entity edges"],
  "motion": ["commits (touched)", "in-flight (sim)", "levels.pressure"],
  "runtime": [],
}
LETTER_USES = {}
for _k, _lts, _ in ROWS:
    for _l in _lts.split(): LETTER_USES.setdefault(_l, []).append(("#w-" + _k, wells[_k]["label"]))
for _l, _id, _nm in (("K", "#dv-speed", "Speed — mass"), ("L", "#dv-accel", "Acceleration"), ("M", "#dv-wait", "Expectation")):
    LETTER_USES.setdefault(_l, []).append((_id, _nm))
def meaning_chips(letter):
    uses = LETTER_USES.get(letter, [])
    if not uses: return '<div class="fl"><b>meanings</b><span class="ev absent">no row uses it yet — your call</span></div>'
    return '<div class="fl"><b>meanings</b>' + "".join('<a class="mn" href="%s">%s</a>' % (E(h), E(n)) for h, n in uses) + '</div>'

WHY = {
 # letters
 ("A","access.ops[]"):"13 tables to count, 11 of them written", ("A","det.payload {schema,n}"):"6 fields come back", ("A","nested schemas, one hop (derived)"):"5 sub-shapes hang under the response",
 ("A","behind.fns"):"29 functions under one call", ("A","det.cases[] {cid,corpus,name,state} (tests)"):"26 named cases", ("A","det.case_files[] {corpus,name}"):"15 web cases, counted not named",
 ("A","det.test_journeys[] {cid,comp,corpus,entities} + test_journeys_more"):"27 walks pass through", ("A","middleware[]"):"3 injected, 1 can refuse", ("A","flags"):"0 walls here; 3 doors have them",
 ("A","bridges in (screens)"):"1 screen fetches it", ("A","handler chain (direct out-edges)"):"3 first-hop calls", ("A","schemas touched (derived)"):"2 shapes it speaks",
 ("A","tables read (derived)"):"13 read", ("A","tables written (derived)"):"11 written", ("A","cross-entity data reach (derived)"):"4 other houses touched",
 ("B","slug"):"the claim home: auth", ("B","home_ev (homing)"):"file · users · data — who says whose", ("B","entity-model homes"):"where other entity models would file it",
 ("B","cross-entity data reach (derived)"):"which houses its tables belong to", ("B","det.file / det.flines"):"where it lives on disk", ("B","x / y"):"the fixed position a fact sits in",
 ("C","kind"):"a door — drawn as the bolt", ("C","label"):"POST: the verb is the badge", ("C","stream"):"one-shot or a stream — the delivery glyph", ("C","resp"):"a schema — drawn as braces", ("C","handler fn_node"):"caller · accessor · pure · gate",
 ("D","journeys (curated workflows)"):"step 2 of 4 in Initial setup", ("D","middleware[]"):"the order a request meets them", ("D","handler chain (transitive BFS)"):"layer 1, 2, 3… of the call tree",
 ("D","fe render chain behind the bridge"):"the path a user walks to the door", ("D","commits (touched)"):"the timeline of touches",
 ("E","behind.depth"):"5 layers of calls", ("E","nested schemas, one hop (derived)"):"one hop down inside the shape", ("E","handler fn_node"):"d2w 1 — one hop to the first write",
 ("E","cross-entity data reach (derived)"):"how far outside its house", ("E","fe render chain behind the bridge"):"4 rungs from the route", ("E","behind.truncated"):"the depth the walk was cut at — never here",
 ("F","commits (touched)"):"a touch landed — none in the window", ("F","in-flight (sim)"):"a change happening now — none", ("F","bridges in (screens)"):"a fetch arrives from a screen",
 ("F","handler chain (direct out-edges)"):"a call leaves the handler", ("F","access.commits"):"the write landed",
 ("G","handler chain (direct out-edges)"):"extracted vs inferred, per hop", ("G","det.case_files[] {corpus,name}"):"a count, no names — half-measured", ("G","app middleware (ASGI)"):"never tied to a door — hatched",
 ("G","l1 entity edges"):"the door's share is not carried", ("G","levels.pressure"):"reserved, empty for every node", ("G","behind.truncated"):"the walk could have been clipped",
 ("G","home_ev (homing)"):"the witnesses disagree 10 : 9", ("G","consumes"):"drawn 1 of 81 against a stat of 70",
 ("H","middleware[].gate (derived: gates)"):"the turnstile — one dependency can refuse", ("H","walls (flags via edges)"):"a kill-switch in front — none here", ("H","flags"):"the switch on the wall",
 ("H","access.commits"):"the latch — closed means the write is final", ("H","stream"):"an open channel vs a closed reply", ("H","det.usage {api,internal}"):"a door used from inside — none",
 ("I","access.commits"):"one pulse: the write lands", ("I","tables written (derived)"):"where the pulse happens — 11 places", ("I","access.sinks"):"a push to a queue would pulse — none", ("I","in-flight (sim)"):"a change landing now",
 ("J","tables written (derived)"):"rows change", ("J","label"):"POST · PATCH · DELETE mutate; GET does not", ("J","serializes, one hop (derived)"):"a shape that is a table's projection", ("J","det.status"):"201 created · 204 no content — the change kind",
 ("K","det.gsig"):"7 fields arrive — mass in", ("K","behind.fns"):"29 functions — mass behind", ("K","behind.depth"):"5 deep — the slowest axis", ("K","det.payload {schema,n}"):"6 fields leave",
 ("K","det.sig {async,lines,returns}"):"21 handler lines", ("K","det.file / det.flines"):"a 254-line file around it",
 ("L","det.payload {schema,n}"):"6 out…", ("L","det.gsig"):"…for 7 in: −1, it condenses", ("L","behind.fns"):"29 run…", ("L","handler chain (direct out-edges)"):"…for 3 called: ×10 process",
 ("L","access.sinks"):"process pushed outside — none", ("L","tables written (derived)"):"11 writes from one call",
 ("M","det.sig {async,lines,returns}"):"awaited — 80 of 81, says nothing", ("M","stream"):"the wait never closes — 1 of 81", ("M","access.sinks"):"a queue: work continues elsewhere",
 ("M","det.status"):"202 would mean work continues after the reply", ("M","bridges in (screens)"):"the hook waits, then caches", ("M","journeys (curated workflows)"):"the next step waits on this one",
 ("M","det.usage {api,internal}"):"a caller inside would wait too",
 # wells
 ("footprint","access.ops[]"):"every table the chain touches", ("footprint","tables read (derived)"):"what it depends on", ("footprint","tables written (derived)"):"what it changes",
 ("footprint","access.commits"):"does the write land", ("footprint","cross-entity data reach (derived)"):"how far it spills",
 ("dependents","bridges in (screens)"):"who fetches it", ("dependents","fe render chain behind the bridge"):"how a user reaches it", ("dependents","journeys (curated workflows)"):"which story stalls, at which step",
 ("dependents","det.usage {api,internal}"):"anything inside calling it",
 ("response","resp"):"the named shape back", ("response","det.payload {schema,n}"):"how many fields", ("response","nested schemas, one hop (derived)"):"how deep", ("response","det.status"):"the declared success",
 ("response","stream"):"all at once or a stream", ("response","serializes, one hop (derived)"):"is it a table's projection",
 ("request","det.gsig"):"the body type, read off the signature", ("request","nested schemas, one hop (derived)"):"how much to assemble", ("request","consumes"):"the explicit edge — drawn 1 of 81",
 ("request","levels.schema_edges"):"which function reads it",
 ("chain","behind.fns"):"how much runs", ("chain","behind.depth"):"how deep", ("chain","behind.names / names_more"):"a sample of what", ("chain","handler chain (direct out-edges)"):"the first hop and its trust",
 ("chain","handler chain (transitive BFS)"):"where reads and writes happen", ("chain","handler fn_node"):"the handler's own card", ("chain","behind.truncated"):"was the walk clipped",
 ("gate","middleware[].gate (derived: gates)"):"who can refuse", ("gate","middleware[]"):"everything injected", ("gate","flags"):"a switch that walls it", ("gate","walls (flags via edges)"):"the wall edge",
 ("gate","app middleware (ASGI)"):"rate-limit · idempotency at app scope",
 ("errors","det.status"):"the success code only", ("errors","det.cases[] {cid,corpus,name,state} (tests)"):"the error statuses live in test names", ("errors","det.doc"):"the only prose on errors — absent here",
 ("tests","det.cases[] {cid,corpus,name,state} (tests)"):"26 named api cases", ("tests","det.case_files[] {corpus,name}"):"15 web cases, unnamed", ("tests","det.test_journeys[] {cid,comp,corpus,entities} + test_journeys_more"):"27 walks through it",
 ("after","access.commits"):"the write lands", ("after","bridges in (screens)"):"the hook caches the reply", ("after","journeys (curated workflows)"):"the next step: GET /me", ("after","access.sinks"):"a queue — none",
 ("after","det.usage {api,internal}"):"a caller inside — none", ("after","stream"):"keeps delivering — no",
 ("home","slug"):"the claim", ("home","home_ev (homing)"):"do the witnesses agree", ("home","entity-model homes"):"where other models file it", ("home","l1 entity edges"):"the coupling around it",
 ("motion","commits (touched)"):"touched recently? 0 of 30", ("motion","in-flight (sim)"):"a change now? none", ("motion","levels.pressure"):"reserved, empty",
 # derivatives
 ("dv-speed","det.gsig"):"mass in: 7", ("dv-speed","behind.fns"):"mass behind: 29", ("dv-speed","behind.depth"):"5 — the slow axis", ("dv-speed","det.payload {schema,n}"):"6 leave", ("dv-speed","det.sig {async,lines,returns}"):"21 lines of handler",
 ("dv-accel","det.payload {schema,n}"):"6 out", ("dv-accel","det.gsig"):"7 in → −1", ("dv-accel","behind.fns"):"29 run", ("dv-accel","handler chain (direct out-edges)"):"3 called → ×10",
 ("dv-accel","access.sinks"):"pushed outside — none", ("dv-accel","tables written (derived)"):"11 writes from one call",
 ("dv-wait","det.sig {async,lines,returns}"):"awaited — uniform, says nothing", ("dv-wait","stream"):"never closes — no", ("dv-wait","access.sinks"):"continues elsewhere — none", ("dv-wait","det.status"):"202 would continue; 200 here",
 ("dv-wait","bridges in (screens)"):"the hook waits, then caches", ("dv-wait","journeys (curated workflows)"):"GET /me waits on this", ("dv-wait","det.usage {api,internal}"):"none wait inside",
}
def fact_list(keys, ctx, label="fields"):
    """the fields a card carries, each with its WHY — visible, never hover-only (operator: 'mention the fields and why')"""
    items = []
    for k in keys:
        f = FACT.get(k)
        if not f: continue
        items.append('<li><span class="ev %s" title="%s — %s (feed-wide %s)">%s</span><span class="why">%s</span></li>'
                     % (f["state"], E(k), E(f["plain"]), E(f["feedwide"]), E(SHORT.get(k, k)), E(WHY.get((ctx, k), ""))))
    if not items: items.append('<li><span class="ev absent">no field</span><span class="why">the feed cannot say — a static map has no runtime</span></li>')
    return '<div class="fw"><b>%s · why</b><ul>%s</ul></div>' % (label, "".join(items))

def fact_chips(keys, label="fields"):
    out = []
    for k in keys:
        f = FACT.get(k)
        if not f: continue
        out.append('<span class="ev %s" title="%s — %s (feed-wide %s)">%s</span>' % (f["state"], E(k), E(f["plain"]), E(f["feedwide"]), E(SHORT.get(k, k))))
    if not out: out.append('<span class="ev absent">no field — the feed cannot say</span>')
    return '<div class="fl"><b>%s</b>' % label + "".join(out) + '</div>'
def letter_chips(lts):
    return "".join('<a class="lt" href="#al-%s" title="%s">%s</a><span class="ltn">%s</span>' % (l, E(ALPHA_NAME[l]), l, E(ALPHA_NAME[l])) for l in lts.split())
def field_chips(letter):
    out = []
    for k in FIELDS_BY_LETTER[letter]:
        f = FACT.get(k)
        if not f: continue
        out.append('<span class="ev %s" title="%s — %s (feed-wide %s)">%s</span>' % (f["state"], E(k), E(f["plain"]), E(f["feedwide"]), E(SHORT.get(k, k))))
    return fact_list(FIELDS_BY_LETTER[letter], letter)

def mark(id_, hint="I'd want…"):
    return ('<div class="mk" data-id="%s"><button type="button" data-m="got" title="I get it">✓</button>'
            '<button type="button" data-m="not" title="not this">✗</button><button type="button" data-m="want" title="I would want…">→</button>'
            '<input type="text" placeholder="%s" aria-label="what you would want for %s"></div>' % (E(id_), E(hint), E(id_)))

def letters(s):
    return "".join('<a class="lt" href="#al-%s" title="%s">%s</a>' % (l, E(ALPHA_NAME[l]), l) for l in s.split())

def sec(n, icon, title, count, body):
    return ('<section class="sec panel" data-sec="%d"><div class="sec-head"><h2>%s%s</h2><span class="n">%s</span></div>%s</section>'
            % (n, ico(icon), E(title), E(count), body))

# ── 1 · the door ───────────────────────────────────────────────────────────────────────────────────────
door = ('<p class="ctx"><b>POST /setup/complete</b> · entity <b>auth</b> — the first-run setup. One screen (SetupScreen → <code>useCompleteSetup</code>) '
        'sends <b>7 fields</b>; the handler (21 lines, async) hands the body to <code>complete_setup</code>, which fans out to <b>29 functions, 5 deep</b>, '
        'reads <b>13 tables</b> and writes <b>11</b> of them across <b>5 entities</b>, then commits. <b>MeResponse</b> (6 fields, 5 nested) comes back and the hook caches it. '
        '<b>26 api cases</b> prove it; it is step 2 of 4 in <i>Initial setup</i>. One dependency can refuse it (<code>get_auth_context</code>); no flag walls it.</p>'
        '<div class="doors">'
        '<div class="d"><b>the bench</b><span>POST /setup/complete</span><i>in 7 · behind 29 / 5 · tables 13 (11 w) · out 6 · commit · cases 26</i></div>'
        '<div class="d"><b>contrast — a stream</b><span>GET /recipe-creation/gustify/stream</span><i>in 0 · behind 48 / 6 · tables 10 (3 w) · out: events · walled by a flag · calls Gemini</i></div>'
        '<div class="d"><b>contrast — a read</b><span>GET /recipes/{recipe_id}</span><i>in 0 (path) · behind 14 / 3 · tables 12 (0 w) · out 39 · no commit · cached</i></div></div>')

# ── 2 · the alphabet ───────────────────────────────────────────────────────────────────────────────────
alpha = '<div class="alpha">' + "".join(
    '<div class="al%s" id="al-%s"><div class="al-h"><b>%s</b><span>%s</span></div><div class="gl">%s</div><p>%s</p><p class="rule"><b>your reading</b> %s</p>%s%s</div>'
    % (" absorbed" if l == "F" else (" isrule" if l == "C" else ""), l, l, E(name), svg, E(meaning), E(RULING[l]), field_chips(l) + meaning_chips(l), mark("al-" + l, "not mine / missing…")) for l, name, meaning, svg in ALPHA) + '</div>'

# ── 3 · the bridge rows ────────────────────────────────────────────────────────────────────────────────
def row(i, key, lts, grasp):
    w = wells[key]
    return ('<article class="row" id="w-' + E(key) + '"><div class="rk"><b>' + str(i) + '</b><span>' + E(w["group"]) + '</span></div>'
            + '<div class="l"><h3>' + E(w["label"]) + '</h3><p class="q">' + E(w["question"]) + '</p>' + fact_list(FIELDS_BY_WELL[key], key)
            + '<p class="f"><b>on the bench</b> ' + E(SHORT_FIELDS[key]) + '</p><p class="m"><b>meaning → </b>' + letter_chips(lts) + '</p><p class="g">' + E(grasp) + '</p>' + mark("w-" + key) + '</div>'
            + '<div class="r">' + sk_block(SIMPLE[key](), "s-" + key) + SS.legend_html(key) + '</div></article>')
bridge = '<div class="rows">' + "".join(row(i + 1, k, lts, gr) for i, (k, lts, gr) in enumerate(ROWS)) + '</div>'

# ── 4 · the derivatives — the operator's additions, with the feed's numbers ─────────────────────────────
speed_svg = g(
  '<text x="4" y="10" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">POST /setup/complete · mass 7 in + 29 behind</text>'
  '<path d="M8 18h150"/><circle cx="16" cy="18" r="7" fill="currentColor" fill-opacity=".85" class="b1"/>'
  '<text x="4" y="34" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">GET /recipes/{id} · mass 0 in + 14 behind</text>'
  '<path d="M8 42h150"/><circle cx="16" cy="42" r="3.5" fill="currentColor" class="b2"/>'
  '<text x="4" y="58" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">GET …/stream · mass 0 in + 48 behind</text>'
  '<path d="M8 66h150"/><circle cx="16" cy="66" r="6" fill="currentColor" fill-opacity=".85" class="b3"/>'
  '<style>svg[data-fx="dv-speed"] .b1{animation:k_dv_s1 5s linear infinite}svg[data-fx="dv-speed"] .b2{animation:k_dv_s2 5s linear infinite}svg[data-fx="dv-speed"] .b3{animation:k_dv_s3 5s linear infinite}'
  '@keyframes k_dv_s1{0%{transform:translateX(0)}80%,100%{transform:translateX(136px)}}@keyframes k_dv_s2{0%{transform:translateX(0)}35%,100%{transform:translateX(136px)}}@keyframes k_dv_s3{0%{transform:translateX(0)}100%{transform:translateX(136px)}}</style>',
  w=170, h=72, fx="dv-speed")
accel_svg = g(
  '<text x="4" y="9" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">payload: in 7 → out 6 (−1)   ·   process: 3 called → 29 run (×10)</text>'
  '<path d="M6 20h28l10 2-10 2H6z" fill="currentColor" fill-opacity=".3"/><path d="M50 22h10"/>'
  '<path d="M60 22l40-12M60 22l40 0M60 22l40 12" stroke-width="1.1"/>'
  '<path d="M100 10h6M100 22h6M100 34h6" stroke-width="2.4"/>'
  '<g stroke-width="1" opacity=".55"><path d="M106 10l20-6M106 10l20 0M106 10l20 6M106 22l20-6M106 22l20 0M106 22l20 6M106 34l20-6M106 34l20 0M106 34l20 6"/></g>'
  '<path d="M126 4h4M126 10h4M126 16h4M126 22h4M126 28h4M126 34h4M126 40h4" stroke-width="2"/>'
  '<text x="4" y="58" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">GET /recipes/{id}: in 0 → out 39 (+39): the door amplifies</text>'
  '<path d="M6 66h6l40 4-40 4H6z" fill="currentColor" fill-opacity=".3"/><path d="M54 66h104v8H54z" fill="currentColor" fill-opacity=".3" stroke-dasharray="2 2"/>',
  w=170, h=80)
wait_svg = g(
  '<text x="4" y="9" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">bench: the hook waits for MeResponse, then the story steps to GET /me</text>'
  '<path d="M8 22h60"/><circle cx="68" cy="22" r="6" class="wt"/><path d="M78 22h40" stroke-dasharray="2 5"/><circle cx="126" cy="22" r="7"/><text x="140" y="25" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">GET /me</text>'
  '<text x="4" y="45" font-size="8.5" fill="currentColor" stroke="none" font-family="ui-monospace,monospace">stream: beads keep coming — the wait never closes</text>'
  '<path d="M8 58h150"/><circle cx="30" cy="58" r="4" fill="currentColor" class="s1"/><circle cx="30" cy="58" r="4" fill="currentColor" class="s2"/><circle cx="30" cy="58" r="4" fill="currentColor" class="s3"/>'
  '<style>svg[data-fx="dv-wait"] .wt{transform-origin:68px 22px;animation:k_dv_w 2s ease-in-out infinite}svg[data-fx="dv-wait"] .s1{animation:k_dv_st 3s linear infinite}svg[data-fx="dv-wait"] .s2{animation:k_dv_st 3s linear 1s infinite}svg[data-fx="dv-wait"] .s3{animation:k_dv_st 3s linear 2s infinite}'
  '@keyframes k_dv_w{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.45);opacity:.55}}@keyframes k_dv_st{0%{transform:translateX(0);opacity:1}100%{transform:translateX(120px);opacity:.2}}</style>',
  w=190, h=68, fx="dv-wait")
DV_FIELDS = {"dv-speed": ["det.gsig", "behind.fns", "behind.depth", "det.payload {schema,n}", "det.sig {async,lines,returns}"],
             "dv-accel": ["det.payload {schema,n}", "det.gsig", "behind.fns", "handler chain (direct out-edges)", "access.sinks", "tables written (derived)"],
             "dv-wait": ["det.sig {async,lines,returns}", "stream", "access.sinks", "det.status", "bridges in (screens)", "journeys (curated workflows)", "det.usage {api,internal}"]}
def dcard(id_, letter, title, q, numbers, svg, grasp):
    return ('<article class="dv" id="' + E(id_) + '"><div class="dv-h">' + letter_chips(letter) + '<h3>' + E(title) + '</h3></div><p class="q">' + E(q) + '</p>'
            + fact_list(DV_FIELDS[id_], id_) + '<p class="f"><b>on the bench</b> ' + E(numbers) + '</p>'
            + '<div class="sk" data-mode="once"><template>' + svg + '</template><div class="stage"></div><button class="replay" type="button" data-fx-replay="' + E(id_) + '" title="replay">' + ico("replay") + '</button></div>'
            + '<p class="g">' + E(grasp) + '</p>' + mark(id_) + '</article>')
derivs = '<div class="dvs">' + dcard("dv-speed", "K", "Speed — mass",
    "How heavy is this door: what arrives, and how much sits behind it?",
    "mass in = request cols 7 (schema det.cols) + behind.fns 29 at depth 5; the read door carries 0 in + 14 behind; the stream 0 in + 48 behind. Speed is the inverse: heavy crosses slowly.",
    speed_svg, "the bench bead is the slow one; the read door is crossed in a third of the time") + \
  dcard("dv-accel", "L", "Acceleration — the second derivative",
    "Does this door put out more than it took in, and does it trigger more process than it was asked?",
    "Δpayload = out − in: MeResponse 6 − SetupCompleteRequest 7 = −1 (it condenses); RecipeDetailResponse 39 − 0 = +39 (it amplifies). Δprocess = 29 run for 3 direct calls (×10 beyond the first hop); dispatches 0 · sinks 0 (1/81 each feed-wide).",
    accel_svg, "a narrow funnel in, a wide fan out: this door is a delegate — the work is not in the handler") + \
  dcard("dv-wait", "M", "Expectation — what waits on it",
    "Once it answers, who was waiting, and does the wait ever close?",
    "async true (80/81 — separates nothing) · stream 1/81 · queue dispatch 1/81 · 202 accepted 1/81 · the fetching hook caches the reply (50/81 doors are cached) · next curated step GET /me. The bench: one wait, closed by MeResponse.",
    wait_svg, "one hollow bead waits, one reply closes it; on the stream the beads never stop") + '</div>'

# ── 5 · the dimensions a door touches — a fixed strip ──────────────────────────────────────────────────
DIMS = [  # (label, bench state, feed-wide of 81, evidence, FACT key)
  ("database", "lit", "79", "access.ops — 13 tables", "access.ops[]"), ("DB commit", "lit", "51", "access.commits true — the transaction lands", "access.commits"),
  ("auth gate", "lit", "79", "middleware gate:true", "middleware[].gate (derived: gates)"), ("flag wall", "grey", "3", "flags · walls: 0 here", "walls (flags via edges)"),
  ("queue / task", "grey", "1", "dispatches: 0 here", "handler chain (direct out-edges)"), ("stream", "grey", "1", "stream: false", "stream"),
  ("async", "lit", "80", "det.sig.async", "det.sig {async,lines,returns}"), ("client cache", "lit", "50", "the fetching hook caches", "bridges in (screens)"),
  ("LLM · provider", "grey", "3", "no provider in the chain (the stream: Gemini)", "behind.names / names_more"), ("other entity's table", "lit", "8", "8 tables in 4 foreign entities", "cross-entity data reach (derived)"),
  ("http · file sink", "grey", "1", "access.sinks: none", "access.sinks"), ("rate-limit · idempotency", "hatched", "0 / 81 tied", "ASGI at app scope; per-door tie never measured", "app middleware (ASGI)"),
  ("memory · parallelism", "hatched", "—", "never measured", None),
]
dims = ('<p class="ctx">The same strip for every kind, the same cells in the same places. A door lights the cells it touches; a cell no door can touch reads BLANK, a cell nobody measured reads HATCHED. '
        'A function would light database · commit · async; a component cache · stream; a table only itself. Bench below; the count is how many of the 81 doors light that cell.</p>'
        '<div class="dims">' + "".join(
        '<div class="dm %s" title="%s"><i></i><b>%s</b><span>%s</span><em>%s</em></div>' % (st, E(evd), E(lab), E(n), E(SHORT.get(fk, fk) if fk else "— no field")) for lab, st, n, evd, fk in DIMS) + '</div>'
        + '<p class="ctx muted" style="font-size:var(--fs-sm)">letters the strip spends: ' + letter_chips("A H G") + '— a count of lit cells · lit / grey · hatched.</p>'
        + mark("dims", "a dimension that matters to you and is missing…"))

# ── 6 · the ASSEMBLY — the operator's dimensions become the PARTS of the element, each a fixed slot ──────────
PARTS = [
  ("p-data", "DATA — what it touches", "footprint", "A B J I",
   ["access.ops[]", "tables read (derived)", "tables written (derived)", "cross-entity data reach (derived)", "access.commits"],
   "tiles on the OWNER's ground (B), read = hollow · written = filled (J), the DB commit = one pulse at the end (I); A counts them",
   "13 tiles · 11 filled · 4 foreign grounds · 1 pulse"),
  ("p-schemas", "SCHEMAS — what shapes it speaks", "response", "A E L",
   ["det.gsig", "nested schemas, one hop (derived)", "resp", "det.payload {schema,n}", "serializes, one hop (derived)"],
   "two STACKS side by side (E = nesting depth): the body in, the response out; the shape between them is L — narrowing = it condenses, widening = it manufactures data",
   "in 7 (6 structured) → out 6 (5 nested): a narrowing funnel"),
  ("p-fns", "FUNCTIONS — what runs", "chain", "D A G K",
   ["behind.fns", "behind.depth", "handler chain (direct out-edges)", "behind.names / names_more", "handler fn_node"],
   "the ONE animated D of the element: a bead descends the call layers (F absorbed); row length = count (A); dashed cell = inferred hop (G); the bead's speed = mass (K)",
   "3 · 16 · 5 · 1 by layer · 8 of 25 hops dashed · a heavy, slow bead"),
  ("p-tests", "TESTS — what proves it", "tests", "A G",
   ["det.cases[] {cid,corpus,name,state} (tests)", "det.case_files[] {corpus,name}", "det.test_journeys[] {cid,comp,corpus,entities} + test_journeys_more"],
   "three fixed lanes — cases · case files · journeys — cells per item (A); a lane the feed only counts is hatched (G)",
   "26 named · 15 hatched · 27 walks"),
  ("p-reach", "WIDENING — who reaches it, what it reaches", "dependents", "D A",
   ["bridges in (screens)", "fe render chain behind the bridge", "journeys (curated workflows)", "handler chain (direct out-edges)", "det.usage {api,internal}"],
   "the element's SECOND D, static: the ladder in (route → screen → hook → door) and the story step; the fan out is a count (A)",
   "1 screen · 4 rungs · step 2 of 4 · 3 direct calls · 0 inside"),
  ("p-security", "FLAGS · SECURITY — who can stop it", "gate", "H A G",
   ["middleware[].gate (derived: gates)", "middleware[]", "flags", "walls (flags via edges)", "app middleware (ASGI)"],
   "a lane with the refusers in the order met: a turnstile = a dependency that can refuse (H), a wall with a switch = a flag (H), pegs = the rest (A); the ASGI tie hatched (G)",
   "1 turnstile · 0 walls · 2 pegs · 3 ASGI cells hatched"),
]
PART_SKETCH = {"footprint": "footprint", "response": "schemas", "chain": "chain", "tests": "tests", "dependents": "dependents", "gate": "gate"}
def part_card(pid, title, sketch_well, lts, keys, component, bench):
    sname = PART_SKETCH[sketch_well]; sk = SIMPLE[sname]().replace("s-" + sname, "p-" + sname)
    return ('<article class="part" id="' + E(pid) + '"><h3>' + E(title) + '</h3>'
            + '<div class="plt">' + letter_chips(lts) + '</div>'
            + fact_list(keys, sketch_well) + '<p class="comp"><b>the component</b> ' + E(component) + '</p>'
            + sk_block(sk, "p-" + sname) + SS.legend_html(sname)
            + '<p class="f"><b>on the bench</b> ' + E(bench) + '</p>' + mark(pid, "this part should show…") + '</article>')
assembly = ('<p class="ctx">Your grouping of A is the element\'s anatomy: six parts, each a FIXED SLOT, each spending a few letters, A counting inside every one. '
            'Two rules you set ride on top: <b>C</b> — every part\'s title is an icon, the word on hover; <b>D</b> — at most two sequences per element, in the same place on every kind: '
            'the animated one (FUNCTIONS, a bead) and the static one (WIDENING, a ladder). The derivatives are the <b>motion layer</b> over the parts: one bead, speed = K, the funnel = L, the wait = M.</p>'
            '<div class="parts">' + "".join(part_card(*pc) for pc in PARTS) + '</div>')

# ── 7 · APPLIED — the four letters the operator could not yet see: B · G · H · L, on the bench ────────────
APPLIED = [
  ("B", "whose · where", "ap-B",
   "The DATA part draws each table on the ground of the entity that owns it, in that entity\'s colour — auth violet, settings plum, allergen green, pantry amber, legal-consent teal. "
   "Eight of thirteen tiles sit on grounds that are not the door\'s own: you see the spill as colour before you count it. \'Where\' is the other half: the SECURITY part is always top-left, DATA in the middle, TESTS on the right — you know where to look before you look.",
   "#p-data", "the grounds in the DATA sketch — eight tiles off the home ground"),
  ("G", "how sure", "ap-G",
   "G is the map\'s CERTAINTY about a fact, not the data\'s lifetime. Three states, three textures, everywhere: DASHED = the map inferred it (8 of the 25 hops in FUNCTIONS are dashed cells); "
   "HATCHED = nobody measured it (the web tests lane: 15 cases counted, none named; the ASGI cells in SECURITY); HOLLOW = measured and zero (the wall socket in SECURITY, no flag). "
   "Your intuition — data in transit, written later, deleted later — is real but belongs to the motion layer: in transit = a bead (D), landed = a pulse (I), deleted = a tile that empties (J).",
   "#p-fns", "the dashed cells in FUNCTIONS · the hatched lane in TESTS · the hollow socket in SECURITY"),
  ("H", "open · closed · full · empty", "ap-H",
   "H is a STATE you read from a shape\'s posture. SECURITY: the turnstile\'s arms are closed until the gate passes — a request stops there; the stream door\'s wall shows its switch OFF: closed, no request passes. "
   "DATA: the DB commit is a latch — closed means the eleven writes are permanent; open (no commit) means they were staged and could vanish. SCHEMAS: the response crate is full when every field is present (6 of 6), a cell left empty is a field the shape declares but the door never fills. "
   "M is H over time: an open wait that closes when the reply lands.",
   "#p-security", "the arms on the turnstile · the latch under the DATA tiles"),
  ("L", "acceleration", "ap-L",
   "L is never its own picture: it is the SHAPE between two counts placed in sequence (two A\'s in D order). SCHEMAS: 7 fields in, 6 out — a funnel that narrows slightly, the door condenses; "
   "GET /recipes/{id}: 0 in, 39 out — a funnel that widens ten-fold, the door manufactures data. FUNCTIONS: 3 direct calls, 29 run — the fan widens ×10 below the first row, the handler delegates. "
   "Read it as: narrow → wide = this element makes more (data or work) than it received; wide → narrow = it reduces.",
   "#dv-accel", "the funnel in SCHEMAS · the fan under the first row in FUNCTIONS"),
]
applied = '<div class="apps">' + "".join(
  '<article class="ap" id="%s"><div class="ap-h">%s<h3>%s applied</h3></div><p>%s</p><p class="f"><b>see it</b> <a href="%s">%s</a></p>%s</article>'
  % (E(aid), letter_chips(l), E(name), t, E(href), E(where), mark(aid, "what I get / would want…")) for l, name, aid, t, href, where in APPLIED) + '</div>'

# ── 8 · your marks ─────────────────────────────────────────────────────────────────────────────────────
marks = ('<p class="ctx">Every ✓ ✗ → above is kept on this page (shared store) — or in this browser when the store is not granted — and read back by Claude. '
         'Nothing to retype.</p><div class="mks-bar"><span id="mk-status" class="muted">loading marks…</span><button type="button" id="mk-copy" class="btn">copy marks as JSON</button></div>'
         '<pre id="mk-out" class="mk-out">—</pre>')

CSS = """
<style>
  .artifact-page{ max-width: calc(100% - clamp(16px,4vw,56px) - clamp(40px,6vw,120px)); }
  h1{ max-width:34ch; text-wrap:balance; }
  .lede{ max-width:76ch; } .lede p{ margin:0 0 .6em; }
  .ctx{ max-width:86ch; margin:0 0 .7em; } .ctx code{ font-size:.92em; background:color-mix(in srgb,currentColor 8%,transparent); padding:.05em .35em; border-radius:4px; }
  .muted{ color:var(--muted); }
  .doors{ display:grid; grid-template-columns:repeat(auto-fit,minmax(17rem,1fr)); gap:.6em; }
  .doors .d{ display:grid; gap:.15em; padding:.5em .7em; border-radius:8px; border:1px solid var(--rule); background:var(--raised); }
  .doors .d b{ font-size:var(--fs-min); letter-spacing:.08em; text-transform:uppercase; color:var(--accent); }
  .doors .d span{ font-weight:700; } .doors .d i{ font-style:normal; font-size:var(--fs-xs); color:var(--muted); }

  /* the alphabet */
  .alpha{ display:grid; grid-template-columns:repeat(auto-fill,minmax(19rem,1fr)); gap:.6em; }
  .al{ display:grid; gap:.35em; padding:.55em .7em .6em; border-radius:8px; border:1px solid var(--rule); background:var(--card); }
  .al-h{ display:flex; align-items:baseline; gap:.5em; } .al-h b{ font-size:1.3em; color:var(--accent); } .al-h span{ font-weight:700; }
  .al .gl{ height:3.4em; } .al .gl svg{ height:100%; width:auto; max-width:100%; display:block; }
  .al p{ margin:0; font-size:var(--fs-sm); color:var(--ink-soft); }
  .al .rule{ padding:.35em .55em; border-radius:6px; background:var(--accent-soft); color:var(--ink); border-left:3px solid var(--accent); }
  .al .rule b{ color:var(--accent); font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; margin-right:.3em; }
  .al.absorbed .gl, .al.absorbed > p:first-of-type{ opacity:.45; } .al.absorbed .al-h span::after{ content:" — absorbed into D"; color:var(--muted); font-weight:400; }
  .al.isrule .al-h span::after{ content:" — a rule, not a picture"; color:var(--muted); font-weight:400; }
  .fl{ display:flex; flex-wrap:wrap; gap:.25em; align-items:center; margin-top:.15em; }
  .fl b{ font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin-right:.15em; }
  .fw{ margin-top:.2em; } .fw > b{ display:block; font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin-bottom:.15em; }
  .fw ul{ margin:0; padding:0; list-style:none; display:grid; gap:.15em; }
  .fw li{ display:grid; grid-template-columns:auto 1fr; gap:.45em; align-items:baseline; font-size:var(--fs-sm); }
  .fw .why{ color:var(--ink-soft); }
  .fl .mn{ font-size:var(--fs-min); padding:.08em .5em; border-radius:999px; text-decoration:none; color:var(--accent); background:var(--accent-soft); border:1px solid color-mix(in srgb,var(--accent) 30%,transparent); }
  .ltn{ font-size:var(--fs-sm); color:var(--ink-soft); margin-right:.7em; }
  .dv-h .ltn{ display:none; }
  .dm em{ font-style:normal; font-size:var(--fs-min); color:var(--accent); background:var(--accent-soft); padding:.05em .4em; border-radius:999px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ev{ display:inline-flex; align-items:center; font-size:var(--fs-min); padding:.08em .45em; border-radius:999px; border:1px solid color-mix(in srgb,currentColor 30%,transparent); cursor:help; }
  .ev.live{ color:#2e9e6b; } .ev.empty{ color:var(--muted); } .ev.unmeasured{ color:#c8871b; border-style:dashed; } .ev.absent{ color:color-mix(in srgb,currentColor 55%,transparent); border-style:dotted; }

  /* the bridge rows */
  .rows{ display:grid; gap:.8em; }
  .row{ display:grid; grid-template-columns:3em minmax(22ch,30ch) minmax(0,1fr); gap:0 1.2em; align-items:start;
    border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); padding:.7em .8em .7em .5em; }
  @media (max-width:1300px){ .row{ grid-template-columns:3em minmax(0,1fr); } .row .r{ grid-column:2; margin-top:.6em; } }   /* the artifact pane is ~1030px on the operator's screen: below 1300 the drawing takes the full row so its letters stay ≥12px */
  .rk{ display:flex; flex-direction:column; align-items:center; gap:.3em; }
  .rk b{ font-size:1.35em; color:var(--accent); line-height:1; font-variant-numeric:tabular-nums; }
  .rk span{ font-size:var(--fs-min); letter-spacing:.08em; text-transform:uppercase; color:var(--muted); writing-mode:vertical-rl; transform:rotate(180deg); }
  .row h3{ margin:0 0 .2em; font-size:1.05em; }
  .row .q{ font-weight:700; margin:0 0 .4em; }
  .row .f, .row .m, .dv .f{ margin:0 0 .3em; font-size:var(--fs-sm); color:var(--ink-soft); } .row .f b, .row .m b, .dv .f b{ color:var(--muted); font-weight:700; margin-right:.25em; }
  .lt{ display:inline-grid; place-items:center; width:1.55em; height:1.55em; margin-right:.2em; border-radius:5px; font-weight:700; text-decoration:none;
    color:var(--accent); background:var(--accent-soft); border:1px solid color-mix(in srgb,var(--accent) 35%,transparent); }
  .row .g, .dv .g{ margin:.35em 0 .5em; font-size:1.02em; } .row .g::before, .dv .g::before{ content:"you grasp: "; color:var(--muted); font-size:var(--fs-xs); letter-spacing:.06em; text-transform:uppercase; }
  .sk{ position:relative; border:1px solid var(--rule); border-radius:8px; background:var(--raised); padding:.45em .55em .4em; overflow:hidden; }
  .sk .stage svg{ display:block; width:100%; height:auto; max-height:16em; }
  .sk .replay{ position:absolute; top:.4em; right:.4em; width:1.7em; height:1.7em; display:grid; place-items:center; padding:0; background:var(--card); color:var(--muted); border:1px solid var(--rule); border-radius:6px; cursor:pointer; }
  .sk .replay:hover{ color:var(--accent); border-color:var(--accent); } .sk .replay svg{ width:1em; height:1em; }
  .sk[data-mode="once"] .stage svg *{ animation-iteration-count:1 !important; animation-fill-mode:forwards !important; }
  @media (prefers-reduced-motion: reduce){ svg[data-fx] *{ animation-duration:.001s !important; animation-iteration-count:1 !important; animation-fill-mode:forwards !important; } }
  .sub{ display:flex; align-items:baseline; gap:.6em; flex-wrap:wrap; margin-top:.35em; font-size:var(--fs-xs); color:var(--muted); } .sub .nm{ font-weight:700; color:var(--ink-soft); }
  .vd{ padding:.08em .45em; border-radius:999px; border:1px solid currentColor; font-size:var(--fs-min); letter-spacing:.05em; text-transform:uppercase; }
  .vd.ok{ color:#2e9e6b; } .vd.bad{ color:#b4462f; }

  /* the derivatives */
  .dvs{ display:grid; grid-template-columns:repeat(auto-fit,minmax(22rem,1fr)); gap:.8em; }
  .dv{ display:grid; gap:.3em; align-content:start; padding:.7em .8em; border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); }
  .dv-h{ display:flex; align-items:center; gap:.5em; } .dv h3{ margin:0; font-size:1.05em; } .dv .q{ font-weight:700; margin:0; }
  .dv .sk .stage svg{ max-height:9em; }
  .dv .sk .replay{ top:auto; bottom:.4em; }   /* the derivative sketches open with a text line — the replay sits below it */

  /* the dimension strip */
  .dims{ display:grid; grid-template-columns:repeat(auto-fit,minmax(7.4em,1fr)); gap:.35em; margin-bottom:.6em; }
  .dm{ display:grid; grid-template-rows:auto auto auto auto; gap:.25em; justify-items:center; padding:.5em .3em .45em; border-radius:8px; border:1px solid var(--rule); background:var(--raised); text-align:center; cursor:help; }
  .dm i{ width:2.1em; height:.9em; border-radius:3px; border:1px solid color-mix(in srgb,currentColor 35%,transparent); }
  .dm b{ font-size:var(--fs-xs); font-weight:700; line-height:1.15; } .dm span{ font-size:var(--fs-min); color:var(--muted); font-variant-numeric:tabular-nums; }
  .dm.lit i{ background:#2e9e6b; border-color:#2e9e6b; } .dm.grey i{ background:transparent; }
  .dm.hatched i{ background:repeating-linear-gradient(45deg,color-mix(in srgb,#c8871b 55%,transparent) 0 3px,transparent 3px 6px); border-color:#c8871b; }
  .dm.blank i{ visibility:hidden; }

  /* legends + readouts under every drawing; the page tooltip for any glyph */
  .lg{ display:flex; flex-wrap:wrap; gap:.3em .9em; align-items:center; margin:.45em 0 0; }
  .lg span{ display:inline-flex; align-items:center; gap:.3em; font-size:var(--fs-sm); color:var(--ink-soft); }
  .lg span svg{ width:2.4em; height:2em; flex:0 0 auto; }   /* the R / RW samples carry letters: big enough to clear the floor */
  .lg span i{ font-style:normal; }
  .ro{ margin:.3em 0 0; font-size:var(--fs-sm); font-variant-numeric:tabular-nums; color:var(--ink); }
  .ro::before{ content:"readout "; color:var(--muted); font-size:var(--fs-min); letter-spacing:.06em; text-transform:uppercase; }
  .sk svg g[data-t]{ cursor:help; pointer-events:bounding-box; }   /* a stroke-only shape has no interior to hover; the group's box is the target */
  #gtip{ position:fixed; z-index:400; pointer-events:none; max-width:26rem; padding:.4em .6em; border-radius:6px; background:var(--card); color:var(--ink);
    border:1px solid var(--rule); box-shadow:var(--shadow); font-size:var(--fs-sm); opacity:0; transition:opacity .08s; }
  #gtip.on{ opacity:1; }
  #gtip.card{ max-width:24rem; padding:.55em .7em .5em; }
  .cphd{ font-weight:700; font-size:1.02em; } .cpsub{ font-size:var(--fs-xs); color:var(--muted); margin-bottom:.35em; }
  .cprow{ display:grid; grid-template-columns:5.5em 1fr; gap:.5em; font-size:var(--fs-sm); margin:.1em 0; }
  .cpk{ font-size:var(--fs-min); letter-spacing:.08em; text-transform:uppercase; color:var(--muted); align-self:baseline; } .cpv{ font-weight:600; }
  .cpf{ margin-top:.4em; padding-top:.35em; border-top:1px solid var(--rule); display:grid; gap:.1em; }
  .cpfr{ display:flex; justify-content:space-between; gap:1em; font-size:var(--fs-sm); font-family:ui-monospace, monospace; } .cpfn{ font-weight:700; } .cpft{ color:var(--muted); }
  .cpmore{ font-size:var(--fs-min); color:var(--muted); }
  .cpfoot{ margin-top:.4em; font-size:var(--fs-min); letter-spacing:.05em; text-transform:uppercase; color:var(--accent); }
  .sk svg g[data-card]{ cursor:help; pointer-events:bounding-box; }
  /* the assembly + applied */
  .parts{ display:grid; grid-template-columns:repeat(auto-fit,minmax(40rem,1fr)); gap:.8em; }   /* wide cells: the badge letters must clear the floor in the parts copy too */   /* wide cells: the run's sketches carry 7px labels in a 320-wide viewBox — the part must render them ≥12px */
  svg title, svg style{ font-size:14px !important; }   /* non-rendered nodes the floor gate still measures */
  .part{ display:grid; gap:.35em; align-content:start; padding:.7em .8em; border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); }
  .part h3{ margin:0; font-size:1.05em; } .plt{ display:flex; flex-wrap:wrap; align-items:center; }
  .part .comp{ margin:.2em 0; font-size:var(--fs-sm); } .part .comp b{ color:var(--accent); margin-right:.3em; }
  .part .sk .stage svg{ max-height:16em; }
  .apps{ display:grid; grid-template-columns:repeat(auto-fit,minmax(24rem,1fr)); gap:.8em; }
  .ap{ display:grid; gap:.4em; align-content:start; padding:.7em .8em; border:1px solid var(--rule); border-radius:var(--radius,10px); background:var(--card); }
  .ap-h{ display:flex; align-items:center; gap:.3em; } .ap h3{ margin:0; font-size:1.05em; } .ap-h .ltn{ display:none; }
  .ap p{ margin:0; font-size:var(--fs-sm); } .ap .f a{ color:var(--accent); }
  /* marks */
  .mk{ display:flex; align-items:center; gap:.3em; margin-top:.45em; }
  .mk button{ width:2em; height:2em; border-radius:6px; border:1px solid var(--rule); background:var(--card); color:var(--muted); cursor:pointer; font:inherit; line-height:1; }
  .mk button:hover{ border-color:var(--accent); color:var(--accent); }
  .mk button[aria-pressed="true"]{ color:#fff; background:var(--accent); border-color:var(--accent); }
  .mk button[data-m="not"][aria-pressed="true"]{ background:#b4462f; border-color:#b4462f; }
  .mk button[data-m="got"][aria-pressed="true"]{ background:#2e9e6b; border-color:#2e9e6b; }
  .mk input{ flex:1 1 auto; min-width:8em; font:inherit; font-size:var(--fs-sm); padding:.3em .5em; border-radius:6px; border:1px solid var(--rule); background:var(--raised); color:var(--ink); }
  .mks-bar{ display:flex; align-items:center; gap:1em; flex-wrap:wrap; margin:.3em 0 .5em; font-size:var(--fs-sm); }
  .btn{ font:inherit; font-size:var(--fs-sm); padding:.35em .7em; border-radius:6px; border:1px solid var(--rule); background:var(--card); color:var(--ink); cursor:pointer; }
  .btn:hover{ border-color:var(--accent); color:var(--accent); }
  .mk-out{ margin:0; font-size:var(--fs-xs); max-height:14em; overflow:auto; padding:.6em .8em; border-radius:8px; background:var(--raised); border:1px solid var(--rule); white-space:pre-wrap; word-break:break-word; }
</style>
"""

SCRIPT = """
<div id="gtip" role="tooltip"></div>
<script>
(function(){
  /* the page tooltip: any glyph group with data-t names itself on hover (native SVG <title> does not fire reliably here) */
  var tip = document.getElementById('gtip');
  document.addEventListener('mousemove', function(ev){
    var g = ev.target && ev.target.closest ? ev.target.closest('svg g[data-t], svg g[data-card]') : null;
    if (!g) { tip.classList.remove('on'); return; }
    if (g.hasAttribute('data-card')) {
      /* the station's cell popover (_jdCellPop): header · kind · entity · operation · here · the structure's fields */
      var c; try { c = JSON.parse(g.getAttribute('data-card')); } catch (e) { c = null; }
      if (c) {
        var esc = function (x) { return String(x).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
        var h = '<div class="cphd" style="color:' + esc(c.hc) + '">' + esc(c.h) + '</div><div class="cpsub">' + esc(c.sub) + '</div>';
        (c.rows || []).forEach(function (r) { h += '<div class="cprow"><span class="cpk">' + esc(r[0]) + '</span><span class="cpv" style="color:' + esc(r[2]) + '">' + esc(r[1]) + '</span></div>'; });
        if (c.fields && c.fields.length) { h += '<div class="cpf">' + c.fields.slice(0, 26).map(function (f) { return '<div class="cpfr"><span class="cpfn">' + esc(f[0]) + '</span><span class="cpft">' + esc(f[1] || '') + '</span></div>'; }).join('') + (c.fields.length > 26 ? '<div class="cpmore">+' + (c.fields.length - 26) + ' more</div>' : '') + '</div>'; }
        if (c.foot) h += '<div class="cpfoot">' + esc(c.foot) + '</div>';
        tip.innerHTML = h; tip.classList.add('on', 'card');
      }
    } else { tip.textContent = g.getAttribute('data-t'); tip.classList.remove('card'); tip.classList.add('on'); }
    var x = ev.clientX + 14, y = ev.clientY + 16; if (x + 420 > window.innerWidth) x = ev.clientX - 430; if (y + 80 > window.innerHeight) y = ev.clientY - 60;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
  /* sketches: a <template> each, a live clone on stage; replay = fresh clone; the cog's Motion switch rebuilds then pauses */
  window.FXREPLAY = window.FXREPLAY || {};
  document.querySelectorAll('.sk').forEach(function(sk){
    var tpl = sk.querySelector('template'), stage = sk.querySelector('.stage'), btn = sk.querySelector('.replay');
    function build(){ stage.innerHTML = ''; stage.appendChild(tpl.content.cloneNode(true)); var s = stage.querySelector('svg'); if (s && window.MOTION && !MOTION.on && s.pauseAnimations) s.pauseAnimations(); }
    if (btn) { window.FXREPLAY[btn.getAttribute('data-fx-replay')] = build; btn.addEventListener('click', build); }   /* a static drawing has nothing to replay */
    build();
  });
  /* the alphabet's own micro-glyphs animate in place (no template) — register them so replay + pause reach them */
  document.querySelectorAll('.al .gl svg[data-fx]').forEach(function(svg){
    var slug = svg.getAttribute('data-fx'), parent = svg.parentNode, src = svg.outerHTML;
    window.FXREPLAY[slug] = function(){ var d = document.createElement('div'); d.innerHTML = src; var n = d.firstElementChild; parent.replaceChild(n, parent.querySelector('svg')); if (window.MOTION && !MOTION.on && n.pauseAnimations) n.pauseAnimations(); };
  });
  window.__rebuildMotion = function(){ Object.keys(window.FXREPLAY).forEach(function(k){ window.FXREPLAY[k](); }); };

  /* MARKS — ✓ ✗ → per item, kept in the shared store (db) or this browser; Claude reads them back */
  var MARKS = {}, status = document.getElementById('mk-status'), out = document.getElementById('mk-out'), dbref = null, where = 'browser';
  function render(){
    document.querySelectorAll('.mk').forEach(function(mk){
      var id = mk.getAttribute('data-id'), m = MARKS[id] || {};
      mk.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m.mark)); });
      var inp = mk.querySelector('input'); if (document.activeElement !== inp) inp.value = m.want || '';
    });
    var n = Object.keys(MARKS).length; out.textContent = n ? JSON.stringify(MARKS, null, 1) : '—';
    status.textContent = (n ? n + ' marked · ' : 'no marks yet · ') + (where === 'db' ? 'kept on the page' : 'kept in this browser only');
  }
  var saveT = null;
  function save(){
    try { localStorage.setItem('cognos:endpoint:marks', JSON.stringify(MARKS)); } catch(e) {}
    if (!dbref) return;
    clearTimeout(saveT); saveT = setTimeout(function(){ dbref.set({ marks: MARKS, kind: 'endpoint', bench: 'POST /setup/complete', head: '8356f531' }).catch(function(){ where = 'browser'; render(); }); }, 500);
  }
  document.querySelectorAll('.mk').forEach(function(mk){
    var id = mk.getAttribute('data-id');
    mk.querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){
      var m = MARKS[id] || {}; m.mark = (m.mark === b.getAttribute('data-m')) ? null : b.getAttribute('data-m'); MARKS[id] = m; render(); save(); }); });
    mk.querySelector('input').addEventListener('input', function(ev){ var m = MARKS[id] || {}; m.want = ev.target.value; MARKS[id] = m; render(); save(); });
  });
  try { var raw = localStorage.getItem('cognos:endpoint:marks'); if (raw) MARKS = JSON.parse(raw) || {}; } catch(e) {}
  render();
  document.getElementById('mk-copy').addEventListener('click', function(){
    var t = JSON.stringify(MARKS); var ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {} document.body.removeChild(ta);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(function(){});
    status.textContent = 'copied'; setTimeout(render, 1200);
  });
  /* the shared store lights up when the viewer grants it — later than first paint, never assumed */
  if (window.claude && window.claude.use) {
    window.claude.use('db').then(function(db){
      if (!db) return;
      dbref = db.doc('cognos/endpoint'); where = 'db';
      return dbref.get().then(function(snap){
        var d = snap && snap.exists ? snap.data() : null;
        if (d && d.marks && Object.keys(d.marks).length) MARKS = d.marks;   /* the store wins over this browser */
        render(); save();
      });
    }).catch(function(){ where = 'browser'; render(); });
  }
})();
</script>
"""

page = ("<title>Cognos · Bridge</title>\n" + L.BLOCK1 + "\n" + CSS + '\n<div class="artifact-page">\n'
        + '<h1>The bridge — a meaning on my side, an abstraction on yours</h1>'
        + '<div class="lede"><p>Your drawing, applied to one door. On my side: <b>55 fields</b> → <b>12 gravity wells</b> → a meaning each, ranked by how much understanding it gives per unit of attention. '
          'On yours: an <b>alphabet</b> of what sight grasps without reading — read · 3D · time — and the rows below propose which letters answer which well.</p>'
          '<p>Mark every card: <b>✓</b> I get it · <b>✗</b> not this · <b>→</b> I would want… Marks stay on the page; I read them back. Field chips wear the bench\'s state: <span class="ev live">live</span> <span class="ev empty">empty</span> <span class="ev unmeasured">unmeasured</span> <span class="ev absent">absent here</span>.</p></div>\n'
        + sec(1, "target", "The door — context first", "bench", door)
        + sec(2, "sparkles", "The alphabet — what you grasp without reading", "13 letters", alpha)
        + sec(3, "route", "The bridge — meaning → abstraction, twelve wells", "dE/dx order", bridge)
        + sec(4, "bars", "The derivatives — speed · acceleration · expectation", "your additions", derivs)
        + sec(5, "layout", "The dimensions a door touches", "one strip, every kind", dims)
        + sec(6, "layout", "The assembly — the six parts of an API element", "your grouping", assembly)
        + sec(7, "target", "Applied — B · G · H · L on the bench", "the four you asked to see", applied)
        + sec(8, "gavel", "Your marks", "read back by Claude", marks)
        + "\n</div>\n" + L.BLOCK2 + "\n" + L.BLOCK3 + "\n" + SCRIPT)
out = HERE / "cognos-bridge.html"; out.write_text(page, encoding="utf-8")
print("wrote", out, len(page), "bytes ·", len(ROWS), "rows ·", len(ALPHA), "letters ·", len(DIMS), "dimension cells")
