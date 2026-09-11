/* ─────────────────────────────────────────────────────────────────────────────
   REAL feed slice — gustify, the suite's frozen example center.
   Source: templates/center/shell/example/codebase-graph-station/c4-graph.js
           (window.GABE_C4) + workflows.js · c4_head 8356f531 · 313 L2 nodes /
           1078 fe pieces.  Nothing here is invented; every value was read out of
           the feed on 2026-09-08.  Where the feed is empty, the field says so in
           the feed's own words rather than being dropped.
   ───────────────────────────────────────────────────────────────────────────── */

/* The SEVEN fixed slots. Every proposal renders all seven, in this order, for
   every element. An element that has nothing for a slot still gets the slot —
   dimmed, carrying the REASON. That is the whole idea being tested. */
var SLOTS = [
  { key:"ident", label:"IDENTITY",  hint:"name · kind · entity · file:lines" },
  { key:"op",    label:"OPERATION", hint:"what it does — verb, signature, delivery" },
  { key:"in",    label:"IN",        hint:"what reaches it — gates, callers, payload" },
  { key:"store", label:"STORE",     hint:"what it holds or touches — tables r/w, fields" },
  { key:"out",   label:"OUT",       hint:"what leaves — response, writes, dispatches" },
  { key:"ev",    label:"EVIDENCE",  hint:"tests · journeys · risk flags" },
  { key:"place", label:"PLACE",     hint:"connections · reach · homing · above" }
];

/* r = a row inside a slot: [icon-class, label, value, tone]
   tone: "" normal · "dim" muted · "warn" amber · "ok" green · "none" the honest-empty line */
function r(k, v, tone){ return { k:k, v:v, tone:tone||"" }; }

