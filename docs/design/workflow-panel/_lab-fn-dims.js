/* GENERATED from the analysis pass (workflow wf_a571dd73-0a1: dims · layouts · game · verify · critic) — judgement only.
   Example values are computed by the page from window.LABFN so a number here can never drift from the feed.
   `plain` — IN YOUR WORDS (operator 2026-09-09): the legend reference's column, one line per dim from the reader's side of the screen; judgement, authored beside `why`. */
window.LABDIMS = {
 "kind": "function",
 "dims": [
  {
   "key": "name",
   "label": "Name (and the join id)",
   "why": "A private helper has no URL and no table — its name is the only stable handle, and the underscore already says 'not a door'. The id `file#name` is the key every other block joins on (fn_edges, schema_edges, homing.pieces, models.homes).",
   "question": "What am I looking at, and what key joins it to everything else?",
   "plain": "the function's name — the handle you search for, and the key everything else joins on",
   "feedwide": "292/292",
   "station_today": "shown — showPanel .pname (gabe-universe.html:6228) from n.label, minted at :2105 (label:f.name)",
   "tier": "anchor",
   "slot": "IDENTITY"
  },
  {
   "key": "role",
   "label": "Role badge (accessor · caller · pure · gate)",
   "why": "For a function the role is the one-word job: accessor = it touches tables itself, caller = it delegates, pure = no I/O, gate = it runs before handlers. It is the reader's first fork — am I changing data logic or orchestration?",
   "question": "What kind of work does this function do — read/write data, orchestrate, compute, or guard?",
   "plain": "its one-word job: touches tables (accessor), delegates (caller), computes only (pure), or guards (gate)",
   "feedwide": "292/292 (accessor 156 · caller 95 · pure 36 · gate 5)",
   "station_today": "shown — the role badge on the kind row, showPanel :6225-6226 (n.role, minted :2108); also in the journey-step tooltip :3128",
   "tier": "anchor",
   "slot": "IDENTITY"
  },
  {
   "key": "entity",
   "label": "Entity (home)",
   "why": "Tells the reader whose tests, PLAN row and center card own the change; a function's entity is a file claim, so it is also the first thing homing evidence can contradict.",
   "question": "Whose function is this — which entity do I file the change under?",
   "plain": "which feature area owns it — whose tests and card you file the change under",
   "feedwide": "292/292 (1 is __unclaimed__)",
   "station_today": "shown — header ' · settings' showPanel :6230 (n.ent, minted :2105 ent:f.slug) + identSec :5742 kv entity",
   "tier": "anchor",
   "slot": "PLACE"
  },
  {
   "key": "file",
   "label": "File + line span",
   "why": "The next move is 'open the editor at the right spot'. A 61-line helper reads differently than a 6-line one, and the god flag is literally lines ≥ 50 — so the size is the flag's evidence.",
   "question": "Where do I open it, and how big is it?",
   "plain": "where to open it in the editor, and how many lines you are in for",
   "feedwide": "file 292/292 · flines 288/292",
   "station_today": "file shown — fileRowSec :5728-5729 kv from det.file (minted :2110 from the id split); flines never joined; if joined, :5729 renders `det.file+\":\"+det.flines` → 'user_settings.py:61', which reads as line 61 but is the line COUNT",
   "tier": "anchor",
   "slot": "PLACE"
  },
  {
   "key": "sig",
   "label": "Signature (async · returns)",
   "why": "For a function the return type IS its contract to its callers — here SettingsResponse is what four endpoints ship. `async` says it is awaited inside a request path, so blocking work in it stalls the handler.",
   "question": "What does it hand back, and is it awaited?",
   "plain": "what it hands back, and whether the caller has to await it",
   "feedwide": "288/292 (async true 258 · returns 288)",
   "station_today": "dropped — _buildFnData :2104-2110 never reads GABE_LEVELS.detail (det:{file, doc:\"\"}), so sigSec :5712 returns null for all 292; and sigSec :5715 renders its body only when `s.lines!=null`, a key the levels sig never carries (0/291) — a joined detail would still render a header with no body",
   "tier": "core",
   "slot": "OPERATION"
  },
  {
   "key": "callers",
   "label": "Callers (fan-in) + the endpoints they are",
   "why": "A private function's blast radius is exactly its callers. Here every caller is a route handler, so '4 callers' means '4 public endpoints change behaviour' — the one number that decides whether this is a safe local edit or a contract change.",
   "question": "If I change this, which endpoints change?",
   "plain": "who calls it — change this and these endpoints change with it",
   "feedwide": "in-degree ≥1 on 201/292 (max 78 · p95 3 · median 1); hub.usage ≠ in-degree on 175/292",
   "station_today": "WRONG + split — usage() :5517 prints 1 under a tooltip that says 'IN-DEGREE', identSec :5743 prints '1 caller (graph in-degree)'; both read m.fanin = f.hub.usage (mint :2109), which counts referencing FILES with the self-file once (_a3_code.py:2276-2281), not callers. liveConns :5699-5706 shows 'called by 4' only with Functions ON, tagged inferred (:5706) though all 4 edges are extracted (conf dropped at :2111). The doors behind the callers appear only one expander level down (handler wire :2113-2117 via _neighborRows :5648).",
   "tier": "anchor",
   "slot": "IN"
  },
  {
   "key": "tables",
   "label": "Tables read / written + commit",
   "why": "For an accessor this IS the function. Six reads, zero writes, commits false tells the reader it is a read-only aggregator: a change here cannot corrupt data, but a schema change on any of the six tables breaks it.",
   "question": "Which tables does it touch, does it write, does it commit?",
   "plain": "the database tables it reads or writes, and whether it commits",
   "feedwide": "158/292 carry ops (any read 133 · any write 69 · commits true 64)",
   "station_today": "shown — accessSec :5692-5697, one 'reads → Model · table' row per op; commits only inside the info tooltip text (:5696) and only when true; also drawn as fnreads wires :2121-2124 with Functions ON",
   "tier": "core",
   "slot": "STORE"
  },
  {
   "key": "callees",
   "label": "Callees (fan-out) + confidence + crossing",
   "why": "A function's direct dependencies are what a refactor must preserve; an INFERRED cross-entity call is exactly the edge to verify by grep before trusting the map (the map is a floor).",
   "question": "What does it lean on, and how sure is the map?",
   "plain": "what it calls in turn, and how sure the map is about each call",
   "feedwide": "out-degree ≥1 on 145/292 (max 15 · p95 5 · median 0); 92/292 have a cross-entity callee; edges 194 extracted / 233 inferred",
   "station_today": "partial — liveConns :5699 'calls 1' with Functions ON; conf dropped by the mint :2111 (all groups labelled inferred at :5706); the entity crossing is not said",
   "tier": "core",
   "slot": "OUT"
  },
  {
   "key": "behind",
   "label": "Code behind (fns · depth · names)",
   "why": "The transitive mass a reader inherits by stepping into this function. Depth 3 says credit/allowance math sits three hops under a 'settings builder' — a surprise worth knowing before touching it.",
   "question": "How much code runs under this call, and how deep?",
   "plain": "how much code runs underneath one call to it, and how deep the stack goes",
   "feedwide": "189/292 (max 135 · p95 38 (nearest-rank; 37.2 linear) · median 4 · truncated 0)",
   "station_today": "shown — behindTree :5669-5676 ('reach 3 · 6 behind', chips; 4 of 6 names resolve to fn_nodes via _fnByLabel :5662 — allowance_for and month_start are not fn_nodes, so they cannot expand)",
   "tier": "core",
   "slot": "OPERATION"
  },
  {
   "key": "schemas",
   "label": "Schemas returned / used",
   "why": "The return schema is what the four endpoints ship to the client — GET /settings' payload {n:7, schema SettingsResponse} is assembled here from seven recipe-owned blocks. Change a block, change the wire contract.",
   "question": "What shape leaves this function, and which shapes does it assemble?",
   "plain": "the request / response shapes it returns or assembles",
   "feedwide": "26/292 (returns 9 · uses 8 · takes 15)",
   "station_today": "partial — the mint :2128 pushes schema wires when both ends are in the field (8/8 targets exist in c4), so liveConns :5699 shows 'returns 1 · uses 7' only with Functions ON, labelled inferred by :5706 though schema_edges are an AST-exact join (TRUST :5521 (consulted :5529) lists 'returns' as structural but liveConns never consults it)",
   "tier": "context",
   "slot": "OUT"
  },
  {
   "key": "tests",
   "label": "Tests (direct + through callers)",
   "why": "The 'is it safe to touch' question. A function reached by 38 passing cases through four handlers is guarded — it is just not NAMED by any case, and a panel that says 'unguarded' sends the reader to write tests that exist.",
   "question": "What goes red if I get this wrong?",
   "plain": "what goes red if you break it — its own cases, or the cases of the endpoints above it",
   "feedwide": "0/292 direct",
   "station_today": "WRONG — the mint hard-codes m.tests:0 (:2109) and det has no cases, so testsSec :5552 prints '— no cases claimed yet' AND flagsSec :6087 (untested = tests===0) raises 'unguarded · no test covers this' on all 292 functions",
   "tier": "core",
   "slot": "EVIDENCE"
  },
  {
   "key": "journeys",
   "label": "Journeys / workflows through it",
   "why": "Tells the reader which user story exercises this helper end-to-end — the first-run setup and 'tune discovery' both read it — so a behaviour change is checked against the flow, not just the unit.",
   "question": "Which user flows pass through here?",
   "plain": "the user flows that pass through it on their way somewhere",
   "feedwide": "0/292 direct",
   "station_today": "dropped — journeysSection :5587 is called by the endpoint (:5755) and model cards, not by KINDCARD.function (:5760-5764); fn detail carries no test_journeys",
   "tier": "context",
   "slot": "EVIDENCE"
  },
  {
   "key": "d2w",
   "label": "Hops to a write (d2w)",
   "why": "Separates a read-path helper from a write-path one. Absent here is the reassuring answer: nothing this function calls persists data, so a refactor cannot leave a half-written row.",
   "question": "Can this function, or anything under it, persist data?",
   "plain": "how many calls away a database write is — can this path persist anything?",
   "feedwide": "152/292 (0: 133 · 1: 17 · 2: 2); absent on 74 accessors · 36 pure · 27 callers · 3 gates",
   "station_today": "partial — minted :2108; drives wire heat (:2189) and the journey-step tooltip (:3128-3129 'never reaches a write (read / serialize path)'); no card row",
   "tier": "context",
   "slot": "STORE"
  },
  {
   "key": "god",
   "label": "God flag (lines ≥ 50)",
   "why": "For a function 'god' is only a length threshold — the reader should learn it means 61 ≥ 50, not fan-in or coupling, or they will refactor the wrong thing.",
   "question": "Is this function too big — and by which rule?",
   "plain": "the too-big flag: 50 lines or more",
   "feedwide": "42/292",
   "station_today": "shown — m.god (mint :2109) → flagsSec :6086 'god-object · oversized fn / class' with the raider asset; the rule and the line count are never stated (flines not joined)",
   "tier": "context",
   "slot": "EVIDENCE"
  },
  {
   "key": "doc",
   "label": "Docstring",
   "why": "The author's one-line intent is the cheapest 'why does this private helper exist'; when absent, the serializes lines and callers have to stand in for it.",
   "question": "What did the author say this is for?",
   "plain": "what the author wrote it was for — the docstring",
   "feedwide": "200/292",
   "station_today": "dropped — the mint :2110 sets det.doc:\"\" and never joins detail; docSec :5727 returns null on every function; the journey tooltip :3122 reads the same empty string",
   "tier": "context",
   "slot": "OPERATION"
  },
  {
   "key": "layer",
   "label": "Layer (api · services · schemas)",
   "why": "An api-layer helper living beside handlers vs a services-layer function tells the reader whether it is presentation glue (candidate to move under services) or domain logic.",
   "question": "Is this request-layer glue or domain logic?",
   "plain": "which floor it lives on: request glue (api), business rules (services), or data shapes (schemas)",
   "feedwide": "292/292 (services 195 · api 96 · schemas 1)",
   "station_today": "WRONG — the mint :2106 sets layer to KINDS.function.layer ('api', :1116) and drops f.layer; identSec :5742 prints n.K.layer, so all 292 read 'api' though 195 are services",
   "tier": "context",
   "slot": "PLACE"
  },
  {
   "key": "handler",
   "label": "Is it a route handler?",
   "why": "A handler is a door with a URL; a non-handler is reachable only through its callers — this decides whether the callers row is the WHOLE blast radius or just the inner ring.",
   "question": "Is this itself an endpoint, or only reachable through one?",
   "plain": "is it an API door itself, or only reached through one?",
   "feedwide": "80/292 true",
   "station_today": "dropped — the mint :2104-2110 never copies f.handler; nothing reads it",
   "tier": "context",
   "slot": "IDENTITY"
  },
  {
   "key": "serializes",
   "label": "Serialises (schema blocks · lines)",
   "why": "The only field that carries LINE NUMBERS inside the body — the reader can jump to line 93 to change how DietaryBlock is built — and it proves the function assembles six response blocks by hand.",
   "question": "Where inside the body is each response block built?",
   "plain": "where inside the body each response block gets built",
   "feedwide": "9/292",
   "station_today": "dropped — accessSec :5692 reads a.ops only; 'serializes' in the station is the c4 schema→model rel (:1239, :1708, :4481), never a function field",
   "tier": "context",
   "slot": "OUT"
  },
  {
   "key": "xreach",
   "label": "Cross-entity reach (use_edges)",
   "why": "A settings helper that reaches into allergen, auth and recipe classes is the coupling a reviewer prices, and the reason the derived model files it under a table-named atom instead of settings.",
   "question": "Which other entities' classes does it depend on?",
   "plain": "which other features' classes it depends on",
   "feedwide": "89/292 (173 edges)",
   "station_today": "dropped — gabe-universe.html never reads use_edges or usefns (0 references)",
   "tier": "context",
   "slot": "OUT"
  },
  {
   "key": "conn",
   "label": "Connections (drawn wire count)",
   "why": "How much of the field lights when this function is selected — the cheapest sense of how entangled it is, and the number the lab's `conn` slot already carries.",
   "question": "How wired is it?",
   "plain": "how many wires the station draws to it",
   "feedwide": "292/292 computable (201 with a call in · 158 with ops · 26 with schema)",
   "station_today": "shown as the Connections total (conns :5527 showCount) only with Functions ON; otherwise the empty text :5709 points at Code behind",
   "tier": "context",
   "slot": "PLACE"
  },
  {
   "key": "flags",
   "label": "Feature-flag walls",
   "why": "A wall inside the body is a path the reader cannot reach in some environments — a test that passes locally and 403s in prod.",
   "question": "Is any path inside gated by a feature flag?",
   "plain": "a feature flag that can wall off part of it",
   "feedwide": "4/292 (_require_seed_controls · post_create_gustify · post_create_manual · stream_gustify)",
   "station_today": "dropped — the mint never copies f.flags; the only `.flags` in the station is m.flags, a risk COUNT (:1384)",
   "tier": "context",
   "slot": "IN"
  },
  {
   "key": "sinks",
   "label": "Non-ORM sinks (queue · http · fs)",
   "why": "A sink is a side effect the tables row cannot show — an enqueue or an email. A read-only builder with no sinks genuinely has no output but its return value.",
   "question": "Does it push anything out besides its return value?",
   "plain": "anything it pushes out besides its return value — a queue, an HTTP call, a file",
   "feedwide": "1/292 (cooking.py#post_complete [\"queue\"])",
   "station_today": "dropped — minted at :2108 (n.sinks) but no helper reads it",
   "tier": "context",
   "slot": "OUT"
  },
  {
   "key": "homing",
   "label": "Membership evidence (homing verdict)",
   "why": "'Does this function live in the right entity' is a move decision; for _build_settings its four users are settings and its data majority is settings, so the evidence says stay put — but the feed cannot say that out loud.",
   "question": "Is this filed under the right entity?",
   "plain": "does the evidence (who calls it, what data it touches) agree with the folder it lives in?",
   "feedwide": "66/292 listed (stay 63 · shared 2 · move 1: compute_recipe_availability pantry→recipe); stats claim 216 function pieces weighed",
   "station_today": "dropped — homeEvRow :5820 is not in KINDCARD.function (:5760-5764) and levels-minted fn nodes never receive homeEv (set only at :1282/:1339 from c4 pieces); even the one move candidate shows nothing",
   "tier": "press",
   "slot": "PLACE"
  },
  {
   "key": "model",
   "label": "Entity-model cluster (seeded · derived · proposed)",
   "why": "The derived view says 'by data this belongs with the household_format_preferences atom' — a naming hint for a future split, not a move. Worth a button, never a fixed row.",
   "question": "Where would the evidence-based models file it?",
   "plain": "where the evidence-based entity models would file it instead",
   "feedwide": "seeded 1/292 · derived 195/292 · proposed 34/292",
   "station_today": "shown only when moved/abstain/held — _applyEntityModel :4170-4182 marks the _FNNODES pool and modelRow :5829 renders those; null here (modelMark null under the settled seeded view)",
   "tier": "press",
   "slot": "PLACE"
  },
  {
   "key": "hub_usage",
   "label": "hub.usage (referencing-file count)",
   "why": "It is not fan-in: function_insight counts the FILES that reference the name (the own file once), so four same-file callers read 1 and a handler with zero callers reads 1. As a displayed number it misleads; keep it only as the mint's fallback when fn_edges is empty.",
   "question": "—",
   "plain": "how many files mention it — a count of files, not of callers",
   "feedwide": "283/292 > 0; ≠ fn_edges in-degree on 175/292",
   "station_today": "shown AS fan-in — usage() :5517 and identSec :5743 both print it under an in-degree label",
   "tier": "cut",
   "slot": "IN"
  },
  {
   "key": "lang",
   "label": "Language",
   "why": "Zero information in a single-language backend function layer.",
   "question": "—",
   "plain": "the language it is written in",
   "feedwide": "292/292 (all py)",
   "station_today": "dropped — the mint never copies it",
   "tier": "cut",
   "slot": "IDENTITY"
  },
  {
   "key": "externals",
   "label": "Providers reached",
   "why": "Would matter for a function that calls an LLM or SDK; no function in this feed carries it, and the station never reads it.",
   "question": "—",
   "plain": "the outside providers it reaches — never measured for functions",
   "feedwide": "0/292",
   "station_today": "not read (0 references in gabe-universe.html)",
   "tier": "cut",
   "slot": "OUT"
  },
  {
   "key": "pressure",
   "label": "Pressure",
   "why": "A slot that has never carried a value is dead, per the field-table law's `dispatch` precedent.",
   "question": "—",
   "plain": "a placeholder the walk leaves empty",
   "feedwide": "0/292",
   "station_today": "not read",
   "tier": "cut",
   "slot": "EVIDENCE"
  },
  {
   "key": "depends",
   "label": "Depends / dispatches (the other two rels)",
   "why": "fn_edges carry three rels — calls 344 · depends 81 · dispatches 2. A handler's Depends() wiring and a task dispatch are callers too; three functions have in-degree ONLY through depends and would read '0 callers' on a calls-only rail.",
   "question": "Does anything reach it other than a call?",
   "plain": "reaches it by something other than a plain call — an injected dependency or a dispatch",
   "feedwide": "depends 81 · dispatches 2 of 427 edges",
   "station_today": "shown as wires — the station labels 'depended on by' (:5615) and walks them (:2767); the console's caller rows say 'calls' only",
   "tier": "core",
   "slot": "IN"
  },
  {
   "key": "screens",
   "label": "Screens, through the callers",
   "why": "A private function has no screen of its own, but the doors it feeds do: the c4 bridges from the fetching hooks to its four endpoints are its UI blast radius.",
   "question": "Which screens change if this changes?",
   "plain": "the screens that change if this changes — found through its callers",
   "feedwide": "53 bridges feed-wide (c4 cross_edges kind bridge)",
   "station_today": "dropped for functions — the SCREENS verb reads BLANK ('wrong question') on a function card; the bridges exist one join away",
   "tier": "context",
   "slot": "OUT"
  },
  {
   "key": "gates",
   "label": "Gates in front of the callers",
   "why": "Every door into this function carries the same gate. A reader changing an accessor needs to know it is only ever reached authenticated — the gate is part of its contract.",
   "question": "What guards stand between a request and this code?",
   "plain": "the auth and permission checks a request passes before it reaches this code",
   "feedwide": "79 gated endpoints (c4 stats.gate_endpoints)",
   "station_today": "dropped for functions — middleware rides the endpoint node; the function card never looks up",
   "tier": "context",
   "slot": "IN"
  },
  {
   "key": "hidden",
   "label": "Hidden functions in the walk",
   "why": "behind.names can name functions the walk did not DRAW (entities[].counts.hidden_fns: 2,150 feed-wide). A name with no node is hidden, not missing — two states the panel must keep apart.",
   "question": "Is a name I cannot open missing from the map, or just not drawn?",
   "plain": "a name under it the map knows but did not draw — hidden by the walk rule, not missing",
   "feedwide": "hidden_fns 2,150 vs 292 drawn",
   "station_today": "dropped — behindTree resolves by label and draws a bare chip for a miss; nothing says 'hidden by the walk rule'",
   "tier": "context",
   "slot": "PLACE"
  },
  {
   "key": "community",
   "label": "Community / use-case membership",
   "why": "The levels feed clusters handlers into communities and URL-domain use-cases; a helper belongs to none. An honest 'clustered nowhere' is a fact about how the map groups, not about the function.",
   "question": "Which cluster does the map put it in?",
   "plain": "the cluster the map's own grouping puts it in",
   "feedwide": "pieces.<slug>.communities · usecases (handlers only)",
   "station_today": "dropped — no card reads pieces.communities for a function",
   "tier": "press",
   "slot": "PLACE"
  },
  {
   "key": "inflight",
   "label": "In flight (GABE_SIM)",
   "why": "When a change is in flight the station overlays it; a function in the touched set should say so before anything else — the one dimension that outranks the ranking.",
   "question": "Is this being changed right now?",
   "plain": "is a commit touching it right now?",
   "feedwide": "sim.data.js derived:true in this example (commit a99719f3, 28 touched)",
   "station_today": "shown at the station level (the SIM overlay), never on the function card",
   "tier": "context",
   "slot": "EVIDENCE"
  },
  {
   "key": "time",
   "label": "Last change (commits.js)",
   "why": "The feed carries 30 commits with touched ids; 'when did what this returns last change' is a history-first thesis none of the five layouts holds — a sixth layout, not a row.",
   "question": "When did this, or what it returns, last move?",
   "plain": "when it, or what it returns, last changed",
   "feedwide": "commits.js 30 commits · touched fe 246 · schema 107 · endpoint 40 · model 28",
   "station_today": "shown only through the commits-as-journeys walk; no per-element 'last touched' anywhere",
   "tier": "press",
   "slot": "EVIDENCE"
  }
 ],
 "reading_order": [
  "name",
  "role",
  "entity",
  "file",
  "sig",
  "callers",
  "tables",
  "callees",
  "behind",
  "schemas",
  "d2w",
  "tests",
  "journeys",
  "god",
  "doc",
  "layer",
  "handler",
  "serializes",
  "xreach",
  "conn",
  "flags",
  "sinks",
  "homing",
  "model",
  "hub_usage",
  "lang",
  "externals",
  "pressure",
  "depends",
  "screens",
  "gates",
  "hidden",
  "community",
  "inflight",
  "time"
 ],
 "findings": [
  "F1 fan-in 1 vs 4 callers — levels.json fn_nodes[_build_settings].hub.usage = 1 while fn_edges carries 4 `calls` edges (all conf extracted) targeting apps/api/api/user_settings.py#_build_settings. The station prints the 1 as 'IN-DEGREE' (gabe-universe.html:5517 tooltip) and '1 caller (graph in-degree)' (:5743) because _buildFnData reads f.hub.usage into m.fanin (:2109); hub.usage is function_insight internal+api (_a3_levels.py:407), which counts referencing FILES with the own file once (_a3_code.py:2276-2281). Feed-wide 175/292 fn_nodes disagree with their fn_edges in-degree. The same card's liveConns (:5699) says 'called by 4' when Functions is ON.",
  "F2 sig present in detail, dropped by the mint — levels.json detail[\"fn:settings|_build_settings\"].sig = {async:true, returns:\"SettingsResponse\"} (288/291 detail keys carry sig), but _buildFnData :2104-2110 builds det:{file, doc:\"\"} and never reads GABE_LEVELS.detail; sigSec :5712 and docSec :5727 are null for all 292 functions. Second layer: sigSec :5715 renders its body only when `s.lines!=null`, and the levels sig never carries `lines` (sig keys feed-wide: returns 288 · async 258 · lines 0 — the count rides beside sig as `flines`, _a3_levels.py:452-458), so even a joined detail renders a 'Signature' header with no body.",
  "F3 tests:0 hard-coded → a false 'unguarded' on every function — :2109 `tests:0`; flagsSec :6087 `untested=(tests===0 && n.kind!==\"entity\")` raises 'unguarded · no test covers this' on all 292 fn nodes, and testsSec :5552 prints '— no cases claimed yet'. The emitter leaves function coverage honest-empty by design (_a3_levels.py:408-411). Its 4 callers carry 7/23/7/7 cases in c4-graph.js l2.settings endpoints' det.cases — 38 distinct C-ids, every state pass.",
  "F4 layer wrong for 195/292 — the mint :2106 sets `layer:KINDS[\"function\"].layer` (= 'api', :1116) and discards fn_nodes[].layer; identSec :5742 prints n.K.layer, so every function reads 'api'. Feed: services 195 · api 96 · schemas 1.",
  "F5 conf dropped, trust mislabelled — :2111 maps fn_edges to {source,target,rel}; `conf` (194 extracted / 233 inferred across 427 edges) is lost. liveConns :5706 then labels every non-fk/touches group 'inferred', so the 4 extracted callers and the 8 AST-exact schema edges wear the inferred tag; TRUST :5521 (consulted :5529) lists 'returns' as structural but liveConns never consults TRUST for these groups.",
  "F6 `flines` means two things — levels detail flines is the FUNCTION's line count (_a3_levels.py:452-453 from function_insight `lines`, _a3_code.py:2229; 61 here; get_settings_route's levels flines 7 equals its c4 det.sig.lines 7), while c4 endpoint det.flines is the FILE's line count (_a3_graph.py:416 and :447; 247 for user_settings.py). fileRowSec :5729 renders `det.file+\":\"+det.flines`, which reads as a line NUMBER. The function's start line (`span`, _a3_code.py:2229) is never emitted to levels.json.",
  "F7 homing invisible for functions — homeEvRow :5820 is absent from KINDCARD.function (:5760-5764) and levels-minted fn nodes never get homeEv (set only at :1282 and :1339 from c4 pieces), so the feed's one function move candidate (compute_recipe_availability pantry→recipe, levels.json homing.stats.move_named) can never render. levels.json homing.pieces drops agree verdicts (_a3_homing.py:221: 'no consumer reads an agree record') — 66 function pieces listed of 216 weighed — so an unlisted function is indistinguishable between agree and unweighed.",
  "F8 feed fields no card reads — access.serializes (9/292 fns, the only field with in-body line numbers): accessSec :5692 reads a.ops only, and 'serializes' in the station is the c4 schema→model rel (:1239, :1708, :4481); sinks (1/292): copied at :2108, no reader; flags (4/292): never copied — the only `.flags` is m.flags, a risk COUNT at :1384; use_edges (173 edges, 89 fns) and pieces[].usefns: zero references in gabe-universe.html; fn_nodes[].handler (80/292): never copied.",
  "F9 journeys have no path onto a function card — journeysSection :5587 is called by the endpoint card (:5755) and the model card, not by KINDCARD.function (:5760-5764); levels detail fn: entries carry no test_journeys (0/291). Each of the 4 caller endpoints carries 6 test_journeys (+4/+17/+2/+4 more) and 2 curated workflows name GET /settings (workflows.js:18-19 'Initial setup — first run', :57-59 'Tune recipe discovery'); the draft 'Edit settings — household · preferences' names PATCH /settings/household + /preferences (workflows.draft.js:206-212).",
  "F10 pressure {} and census {} are permanent placeholders — _a3_levels.py:220 initialises pressure:{} and nothing writes it (only reference in the file); census_note reads 'workflow census not curated for this project yet'. Both are dead slots by the field-table law (FIELD-TABLE.md:51-52, the `dispatch` precedent).",
  "F11 detail is keyed by slug|name, not id — 292 fn_nodes resolve to 291 `fn:` keys: apps/api/services/progression.py#on_cooked_meal_created and apps/api/services/skills.py#on_cooked_meal_created share detail[\"fn:progression|on_cooked_meal_created\"], whose file is skills.py (flines 5, returns None) — a join on this key would attach skills.py's signature and docstring to progression.py's function.",
  "F12 the 3D satellite count inherits F1 — the usage tooltip :5517 promises 'N satellites orbit the node, one per caller', and the satellite count reads m.fanin (:1681), so a function with 4 drawn callers orbits 1 satellite.",
  "F13 the god row never states its rule — fn_nodes[].god is function_insight lines ≥ _FN_GOD_LINES = 50 (_a3_code.py:1604, :2285); flagsSec :6086 says 'god-object · oversized fn / class' and, with flines never joined, shows neither the 50 nor the 61.",
  "F14 the lab record checks out on substance, drifts on a line — docs/design/workflow-panel/_kinds.js:320 place.conn '19 wires when Functions is ON — 4 calls in · 1 call out · 6 fnreads · 8 schema' verifies (4+1+6+8 = 19); :330 VITALS.fanin '1 (hub.usage)' vs CMDSTATE callers 4 matches F1; :298 'det {file, doc} only' matches :2110. The record cites the mint at ':2074' (_kinds.js:295); it sits at :2104-2131 today."
 ],
 "verdict": {
  "checked": 42,
  "confirmed": 38,
  "refuted": [
   {
    "claim": "[dim behind] feedwide p95 36",
    "truth": "Only the p95 figure is off. behind.fns present on 189/292, max 135, median 4, truncated 0 all verify; the p95 of the 189 values is 37.2 (linear/inclusive) or 38 (nearest-rank, sorted[179]) — 36 is sor"
   },
   {
    "claim": "[dim schemas] TRUST :5538 lists 'returns' as structural but liveConns never consults it (plus 'the mint :2128 pushes sch",
    "truth": "Substance holds but both cites are wrong constructs: TRUST is defined at :5521 ({\"returns\":\"structural\", …}) and consulted at :5529 (`g.trust||TRUST[g.label]`); :5538 is conns' inner show() closure. l"
   },
   {
    "claim": "[finding] F5 conf dropped, trust mislabelled — TRUST :5538",
    "truth": "Substance verifies (fn_edges conf: 194 extracted / 233 inferred over 427 edges; :2111 maps only {source,target,rel}; :5706 labels non-fk/touches groups 'inferred'; TRUST lists 'returns' structural yet"
   },
   {
    "claim": "[finding] F14 the lab record checks out on substance, drifts on a line — _kinds.js:325 place.conn, :298 'det {file, doc}",
    "truth": "The record's substance verifies (19 = 4+1+6+8; fanin '1 (hub.usage)' at :330; callers 4 at :333; ':2074' cited at :7, :295, :329 while the mint sits at :2104-2128 today). But two of F14's own cites dr"
   }
  ],
  "unverifiable": []
 },
 "open": [
  "P1 and P2 hold the same four field-sets re-proportioned (critic #14) — the DOM measures 0.47 apart; the FIELD SETS do not. One of them should change what it holds, not how big.",
  "A history-first layout (commits.js: last change to the return schema, to the doors) is a sixth thesis nobody drew (critic #13).",
  "The handler=true panel (80 of 292) is never drawn: for a handler the callers rail is structurally empty and its door is its own endpoint (critic #17).",
  "Three p95 figures for one axis — console notch 30 (fixed), analysis 36 (off-by-one), verifier 38 (nearest-rank). The lab now states both the notch and the feed p95 on the meter (critic #20).",
  "sigSec needs TWO fixes, not one: join detail AND map flines→sig.lines, or the joined header renders with no body (verifier on dim sig).",
  "detail is keyed slug|name, 291 keys for 292 functions — the join must guard detail.file == id file or one pair lights the wrong signature (F11, critic #16)."
 ]
};