var ELEMENTS = [

/* ── 1 · ENDPOINT, the richest backend node ──────────────────────────────── */
{ id:"ep-relief", kind:"endpoint", entity:"recipe",
  label:"POST /recipe-creation/{request_id}/relief-accept",
  short:"POST /…/relief-accept",
  note:"48 chars — the 6th-longest label in the feed. The longest is 52.",
  slots:{
    ident:[ r("name","POST /recipe-creation/{request_id}/relief-accept"),
            r("kind","endpoint · POST"),
            r("entity","recipe"),
            r("file","apps/api/api/recipe_creation.py:302") ],
    op:[ r("fn","post_relief_accept"),
         r("sig","async · 34 lines · → GustifyCreationResponse"),
         r("delivery","JSON · HTTP 200"),
         r("doc","Filter-relief continue: re-run relaxing the novelty rule (allergen safety stays).","dim") ],
    in:[ r("gate","get_auth_context","ok"),
         r("dep","get_session · get_settings","dim"),
         r("payload","GustifyCreationResponse · 7 fields"),
         r("caller","0 inbound edges — no screen bridges here (an unmatched web-bridge gap)","warn") ],
    /* PROVENANCE: every row below is read from the FEED (node.access.ops), and the
       station cannot currently draw any of it — the adapter at gabe-universe.html:1248
       never copies `access` onto the node, so accessSec (:5572) returns null on all
       79 of 81 endpoints that carry it. Marked unmeas so the demo stops showing an
       answer the live panel does not have. See FINDINGS.md F6. */
    store:[ r("read","recipes · recipe_creation_requests · recipe_ingredients","unmeas"),
            r("read","dish_history_events · pantry_items","unmeas"),
            r("read","subscription_entitlement · user_dietary_profile","unmeas"),
            r("write","recipe_creation_requests · ai_spend_log · ingredient_reconciliation_queue","unmeas"),
            r("commits","yes — in the feed, unreachable from the card (adapter :1248)","unmeas") ],
    out:[ r("resp","GustifyCreationResponse"),
          r("write","3 tables written across 2 entities"),
          r("touch","GustifyCreationResponse (schema)"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","C89 · C90 · C91 — 3 cases, all pass","ok"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— no risk flags","none") ],
    place:[ r("conn","11 edges · 7 reads_from · 3 writes_to · 1 touches"),
            r("reach","42 fns behind · depth 5","warn"),
            r("home","recipe — file, users and data agree","dim"),
            r("above","cluster · recipe → everything") ]
  } },

/* ── 2 · MODEL, the widest structure in the feed ─────────────────────────── */
{ id:"model-recipe", kind:"model", entity:"recipe", label:"Recipe", short:"Recipe",
  note:"38 columns · 67 test cases · 43 edges. The structural extreme.",
  slots:{
    ident:[ r("name","Recipe"), r("kind","model · table recipes"), r("entity","recipe"),
            r("file","apps/api/models/recipe.py:493") ],
    op:[ r("sig","class Recipe(Base)"),
         r("fn","principal: explore_recipes"),
         r("delivery","— a table is not called; it is read and written","dim"),
         r("doc","A recipe — system-seeded, user-created (manual), or Gustify AI generated.","dim") ],
    in:[ r("fk","9 foreign keys point AT this table","ok"),
         r("caller","31 internal readers/writers"),
         r("api","GET /recipes/explore"),
         r("gate","— a table carries no gate of its own","none") ],
    store:[ r("col","id uuid · title str · slug str? · description str?"),
            r("col","creator_type str · creator_user_id uuid? · language str"),
            r("col","complexity int · servings int · active_minutes int · total_minutes int"),
            r("col","sweet · salty · sour · bitter · umami · fat · piquant · cooling (int?)","dim"),
            r("col","+ 24 more of 38 — demoted to the expander","dim"),
            r("fk","creator_user_id → users.id") ],
    out:[ r("resp","— a table returns nothing; its readers shape the response","none"),
          r("write","written by 12+ endpoints across 5 entities"),
          r("touch","serialised into GustifyCreationResponse and 6 other schemas"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","C13 · C215 · C241 · C268 · C312 · C446 — 67 cases total","ok"),
         r("journey","34 test journeys · widest = C13, 17 components / 5 entities","ok"),
         r("flag","— no risk flags","none") ],
    place:[ r("conn","43 edges — the 2nd-most-connected backend node"),
            r("reach","— a table has no call tree","none"),
            r("home","recipe — file, users and data agree","dim"),
            r("above","cluster · recipe → everything") ]
  } },

/* ── 3 · COMPONENT, the frontend extreme ────────────────────────────────── */
{ id:"fe-browse", kind:"component", entity:"fe·cooking", label:"RecipeBrowseContainer",
  short:"RecipeBrowseContainer",
  note:"56 edges · 32 hooks · 14 write-channel wires. A view with a move verdict.",
  slots:{
    ident:[ r("name","RecipeBrowseContainer"),
            r("kind","component · view"),
            r("entity","fe·cooking (frontend twin of cooking)"),
            r("file","apps/web/src/features/cooking/RecipeBrowseContainer.tsx:124–683") ],
    op:[ r("sig","React component · 559 lines"),
         r("fn","feClass: view — mounted by a route"),
         r("delivery","renders UI · holds local state"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","3 routes render it: CookingRoute · ExploreRoute · RecipesRoute","ok"),
         r("gate","— a component carries no gate","none"),
         r("payload","— props are not captured (the data rides the wires)","dim"),
         r("read","18 read-channel wires") ],
    store:[ r("store","useUiStore (app-shell) — 1 uses-store wire"),
            r("state","holds local state: yes"),
            r("shape","CookingRecipe · CookingFlowState · PaneConfig · +8 typed"),
            r("col","— a component has no columns; its shapes are its structure","dim") ],
    out:[ r("write","14 write-channel wires — useStartCooking · usePlanRecipe · usePutEquipment · +11"),
          r("fetch","reaches the API only through its hooks (fed2w = 1)"),
          r("resp","— components return markup, not payloads","none"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— no cases claimed yet","none"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured for frontend pieces","unmeas") ],
    place:[ r("conn","56 edges · 32 uses-hook · 11 typed · 8 fecall · 3 renders in"),
            r("reach","fed2w 1 — one hop from a write fetch"),
            r("home","MOVE CANDIDATE → app-shell · users say app-shell 100% of 3 · data abstains","warn"),
            r("above","cluster · root → fe·cooking → everything") ]
  } },

/* ── 4 · HOOK, the bridge case ──────────────────────────────────────────── */
{ id:"fe-redo", kind:"hook", entity:"fe·auth", label:"useRedoSetup", short:"useRedoSetup",
  note:"A fetcher that crosses the web→API bridge into another entity.",
  slots:{
    ident:[ r("name","useRedoSetup"), r("kind","hook · fetcher"),
            r("entity","fe·auth (frontend twin of auth)"),
            r("file","apps/web/src/features/auth/useRedoSetup.ts:18–48") ],
    op:[ r("sig","custom hook · 30 lines"),
         r("fn","hrole: fetcher"),
         r("delivery","server cache — a query-library sink"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","2 call sites"),
         r("gate","— the gate lives on the endpoint it reaches","dim"),
         r("payload","— arguments are not captured","dim"),
         r("read","cache: true") ],
    store:[ r("store","— reads no client store","none"),
            r("state","server cache only"),
            r("shape","— no typed wires captured","none"),
            r("col","— a hook has no columns","dim") ],
    out:[ r("fetch","PATCH /settings/household → settings","warn"),
          r("fetch","PATCH /settings/preferences → settings","warn"),
          r("write","2 write sites — both cross into the settings entity"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— no cases claimed yet","none"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured for frontend pieces","unmeas") ],
    place:[ r("conn","2 bridges out · 2 call sites in"),
            r("reach","fed2w 0 — it IS the write"),
            r("home","fe·auth by the feature layout · data says settings 2 → STAY (the file wins)","dim"),
            r("above","cluster · root → fe·auth → everything") ]
  } },

/* ── 5 · SCHEMA ─────────────────────────────────────────────────────────── */
{ id:"schema-shop", kind:"schema", entity:"pantry", label:"ShoppingItemResponse",
  short:"ShoppingItemResponse",
  note:"A response shape — 10 fields, 5 API cases, 11 e2e cases behind one row.",
  slots:{
    ident:[ r("name","ShoppingItemResponse"), r("kind","schema"), r("entity","pantry"),
            r("file","apps/api/schemas/shopping.py:67") ],
    op:[ r("sig","class ShoppingItemResponse(BaseModel)"),
         r("fn","— a shape has no principal function","none"),
         r("delivery","serialised into JSON responses"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","2 internal users"),
         r("fk","0 foreign keys point at it","dim"),
         r("gate","— a shape carries no gate","none"),
         r("payload","— it IS the payload","dim") ],
    store:[ r("col","id uuid · ingredient_code str · display_name str"),
            r("col","quantity float · unit_code str · status str · source str"),
            r("col","notes str? · created_at datetime · bought_at datetime?"),
            r("col","10 of 10 — the whole shape fits","ok") ],
    out:[ r("resp","— a shape is returned, it does not return","none"),
          r("write","— shapes write nothing","none"),
          r("touch","carried by the shopping endpoints"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","C674 · C676 · C706 · C707 · C1077 — 5 cases, all pass","ok"),
         r("journey","2 journeys · e2e corpus contributes '11 case(s)' as ONE row","warn"),
         r("flag","— no risk flags","none") ],
    place:[ r("conn","2 edges"),
            r("reach","— a shape has no call tree","none"),
            r("home","pantry — file, users and data agree","dim"),
            r("above","cluster · pantry → everything") ]
  } },

/* ── 6 · ROUTE, the skeletal case (21 of 22 routes look like this) ───────── */
{ id:"fe-legal", kind:"route", entity:"fe·legal-consent", label:"LegalDocumentPage",
  short:"LegalDocumentPage",
  note:"THE RICHEST route in the feed — and it carries only 7 keys. 213 of 1078 fe pieces are this skeletal.",
  slots:{
    ident:[ r("name","LegalDocumentPage"), r("kind","route"),
            r("entity","fe·legal-consent"),
            r("file","apps/web/src/features/legal/LegalDocumentPage.tsx:11–37") ],
    op:[ r("sig","React component · 26 lines"),
         r("fn","— export name only","dim"),
         r("delivery","— no URL path: gustify is a react-router JSX app, so no route literal exists to read","none"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","— no drawn renderer","none"),
         r("gate","— a route carries no gate","none"),
         r("payload","— props not captured","dim"),
         r("read","— no read-channel wires","none") ],
    store:[ r("store","— reads no client store","none"),
            r("state","— no local state detected","none"),
            r("shape","— no typed wires captured","none"),
            r("col","— a route has no columns","dim") ],
    out:[ r("fetch","— reaches no endpoint","none"),
          r("write","— no write-channel wires","none"),
          r("resp","— routes return markup","none"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— no cases claimed yet","none"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured for frontend pieces","unmeas") ],
    place:[ r("conn","1 edge"),
            r("reach","— no call tree","none"),
            r("home","fe·legal-consent by the feature layout · users say app-shell 100% of 1 → STAY","dim"),
            r("above","cluster · root → fe·legal-consent → everything") ]
  } },

/* ── 7 · EXTERNAL, the 5-key stub (41 of 313 backend nodes carry NO det) ─── */
{ id:"ext-auth", kind:"external", entity:"auth", label:"Auth", short:"Auth (external)",
  note:"A bare 5-key stub. 33 web + 8 external nodes — 13% of the backend graph — look like this.",
  slots:{
    ident:[ r("name","Auth"), r("kind","external"), r("entity","auth"),
            r("file","— an external system has no file in this repo","none") ],
    op:[ r("sig","— no signature: nothing of it is in the tree","none"),
         r("fn","— none","none"), r("delivery","— unknown","none"), r("doc","— none","none") ],
    in:[ r("caller","29 edges name it"), r("gate","— none","none"),
         r("payload","— not captured","none"), r("read","— not captured","none") ],
    store:[ r("col","— an external system exposes no columns to us","none"),
            r("store","— none","none"), r("state","— none","none"), r("shape","— none","none") ],
    out:[ r("resp","— not captured","none"), r("write","— not captured","none"),
          r("touch","— not captured","none"), r("dispatch","— none","none") ],
    ev:[ r("test","— no det at all: a bare 5-key stub","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured: nothing of it is in the tree","unmeas") ],
    place:[ r("conn","29 edges — the 6th-most-connected backend node","ok"),
            r("reach","— no call tree","none"),
            r("home","auth by its file claim","dim"),
            r("above","cluster · auth → everything") ]
  } },

/* ── 8 · MIDDLEWARE — THE GAP. Real det, no card. ───────────────────────── */
{ id:"mw-idem", kind:"middleware", entity:"__unclaimed__", label:"IdempotencyMiddleware",
  short:"IdempotencyMiddleware", gap:true,
  note:"GAP · KINDCARD has no `middleware` key, so today this element opens an EMPTY card — over data that exists.",
  slots:{
    ident:[ r("name","IdempotencyMiddleware"), r("kind","middleware"),
            r("entity","__unclaimed__ — no entity claims it","warn"),
            r("file","apps/api/main.py (det.file · det.line)") ],
    op:[ r("sig","ASGI middleware"),
         r("fn","det.order — its position in the stack"),
         r("delivery","runs on EVERY request before any endpoint is chosen","warn"),
         r("doc","a wrapper the app runs on every request — the building's front door, not a journey's gate","dim") ],
    in:[ r("caller","every request — there is no selective inbound edge","warn"),
         r("gate","det.gates — the endpoints it stands in front of","ok"),
         r("payload","the raw request"), r("read","det.scope — what it applies to") ],
    store:[ r("store","— not captured","none"), r("state","— not captured","none"),
            r("col","— middleware has no columns","dim"), r("shape","— not captured","none") ],
    out:[ r("resp","passes through, or short-circuits"), r("write","— not captured","none"),
          r("touch","— not captured","none"), r("dispatch","— none","none") ],
    ev:[ r("test","— no cases claimed yet","none"),
         r("journey","every journey passes through it and none names it","warn"),
         r("flag","— no card draws this kind at all (KINDCARD has no middleware key)","unmeas") ],
    place:[ r("conn","drawn as a front-door node, not on a journey wire"),
            r("reach","— not walked","none"),
            r("home","__unclaimed__ — outside every claim root","warn"),
            r("above","cluster · __unclaimed__ → everything") ]
  } },

/* ── 9 · FLAG — the second gap kind ─────────────────────────────────────── */
{ id:"flag-rc", kind:"flag", entity:"recipe", label:"RECIPE_CREATION_ENABLED",
  short:"RECIPE_CREATION_ENABLED", gap:true,
  note:"GAP · same class as middleware — det carries {default, line, src, walls} and no card draws it.",
  slots:{
    ident:[ r("name","RECIPE_CREATION_ENABLED"), r("kind","flag"), r("entity","recipe"),
            r("file","det.src : det.line") ],
    op:[ r("sig","a switch that turns a lane on or off"),
         r("fn","det.default — its value when nothing overrides it"),
         r("delivery","the journey stops here when it is off","warn"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","det.walls — the endpoints it stands in front of","ok"),
         r("gate","— the flag IS the gate","dim"),
         r("payload","— none","none"), r("read","— none","none") ],
    store:[ r("store","— none","none"), r("state","— none","none"),
            r("col","— a flag has no columns","dim"), r("shape","— none","none") ],
    out:[ r("resp","— none","none"), r("write","— none","none"),
          r("touch","det.walls"), r("dispatch","— none","none") ],
    ev:[ r("test","— no cases claimed yet","none"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— it is one","dim") ],
    place:[ r("conn","walls the endpoints in det.walls"),
            r("reach","— not walked","none"),
            r("home","recipe by its file claim","dim"),
            r("above","cluster · recipe → everything") ]
  } }
];

/* ── The JOURNEY, for proposals B and C ──────────────────────────────────
   "Cook a recipe — the cooking session" · level 2 · Core · 5 steps.
   Every number below is read from the feed's cooking endpoints. */
var JOURNEY = {
  name:"Cook a recipe — the cooking session", level:"2 · Core",
  note:"start → advance stages/steps → timer → complete (leftovers → pantry, history events)",
  steps:[
  { n:1, label:"POST /cooking/sessions", short:"POST /cooking/sessions", op:"create", entity:"cooking",
    slots:{
      ident:[ r("name","POST /cooking/sessions"), r("kind","endpoint · POST"), r("entity","cooking"),
              r("file","apps/api/api/cooking.py:585") ],
      op:[ r("fn","post_start_session"), r("sig","async · 53 lines · → CookingSessionResponse"),
           r("delivery","JSON · HTTP 201 CREATED"), r("doc","— no docstring captured","none") ],
      in:[ r("gate","get_auth_context","ok"), r("dep","get_session","dim"),
           r("payload","CookingSessionResponse · 18 fields"), r("caller","1 API user") ],
      store:[ r("read","recipes · recipe_ingredients · cooking_sessions"),
              r("read","cooking_photos · subscription_entitlement","dim"),
              r("write","cooking_sessions · cooking_stage_reminders","warn"),
              r("commits","yes","warn"),
              r("via","access.ops \u2014 unreachable from the card (adapter :1248)","unmeas") ],
      out:[ r("resp","CookingSessionResponse"), r("write","2 tables"),
            r("touch","CookingSessionResponse"), r("dispatch","— none","none") ],
      ev:[ r("test","C237 · C250 · C267 · C283 · C284 · C1087 — 6 cases","ok"),
           r("journey","step 1 of 5"), r("flag","— none","none") ],
      place:[ r("conn","cooking cluster"), r("reach","18 fns behind · depth 4"),
              r("home","cooking — agree","dim"), r("above","cluster · cooking") ] } },

  { n:2, label:"PATCH /cooking/sessions/{session_id}/stage", short:"PATCH /…/stage", op:"update", entity:"cooking",
    slots:{
      ident:[ r("name","PATCH /cooking/sessions/{session_id}/stage"), r("kind","endpoint · PATCH"),
              r("entity","cooking"), r("file","apps/api/api/cooking.py:585") ],
      op:[ r("fn","patch_stage"), r("sig","async · 22 lines · → CookingSessionResponse"),
           r("delivery","JSON · HTTP 200"), r("doc","— no docstring captured","none") ],
      in:[ r("gate","get_auth_context","ok"), r("dep","get_session","dim"),
           r("payload","CookingSessionResponse · 18 fields"), r("caller","1 API user") ],
      store:[ r("read","cooking_sessions · recipes · cooking_photos"),
              r("write","cooking_sessions","warn"),
              r("commits","yes","warn"),
              r("via","access.ops \u2014 unreachable from the card (adapter :1248)","unmeas"),
              r("col","— no columns of its own","dim") ],
      out:[ r("resp","CookingSessionResponse"), r("write","1 table"),
            r("touch","CookingSessionResponse"), r("dispatch","— none","none") ],
      ev:[ r("test","C675 · C677 — 2 cases","ok"), r("journey","step 2 of 5"),
           r("flag","— none","none") ],
      place:[ r("conn","cooking cluster"), r("reach","5 fns behind · depth 2"),
              r("home","cooking — agree","dim"), r("above","cluster · cooking") ] } },

  { n:3, label:"PATCH /cooking/sessions/{session_id}/steps/{step_id}", short:"PATCH /…/steps/{id}",
    op:"update", entity:"cooking",
    slots:{
      ident:[ r("name","PATCH /cooking/sessions/{session_id}/steps/{step_id}"),
              r("kind","endpoint · PATCH"), r("entity","cooking"),
              r("file","apps/api/api/cooking.py:585") ],
      op:[ r("fn","patch_step_progress"), r("sig","async · 25 lines · → StepProgressResponse"),
           r("delivery","JSON · HTTP 200"), r("doc","— no docstring captured","none") ],
      in:[ r("gate","get_auth_context","ok"), r("dep","get_session","dim"),
           r("payload","StepProgressResponse · 6 fields"), r("caller","1 API user") ],
      store:[ r("read","cooking_sessions · cooking_step_progress"),
              r("write","cooking_step_progress","warn"), r("commits","yes","warn"),
              r("via","access.ops \u2014 unreachable from the card (adapter :1248)","unmeas"),
              r("col","— no columns of its own","dim") ],
      out:[ r("resp","StepProgressResponse"), r("write","1 table"),
            r("touch","StepProgressResponse"), r("dispatch","— none","none") ],
      ev:[ r("test","— no cases claimed yet","none"), r("journey","step 3 of 5"),
           r("flag","— not measured for frontend pieces","unmeas") ],
      place:[ r("conn","cooking cluster"), r("reach","6 fns behind · depth 4"),
              r("home","cooking — agree","dim"), r("above","cluster · cooking") ] } },

  { n:4, label:"PATCH /cooking/sessions/{session_id}/timer", short:"PATCH /…/timer",
    op:"update", entity:"cooking",
    slots:{
      ident:[ r("name","PATCH /cooking/sessions/{session_id}/timer"), r("kind","endpoint · PATCH"),
              r("entity","cooking"), r("file","apps/api/api/cooking.py:585") ],
      op:[ r("fn","patch_session_timer"), r("sig","async · 29 lines · → CookingSessionResponse"),
           r("delivery","JSON · HTTP 200"),
           r("doc","Start/replace or clear a session's per-step timer (H7). Ownership scoped exactly like step-progress.","dim") ],
      in:[ r("gate","get_auth_context","ok"), r("dep","get_session","dim"),
           r("payload","CookingSessionResponse · 18 fields"), r("caller","1 API user") ],
      store:[ r("read","cooking_sessions · cooking_step_progress · recipe_steps"),
              r("read","recipes · cooking_photos","dim"),
              r("write","cooking_sessions · notifications","warn"), r("commits","yes","warn"),
              r("via","access.ops \u2014 unreachable from the card (adapter :1248)","unmeas") ],
      out:[ r("resp","CookingSessionResponse"), r("write","2 tables — one is notifications"),
            r("touch","CookingSessionResponse"), r("dispatch","— none","none") ],
      ev:[ r("test","C283 · C284 · C285 — 3 cases","ok"), r("journey","step 4 of 5"),
           r("flag","— none","none") ],
      place:[ r("conn","cooking cluster"), r("reach","8 fns behind · depth 2"),
              r("home","cooking — agree","dim"), r("above","cluster · cooking") ] } },

  { n:5, label:"POST /cooking/sessions/{session_id}/complete", short:"POST /…/complete",
    op:"create", entity:"cooking",
    slots:{
      ident:[ r("name","POST /cooking/sessions/{session_id}/complete"), r("kind","endpoint · POST"),
              r("entity","cooking"), r("file","apps/api/api/cooking.py:585") ],
      op:[ r("fn","post_complete"), r("sig","async · 50 lines · → CompletionResponse"),
           r("delivery","JSON · HTTP 200"), r("doc","— no docstring captured","none") ],
      in:[ r("gate","get_auth_context","ok"), r("dep","get_session","dim"),
           r("payload","CompletionResponse · 8 fields"), r("caller","1 API user") ],
      store:[ r("read","cooking_sessions · recipes · recipe_ingredients · pantry_items"),
              r("read","dish_history_events · skill_tree · tree_node · node_progress","dim"),
              r("read","skill_progress · canonical_ingredients","dim"),
              r("write","cooking_sessions · pantry_items · dish_history_events","warn"),
              r("write","ingredient_history_events · node_progress · skill_progress · notifications","warn"),
              r("commits","yes — 7 tables in one transaction","warn"),
              r("via","access.ops \u2014 unreachable from the card (adapter :1248)","unmeas") ],
      out:[ r("resp","CompletionResponse"),
            r("write","7 tables across 4 entities — the journey's real payload","warn"),
            r("touch","CompletionResponse"), r("dispatch","— none","none") ],
      ev:[ r("test","C250 · C251 · C264 · C1087 — 4 cases","ok"), r("journey","step 5 of 5"),
           r("flag","— none","none") ],
      place:[ r("conn","cooking cluster · reaches pantry, progression, recipe"),
              r("reach","36 fns behind · depth 7 — the deepest step","warn"),
              r("home","cooking — users and data agree, STAY","dim"),
              r("above","cluster · cooking") ] } }
]};

/* What does NOT fit a ~260px strip. Named in every proposal, demoted on purpose. */
var DEMOTED = [
  ["Model columns",      "Recipe has 38; ~6 fit. The rest live behind the STORE expander."],
  ["Connection rows",    "useT carries 230 fe-edges. The dock shows the COUNT and the top group; the list is an expander."],
  ["Code behind",        "POST /…/complete runs 36 fns at depth 7. The dock shows '36 · depth 7'; the tree is an expander."],
  ["Test cases",         "Recipe has 67. The dock shows the first 4–6 C-ids and the total."],
  ["Docstrings",         "One clamped line in OPERATION; the full text is an expander."],
  ["Test journeys",      "Recipe has 34. The dock shows the widest one and the count."],
  ["The full signature", "det.gsig is already truncated at ~210 chars IN THE FEED. The dock clamps to one line."]
];

/* ═══════════════════════════════════════════════════════════════════════════
   VITALS — the station's HP / shields / energy.
   `n.m = {behind, depth, tests, cols, fanin, god, method}` is built for EVERY node
   at gabe-universe.html:1245, with fanin filled by real in-degree at :1344. Four
   scalars, the same measurement for every element, already computed — and today
   they feed only fleet decoration and three risk rows (census F4).

   FIXED IN POSITION, KIND-AWARE IN SOURCE. Four meters, four permanent y-slots.
   A backend node fills REACH from its call tree; a frontend piece from its write
   distance. Same slot, different meter — how an RTS shows HP for every unit but
   energy only for casters, and never reflows the stack.

   state: ok | zero | na (inapplicable to this kind) | unmeas (never measured)
   ═══════════════════════════════════════════════════════════════════════════ */
var VMAX = { reach: 47, surface: 38, tested: 67, fanin: 61 };   // gustify's measured maxima

function vit(v, max, state, label, note){
  return { v: v, max: max, state: state || "ok", label: label, note: note || "" };
}

var VITALS = {
  "ep-relief": {
    reach:   vit(42, VMAX.reach,   "ok",     "42 fns · depth 5"),
    surface: vit(7,  VMAX.surface, "ok",     "7 payload fields"),
    tested:  vit(3,  VMAX.tested,  "ok",     "3 cases · all pass"),
    fanin:   vit(0,  VMAX.fanin,   "zero",   "0 callers", "no screen bridges reach it — an unmatched web-bridge gap"),
  },
  "model-recipe": {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "a table has no call tree"),
    surface: vit(38, VMAX.surface, "ok",     "38 columns", "det.cols is capped at 10 in the feed; the true 38 is on ids.datatype (census F3)"),
    tested:  vit(67, VMAX.tested,  "ok",     "67 cases"),
    fanin:   vit(22, VMAX.fanin,   "ok",     "22 in-edges"),
  },
  "fe-browse": {
    reach:   vit(1,  4,            "ok",     "fed2w 1", "hops to a write fetch — the frontend's reach meter"),
    surface: vit(11, VMAX.surface, "ok",     "11 typed shapes"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "tests:0 is hardcoded at :1305 and no fe piece in the feed carries a test key"),
    fanin:   vit(3,  VMAX.fanin,   "ok",     "3 routes render it"),
  },
  "fe-redo": {
    reach:   vit(0,  4,            "ok",     "fed2w 0", "it IS the write"),
    surface: vit(2,  VMAX.surface, "ok",     "2 fetch sites"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "same hardcoded zero"),
    fanin:   vit(1,  VMAX.fanin,   "ok",     "1 call site"),
  },
  "schema-shop": {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "a shape has no call tree"),
    surface: vit(10, VMAX.surface, "ok",     "10 fields", "the whole shape fits"),
    tested:  vit(5,  VMAX.tested,  "ok",     "5 cases · all pass"),
    fanin:   vit(6,  VMAX.fanin,   "ok",     "6 in-edges"),
  },
  "fe-legal": {
    reach:   vit(0,  4,            "unmeas", "not measured", "21 of 22 routes carry only the 7 skeletal keys"),
    surface: vit(0,  VMAX.surface, "unmeas", "not measured", "no typed wires captured"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "hardcoded zero"),
    fanin:   vit(1,  VMAX.fanin,   "ok",     "1 in-edge"),
  },
  "ext-auth": {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "nothing of it is in the tree"),
    surface: vit(0,  VMAX.surface, "na",     "—", "an external system exposes no columns to us"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "a bare 5-key stub — no det at all"),
    fanin:   vit(29, VMAX.fanin,   "ok",     "29 in-edges", "the 6th-most-connected backend node"),
  },
  "mw-idem": {
    reach:   vit(0,  VMAX.reach,   "unmeas", "not walked", "no card draws this kind"),
    surface: vit(0,  VMAX.surface, "na",     "—", "middleware has no columns"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured"),
    fanin:   vit(0,  VMAX.fanin,   "na",     "every request", "there is no selective inbound edge — it is the front door"),
  },
  "flag-rc": {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "a flag has no call tree"),
    surface: vit(0,  VMAX.surface, "na",     "—", "a flag has no columns"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured"),
    fanin:   vit(0,  VMAX.fanin,   "unmeas", "det.walls", "the endpoints it can close — in the feed, drawn nowhere"),
  },
};
VITALS["mw-idem"].__gap = true;

/* the four meters, in their permanent order */
var VROWS = [
  { key:"reach",   label:"REACH",   hint:"call tree behind it · or hops to a write" },
  { key:"surface", label:"SURFACE", hint:"columns · fields · shapes it carries" },
  { key:"tested",  label:"TESTED",  hint:"cases claimed" },
  { key:"fanin",   label:"FAN-IN",  hint:"in-degree — the one scalar every kind has" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMMAND CARD — 15 cells, 5 x 3, SC2's CommandPanel geometry.
   Row 0 = the universal orders (SC2's y=0 Move/Stop/Hold/Patrol/Attack).
   Row 1 = the element's own reach, each cell carrying a COUNT badge.
   Row 2 = the ladder, the walk, and Cancel at the canonical (2,4).

   FOUR AVAILABILITY STATES, and the fourth is the one no RTS needs:
     lit    — applies, and has something to reach
     blank  — inapplicable to this KIND by definition. Says "wrong question".
     grey   — applies to the kind, this element has none. Says "no answer".
     unmeas — the station never measured it. Says "we did not look".
   A verb an element cannot use KEEPS ITS CELL. That is the whole mechanism.
   ═══════════════════════════════════════════════════════════════════════════ */
var CMD = [
  { r:0,c:0, key:"frame",  label:"FRAME",  hot:"G",     fn:"_frameSet :3052" },
  { r:0,c:1, key:"focus",  label:"FOCUS",  hot:"F",     fn:"__uniHLMode :2663" },
  { r:0,c:2, key:"depthd", label:"DEPTH−", hot:"↓",     fn:"__uniHLDepth :2656" },
  { r:0,c:3, key:"depthu", label:"DEPTH+", hot:"↑",     fn:"__uniHLDepth :2656" },
  { r:0,c:4, key:"neigh",  label:"NEIGH",  hot:"N",     fn:"__uniRevealNeighbors :2366" },
  { r:1,c:0, key:"callers",label:"CALLERS",hot:"C",     fn:"liveConns :5579 inbound" },
  { r:1,c:1, key:"behind", label:"BEHIND", hot:"B",     fn:"behindTree :5549" },
  { r:1,c:2, key:"tables", label:"TABLES", hot:"T",     fn:"accessSec :5572" },
  { r:1,c:3, key:"screens",label:"SCREENS",hot:"R",     fn:"bridge / fetches edges" },
  { r:1,c:4, key:"expand", label:"EXPAND", hot:"X",     fn:"__uniCapExpand :4023" },
  { r:2,c:0, key:"upclu",  label:"CLUSTER",hot:"K",     fn:"panelClu :5938" },
  { r:2,c:1, key:"upent",  label:"ENTITY", hot:"J",     fn:"panelEnt :5920" },
  { r:2,c:2, key:"walkb",  label:"WALK ‹", hot:"⌥A",    fn:"_walkGo(-1) :3059" },
  { r:2,c:3, key:"walkf",  label:"WALK ›", hot:"⌥D",    fn:"_walkGo(+1) :3059" },
  { r:2,c:4, key:"clear",  label:"CLEAR",  hot:"Esc",   fn:"__uniHLClear :2653 + panelAll" },
];

/* per element: cell key -> [state, count|null, reason]
   Only cells that differ from "lit with no count" are listed; the rest default to lit. */
var CMDSTATE = {
  "ep-relief": {
    callers:["grey", 0, "0 inbound edges — no screen bridges reach it"],
    behind: ["lit", 42, "42 fns · depth 5"],
    tables: ["unmeas", null, "the feed carries access.ops; the adapter at :1248 never copies it"],
    screens:["grey", 0, "no screen bridges to this endpoint"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"],
    walkf:  ["grey", null, "no journey is walking"],
  },
  "model-recipe": {
    callers:["lit", 22, "22 in-edges"],
    behind: ["blank", null, "a table has no call tree"],
    tables: ["blank", null, "it IS the table"],
    screens:["blank", null, "a table is not fetched directly"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
  "fe-browse": {
    callers:["lit", 3, "3 routes render it"],
    behind: ["blank", null, "a component has no backend call tree"],
    tables: ["blank", null, "a component reaches tables only through its hooks"],
    screens:["lit", 1, "it is a view"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
  "fe-redo": {
    callers:["lit", 1, "1 call site"], behind:["blank", null, "no backend call tree"],
    tables: ["blank", null, "reaches tables through the endpoints it fetches"],
    screens:["lit", 2, "2 bridges out — both into settings"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
  "schema-shop": {
    callers:["lit", 6, "6 in-edges"], behind:["blank", null, "a shape has no call tree"],
    tables: ["blank", null, "a shape touches no table"], screens:["blank", null, "not fetched directly"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
  "fe-legal": {
    callers:["lit", 1, "1 in-edge"], behind:["blank", null, "no backend call tree"],
    tables: ["blank", null, "reaches no table"],
    screens:["grey", 0, "reaches no endpoint"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
  "ext-auth": {
    callers:["lit", 29, "29 edges name it"],
    behind: ["blank", null, "nothing of it is in the tree"],
    tables: ["blank", null, "an external system exposes no tables to us"],
    screens:["blank", null, "not fetched directly"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
  "mw-idem": {
    callers:["unmeas", null, "every request passes through — no selective inbound edge"],
    behind: ["unmeas", null, "no card draws this kind at all"],
    tables: ["blank", null, "middleware touches no table"],
    screens:["blank", null, "not fetched directly"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
  "flag-rc": {
    callers:["unmeas", null, "det.walls names them; nothing draws it"],
    behind: ["blank", null, "a flag has no call tree"],
    tables: ["blank", null, "a flag touches no table"],
    screens:["blank", null, "not fetched directly"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  },
};

/* the global budget — SC's statres.bin. Selection-INDEPENDENT by construction.
   Today every one of these lives inside panelAll's Sources rows (:5926-5936), so it
   VANISHES the moment an element is selected — the inverse of every RTS surveyed. */
var STANDING = {
  tier:      { label:"TIER",     v:"T2", note:"disclosure tier · __uniTier :4265" },
  budget:    { label:"NODES",    v:"843 / 1600", note:"__uniBudget — above it the station boots at tier 0" },
  kinds:     { label:"KINDS",    v:"11 on / 15", note:"__uniKindState :4254" },
  partial:   { label:"PARTIAL",  v:"6 unmatched fetches · 20 move candidates", note:"stats.web + stats.homing", warn:true },
};

var ENTS = [
  { slug:"recipe",   n:74, col:"#4c9dfb" }, { slug:"cooking",  n:61, col:"#4cbe83" },
  { slug:"pantry",   n:48, col:"#c084fc" }, { slug:"auth",     n:37, col:"#e8590c" },
  { slug:"allergen", n:29, col:"#d946ef" }, { slug:"settings", n:26, col:"#10b981" },
  { slug:"progression", n:21, col:"#38bdf8" }, { slug:"shopping", n:17, col:"#e8a33d" },
  { slug:"__unclaimed__", n:9, col:"#8794ab" },
];

/* the portrait badge — the station's own badge families: method · feclass · hrole ·
   pclass · delivery (gabe-universe.html __BADGE_COL / __slot) */
var BADGE = {
  "ep-relief":"POST", "model-recipe":"TABLE", "schema-shop":"SHAPE",
  "fe-browse":"VIEW", "fe-redo":"FETCHER", "fe-legal":"ROUTE",
  "ext-auth":"EXTERNAL", "mw-idem":"GATE", "flag-rc":"SWITCH",
};
